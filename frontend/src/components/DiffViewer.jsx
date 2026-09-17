import React from 'react';
import { Loader2, Wrench, ShieldCheck, FileDiff, Check, Copy, AlertTriangle } from 'lucide-react';

export default function DiffViewer({ fixData, isLoading, onTriggerFix }) {
  const [copied, setCopied] = React.useState(false);

  if (isLoading) {
    return (
      <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-200">
              Grok is preparing a minimal secure patch…
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Generating least-privilege, minimal-diff remediation with parameterized bindings
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="mt-4 space-y-2 pt-2">
          <div className="h-4 bg-slate-800 rounded w-full animate-pulse" />
          <div className="h-4 bg-red-950/40 border border-red-900/30 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-emerald-950/40 border border-emerald-900/30 rounded w-5/6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!fixData) {
    return (
      <div className="bg-[#0f172a]/60 border border-dashed border-slate-800 rounded-2xl p-5 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Wrench className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Ready to patch this vulnerability?</p>
              <p className="text-xs text-slate-400">
                Grok produces a surgical, minimal diff ready for code review and Pull Request creation.
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerFix}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold transition whitespace-nowrap"
          >
            Generate Fix with Grok
          </button>
        </div>
      </div>
    );
  }

  const handleCopyDiff = () => {
    navigator.clipboard.writeText(fixData.diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffLines = (fixData.diff || '').split('\n');

  return (
    <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl shadow-emerald-950/20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
            <FileDiff className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Proposed Security Patch</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                {fixData.file_path}
              </span>
            </h3>
          </div>
        </div>

        <button
          onClick={handleCopyDiff}
          title="Copy diff to clipboard"
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 text-xs transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      {/* Explanation of change */}
      {fixData.explanation_of_change && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="font-semibold text-slate-300 mr-1.5">Change summary:</span>
          <span className="text-slate-300">{fixData.explanation_of_change}</span>
        </div>
      )}

      {/* Unified Diff View */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-mono text-[11px] text-slate-400">Unified Diff</span>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> - Removed
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> + Added
            </span>
          </div>
        </div>

        <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="p-3 overflow-x-auto space-y-0.5">
            {diffLines.map((line, idx) => {
              const isAdded = line.startsWith('+') && !line.startsWith('+++');
              const isRemoved = line.startsWith('-') && !line.startsWith('---');
              const isHunk = line.startsWith('@@');
              const isFileHeader = line.startsWith('---') || line.startsWith('+++');

              let rowClass = 'text-slate-400 py-0.5 px-2';
              let indicator = ' ';

              if (isAdded) {
                rowClass = 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium py-1 px-2 rounded';
                indicator = '+';
              } else if (isRemoved) {
                rowClass = 'bg-red-950/60 border border-red-500/30 text-red-300 font-medium py-1 px-2 rounded';
                indicator = '-';
              } else if (isHunk) {
                rowClass = 'text-cyan-400/80 bg-slate-900/60 py-0.5 px-2 rounded text-[11px]';
              } else if (isFileHeader) {
                rowClass = 'text-slate-500 font-semibold py-0.5 px-2';
              }

              return (
                <div key={idx} className={`flex items-start gap-2 whitespace-pre leading-relaxed ${rowClass}`}>
                  <span className="select-none text-slate-600 w-3 text-center font-bold">
                    {indicator}
                  </span>
                  <span className="overflow-x-auto">{line.replace(/^[+-]\s?/, '') || line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Human Review Note */}
      <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center gap-2.5 text-xs text-cyan-200">
        <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <span>
          <strong>Human-in-the-loop guarantee:</strong> AI proposes the fix. A human reviews it before merging.
        </span>
      </div>
    </div>
  );
}
