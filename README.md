# 🛡️ Code Bro — AI Code Review & Vulnerability Detection Agent

> **Autonomous End-to-End Security Analysis, Contextual AI Patch Generation, and GitHub Pull Request Remediation.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA--3.3--70B-orange?logo=fastapi&logoColor=white)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

**Code Bro** is an autonomous AI-powered security engineer designed to bridge the gap between static vulnerability detection and automated patch delivery. 

Traditional SAST (Static Application Security Testing) tools bombard developers with noisy alerts, leaving remediation as a tedious manual burden. Hardcoded template fixes, on the other hand, frequently break surrounding context or fail on varied syntaxes.

**Code Bro solves this through a hybrid architecture:**
1. **Deterministic Static Analysis**: Ultra-fast, deterministic rule matching (AST and targeted regex) identifies genuine security vulnerabilities with exact line numbers, code snippets, and surrounding context.
2. **Dynamic AI Reasoning**: Groq-powered large language models (LLaMA 3.3 70B) analyze the vulnerable snippet *alongside surrounding code context* to understand program intent, explain security implications, and construct targeted, drop-in replacements.
3. **Rigorous Self-Validation**: Every AI-generated fix passes through an automated validation gate (bracket balance, quote enclosure, Node.js syntax parsing, and vulnerability re-testing) before any code is modified.
4. **Automated GitHub Pull Request Delivery**: An asynchronous GitHub client isolates the fix on a dedicated patch branch, splices the change by exact line index, commits the modification, and opens a Pull Request with a comprehensive security summary.

---

## 🏗️ Architecture Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                       USER / CI                                        │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 1. Trigger Repository Scan
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND SCANNER                                  │
│  - Path Traversal & File Filtering (.js, .jsx, .ts, .tsx)                              │
│  - 8 Deterministic Security Rules (CWE Mappings)                                       │
│  - Context Extraction (Lines & Radii)                                                  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 2. Extracted Finding + Surrounding Context
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AUTONOMOUS AI FIX AGENT                                   │
│  - Groq Cloud API (LLaMA 3.3 70B Versatile)                                            │
│  - Zero-Shot & Few-Shot Security Prompts                                               │
│  - Contextual Reasoning & Minimal Patch Generation                                     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 3. Candidate Patch
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               SELF-VALIDATION ENGINE                                   │
│  ✔ Lexer Bracket/Quote Balance Checker                                                 │
│  ✔ Vulnerability Re-Check (Ensures bug is eradicated)                                  │
│  ✔ Node.js AST/Syntax Verification                                                     │
│  ✔ Unified Diff Generation (diff -u)                                                   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 4. Verified Patch
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                GITHUB PR INTEGRATION                                   │
│  - Fetch latest branch SHA from base (main)                                            │
│  - Create isolated branch: patch/{rule}-{finding}-{timestamp}                          │
│  - Line-index file splicing (preserves indentation & line-endings)                     │
│  - Base64 commit via GitHub Contents API                                               │
│  - Open Pull Request with CWE description, severity, and diff                          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ 5. PR Link
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           REACT + TAILWIND DASHBOARD                                   │
│  - Real-time Findings Explorer                                                         │
│  - Interactive AI Explanations & Diff Inspector                                        │
│  - One-Click Pull Request View                                                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features

* **Deterministic Static Scanner**: High-speed scanner that skips build artifacts (`dist`, `build`, `node_modules`, `.git`) and lockfiles, focusing exclusively on active application logic.
* **Context-Aware Dynamic AI Fixes**: No hardcoded template replacements. The AI agent analyzes variable declarations, function scopes, and library imports to generate syntactically seamless fixes.
* **Line-Index Splicing**: Unlike naive string replacement that corrupts duplicate lines elsewhere in a file, our engine computes the precise line index and preserves existing indentation, CRLF/LF line endings, and trailing newlines.
* **Lexer-Based Syntax Validation**: Built-in parenthesis, brace, bracket, template literal, and regex parser that guarantees no unbalanced code reaches your repository.
* **Complete GitHub Pull Request Lifecycle**: Creates branches, updates files, commits cleanly with informative commit messages, and opens PRs formatted for peer review.
* **Modern Dark-Mode Dashboard**: Visual dashboard providing real-time status, severity filtering (Critical, High, Medium, Low), inline explanations, diff visualization, and direct links to live GitHub PRs.

---

## 🛡️ Supported Vulnerability Rules

The static analysis engine checks JavaScript and TypeScript source files against 8 high-impact vulnerability classes mapped to Common Weakness Enumeration (CWE) standards:

