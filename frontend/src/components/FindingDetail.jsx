import React from 'react';
import { SeverityBadge } from './FindingsList';
import { FileCode, AlertCircle, Sparkles, Wrench, Shield, Check, Copy } from 'lucide-react';

export default function FindingDetail({
  finding,
  onExplain,
  onGenerateFix,
  isExplaining,
  isFixing,
  hasExplanation,
  hasFix
}) {
  const [copied, setCopied] = React.useState(false);

  if (!finding) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-300">Select a Finding</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Choose any detected vulnerability from the list on the left to inspect its code context and trigger Grok AI actions.
        </p>
      </div>
    );
  }

  const handleCopyPath = () => {
    navigator.clipboard.writeText(`${finding.file_path}:${finding.line_start}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse lines from context
  const contextLines = (finding.context || `${finding.line_start}: ${finding.snippet}`).split('\n');

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-5">
      {/* Header Info */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={finding.severity} />
          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {finding.cwe}
          </span>
          <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
            {finding.rule_id}
          </span>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold ml-auto">
            Category: <strong className="text-slate-200">{finding.category}</strong>
          </span>
        </div>

        <h2 className="text-xl font-bold text-white leading-snug">
          {finding.title}
        </h2>

        {/* File Path & Line Prominently */}
        <div className="flex items-center justify-between bg-[#090d16] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <FileCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-400 font-sans font-medium">Location:</span>
            <span className="text-white font-semibold truncate">{finding.file_path}</span>
            <span className="text-emerald-400 font-bold">:{finding.line_start}</span>
          </div>

          <button
            onClick={handleCopyPath}
            title="Copy path and line number"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/70 hover:bg-slate-800 transition text-[11px]"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Context with vulnerable line highlighted */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            Surrounding Code Context
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Vulnerable Line: {finding.line_start}
          </span>
        </div>

        <div className="bg-[#090d16] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
          <div className="p-3.5 space-y-1 overflow-x-auto">
            {contextLines.map((line, idx) => {
              // Parse leading line number if present like "42: ..."
              const match = line.match(/^(\d+):(.*)$/);
              let lineNum = idx + 1;
              let content = line;
              if (match) {
                lineNum = parseInt(match[1], 10);
                content = match[2];
              }

              const isVulnerable = lineNum === finding.line_start;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 py-1 px-2.5 rounded transition-colors ${
                    isVulnerable
                      ? 'bg-red-950/50 border border-red-500/40 text-red-200'
                      : 'text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <span
                    className={`w-8 text-right select-none flex-shrink-0 font-mono text-[11px] ${
                      isVulnerable ? 'text-red-400 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {lineNum}
                  </span>
                  <div className="flex-1 overflow-x-auto">
                    <code>{content}</code>
                  </div>
                  {isVulnerable && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-500/50 ml-2">
                      <AlertCircle className="w-3 h-3 text-red-400" />
                      Vulnerable
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-800">
        <button
          onClick={onExplain}
          disabled={isExplaining}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
            hasExplanation
              ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{hasExplanation ? 'Re-Explain with Grok' : 'Explain with Grok'}</span>
        </button>

        <button
          onClick={onGenerateFix}
          disabled={isFixing}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
            hasFix
              ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/10'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Wrench className="w-4 h-4 text-emerald-300" />
          <span>{hasFix ? 'Regenerate Fix with Grok' : 'Generate Fix with Grok'}</span>
        </button>
      </div>
    </div>
  );
}
