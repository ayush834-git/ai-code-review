from enum import Enum

from pydantic import BaseModel, Field


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
    scan_id: str
    finding_id: str


class ExplainResponse(BaseModel):
    finding_id: str
    explanation: str
    impact: str
    recommendation: str


class FixRequest(BaseModel):
    scan_id: str | None = None
    finding_id: str | None = None
    finding: Finding | None = None


class FixResponse(BaseModel):
    finding_id: str
    file_path: str
    original_code: str
    fixed_code: str
    diff: str
    explanation_of_change: str
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class ApplyPRRequest(BaseModel):
    scan_id: str
    finding_ids: list[str]


class ApplyPRResponse(BaseModel):
    branch: str
    commit_sha: str
    pr_number: int
    pr_url: str
    files_changed: int


class ErrorResponse(BaseModel):
    error: str