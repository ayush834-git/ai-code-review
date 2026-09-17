import { mockScanResponse, mockExplains, mockFixes, getMockPullRequest } from '../data/mockResponses';
import findingsData from '../data/findings.json';

// Base API configuration (when connected to backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Helper to simulate realistic async network delay for loading states
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Initiates repository scan
 * POST /api/scan { repo_url: "..." }
 */
export async function scanRepository(repoUrl) {
  const targetUrl = repoUrl || 'https://github.com/ayush834-git/ai-code-review';
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo_url: targetUrl }),
    });
    if (response.ok) {
      return await response.json();
    }
    console.warn(`Live scan API returned ${response.status}. Falling back to mock data.`);
  } catch (err) {
    console.warn('Backend /api/scan unreachable, falling back to mock data:', err.message);
  }

  await delay(1200);
  return {
    ...mockScanResponse,
    repo_url: repoUrl || mockScanResponse.repo_url,
    findings: findingsData,
  };
}

/**
 * Requests Groq explanation for a specific finding
 * POST /api/explain { scan_id: "...", finding_id: "..." }
 */
export async function explainFinding(scanId, findingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanId, finding_id: findingId }),
    });
    if (response.ok) {
      return await response.json();
    }
    console.warn(`Live explain API returned ${response.status}. Falling back to mock data.`);
  } catch (err) {
    console.warn('Backend /api/explain unreachable, falling back to mock data:', err.message);
  }

  await delay(800);
  if (mockExplains[findingId]) {
    return mockExplains[findingId];
  }
  return {
    finding_id: findingId,
    explanation: "Vulnerability detected by static analysis rule.",
    impact: "May lead to unintended authorization bypass or data leakage.",
    recommendation: "Apply input validation and principle of least privilege."
  };
}

/**
 * Requests Groq patch generation for a specific finding
 * POST /api/fix { scan_id: "...", finding_id: "..." }
 */
export async function generateFix(scanId, findingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scan_id: scanId, finding_id: findingId }),
    });
    if (response.ok) {
      return await response.json();
    }
    console.warn(`Live fix API returned ${response.status}. Falling back to mock data.`);
  } catch (err) {
    console.warn('Backend /api/fix unreachable, falling back to mock data:', err.message);
  }

  await delay(1000);
  if (mockFixes[findingId]) {
    return mockFixes[findingId];
  }
  return {
    finding_id: findingId,
    file_path: "src/utils.js",
    original_code: "// vulnerable implementation",
    fixed_code: "// secure implementation",
    diff: "--- a/src/utils.js\n+++ b/src/utils.js\n@@ -1,1 +1,1 @@\n- // vulnerable implementation\n+ // secure implementation",
    explanation_of_change: "Updated code with secure pattern and safe defaults."
  };
}

/**
 * Creates GitHub Pull Request with the patch
 * POST /api/apply-pr
 */
export async function createPullRequest(scanId, findingIds, fixData = null, finding = null) {
  const primaryFindingId = Array.isArray(findingIds) ? findingIds[0] : findingIds;
  try {
    const payload = {
      scan_id: scanId,
      finding_id: primaryFindingId,
      finding_ids: Array.isArray(findingIds) ? findingIds : (findingIds ? [findingIds] : []),
    };

    if (fixData) {
      if (fixData.fixed_code) payload.fixed_code = fixData.fixed_code;
      if (fixData.original_code) payload.original_code = fixData.original_code;
      if (fixData.diff) payload.diff = fixData.diff;
      if (fixData.explanation_of_change) payload.explanation_of_change = fixData.explanation_of_change;
      if (fixData.file_path) payload.file_path = fixData.file_path;
      if (fixData.line_number) payload.line_number = fixData.line_number;
      if (fixData.rule_id) payload.rule_id = fixData.rule_id;
      if (fixData.severity) payload.severity = fixData.severity;
      if (fixData.cwe) payload.cwe = fixData.cwe;
      if (fixData.title) payload.title = fixData.title;
    }

    if (finding) {
      if (!payload.file_path && finding.file_path) payload.file_path = finding.file_path;
      if (!payload.line_number && (finding.line_start || finding.line_number)) {
        payload.line_number = finding.line_start || finding.line_number;
      }
      if (!payload.original_code && finding.snippet) payload.original_code = finding.snippet;
      if (!payload.rule_id && finding.rule_id) payload.rule_id = finding.rule_id;
      if (!payload.severity && (finding.severity?.value || finding.severity)) {
        payload.severity = finding.severity?.value || finding.severity;
      }
      if (!payload.cwe && finding.cwe) payload.cwe = finding.cwe;
    }

    const response = await fetch(`${API_BASE_URL}/api/apply-pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      // Directly return the real backend response
      return {
        branch: data.branch,
        commit_sha: data.commit_sha,
        pr_number: data.pr_number,
        pr_url: data.pr_url,
        files_changed: data.files_changed ?? 1,
      };
    }
    const errText = await response.text().catch(() => '');
    console.warn(`Live apply-pr API returned status ${response.status}: ${errText}. Falling back to mock.`);
  } catch (err) {
    console.warn('Backend /api/apply-pr unreachable, falling back to mock data:', err.message);
  }

  await delay(1400);
  return getMockPullRequest(primaryFindingId);
}
