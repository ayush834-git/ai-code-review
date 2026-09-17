import { mockScanResponse, mockExplains, mockFixes, getMockPullRequest } from '../data/mockResponses';
import findingsData from '../data/findings.json';

// Base API configuration (when connected to backend)
const API_BASE_URL = '';

// Helper to simulate realistic async network delay for loading states
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Initiates repository scan
 * Later: POST /api/scan { repo_url: "..." }
 */
export async function scanRepository(repoUrl) {
  /*
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl }),
  });
  return await response.json();
  */

  await delay(1200);
  return {
    ...mockScanResponse,
    repo_url: repoUrl || mockScanResponse.repo_url,
    findings: findingsData,
  };
}

/**
 * Requests Grok explanation for a specific finding
 * Later: POST /api/explain { scan_id: "...", finding_id: "..." }
 */
export async function explainFinding(scanId, findingId) {
  /*
  const response = await fetch(`${API_BASE_URL}/api/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId, finding_id: findingId }),
  });
  return await response.json();
  */

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
 * Requests Grok patch generation for a specific finding
 * Later: POST /api/fix { scan_id: "...", finding_id: "..." }
 */
export async function generateFix(scanId, findingId) {
  /*
  const response = await fetch(`${API_BASE_URL}/api/fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId, finding_id: findingId }),
  });
  return await response.json();
  */

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
 * Later: POST /api/apply-pr { scan_id: "...", finding_ids: ["..."] }
 */
export async function createPullRequest(scanId, findingIds) {
  /*
  const response = await fetch(`${API_BASE_URL}/api/apply-pr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId, finding_ids: findingIds }),
  });
  return await response.json();
  */

  await delay(1400);
  const primaryFindingId = Array.isArray(findingIds) ? findingIds[0] : findingIds;
  return getMockPullRequest(primaryFindingId);
}
