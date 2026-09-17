from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, model_validator


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Finding(BaseModel):
    id: str
    rule_id: str
    title: str
    severity: Severity
    category: str
    cwe: str
    file_path: str
    line_start: int = Field(ge=1)
    line_end: int = Field(ge=1)
    snippet: str
    context: str
    matched_text: str


class ScanRequest(BaseModel):
    repo_url: str


class ScanSummary(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    total: int = 0


class ScanResponse(BaseModel):
    scan_id: str
    repo_url: str
    files_scanned: int
    duration_ms: int
    summary: ScanSummary
    findings: list[Finding]


class ExplainRequest(BaseModel):
    scan_id: Optional[str] = None
    finding_id: Optional[str] = None
    finding: Optional[Finding] = None


class ExplainResponse(BaseModel):
    finding_id: str
    explanation: str
    impact: str
    recommendation: str


class FixRequest(BaseModel):
    scan_id: Optional[str] = None
    finding_id: Optional[str] = None
    finding: Optional[Finding] = None


class FixResponse(BaseModel):
    finding_id: str
    file_path: str
    original_code: str
    fixed_code: str
    diff: str
    explanation_of_change: str
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    line_number: Optional[int] = Field(None, description="1-indexed line number of vulnerable code")
    rule_id: Optional[str] = Field(None, description="Rule or vulnerability identifier")
    severity: Optional[str] = Field(None, description="Severity level: CRITICAL, HIGH, MEDIUM, LOW")
    cwe: Optional[str] = Field(None, description="CWE category identifier and name")
    title: Optional[str] = Field(None, description="Vulnerability title")


class ApplyPRRequest(BaseModel):
    """
    Request payload for applying a security patch and creating a GitHub Pull Request.
    """
    owner: Optional[str] = Field(None, description="GitHub repository owner/organization")
    repo: Optional[str] = Field(None, description="GitHub repository name")
    file_path: Optional[str] = Field(None, description="Target file path in repository (e.g. api/users.js)")
    line_number: Optional[int] = Field(None, ge=1, description="1-indexed line number of vulnerable code")
    fixed_code: Optional[str] = Field(None, description="Patched code to replace the vulnerable line")
    original_code: Optional[str] = Field(None, description="Original vulnerable code snippet for diff display")
    diff: Optional[str] = Field(None, description="Unified diff details")
    rule_id: Optional[str] = Field(None, description="Rule or vulnerability type identifier (e.g. sqli, rce, xss)")
    finding_id: Optional[str] = Field(None, description="Unique finding ID")
    severity: Optional[str] = Field(None, description="Severity level: CRITICAL, HIGH, MEDIUM, LOW")
    cwe: Optional[str] = Field(None, description="CWE category identifier and name")
    title: Optional[str] = Field(None, description="Pull Request title (auto-generated if omitted)")
    explanation: Optional[str] = Field(None, description="AI explanation of why this vulnerability occurred")
    explanation_of_change: Optional[str] = Field(None, description="Alias for explanation from FixResponse")
    impact: Optional[str] = Field(None, description="Security impact assessment of the vulnerability")
    base_branch: Optional[str] = Field(None, description="Target base branch for PR (defaults to repo default or main)")
    scan_id: Optional[str] = Field(None, description="Scan ID if provided from scan pipeline")
    finding_ids: Optional[list[str]] = Field(None, description="List of finding IDs if batched")

    @model_validator(mode="after")
    def normalize_fields(self):
        if not self.explanation and self.explanation_of_change:
            self.explanation = self.explanation_of_change
        return self


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
    config_status: Optional[dict[str, bool]] = None


class ErrorResponse(BaseModel):
    error: str
