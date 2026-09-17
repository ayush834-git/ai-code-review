import os
import logging
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.models import ApplyPRRequest, ApplyPRResponse, HealthResponse
from app.github.client import (
    GitHubClient,
    GitHubAuthError,
    GitHubResourceNotFoundError,
    LineNumberOutOfRangeError,
    GitHubAPIException
)

# Load environment configuration
load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_code_review_backend")

app = FastAPI(
    title="AI Code Review Agent Backend",
    description="Automated vulnerability detection and GitHub Pull Request remediation API",
    version="1.0.0"
)

# Enable CORS for local frontend development (Next.js / Vite / Vanilla)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        github_token_configured=bool(token)
    )


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
                "hint": "Ensure GITHUB_TOKEN is configured in backend/.env with 'repo' scope."
            }
        )

    except GitHubResourceNotFoundError as exc:
        logger.error(f"GitHub Resource Not Found: {exc}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "GitHub Resource Not Found",
                "message": str(exc)
            }
        )

    except LineNumberOutOfRangeError as exc:
        logger.error(f"Line Number Error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "error": "Invalid Line Number",
                "message": str(exc)
            }
        )

    except GitHubAPIException as exc:
        logger.error(f"GitHub API Error: {exc} (status {exc.status_code})")
        raise HTTPException(
            status_code=exc.status_code if 400 <= exc.status_code < 600 else 500,
            detail={
                "error": "GitHub API Error",
                "message": str(exc),
                "details": exc.details
            }
        )

    except Exception as exc:
        logger.exception("Unexpected error during PR creation")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Internal Server Error",
                "message": str(exc)
            }
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
