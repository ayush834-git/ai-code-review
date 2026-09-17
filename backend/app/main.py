import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pathlib import Path

from app.ai import default_agent
from app.models import Finding, FixRequest, FixResponse, ScanRequest, ScanResponse, ScanSummary
from app.scanner.engine import scan_repository


app = FastAPI(
    title="AI Code Review Agent",
    version="1.0.0",
    description="AI-powered code review and vulnerability detection agent",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Temporary in-memory scan storage
scans = {}


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "service": "AI Code Review Agent",
    }


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