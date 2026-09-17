import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server.node';
import { createServer } from 'vite';

async function verify() {
  console.log('Testing PullRequestPanel rendering with live PR data...');
  const server = await createServer();
  const mod = await server.ssrLoadModule('./src/components/PullRequestPanel.jsx');
  const PullRequestPanel = mod.default;

  const livePrData = {
    pr_number: 3,
    pr_url: 'https://github.com/ayush834-git/ai-code-review/pull/3',
    branch: 'patch/sqli-users-1789634333',
    commit_sha: 'd6e5038d2a1f',
    files_changed: 1
  };

  const element = React.createElement(PullRequestPanel, {
    prData: livePrData,
    fixData: { fixed_code: 'db.query("SELECT * FROM users WHERE id = ?", [id]);' },
    isCreatingPr: false,
    onCreatePr: () => {},
    finding: { id: 'f_002', line_start: 42 }
  });

  const html = renderToStaticMarkup(element);

  console.log('--- Rendered Output Checks ---');
  const renderChecks = [
    { label: 'PR #3 rendered', passed: html.includes('PR #3') },
    { label: 'Live PR URL rendered', passed: html.includes('https://github.com/ayush834-git/ai-code-review/pull/3') },
    { label: 'Live Branch Name rendered', passed: html.includes('patch/sqli-users-1789634333') },
    { label: 'Live Commit SHA rendered', passed: html.includes('d6e5038d2a1f') },
    { label: 'Files changed count rendered', passed: html.includes('1') && html.includes('file patched') },
    { label: 'No hardcoded demo-repo PR URL', passed: !html.includes('https://github.com/org/demo-repo/pull/7') },
    { label: 'No fake PR #8', passed: !html.includes('PR #8') },
  ];

  for (const check of renderChecks) {
    console.log(`[${check.passed ? 'PASS' : 'FAIL'}] ${check.label}`);
    if (!check.passed) process.exit(1);
  }

  console.log('\nTesting createPullRequest() contract handling with live API response...');
  const apiMod = await server.ssrLoadModule('./src/services/api.js');
  const { createPullRequest } = apiMod;

  // Mock global fetch returning 201 Created from backend
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    return {
      ok: true,
      status: 201,
      json: async () => ({
        branch: 'patch/sqli-users-1789634333',
        commit_sha: 'd6e5038d2a1f',
        pr_number: 3,
        pr_url: 'https://github.com/ayush834-git/ai-code-review/pull/3',
        files_changed: 1
      })
    };
  };

  try {
    const prResult = await createPullRequest('scn_test', ['f_002'], { fixed_code: 'safe()' }, { id: 'f_002', line_start: 42 });
    console.log('Returned PR result:', prResult);

    const apiChecks = [
      { label: 'pr_number is exactly 3', passed: prResult.pr_number === 3 },
      { label: 'pr_url is exact live PR URL', passed: prResult.pr_url === 'https://github.com/ayush834-git/ai-code-review/pull/3' },
      { label: 'branch is exact live patch branch', passed: prResult.branch === 'patch/sqli-users-1789634333' },
      { label: 'commit_sha is exact live commit SHA', passed: prResult.commit_sha === 'd6e5038d2a1f' },
      { label: 'files_changed is 1', passed: prResult.files_changed === 1 },
      { label: 'No mock repo used in pr_url', passed: !prResult.pr_url.includes('demo-repo') },
    ];

    for (const check of apiChecks) {
      console.log(`[${check.passed ? 'PASS' : 'FAIL'}] ${check.label}`);
      if (!check.passed) process.exit(1);
    }
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }

  console.log('\nAll PullRequestPanel & API contract verification checks passed successfully!');
}

verify().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
