import React from 'react';
import { Sparkles, Loader2, AlertCircle, ShieldAlert, CheckCircle2, Lightbulb } from 'lucide-react';

export default function ExplanationPanel({ explanation, isLoading, onTriggerExplain }) {
  if (isLoading) {
    return (
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-200">
              Grok is analysing this vulnerability…
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating taint flow, CWE classification, and blast radius
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="mt-4 space-y-2.5 pt-2">
          <div className="h-3.5 bg-slate-800 rounded-full w-5/6 animate-pulse" />
          <div className="h-3.5 bg-slate-800 rounded-full w-4/6 animate-pulse" />
          <div className="h-3.5 bg-slate-800 rounded-full w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="bg-[#0f172a]/60 border border-dashed border-slate-800 rounded-2xl p-5 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Need AI context on this issue?</p>
              <p className="text-xs text-slate-400">
                Grok breaks down the vulnerability mechanism, exploit vectors, and best-practice remediation.
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerExplain}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition border border-slate-700 whitespace-nowrap"
          >
            Explain with Grok
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl shadow-cyan-950/20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Grok AI Vulnerability Analysis</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Grok-Enhanced
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* 1. Explanation */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Explanation</span>
        </h4>
        <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
          {explanation.explanation}
        </div>
      </div>

      {/* 2. Potential Impact */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Potential Impact</span>
        </h4>
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed">
          {explanation.impact}
        </div>
      </div>

      {/* 3. Recommended Remediation */}
      <div className="space-y-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
          <span>Recommended Remediation</span>
        </h4>
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200/90 leading-relaxed">
          {explanation.recommendation}
        </div>
      </div>
    </div>
  );
}