| Rule ID | Title | Severity | CWE | Vulnerable Pattern Example |
| :--- | :--- | :--- | :--- | :--- |
| **`SQLI-001`** | SQL Injection | `CRITICAL` | [CWE-89](https://cwe.mitre.org/data/definitions/89.html) | `db.query("SELECT * FROM users WHERE id=" + id)` |
| **`CMDI-001`** | OS Command Injection | `CRITICAL` | [CWE-78](https://cwe.mitre.org/data/definitions/78.html) | `exec("ping -c 1 " + host, callback)` |
| **`SECRET-001`**| Hardcoded Secret/Token | `CRITICAL` | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) | `const apiKey = "sk_live_9384729183749281";` |
| **`XSS-001`** | Cross-Site Scripting (XSS) | `HIGH` | [CWE-79](https://cwe.mitre.org/data/definitions/79.html) | `<div dangerouslySetInnerHTML={{ __html: bio }} />` |
| **`EVAL-001`** | Arbitrary Code Execution | `HIGH` | [CWE-95](https://cwe.mitre.org/data/definitions/95.html) | `eval("data = " + req.body.payload)` |
| **`CRYPTO-001`**| Broken Cryptography | `HIGH` | [CWE-327](https://cwe.mitre.org/data/definitions/327.html) | `crypto.createHash("md5").update(pass).digest()` |
| **`PATH-001`** | Path Traversal | `MEDIUM` | [CWE-22](https://cwe.mitre.org/data/definitions/22.html) | `fs.readFileSync(path.join(__dirname, req.query.file))` |
| **`TLS-001`** | Disabled TLS Verification | `MEDIUM` | [CWE-295](https://cwe.mitre.org/data/definitions/295.html) | `https.request({ rejectUnauthorized: false })` |

---

## 📂 Repository Structure

```
ai-code-review-agent/
│
├── backend/                             # Python FastAPI Backend Service
│   ├── app/
│   │   ├── ai/                          # AI Fix Agent & Reasoning Engine
│   │   │   ├── client.py                # AIFixAgent, validation engine, retry logic
│   │   │   └── prompts.py               # Prompt templates & few-shot examples
│   │   ├── github/                      # GitHub API Client
│   │   │   └── client.py                # Branching, line-splicing, commit, PR APIs
│   │   ├── scanner/                     # Static Analysis Rule Engine
│   │   │   ├── engine.py                # AST/Regex traversal & finding generation
│   │   │   └── rules.py                 # 8 vulnerability rules with CWE mappings
│   │   ├── config.py                    # Environment & credential configuration
│   │   ├── main.py                      # FastAPI application & API routes
│   │   └── models.py                    # Pydantic schemas (Finding, Fix, PR models)
│   ├── tests/                           # Pytest Test Suite
│   │   ├── test_ai_agent.py             # Validation, Groq fallback, & diff tests
│   │   ├── test_api_endpoints.py        # FastAPI route integration tests
│   │   ├── test_config.py               # Config & environment validator tests
│   │   └── test_github_client.py        # GitHub Client unit tests
│   ├── test_github_pr.py                # Standalone end-to-end GitHub PR validation
│   ├── requirements.txt                 # Backend Python dependencies
│   └── .env                             # Environment secrets (git-ignored)
│
├── frontend/                            # React 18 + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DiffViewer.jsx           # Side-by-side / unified code diff display
│   │   │   ├── ExplanationPanel.jsx     # AI root-cause & impact explanation card
│   │   │   ├── FindingDetail.jsx        # Detailed finding inspector & actions
│   │   │   ├── FindingsList.jsx         # Severity-filtered finding list
│   │   │   ├── PullRequestPanel.jsx     # GitHub PR submission & direct link card
│   │   │   ├── ScanForm.jsx             # Target repository input & hero demo loader
│   │   │   └── ScanSummary.jsx          # Metric cards (Critical, High, Med, Low)
│   │   ├── data/
│   │   │   ├── findings.json            # Demo planted findings
│   │   │   └── mockResponses.js         # Offline fallback mocks & sample fixtures
│   │   ├── services/
│   │   │   └── api.js                   # Client service talking to FastAPI backend
│   │   ├── App.jsx                      # Top-level state & component orchestrator
│   │   ├── index.css                    # Tailwind CSS imports & custom styles
│   │   └── main.jsx                     # React entrypoint
│   ├── package.json                     # Frontend dependencies & npm scripts
│   ├── tailwind.config.js               # Tailwind design system configuration
│   └── vite.config.js                   # Vite dev server configuration
│
├── demo-vulnerable-app/                 # Planted Vulnerable Web Application (CloudPulse)
│   ├── api/
│   │   ├── admin.js                     # Command Injection vulnerability (CMDI-001)
│   │   ├── files.js                     # Path Traversal vulnerability (PATH-001)
│   │   ├── search.js                    # SQL Injection vulnerability (SQLI-001)
│   │   └── users.js                     # SQL Injection hero demo (SQLI-001)
│   ├── config/
│   │   ├── db.js                        # Hardcoded DB credentials (SECRET-001)
│   │   └── mailer.js                    # Hardcoded API key (SECRET-001)
│   └── src/
│       ├── auth/hash.js                 # Weak MD5 hash vulnerability (CRYPTO-001)
│       ├── components/Comment.jsx       # XSS vulnerability (XSS-001)
│       ├── lib/http.js                  # Disabled TLS verification (TLS-001)
│       └── utils/render.js              # Dangerous eval() execution (EVAL-001)
│
└── README.md                            # Main project documentation
```

---

## ⚙️ Prerequisites

Ensure you have the following installed on your system:
* **Python 3.10+** (with `pip` and virtual environment support)
* **Node.js 18+** (with `npm`)
* **Git**
* A **[Groq Cloud API Key](https://console.groq.com/)** (for fast LLaMA 3.3 70B inference)
* A **GitHub Personal Access Token (Classic or Fine-grained)** with `repo` scope (for branch, commit, and Pull Request automation)

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ayush834-git/ai-code-review.git
cd ai-code-review
```

---

### 2. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   * On Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   * On macOS / Linux:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   # Groq API Configuration
   GROQ_API_KEY=gsk_your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   GROQ_BASE_URL=https://api.groq.com/openai/v1

   # GitHub Automation Configuration
   GITHUB_TOKEN=ghp_your_github_pat_with_repo_scope
   GITHUB_OWNER=ayush834-git
   GITHUB_REPO=ai-code-review
   DEFAULT_BRANCH=main

   # Server Configuration
   HOST=0.0.0.0
   PORT=8000
   ```

   > 🔒 **Security Notice**: Never commit `backend/.env` to Git. It is already added to `.gitignore`.

5. **Run the backend server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   * API server will run at: `http://127.0.0.1:8000`
   * Interactive Swagger docs at: `http://127.0.0.1:8000/docs`
   * Health endpoint at: `http://127.0.0.1:8000/api/health`

---

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   * The web application will launch at: `http://localhost:5173`

---

## 🕹️ End-to-End Demo Walkthrough

Follow these steps to experience the complete live remediation workflow:

```
Scan Demo App ──► Select Finding ──► AI Explanation ──► Generate Fix ──► Open GitHub PR
```

1. Open your browser and navigate to **`http://localhost:5173`**.
2. Click **"Load Demo Repository"** (or enter `https://github.com/ayush834-git/ai-code-review`).
3. Click **"Scan Repository"**:
   * The scanner traverses the repository files and identifies 13+ planted vulnerabilities across all 8 security rules.
   * Review the **Scan Summary** metrics: Critical, High, Medium, and Low counts.
4. Select the hero vulnerability: **`api/users.js` — SQL Injection (SQLI-001 / CWE-89)**.
5. Click **"Explain with Grok"**:
   * Groq reasons over the finding and provides a structured breakdown of the vulnerability, potential database breach impact, and remediation guidance.
6. Click **"Generate Fix with Grok"**:
   * The AI generates a parameterized query fix (`db.query("SELECT * FROM users WHERE id = ?", [id])`).
   * The self-validation engine validates the brackets, quotes, and syntax.
   * An interactive **Unified Diff** appears in the Diff Viewer.
7. Click **"Create Pull Request"**:
   * The backend creates a new Git branch (`patch/sqli-001-f_005-XXXX`).
   * The fix is spliced directly into `demo-vulnerable-app/api/users.js` without altering other lines.
   * A commit is pushed, and a new Pull Request is opened on GitHub.
8. Click **"Open Pull Request on GitHub"** to view the live, verified PR on GitHub!

---

## 📡 API Reference

The backend exposes the following RESTful endpoints:

### 1. `POST /api/scan`
Scan a repository path for security vulnerabilities.
```json
// Request
{
  "repo_url": "https://github.com/ayush834-git/ai-code-review"
}

// Response
{
  "scan_id": "scn_b8d1d7",
  "repo_url": "https://github.com/ayush834-git/ai-code-review",
  "files_scanned": 23,
  "duration_ms": 22,
  "summary": {
    "critical": 5,
    "high": 4,
    "medium": 4,
    "low": 0,
    "total": 13
  },
  "findings": [...]
}
```

### 2. `POST /api/explain`
Generate AI-powered architectural explanation, security impact, and recommendations.
```json
// Request
{
  "scan_id": "scn_b8d1d7",
  "finding_id": "f_005"
}

// Response
{
  "finding_id": "f_005",
  "explanation": "User input from req.params.id is concatenated directly into the SQL string...",
  "impact": "Enables attackers to bypass authentication, dump database tables, or drop data.",
  "recommendation": "Use parameterized queries with placeholders (?) to separate query structure from data."
}
```

### 3. `POST /api/fix`
Generate a validated, drop-in replacement patch and unified diff.
```json
// Request
{
  "scan_id": "scn_b8d1d7",
  "finding_id": "f_005"
}

// Response
{
  "finding_id": "f_005",
  "file_path": "api/users.js",
  "original_code": "  db.query(\"SELECT * FROM users WHERE id=\" + id);",
  "fixed_code": "  db.query(\"SELECT * FROM users WHERE id = ?\", [id]);",
  "diff": "--- a/api/users.js\n+++ b/api/users.js\n@@ -42,1 +42,1 @@\n-  db.query(\"SELECT * FROM users WHERE id=\" + id);\n+  db.query(\"SELECT * FROM users WHERE id = ?\", [id]);",
  "explanation_of_change": "Replaced string concatenation with parameterized SQL placeholder to neutralize injection.",
  "confidence": 0.95
}
```

### 4. `POST /api/apply-pr`
Create a branch, commit the fix, and open a GitHub Pull Request.
```json
// Request
{
  "file_path": "api/users.js",
  "line_number": 42,
  "fixed_code": "  db.query(\"SELECT * FROM users WHERE id = ?\", [id]);",
  "rule_id": "SQLI-001",
  "finding_id": "f_005",
  "cwe": "CWE-89",
  "title": "fix: resolve SQLI-001 in api/users.js"
}

// Response (201 Created)
{
  "branch": "patch/sqli-001-f_005-7281",
  "commit_sha": "d00a9896056e07ffbf22ac915b9887264f7006e8",
  "pr_number": 6,
  "pr_url": "https://github.com/ayush834-git/ai-code-review/pull/6",
  "files_changed": 1
}
```

### 5. `GET /api/health`
Check backend operational status and verify configured credentials.
```json
{
  "status": "ok",
  "service": "ai-code-review-backend",
  "github_token_configured": true,
  "config_status": {
    "groq_configured": true,
    "github_token_configured": true,
    "owner_configured": true,
    "repo_configured": true,
    "branch_configured": true
  }
}
```

---

## 🧪 Testing & Verification

### Running Backend Tests
Activate the virtual environment and run the test suite:
```bash
cd backend
pytest -v
```

The test suite covers:
* **`tests/test_scanner.py`**: Validates detection of all 8 vulnerability patterns and false-positive suppression.
* **`tests/test_ai_agent.py`**: Tests Groq API client, prompt construction, bracket-balance lexer, unified diff generator, and safe fallback handling.
* **`tests/test_api_endpoints.py`**: Tests `/api/scan`, `/api/explain`, `/api/fix`, and `/api/apply-pr` endpoints.
* **`tests/test_github_client.py`**: Tests line-index splicing, branch naming, base64 encoding, and GitHub API error handling.

### Running Live GitHub Integration Test
To execute a controlled live PR creation test directly against your configured repository:
```bash
cd backend
python test_github_pr.py
```

### Running Frontend Tests & Build
```bash
cd frontend
npm test
npm run build
```

---

## 🔒 Security Principles

1. **Zero Secret Leakage**: No API keys or tokens are passed to the frontend or exposed in API error messages. Environment variables are kept on the server.
2. **Safe Code Splicing**: The system never replaces code via blind global search-and-replace. All modifications are indexed to the exact line number identified by the scanner.
3. **Defense Against Malformed AI Output**: If the LLM generates unparseable code, mismatched brackets, or attempts to retain the vulnerable construct, the validation engine rejects the patch, attempts automated repair, and gracefully degrades to safe error handling rather than breaking production code.
4. **Isolated Git Branches**: Pull requests are created on isolated patch branches (`patch/*`). The base branch (`main`) is never directly modified.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
