from __future__ import annotations

import difflib
import json
import logging
import os
import re
from typing import Any

import httpx
from dotenv import load_dotenv

from app.ai.prompts import (
    FIX_AGENT_SYSTEM_PROMPT,
    SAFE_FAILURE_EXPLANATION,
    build_safe_failure_dict,
    build_user_prompt,
)
from app.models import Finding, FixResponse

# Load environment variables
load_dotenv()

logger = logging.getLogger("ai_fix_agent")


def check_bracket_balance(code: str) -> bool:
    """Basic sanity check ensuring matching brackets and quotes in code snippet."""
    stack: list[str] = []
    pairs = {")": "(", "}": "{", "]": "["}
    in_single_quote = False
    in_double_quote = False
    in_backtick = False
    escaped = False

    for char in code:
        if escaped:
            escaped = False
            continue
        if char == "\\":
            escaped = True
            continue
        if char == "'" and not in_double_quote and not in_backtick:
            in_single_quote = not in_single_quote
            continue
        if char == '"' and not in_single_quote and not in_backtick:
            in_double_quote = not in_double_quote
            continue
        if char == "`" and not in_single_quote and not in_double_quote:
            in_backtick = not in_backtick
            continue
        if in_single_quote or in_double_quote or in_backtick:
            continue

        if char in pairs.values():
            stack.append(char)
        elif char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False

    return len(stack) == 0 and not (in_single_quote or in_double_quote or in_backtick)


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
            "diff",
            "explanation_of_change",
            "confidence",
        }
        if not required_fields.issubset(patch_data.keys()):
            missing = required_fields - set(patch_data.keys())
            return False, f"Missing required fields: {missing}"

        # If it's a safe failure response, validation passes
        if patch_data.get("fixed_code") == "" and patch_data.get("diff") == "":
            return True, "Safe failure format validated"

        # Check finding ID and file path consistency
        if patch_data["finding_id"] != finding.id:
            return False, f"finding_id mismatch: expected {finding.id}, got {patch_data['finding_id']}"
        if patch_data["file_path"] != finding.file_path:
            return False, f"file_path mismatch: expected {finding.file_path}, got {patch_data['file_path']}"

        fixed_code = patch_data.get("fixed_code", "")
        original_code = patch_data.get("original_code", "")

        if not fixed_code.strip():
            return False, "fixed_code is empty in non-failure response"

        # Check if matched_text is still verbatim present in fixed_code
        matched = finding.matched_text.strip()
        if len(matched) > 5 and matched in fixed_code:
            return False, "Vulnerable construct was not removed from the fixed code"

        # Check basic syntax sanity (bracket/quote balance)
        if not check_bracket_balance(fixed_code):
            return False, "Generated patch has unbalanced brackets or quotes (syntax error)"

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

    def _process_model_response(
        self,
        finding: Finding,
        raw_content: str,
    ) -> FixResponse:
        """Parse, validate, and normalize the model's JSON response."""
        try:
            # Strip possible markdown code fences if model enclosed JSON despite instructions
            clean_content = raw_content.strip()
            if clean_content.startswith("```"):
                clean_content = re.sub(r"^```(?:json)?\s*", "", clean_content)
                clean_content = re.sub(r"\s*```$", "", clean_content)
            clean_content = clean_content.strip()

            data = json.loads(clean_content)
        except Exception as err:
            logger.warning(f"Failed to parse model JSON: {err}. Raw content: {raw_content[:200]}")
            return self._format_safe_failure(
                finding,
                explanation="Model response was not valid JSON; returning safe failure.",
            )

        # Validate patch
        is_valid, reason = self.validate_patch(finding, data)
        if not is_valid:
            logger.warning(f"Patch validation failed for finding {finding.id}: {reason}")
            return self._format_safe_failure(
                finding,
                explanation=f"Generated patch failed validation ({reason}).",
            )

        # Ensure diff exists and is valid
        diff_val = data.get("diff", "")
        fixed_code = data.get("fixed_code", "")
        original_code = data.get("original_code") or finding.snippet

        if fixed_code and (not diff_val or not diff_val.strip()):
            diff_val = generate_unified_diff(finding.file_path, original_code, fixed_code)

        # Clamp confidence to [0.0, 1.0]
        try:
            confidence = float(data.get("confidence", 0.0))
            confidence = max(0.0, min(1.0, confidence))
        except (ValueError, TypeError):
            confidence = 0.5 if fixed_code else 0.0

        severity_val = finding.severity.value if hasattr(finding.severity, "value") else str(finding.severity)

        return FixResponse(
            finding_id=data.get("finding_id", finding.id),
            file_path=data.get("file_path", finding.file_path),
            original_code=original_code,
            fixed_code=fixed_code,
            diff=diff_val,
            explanation_of_change=data.get("explanation_of_change", ""),
            confidence=confidence,
            line_number=finding.line_start,
            rule_id=finding.rule_id,
            severity=severity_val,
            cwe=finding.cwe,
            title=finding.title,
        )

    def generate_fix(
        self,
        finding: Finding,
        file_content: str | None = None,
    ) -> FixResponse:
        """
        Synchronously generate a safe fix for a finding using the LLM agent.
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
            with httpx.Client(timeout=self.timeout) as client:
                response = client.post(self.endpoint, headers=headers, json=payload)
                response.raise_for_status()
                res_data = response.json()
                raw_content = res_data["choices"][0]["message"]["content"]
                return self._process_model_response(finding, raw_content)
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

    async def generate_fix_async(
        self,
        finding: Finding,
        file_content: str | None = None,
    ) -> FixResponse:
        """
        Asynchronously generate a safe fix for a finding using the LLM agent.
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
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(self.endpoint, headers=headers, json=payload)
                response.raise_for_status()
                res_data = response.json()
                raw_content = res_data["choices"][0]["message"]["content"]
                return self._process_model_response(finding, raw_content)
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


# Default singleton instance
default_agent = AIFixAgent()
