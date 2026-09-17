import re


RULES = [
    {
        "id": "SQLI-001",
        "title": "SQL Injection via string concatenation",
        "severity": "critical",
        "category": "injection",
        "cwe": "CWE-89",
        "pattern": re.compile(
            r"\.(query|execute)\s*\(.*\+.*\)"
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "SECRET-001",
        "title": "Hardcoded credential",
        "severity": "critical",
        "category": "credentials",
        "cwe": "CWE-798",
        "pattern": re.compile(
            r"(api_key|apiKey|secret|password|token)\s*=\s*['\"][^'\"]{8,}['\"]",
            re.IGNORECASE,
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "CMDI-001",
        "title": "Command injection",
        "severity": "critical",
        "category": "injection",
        "cwe": "CWE-78",
        "pattern": re.compile(
            r"\b(exec|execSync|spawn)\s*\(.*(\+|`.*\$\{)"
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "XSS-001",
        "title": "XSS via unsanitised HTML",
        "severity": "high",
        "category": "xss",
        "cwe": "CWE-79",
        "pattern": re.compile(
            r"(innerHTML\s*=|outerHTML\s*=|dangerouslySetInnerHTML|document\.write\s*\()"
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "EVAL-001",
        "title": "Unsafe dynamic evaluation",
        "severity": "high",
        "category": "code-injection",
        "cwe": "CWE-95",
        "pattern": re.compile(
            r"\b(eval\s*\(|new\s+Function\s*\(|setTimeout\s*\(\s*['\"])"
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "CRYPTO-001",
        "title": "Weak hash algorithm",
        "severity": "high",
        "category": "cryptography",
        "cwe": "CWE-327",
        "pattern": re.compile(
            r"createHash\s*\(\s*['\"](?:md5|sha1)['\"]\s*\)",
            re.IGNORECASE,
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "PATH-001",
        "title": "Path traversal",
        "severity": "medium",
        "category": "path-traversal",
        "cwe": "CWE-22",
        "pattern": re.compile(
            r"(readFile|readFileSync|createReadStream)\s*\(.*(req\.|params)"
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
    {
        "id": "TLS-001",
        "title": "TLS verification disabled",
        "severity": "medium",
        "category": "transport-security",
        "cwe": "CWE-295",
        "pattern": re.compile(
            r"(rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED)"
        ),
        "file_extensions": {".js", ".jsx", ".ts", ".tsx"},
    },
]