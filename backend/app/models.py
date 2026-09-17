from typing import Optional
from pydantic import BaseModel, Field

class ApplyPRRequest(BaseModel):
    """
    Request payload for applying a security patch and creating a GitHub Pull Request.
    """
    owner: Optional[str] = Field(None, description="GitHub repository owner/organization")
    repo: Optional[str] = Field(None, description="GitHub repository name")
    file_path: str = Field(..., description="Target file path in repository (e.g. api/users.js)")
    line_number: int = Field(..., ge=1, description="1-indexed line number of vulnerable code")
    fixed_code: str = Field(..., description="Patched code to replace the vulnerable line")
    original_code: Optional[str] = Field(None, description="Original vulnerable code snippet for diff display")
    rule_id: Optional[str] = Field("sqli", description="Rule or vulnerability type identifier (e.g. sqli, rce, xss)")
    finding_id: Optional[str] = Field("f001", description="Unique finding ID")
    severity: Optional[str] = Field("CRITICAL", description="Severity level: CRITICAL, HIGH, MEDIUM, LOW")
    cwe: Optional[str] = Field("CWE-89: SQL Injection", description="CWE category identifier and name")
    title: Optional[str] = Field(None, description="Pull Request title (auto-generated if omitted)")
    explanation: Optional[str] = Field(None, description="AI explanation of why this vulnerability occurred")
    impact: Optional[str] = Field(None, description="Security impact assessment of the vulnerability")
    base_branch: Optional[str] = Field(None, description="Target base branch for PR (defaults to repo default or main)")

class ApplyPRResponse(BaseModel):
    """
    Response returned after successfully creating a branch, committing the patch, and opening a PR.
    """
    branch: str = Field(..., description="Name of the generated patch branch")
    commit_sha: str = Field(..., description="SHA of the fix commit")
    pr_number: int = Field(..., description="Pull Request number on GitHub")
    pr_url: str = Field(..., description="Direct URL to view the created Pull Request")
    files_changed: int = Field(1, description="Number of files modified in the PR")

class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "ai-code-review-backend"
    github_token_configured: bool
