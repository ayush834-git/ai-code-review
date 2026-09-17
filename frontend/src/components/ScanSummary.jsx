import React from 'react';
import { Files, Clock, AlertOctagon, ShieldAlert, ShieldCheck, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function ScanSummary({ scanData, activeFilter, onFilterChange }) {
  if (!scanData) return null;

  const { files_scanned, duration_ms, summary, repo_url } = scanData;
  const total = summary?.total ?? 14;
  const critical = summary?.critical ?? 0;
  const high = summary?.high ?? 0;
  const medium = summary?.medium ?? 0;
  const low = summary?.low ?? 0;

  // Security score calculation based on severities (0-100)
  // Higher critical/high reduces score significantly
  const penalty = (critical * 20) + (high * 8) + (medium * 4) + (low * 1);
  const score = Math.max(12, Math.min(100, 100 - penalty));

  const getScoreGrade = (val) => {
    if (val >= 90) return { grade: 'A', text: 'Secure', color: 'text-emerald-400', stroke: '#10b981' };
    if (val >= 75) return { grade: 'B', text: 'Good', color: 'text-cyan-400', stroke: '#06b6d4' };
    if (val >= 60) return { grade: 'C', text: 'Moderate', color: 'text-yellow-400', stroke: '#f59e0b' };
    if (val >= 40) return { grade: 'D', text: 'At Risk', color: 'text-orange-400', stroke: '#f97316' };
    return { grade: 'F', text: 'Critical Risk', color: 'text-red-400', stroke: '#ef4444' };
  };

  const scoreInfo = getScoreGrade(score);

  const severityCards = [
    {
      id: 'critical',
      label: 'Critical',
      count: critical,
      color: 'text-red-400',
      bg: 'bg-red-950/30 hover:bg-red-950/50',
      border: 'border-red-500/40',
      activeRing: 'ring-2 ring-red-500',
      icon: AlertOctagon,
      subtext: 'Remote code execution, SQLi, secrets',
    },
    {
      id: 'high',
      label: 'High',
      count: high,
      color: 'text-orange-400',
      bg: 'bg-orange-950/30 hover:bg-orange-950/50',
      border: 'border-orange-500/40',
      activeRing: 'ring-2 ring-orange-500',
      icon: ShieldAlert,
      subtext: 'SSRF, Path traversal, IDOR, XSS',
    },
    {
      id: 'medium',
      label: 'Medium',
      count: medium,
      color: 'text-yellow-400',
      bg: 'bg-yellow-950/30 hover:bg-yellow-950/50',
      border: 'border-yellow-500/40',
      activeRing: 'ring-2 ring-yellow-500',
      icon: AlertTriangle,
      subtext: 'CORS bypass, weak crypto, rate limit',
    },
    {
      id: 'low',
      label: 'Low',
      count: low,
      color: 'text-blue-400',
      bg: 'bg-blue-950/30 hover:bg-blue-950/50',
      border: 'border-blue-500/40',
      activeRing: 'ring-2 ring-blue-500',
      icon: Info,
      subtext: 'Missing headers, stack trace leaks',
    },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Top Banner & Text Summary */}
      <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
            <AlertOctagon className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-200">Critical issues detected.</p>
            <p className="text-red-300/80 text-xs">
              Review and fix the highest-risk findings first.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center text-xs font-mono text-slate-400">
          <span className="truncate max-w-[240px] text-slate-300 font-semibold">{repo_url}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Files Scanned */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Files Scanned</p>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{files_scanned}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Full codebase scan</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800/70 border border-slate-700 flex items-center justify-center text-slate-400">
            <Files className="w-5 h-5" />
          </div>
        </div>

        {/* Scan Duration */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Scan Duration</p>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{duration_ms} <span className="text-sm font-normal text-slate-400">ms</span></p>
            <p className="text-[11px] text-slate-500 mt-0.5">AST rule evaluation</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800/70 border border-slate-700 flex items-center justify-center text-slate-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Findings */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Findings</p>
            <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{total}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all severities</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Security Score */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Security Score</p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={`text-2xl font-bold font-mono ${scoreInfo.color}`}>{score}</span>
              <span className="text-xs text-slate-400">/ 100</span>
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[11px] font-bold ${scoreInfo.color} bg-slate-800/80`}>
                {scoreInfo.grade}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{scoreInfo.text}</p>
          </div>
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeDasharray={`${score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke={scoreInfo.stroke}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={`absolute text-[11px] font-bold ${scoreInfo.color}`}>
              {scoreInfo.grade}
            </span>
          </div>
        </div>
      </div>

      {/* Severity Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {severityCards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilter === card.id;

          return (
            <button
              key={card.id}
              onClick={() => onFilterChange(card.id)}
              className={`text-left rounded-xl p-4 border transition-all duration-150 ${card.bg} ${card.border} ${
                isSelected ? card.activeRing : 'hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${card.color}`}>
                    {card.label}
                  </span>
                </div>
                <span className={`text-xl font-bold font-mono ${card.color}`}>
                  {card.count}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                {card.subtext}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
