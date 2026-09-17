import React from 'react';
import { AlertOctagon, ShieldAlert, AlertTriangle, Info, FileCode2, ChevronRight, CheckCircle2, GitPullRequest } from 'lucide-react';

export function SeverityBadge({ severity }) {
  const sev = (severity || 'low').toLowerCase();
  
  if (sev === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/60 text-red-400 border border-red-500/40 tracking-wide uppercase">
        <AlertOctagon className="w-3 h-3 text-red-400" />
        <span>Critical</span>
      </span>
    );
  }
  if (sev === 'high') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-950/60 text-orange-400 border border-orange-500/40 tracking-wide uppercase">
        <ShieldAlert className="w-3 h-3 text-orange-400" />
        <span>High</span>
      </span>
    );
  }
  if (sev === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-950/60 text-yellow-400 border border-yellow-500/40 tracking-wide uppercase">
        <AlertTriangle className="w-3 h-3 text-yellow-400" />
        <span>Medium</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950/60 text-blue-400 border border-blue-500/40 tracking-wide uppercase">
      <Info className="w-3 h-3 text-blue-400" />
      <span>Low</span>
    </span>
  );
}

export default function FindingsList({
  findings = [],
  selectedFindingId,
  onSelectFinding,
  activeFilter,
  onFilterChange,
  prCreatedFindings = {}
}) {
  const filters = [
    { id: 'all', label: 'All Findings' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const filteredFindings = activeFilter === 'all'
    ? findings
    : findings.filter(f => f.severity.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-full">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>Detected Vulnerabilities</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {filteredFindings.length}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a finding below to inspect code context, request Grok AI explanation, or generate a fix.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
          {filters.map(filter => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Findings List */}
      <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[620px] pr-1">
        {filteredFindings.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No findings match the selected filter.
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isSelected = selectedFindingId === finding.id;
            const hasPr = !!prCreatedFindings[finding.id];

            return (
              <div
                key={finding.id}
                onClick={() => onSelectFinding(finding)}
                className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-800/80 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/5'
                    : 'bg-[#131d33]/60 hover:bg-[#131d33] border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={finding.severity} />
                    <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                      {finding.cwe}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      {finding.category}
                    </span>
                    {hasPr && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <GitPullRequest className="w-3 h-3 text-emerald-400" />
                        PR Created
                      </span>
                    )}
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 mt-1 ${
                      isSelected ? 'text-emerald-400 translate-x-0.5' : 'group-hover:text-slate-300'
                    }`}
                  />
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-slate-100 mt-2 group-hover:text-white transition-colors">
                  {finding.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 font-mono">
                  <FileCode2 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-slate-300 truncate">{finding.file_path}</span>
                  <span className="text-emerald-400">:{finding.line_start}</span>
                </div>

                {/* Short snippet */}
                <div className="mt-2.5 p-2 rounded-lg bg-[#090d16] border border-slate-800/80 font-mono text-xs text-red-300/90 overflow-x-auto">
                  <div className="truncate">
                    <span className="text-slate-600 select-none mr-2 font-mono text-[11px]">{finding.line_start}</span>
                    <code>{finding.snippet}</code>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
