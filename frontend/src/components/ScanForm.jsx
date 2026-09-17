import React, { useState, useEffect } from 'react';
import { Search, Github, ShieldAlert, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ScanForm({ onScan, isScanning }) {
  const [repoUrl, setRepoUrl] = useState('');
  const [error, setError] = useState('');
  const [scanStep, setScanStep] = useState(0);

  const steps = [
    { label: "Cloning repository…", detail: "Cloning remote tree and parsing AST" },
    { label: "Running vulnerability rules…", detail: "Applying 85+ SAST, taint analysis, and CWE rules" },
    { label: "Grok is standing by for explanations…", detail: "AI reasoning engine ready for contextual remediation" }
  ];

  useEffect(() => {
    let timer;
    if (isScanning) {
      setScanStep(0);
      const step1 = setTimeout(() => setScanStep(1), 400);
      const step2 = setTimeout(() => setScanStep(2), 850);
      return () => {
        clearTimeout(step1);
        clearTimeout(step2);
      };
    } else {
      setScanStep(0);
    }
  }, [isScanning]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      setError('Please provide a GitHub repository URL.');
      return;
    }
    if (!repoUrl.includes('github.com')) {
      setError('Please provide a valid GitHub repository URL (e.g., https://github.com/org/repo).');
      return;
    }
    setError('');
    onScan(repoUrl.trim());
  };

  const handleLoadDemo = () => {
    const demoUrl = 'https://github.com/org/demo-repo';
    setRepoUrl(demoUrl);
    setError('');
    onScan(demoUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Hero Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
          <span>Automated SAST & Secret Scanning</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Find vulnerabilities <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">before they ship.</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Scan any public GitHub repository for critical security bugs, get instant AI explanations with Grok, and apply automated pull request fixes.
        </p>
      </div>

      {/* Input Box Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Github className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  if (error) setError('');
                }}
                disabled={isScanning}
                placeholder="https://github.com/owner/repository"
                className="w-full pl-11 pr-4 py-3.5 bg-[#090d16] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl text-sm transition-all duration-150 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/30 whitespace-nowrap"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Scanning…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Scan Repository</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Load demo and info */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Want a quick test?</span>
              <button
                type="button"
                onClick={handleLoadDemo}
                disabled={isScanning}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 decoration-emerald-500/30 hover:decoration-emerald-400 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Repository</span>
              </button>
            </div>
            <div className="text-slate-500 flex items-center gap-1">
              <span>Static analysis engine</span>
              <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
              <span>Grok AI explanations & patches</span>
            </div>
          </div>
        </form>

        {/* Polished Scanning Loading State */}
        {isScanning && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Scanning repository for vulnerabilities…</span>
              </div>
              <span className="text-xs font-mono text-slate-400">Step {scanStep + 1} of 3</span>
            </div>

            <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((scanStep + 1) / 3) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {steps.map((step, idx) => {
                const isActive = idx === scanStep;
                const isDone = idx < scanStep;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      isActive
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30'
                        : isDone
                        ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                        : 'bg-slate-900/20 border-slate-800/50 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-medium">
                      {isDone ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      ) : isActive ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0" />
                      )}
                      <span className="truncate">{step.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 pl-5">
                      {step.detail}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>
                <strong>Note:</strong> Repository scan is executed via static AST rules. Grok AI is reserved for contextual vulnerability explanation and safe patch generation.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
