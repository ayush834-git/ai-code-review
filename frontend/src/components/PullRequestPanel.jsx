import React, { useState, useEffect } from 'react';
import { GitPullRequest, GitBranch, GitCommit, CheckCircle2, Loader2, ExternalLink, Check, Copy } from 'lucide-react';

export default function PullRequestPanel({
  fixData,
  prData,
  isCreatingPr,
  onCreatePr,
  finding
}) {
  const [prStep, setPrStep] = useState(0);
  const [copiedSha, setCopiedSha] = useState(false);

  const steps = [
    "Creating secure branch…",
    "Applying patch…",
    "Creating Pull Request…"
  ];

  useEffect(() => {
    let t1, t2;
    if (isCreatingPr) {
      setPrStep(0);
      t1 = setTimeout(() => setPrStep(1), 450);
      t2 = setTimeout(() => setPrStep(2), 900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setPrStep(0);
    }
  }, [isCreatingPr]);

  const handleCopySha = () => {
    if (!prData?.commit_sha) return;
    navigator.clipboard.writeText(prData.commit_sha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const isEnabled = Boolean(fixData) && !isCreatingPr;

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Action Trigger Card */}
      {!prData && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-emerald-400" />
              <span>Automate Remediated Pull Request</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isEnabled
                ? "Fix verified. Create an isolated Git branch and open a verified Pull Request on GitHub."
                : "Generate a patch with Grok above to enable automatic Pull Request creation."}
            </p>
          </div>

          <button
            onClick={onCreatePr}
            disabled={!isEnabled}
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg whitespace-nowrap ${
              isEnabled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/30'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
            }`}
          >
            {isCreatingPr ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Publishing PR…</span>
              </>
            ) : (
              <>
                <GitPullRequest className="w-4 h-4" />
                <span>Create Pull Request</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Staged Progress State */}
      {isCreatingPr && (
        <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{steps[prStep]}</span>
            </span>
            <span className="text-slate-500 font-mono">Stage {prStep + 1} of 3</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {steps.map((label, idx) => {
              const isCurrent = idx === prStep;
              const isDone = idx < prStep;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-center text-xs font-mono transition-all ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                      : isDone
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                      : 'bg-slate-900/20 border-slate-800/40 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isDone ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />
                    )}
                    <span className="truncate text-[11px]">{label.replace('…', '')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PR Success Card */}
      {prData && (
        <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900/90 border border-emerald-500/40 rounded-xl p-5 space-y-4 animate-in fade-in duration-300">
          {/* Status Banner */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Pull Request Created</h4>
                <p className="text-xs text-emerald-400/90">
                  Ready for code review and automated CI verification
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50">
              PR #{prData.pr_number}
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
            {/* Branch */}
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans block mb-1">
                Branch Name
              </span>
              <div className="flex items-center gap-1.5 text-slate-200 truncate">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate" title={prData.branch}>{prData.branch}</span>
              </div>
            </div>

            {/* Commit SHA */}
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans block mb-1">
                Commit SHA
              </span>
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <GitCommit className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">{prData.commit_sha}</span>
                </div>
                <button
                  onClick={handleCopySha}
                  className="text-slate-400 hover:text-white transition ml-1"
                  title="Copy SHA"
                >
                  {copiedSha ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Files Changed */}
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-2.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-sans block mb-1">
                Files Changed
              </span>
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="text-emerald-400 font-bold">{prData.files_changed || 1}</span>
                <span className="text-slate-400 font-sans">file patched</span>
              </div>
            </div>
          </div>

          {/* Action Button: Open Pull Request on GitHub */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Patch applied to branch <code className="text-slate-300">{prData.branch}</code>
            </p>

            <a
              href={prData.pr_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              <span>Open Pull Request on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
