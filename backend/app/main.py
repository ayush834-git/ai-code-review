import logging
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.ai import default_agent
from app.github.client import (
    GitHubAPIException,
    GitHubAuthError,
    GitHubClient,
    GitHubResourceNotFoundError,
    LineNumberOutOfRangeError,
)
from app.models import (
    ApplyPRRequest,
    ApplyPRResponse,
    Finding,
    FixRequest,
    FixResponse,
    HealthResponse,
    ScanRequest,
    ScanResponse,
    ScanSummary,
)
from app.scanner.engine import scan_repository

# Load environment configuration
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_code_review_backend")

app = FastAPI(
    title="AI Code Review Agent Backend",
    description="Automated vulnerability detection, AI remediation, and GitHub Pull Request integration API",
    version="1.0.0",
)

# Enable CORS for local frontend development (Next.js / Vite / Vanilla)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary in-memory scan storage
scans: dict[str, ScanResponse] = {}


@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "AI Code Review Agent",
    }


@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint reporting backend readiness and GitHub token presence.
    """
    token = os.getenv("GITHUB_TOKEN", "").strip()
    return HealthResponse(
        status="ok",
        service="ai-code-review-backend",
        github_token_configured=bool(token),
    )


@app.post("/api/scan", response_model=ScanResponse)
def scan(request: ScanRequest):
    try:
        findings, files_scanned, duration_ms = scan_repository(
            request.repo_url
        )
    except FileNotFoundError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    summary = ScanSummary(
        critical=sum(
            1 for finding in findings
            if finding.severity.value == "critical"
        ),
        high=sum(
            1 for finding in findings
            if finding.severity.value == "high"
        ),
        medium=sum(
            1 for finding in findings
            if finding.severity.value == "medium"
        ),
        low=sum(
            1 for finding in findings
            if finding.severity.value == "low"
        ),
        total=len(findings),
    )

    scan_id = f"scn_{uuid.uuid4().hex[:6]}"

    result = ScanResponse(
        scan_id=scan_id,
        repo_url=request.repo_url,
        files_scanned=files_scanned,
        duration_ms=duration_ms,
        summary=summary,
        findings=findings,
    )

    scans[scan_id] = result
    return result


@app.post("/api/fix", response_model=FixResponse)
async def fix(request: FixRequest):
    finding: Finding | None = None
    repo_url: str | None = None

    if request.finding:
        finding = request.finding
    elif request.scan_id and request.finding_id:
        scan_result = scans.get(request.scan_id)
        if not scan_result:
            raise HTTPException(
                status_code=404,
                detail=f"Scan '{request.scan_id}' not found.",
            )
        repo_url = scan_result.repo_url
        for f in scan_result.findings:
            if f.id == request.finding_id:
                finding = f
                break
        if not finding:
            raise HTTPException(
                status_code=404,
                detail=f"Finding '{request.finding_id}' not found in scan '{request.scan_id}'.",
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="Either 'finding' or both 'scan_id' and 'finding_id' must be provided.",
        )

    file_content: str | None = None
    if repo_url:
        try:
            full_path = Path(repo_url) / finding.file_path
            if full_path.exists() and full_path.is_file():
                file_content = full_path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            file_content = None

    result = await default_agent.generate_fix_async(finding, file_content=file_content)
    return result


@app.post("/api/apply-pr", response_model=ApplyPRResponse, status_code=status.HTTP_201_CREATED)
async def apply_pr(payload: ApplyPRRequest):
    """
    Apply a security fix to a vulnerable line and create a GitHub Pull Request.
    Accepts:
      - owner, repo: target GitHub repo
      - file_path: e.g. 'api/users.js'
      - line_number: 1-indexed target line
      - fixed_code: replacement code string
      - severity, cwe, explanation, impact, diff details
    Returns:
      {
        "branch": "patch/sqli-f001-1734",
        "commit_sha": "3fa9c1e...",
        "pr_number": 7,
        "pr_url": "https://github.com/...",
        "files_changed": 1
      }
    """
    client = GitHubClient()

    try:
        response = await client.apply_fix_and_create_pr(payload)
        return response

    except GitHubAuthError as exc:
        logger.error(f"GitHub Auth Error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "GitHub Authentication Failed",
                "message": str(exc),
                "hint": "Ensure GITHUB_TOKEN is configured in backend/.env with 'repo' scope.",
            },
        )

    except GitHubResourceNotFoundError as exc:
        logger.error(f"GitHub Resource Not Found: {exc}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "GitHub Resource Not Found",
                "message": str(exc),
            },
        )

    except LineNumberOutOfRangeError as exc:
        logger.error(f"Line Number Error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Invalid Line Number",
                "message": str(exc),
            },
        )

    except GitHubAPIException as exc:
        logger.error(f"GitHub API Error: {exc} (status {exc.status_code})")
        raise HTTPException(
            status_code=exc.status_code if 400 <= exc.status_code < 600 else 500,
            detail={
                "error": "GitHub API Error",
                "message": str(exc),
                "details": exc.details,
            },
        )

    except Exception as exc:
        logger.exception("Unexpected error during PR creation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal Server Error",
                "message": str(exc),
            },
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
