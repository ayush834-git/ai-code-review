# Code Bro — Frontend

> **AI Code Review & Vulnerability Detection Agent**  
> A modern developer-tool UI built with React, Vite, and Tailwind CSS.

---

## ⚡ Quick Start (Beginner Friendly)

### 1. Prerequisites
Make sure you have **Node.js** (version 18 or higher) installed on your computer. You can check your version in a terminal:
```bash
node -v
npm -v
```

### 2. Navigate to the frontend directory
Open your terminal and navigate to this folder:
```bash
cd frontend
```

### 3. Install dependencies
Run this command once to install all necessary packages:
```bash
npm install
```

### 4. Start the development server
Run:
```bash
npm run dev
```

You will see output similar to:
```text
  VITE v5.4.11  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```
Open **`http://localhost:5173`** in your web browser.

---

## 🚀 Complete Demo Flow

Follow these steps to experience the complete workflow:

1. **Scan Repository**:
   - Paste a GitHub repository URL into the input field or click **"Load Demo Repository"**.
   - Click **"Scan Repository"**.
   - Watch the staged scan loading indicators (*"Cloning repository…"*, *"Running vulnerability rules…"*, *"Grok is standing by for explanations…"*)

2. **Scan Summary**:
   - Inspect the metrics dashboard displaying **127 files scanned**, **840 ms duration**, **total findings**, **severity metrics (Critical, High, Medium, Low)**, and **Security Score**.
   - Filter findings by clicking any severity badge or filter tab.

3. **Choose Finding**:
   - Click the hero finding: **SQL Injection via string concatenation** at `api/users.js`, line 42.
   - Observe the highlighted vulnerable line with red indicator in the code context viewer.

4. **Explain with Grok**:
   - Click **"Explain with Grok"**.
   - Watch the AI analysis loading state (*"Grok is analysing this vulnerability…"*) followed by the structured breakdown: **Explanation**, **Potential Impact**, and **Recommended Remediation**.

5. **Generate Fix with Grok**:
   - Click **"Generate Fix with Grok"**.
   - Watch the patch synthesis loading state (*"Grok is preparing a minimal secure patch…"*) followed by the **unified diff** with removed lines highlighted in red (`-`) and safe replacements in green (`+`).

6. **Create Pull Request**:
   - Click the enabled **"Create Pull Request"** button.
   - Watch the staged Git pipeline (*"Creating secure branch…"*, *"Applying patch…"*, *"Creating Pull Request…"*)
   - Inspect the generated branch name, commit SHA, and click **"Open Pull Request on GitHub"**.

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── ScanForm.jsx           # Repo URL input & staged scanning loader
│   │   ├── ScanSummary.jsx        # Metrics cards & severity filter triggers
│   │   ├── FindingsList.jsx       # Grouped findings with accessible badges
│   │   ├── FindingDetail.jsx      # Line-highlighted code context viewer
│   │   ├── ExplanationPanel.jsx   # Grok AI explanation, impact & recommendations
│   │   ├── DiffViewer.jsx         # Unified diff viewer (red/green)
│   │   └── PullRequestPanel.jsx   # Staged PR pipeline & success card
│   ├── data/
│   │   ├── findings.json          # 14 realistic mock vulnerability findings
│   │   └── mockResponses.js       # Exact schema responses for explain, fix & PR
│   ├── services/
│   │   └── api.js                 # API service layer (ready for backend endpoints)
│   ├── App.jsx                    # Root state machine & layout
│   ├── main.jsx                   # React DOM entrypoint
│   └── index.css                  # Tailwind styles and custom dark theme
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── tailwind.config.js             # Tailwind CSS configuration
├── postcss.config.js              # PostCSS plugins
├── vite.config.js                 # Vite bundler configuration
└── README.md                      # Documentation
```

---

## 🔌 Connecting to the Real Backend

All API requests are isolated in `src/services/api.js`. The UI components have zero direct coupling to Grok or GitHub tokens.

When the backend is ready, the service functions map to:
- `POST /api/scan` — Initiates static AST rule scanner
- `POST /api/explain` — Calls backend Grok integration for explanation
- `POST /api/fix` — Calls backend Grok integration for patch generation
- `POST /api/apply-pr` — Calls backend GitHub integration for branch & PR creation

Simply update `src/services/api.js` to uncomment the `fetch` calls.

---

## 🛠️ Build for Production

To create an optimized production build:
```bash
npm run build
```
The output will be generated in `frontend/dist/`.
