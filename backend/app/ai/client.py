from __future__ import annotations

import difflib
import json
import logging
import os
import re
import subprocess
from typing import Any

import httpx
from dotenv import load_dotenv

from app.ai.prompts import (
    FIX_AGENT_SYSTEM_PROMPT,
    SAFE_FAILURE_EXPLANATION,
    build_repair_prompt,
    build_safe_failure_dict,
    build_user_prompt,
)
from app.models import Finding, FixResponse

# Load environment variables
load_dotenv()

logger = logging.getLogger("ai_fix_agent")


def analyze_brackets_and_quotes(code: str) -> tuple[bool, list[str], str]:
    """
    Check bracket balance and quote closure in code snippet,
    correctly skipping comments and regular expression literals.
    Returns:
        (is_valid, remaining_stack, error_message)
    """
    stack: list[str] = []
    pairs = {")": "(", "}": "{", "]": "["}
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    in_regex = False
    in_regex_class = False
    in_line_comment = False
    in_block_comment = False
    escaped = False

    i = 0
    n = len(code)
    while i < n:
        char = code[i]
        next_char = code[i + 1] if i + 1 < n else ""

        if in_line_comment:
            if char == "\n":
                in_line_comment = False
            i += 1
            continue

        if in_block_comment:
            if char == "*" and next_char == "/":
                in_block_comment = False
                i += 2
                continue
            i += 1
            continue

        if escaped:
            escaped = False
            i += 1
            continue

        if char == "\\":
            escaped = True
            i += 1
            continue

        if not (in_single_quote or in_double_quote or in_backtick or in_regex):
            if char == "/" and next_char == "/":
                in_line_comment = True
                i += 2
                continue
            if char == "/" and next_char == "*":
                in_block_comment = True
                i += 2
                continue
            # Detect regular expression literal start in JS
            if char == "/":
                prev_non_space = ""
                for p in reversed(code[:i]):
                    if not p.isspace():
                        prev_non_space = p
                        break
                if prev_non_space in ("", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", ";", "n"):
                    in_regex = True
                    i += 1
                    continue

        if in_regex:
            if char == "[":
                in_regex_class = True
            elif char == "]" and in_regex_class:
                in_regex_class = False
            elif char == "/" and not in_regex_class:
                in_regex = False
            i += 1
            continue

        if char == "'" and not in_double_quote and not in_backtick:
            in_single_quote = not in_single_quote
            i += 1
            continue
        if char == '"' and not in_single_quote and not in_backtick:
            in_double_quote = not in_double_quote
            i += 1
            continue
        if char == "`" and not in_single_quote and not in_double_quote:
            in_backtick = not in_backtick
            i += 1
            continue

        if in_single_quote or in_double_quote or in_backtick:
            i += 1
            continue

        if char in pairs.values():
            stack.append(char)
        elif char in pairs:
            if not stack:
                return False, [], f"Unexpected closing bracket '{char}'"
            expected = stack.pop()
            if expected != pairs[char]:
                return False, [], f"Mismatched closing bracket '{char}', expected match for '{expected}'"

        i += 1

    if in_single_quote:
        return False, stack, "Unclosed single quote string literal"
    if in_double_quote:
        return False, stack, "Unclosed double quote string literal"
    if in_backtick:
        return False, stack, "Unclosed template literal (backtick)"

    return True, stack, ""


def check_bracket_balance(code: str) -> bool:
    """Basic sanity check ensuring matching brackets and closed quotes."""
    is_valid, stack, _ = analyze_brackets_and_quotes(code)
    return is_valid and len(stack) == 0


def validate_javascript_syntax(file_path: str, spliced_code: str) -> tuple[bool, str]:
    """
    Validate JS syntax using Node.js --check if available.
    Skips JSX/TSX as native node does not parse JSX without Babel.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext not in [".js", ".mjs", ".cjs"]:
        return True, "Skipped non-standard JS file"

    try:
        proc = subprocess.run(
            ["node", "--check"],
            input=spliced_code,
            text=True,
            capture_output=True,
            timeout=3.0,
        )
        if proc.returncode == 0:
            return True, "JavaScript syntax valid"
        err_lines = proc.stderr.strip().splitlines()
        first_err = "SyntaxError"
        for line in err_lines:
            if "SyntaxError:" in line or "Error:" in line:
                first_err = line.strip()
                break
        return False, f"JavaScript syntax error: {first_err}"
    except (subprocess.TimeoutExpired, FileNotFoundError, PermissionError):
        return True, "Node.js check unavailable"


def check_code_syntax(
    original_code: str,
    fixed_code: str,
    file_path: str = "",
    file_content: str | None = None,
) -> tuple[bool, str]:
    """
    Validate that fixed_code is syntactically sound in isolation and in context:
    1. Check quotes and bracket nesting in fixed_code.
    2. Ensure fixed_code preserves bracket stack structure relative to original_code.
    3. If JavaScript (.js) and file_content is available, run Node.js syntax check.
    """
    is_valid_fixed, fixed_stack, fixed_err = analyze_brackets_and_quotes(fixed_code)
    if not is_valid_fixed:
        return False, f"Generated patch has unbalanced brackets or quotes (syntax error: {fixed_err})"

    is_valid_orig, orig_stack, _ = analyze_brackets_and_quotes(original_code)
    if is_valid_orig:
        # If original code was self-contained, fixed code must be self-contained
        if len(orig_stack) == 0 and len(fixed_stack) != 0:
            return False, "Generated patch has unbalanced brackets or quotes (syntax error: unclosed brackets)"
        # If original code was an open block (e.g. callback), fixed code must match the open stack
        if len(orig_stack) > 0 and fixed_stack != orig_stack and len(fixed_stack) != 0:
            return False, (
                f"Generated patch has unbalanced brackets or quotes "
                f"(syntax error: bracket structure mismatch: expected {orig_stack}, got {fixed_stack})"
            )

    # Contextual Node.js syntax validation for JS files
    if file_path and file_content:
        ext = os.path.splitext(file_path)[1].lower()
        if ext in [".js", ".mjs", ".cjs"]:
            spliced: str | None = None
            if original_code in file_content:
                spliced = file_content.replace(original_code, fixed_code, 1)
            elif original_code.strip() in file_content:
                spliced = file_content.replace(original_code.strip(), fixed_code.strip(), 1)

            if spliced is not None:
                valid_js, js_err = validate_javascript_syntax(file_path, spliced)
                if not valid_js:
                    return False, f"Generated patch failed JavaScript syntax check ({js_err})"

    return True, "Syntax valid"


def generate_unified_diff(file_path: str, original_code: str, fixed_code: str) -> str:
    """Compute standard unified diff representation between original and fixed code."""
    orig_lines = [f"{line}\n" for line in original_code.splitlines()]
    fixed_lines = [f"{line}\n" for line in fixed_code.splitlines()]
    diff = difflib.unified_diff(
        orig_lines,
        fixed_lines,
        fromfile=f"a/{file_path}",
        tofile=f"b/{file_path}",
    )
    return "".join(diff)


class AIFixAgent:
    """
    AI Coding Agent that reasons dynamically about vulnerability findings,
    inspects context, generates minimal safe fixes, self-validates patches,
    and returns structured output.
    """

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model = model or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        self.base_url = (base_url or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")).rstrip("/")
        self.endpoint = f"{self.base_url}/chat/completions"
        self.timeout = timeout_seconds

    def validate_patch(
        self,
        finding: Finding,
        patch_data: dict[str, Any],
        file_content: str | None = None,
    ) -> tuple[bool, str]:
        """
        Validate the generated patch against agent rules:
        - Check required fields
        - Check that vulnerable construct is removed
        - Ensure syntax is not broken
        - Check that change is targeted
        """
        required_fields = {
            "finding_id",
            "file_path",
            "original_code",
            "fixed_code",
            "explanation_of_change",
            "confidence",
        }
        if not required_fields.issubset(patch_data.keys()):
            missing = required_fields - set(patch_data.keys())
            return False, f"Missing required fields: {missing}"

        # If it's a safe failure response, validation passes
        if patch_data.get("fixed_code") == "":
            return True, "Safe failure format validated"

        # Check finding ID and file path consistency
        if patch_data["finding_id"] != finding.id:
            return False, f"finding_id mismatch: expected {finding.id}, got {patch_data['finding_id']}"
        if patch_data["file_path"] != finding.file_path:
            return False, f"file_path mismatch: expected {finding.file_path}, got {patch_data['file_path']}"

        fixed_code = patch_data.get("fixed_code", "")
        original_code = patch_data.get("original_code") or finding.snippet

        if not fixed_code.strip():
            return False, "fixed_code is empty in non-failure response"

        # Check if matched_text is still verbatim present in fixed_code
        matched = finding.matched_text.strip()
        if len(matched) > 5 and matched in fixed_code:
            return False, "Vulnerable construct was not removed from the fixed code"

        # Check basic syntax and contextual sanity
        is_syntax_valid, syntax_reason = check_code_syntax(
            original_code=original_code,
            fixed_code=fixed_code,
            file_path=finding.file_path,
            file_content=file_content,
        )
        if not is_syntax_valid:
            return False, syntax_reason

        return True, "Patch passed validation"

    def _format_safe_failure(
        self,
        finding: Finding,
        explanation: str = SAFE_FAILURE_EXPLANATION,
    ) -> FixResponse:
        """Create a standard FixResponse representing a safe failure."""
        severity_val = finding.severity.value if hasattr(finding.severity, "value") else str(finding.severity)
        return FixResponse(
            finding_id=finding.id,
            file_path=finding.file_path,
            original_code=finding.snippet,
            fixed_code="",
            diff="",
            explanation_of_change=explanation,
            confidence=0.0,
            line_number=finding.line_start,
            rule_id=finding.rule_id,
            severity=severity_val,
            cwe=finding.cwe,
            title=finding.title,
        )

    def _parse_model_json(self, raw_content: str) -> tuple[bool, dict[str, Any] | None, str]:
        """Strip markdown fences and parse model JSON response."""
        try:
            clean_content = raw_content.strip()
            if clean_content.startswith("```"):
                clean_content = re.sub(r"^```(?:json)?\s*", "", clean_content)
                clean_content = re.sub(r"\s*```$", "", clean_content)
            clean_content = clean_content.strip()
            data = json.loads(clean_content)
            return True, data, ""
        except Exception as err:
            return False, None, str(err)

    def _build_fix_response(
        self,
        finding: Finding,
        patch_data: dict[str, Any],
    ) -> FixResponse:
        """Construct a validated FixResponse with generated unified diff strictly after validation."""
        fixed_code = patch_data.get("fixed_code", "")
        original_code = patch_data.get("original_code") or finding.snippet

        diff_val = ""
        if fixed_code:
            diff_val = generate_unified_diff(finding.file_path, original_code, fixed_code)

        try:
            confidence = float(patch_data.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            confidence = 0.5 if fixed_code else 0.0

        severity_val = finding.severity.value if hasattr(finding.severity, "value") else str(finding.severity)

        return FixResponse(
            finding_id=patch_data.get("finding_id", finding.id),
            file_path=patch_data.get("file_path", finding.file_path),
            original_code=original_code,
            fixed_code=fixed_code,
            diff=diff_val,
            explanation_of_change=patch_data.get("explanation_of_change", ""),
            confidence=confidence,
            line_number=finding.line_start,
            rule_id=finding.rule_id,
            severity=severity_val,
            cwe=finding.cwe,
            title=finding.title,
        )

    def _process_model_response(
        self,
        finding: Finding,
        raw_content: str,
        file_content: str | None = None,
    ) -> FixResponse:
        """Parse, validate, and normalize the model's JSON response."""
        ok, data, err = self._parse_model_json(raw_content)
        if not ok or data is None:
            logger.warning(f"Failed to parse model JSON: {err}. Raw content: {raw_content[:200]}")
            return self._format_safe_failure(
                finding,
                explanation="Model response was not valid JSON; returning safe failure.",
            )

        is_valid, reason = self.validate_patch(finding, data, file_content=file_content)
        if not is_valid:
            logger.warning(f"Patch validation failed for finding {finding.id}: {reason}")
            return self._format_safe_failure(
                finding,
                explanation=f"Generated patch failed validation ({reason}).",
            )

        return self._build_fix_response(finding, data)

    async def _execute_post_async_with_retry(self, headers: dict, payload: dict) -> str:
        """Post to Groq chat completions endpoint with automatic backoff on 429 rate limit."""
        import asyncio
        for attempt in range(3):
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.endpoint, headers=headers, json=payload)
                if response.status_code == 429 and attempt < 2:
                    wait_time = 8.0
                    try:
                        err_body = response.json()
                        msg = err_body.get("error", {}).get("message", "")
                        m = re.search(r"try again in ([\d\.]+)s", msg)
                        if m:
                            wait_time = float(m.group(1)) + 1.0
                    except Exception:
                        pass
                    logger.warning(f"Groq 429 rate limit hit. Waiting {wait_time:.1f}s before retry (attempt {attempt + 1})...")
                    await asyncio.sleep(min(wait_time, 20.0))
                    continue
                response.raise_for_status()
                res_data = response.json()
                return res_data["choices"][0]["message"]["content"]
        raise RuntimeError("Exhausted retries on 429 rate limit")

    def _execute_post_with_retry(self, headers: dict, payload: dict) -> str:
        """Synchronously post to Groq with automatic backoff on 429 rate limit."""
        import time
        for attempt in range(3):
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.endpoint, headers=headers, json=payload)
                if response.status_code == 429 and attempt < 2:
                    wait_time = 8.0
                    try:
                        err_body = response.json()
                        msg = err_body.get("error", {}).get("message", "")
                        m = re.search(r"try again in ([\d\.]+)s", msg)
                        if m:
                            wait_time = float(m.group(1)) + 1.0
                    except Exception:
                        pass
                    logger.warning(f"Groq 429 rate limit hit. Waiting {wait_time:.1f}s before retry (attempt {attempt + 1})...")
                    time.sleep(min(wait_time, 20.0))
                    continue
                response.raise_for_status()
                res_data = response.json()
                return res_data["choices"][0]["message"]["content"]
        raise RuntimeError("Exhausted retries on 429 rate limit")

    async def _attempt_repair_async(
        self,
        finding: Finding,
        invalid_fixed_code: str,
        validation_error: str,
        file_content: str | None = None,
    ) -> FixResponse | None:
        """
        Make ONE automatic repair attempt through Groq using the invalid generated code,
        the specific validation error, and original code context.
        """
        repair_prompt = build_repair_prompt(
            finding=finding,
            invalid_fixed_code=invalid_fixed_code,
            validation_error=validation_error,
            file_content=file_content,
        )
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": FIX_AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": repair_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            raw_content = await self._execute_post_async_with_retry(headers=headers, payload=payload)
            ok, data, _ = self._parse_model_json(raw_content)
            if not ok or data is None:
                return None
            is_valid, reason = self.validate_patch(finding, data, file_content=file_content)
            if not is_valid:
                logger.warning(f"Repaired patch also failed validation for finding {finding.id}: {reason}")
                return None
            return self._build_fix_response(finding, data)
        except Exception as err:
            logger.warning(f"Repair request failed for finding {finding.id}: {err}")
            return None

    def _attempt_repair(
        self,
        finding: Finding,
        invalid_fixed_code: str,
        validation_error: str,
        file_content: str | None = None,
    ) -> FixResponse | None:
        """Synchronous version of _attempt_repair_async."""
        repair_prompt = build_repair_prompt(
            finding=finding,
            invalid_fixed_code=invalid_fixed_code,
            validation_error=validation_error,
            file_content=file_content,
        )
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": FIX_AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": repair_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        try:
            raw_content = self._execute_post_with_retry(headers=headers, payload=payload)
            ok, data, _ = self._parse_model_json(raw_content)
            if not ok or data is None:
                return None
            is_valid, reason = self.validate_patch(finding, data, file_content=file_content)
            if not is_valid:
                logger.warning(f"Repaired patch also failed validation for finding {finding.id}: {reason}")
                return None
            return self._build_fix_response(finding, data)
        except Exception as err:
            logger.warning(f"Repair request failed for finding {finding.id}: {err}")
            return None

    def generate_fix(
        self,
        finding: Finding,
        file_content: str | None = None,
    ) -> FixResponse:
        """
        Synchronously generate a safe fix for a finding using the LLM agent.
        Includes automatic 1-shot repair if initial fix fails validation.
        """
        if not self.api_key:
            logger.error("No GROQ_API_KEY provided or configured.")
            return self._format_safe_failure(
                finding,
                explanation="AI Agent API key not configured.",
            )

        user_prompt = build_user_prompt(finding, file_content)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": FIX_AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            raw_content = self._execute_post_with_retry(headers=headers, payload=payload)
        except httpx.HTTPStatusError as err:
            logger.error(f"Groq API HTTP error: {err.response.status_code} - {err.response.text}")
            return self._format_safe_failure(
                finding,
                explanation=f"AI service returned HTTP status {err.response.status_code}.",
            )
        except Exception as err:
            logger.error(f"Error communicating with AI service: {err}")
            return self._format_safe_failure(
                finding,
                explanation=f"AI service connection failed: {str(err)}",
            )

        # Parse initial JSON
        ok, data, parse_err = self._parse_model_json(raw_content)
        if not ok or data is None:
            logger.warning(f"Initial model response not valid JSON for finding {finding.id}: {parse_err}")
            repair_err = f"Response was not valid JSON: {parse_err}"
            repaired = self._attempt_repair(finding, raw_content[:200], repair_err, file_content)
            if repaired and repaired.fixed_code:
                return repaired
            return self._format_safe_failure(
                finding,
                explanation="Model response was not valid JSON; repair attempt failed.",
            )

        # Validate initial patch
        is_valid, reason = self.validate_patch(finding, data, file_content=file_content)
        if is_valid:
            return self._build_fix_response(finding, data)

        # Validation failed! Perform ONE automatic repair attempt
        logger.warning(f"Patch validation failed for finding {finding.id}: {reason}. Attempting 1-shot repair...")
        invalid_fixed_code = data.get("fixed_code", "")
        repaired = self._attempt_repair(finding, invalid_fixed_code, reason, file_content)
        if repaired and repaired.fixed_code:
            logger.info(f"Repair attempt succeeded for finding {finding.id}")
            return repaired

        logger.warning(f"Repair attempt failed for finding {finding.id}. Returning safe failure.")
        return self._format_safe_failure(
            finding,
            explanation=f"Generated patch failed validation after repair attempt ({reason}).",
        )

    async def generate_fix_async(
        self,
        finding: Finding,
        file_content: str | None = None,
    ) -> FixResponse:
        """
        Asynchronously generate a safe fix for a finding using the LLM agent.
        Includes automatic 1-shot repair if initial fix fails validation.
        """
        if not self.api_key:
            logger.error("No GROQ_API_KEY provided or configured.")
            return self._format_safe_failure(
                finding,
                explanation="AI Agent API key not configured.",
            )

        user_prompt = build_user_prompt(finding, file_content)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": FIX_AGENT_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            raw_content = await self._execute_post_async_with_retry(headers=headers, payload=payload)
        except httpx.HTTPStatusError as err:
            logger.error(f"Groq API HTTP error: {err.response.status_code} - {err.response.text}")
            return self._format_safe_failure(
                finding,
                explanation=f"AI service returned HTTP status {err.response.status_code}.",
            )
        except Exception as err:
            logger.error(f"Error communicating with AI service: {err}")
            return self._format_safe_failure(
                finding,
                explanation=f"AI service connection failed: {str(err)}",
            )

        # Parse initial JSON
        ok, data, parse_err = self._parse_model_json(raw_content)
        if not ok or data is None:
            logger.warning(f"Initial model response not valid JSON for finding {finding.id}: {parse_err}")
            repair_err = f"Response was not valid JSON: {parse_err}"
            repaired = await self._attempt_repair_async(finding, raw_content[:200], repair_err, file_content)
            if repaired and repaired.fixed_code:
                return repaired
            return self._format_safe_failure(
                finding,
                explanation="Model response was not valid JSON; repair attempt failed.",
            )

        # Validate initial patch
        is_valid, reason = self.validate_patch(finding, data, file_content=file_content)
        if is_valid:
            return self._build_fix_response(finding, data)

        # Validation failed! Perform ONE automatic repair attempt
        logger.warning(f"Patch validation failed for finding {finding.id}: {reason}. Attempting 1-shot repair...")
        invalid_fixed_code = data.get("fixed_code", "")
        repaired = await self._attempt_repair_async(finding, invalid_fixed_code, reason, file_content)
        if repaired and repaired.fixed_code:
            logger.info(f"Repair attempt succeeded for finding {finding.id}")
            return repaired

        logger.warning(f"Repair attempt failed for finding {finding.id}. Returning safe failure.")
        return self._format_safe_failure(
            finding,
            explanation=f"Generated patch failed validation after repair attempt ({reason}).",
        )

    async def generate_explanation_async(
        self,
        finding: Finding,
    ) -> tuple[str, str, str]:
        """
        Generate structured (explanation, impact, recommendation) using Groq LLM.
        """
        fallback_explanation = f"{finding.title} detected at {finding.file_path}:{finding.line_start}."
        fallback_impact = f"Security vulnerability associated with {finding.cwe} ({finding.severity.value})."
        fallback_recommendation = "Apply input validation, parameterized patterns, and secure coding practices."

        if not self.api_key:
            return fallback_explanation, fallback_impact, fallback_recommendation

        prompt = (
            f"Analyze this security vulnerability finding:\n"
            f"Rule: {finding.rule_id} ({finding.title})\n"
            f"Severity: {finding.severity.value}\n"
            f"CWE: {finding.cwe}\n"
            f"File: {finding.file_path}:{finding.line_start}\n"
            f"Snippet: {finding.snippet}\n\n"
            f"Respond ONLY with a JSON object containing exactly these 3 keys:\n"
            f'{{"explanation": "...", "impact": "...", "recommendation": "..."}}'
        )

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": "You are a senior security researcher. Output strictly valid JSON with keys: explanation, impact, recommendation.",
                },
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.endpoint, headers=headers, json=payload)
                response.raise_for_status()
                res_data = response.json()
                raw = res_data["choices"][0]["message"]["content"]
                parsed = json.loads(raw)
                return (
                    parsed.get("explanation", fallback_explanation),
                    parsed.get("impact", fallback_impact),
                    parsed.get("recommendation", fallback_recommendation),
                )
        except Exception as err:
            logger.warning(f"Error generating explanation: {err}")
            return fallback_explanation, fallback_impact, fallback_recommendation

    def generate_explanation(
        self,
        finding: Finding,
    ) -> tuple[str, str, str]:
        """Synchronous version of generate_explanation_async."""
        import asyncio
        return asyncio.run(self.generate_explanation_async(finding))


# Default singleton instance
default_agent = AIFixAgent()
