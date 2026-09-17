import React, { useState } from 'react';
import { ShieldCheck, Terminal, Cpu, Github, RotateCcw, AlertCircle } from 'lucide-react';
import ScanForm from './components/ScanForm';
import ScanSummary from './components/ScanSummary';
import FindingsList from './components/FindingsList';
import FindingDetail from './components/FindingDetail';
import ExplanationPanel from './components/ExplanationPanel';
import DiffViewer from './components/DiffViewer';
import PullRequestPanel from './components/PullRequestPanel';
import { scanRepository, explainFinding, generateFix, createPullRequest } from './services/api';

export default function App() {
  const [scanData, setScanData] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Per-finding cached data
  const [explanations, setExplanations] = useState({});
  const [isExplaining, setIsExplaining] = useState(false);

  const [fixes, setFixes] = useState({});
  const [isFixing, setIsFixing] = useState(false);

  const [pullRequests, setPullRequests] = useState({});
  const [isCreatingPr, setIsCreatingPr] = useState(false);

  // Handle repository scan
  const handleScan = async (repoUrl) => {
    setIsScanning(true);
    setSelectedFinding(null);
    try {
      const data = await scanRepository(repoUrl);
      setScanData(data);
      // Automatically select the hero finding f_001 (or first critical)
      const hero = data.findings.find(f => f.id === 'f_001') || data.findings[0];
      setSelectedFinding(hero);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle finding selection
  const handleSelectFinding = (finding) => {
    setSelectedFinding(finding);
  };

  // Handle Explain with Grok
  const handleExplain = async () => {
    if (!selectedFinding) return;
    setIsExplaining(true);
    try {
      const data = await explainFinding(scanData?.scan_id, selectedFinding.id);
      setExplanations(prev => ({
        ...prev,
        [selectedFinding.id]: data
      }));
    } catch (err) {
      console.error('Explanation error:', err);
    } finally {
      setIsExplaining(false);
    }
  };

  // Handle Generate Fix with Grok
  const handleGenerateFix = async () => {
    if (!selectedFinding) return;
    setIsFixing(true);
    try {
      const data = await generateFix(scanData?.scan_id, selectedFinding.id);
      setFixes(prev => ({
        ...prev,
        [selectedFinding.id]: data
      }));
    } catch (err) {
      console.error('Fix error:', err);
    } finally {
      setIsFixing(false);
    }
  };

  // Handle Create Pull Request
  const handleCreatePr = async () => {
    if (!selectedFinding) return;
    setIsCreatingPr(true);
    try {
      const data = await createPullRequest(scanData?.scan_id, [selectedFinding.id], fixes[selectedFinding.id], selectedFinding);
      setPullRequests(prev => ({
        ...prev,
        [selectedFinding.id]: data
      }));
    } catch (err) {
      console.error('PR error:', err);
    } finally {
      setIsCreatingPr(false);
    }
  };

  const handleResetScan = () => {
    setScanData(null);
    setSelectedFinding(null);
    setExplanations({});
    setFixes({});
    setPullRequests({});
    setActiveFilter('all');
  };

  const currentExplanation = selectedFinding ? explanations[selectedFinding.id] : null;
  const currentFix = selectedFinding ? fixes[selectedFinding.id] : null;
  const currentPr = selectedFinding ? pullRequests[selectedFinding.id] : null;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/10">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">Code Bro</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  v1.0-agent
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                AI Code Review & Vulnerability Detection
              </p>
            </div>
          </div>

          {/* Right Nav Badges & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {scanData && (
              <button
                onClick={handleResetScan}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Scan</span>
              </button>
            )}

            {/* Green status badge: "System ready" */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>System ready</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* If no scan has run yet or scanning in progress */}
        {!scanData ? (
          <ScanForm onScan={handleScan} isScanning={isScanning} />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 3. Scan Summary */}
            <ScanSummary
              scanData={scanData}
              activeFilter={activeFilter}
              onFilterChange={(filter) => setActiveFilter(prev => prev === filter ? 'all' : filter)}
            />

            {/* Findings & Inspector Split Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: 4. Findings List */}
              <div className="lg:col-span-5 xl:col-span-5">
                <FindingsList
                  findings={scanData.findings}
                  selectedFindingId={selectedFinding?.id}
                  onSelectFinding={handleSelectFinding}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  prCreatedFindings={pullRequests}
                />
              </div>

              {/* Right Column: 5. Detail, 6. Explain, 7. Fix/Diff, 8. PR */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-5">
                {/* 5. Finding Detail */}
                <FindingDetail
                  finding={selectedFinding}
                  onExplain={handleExplain}
                  onGenerateFix={handleGenerateFix}
                  isExplaining={isExplaining}
                  isFixing={isFixing}
                  hasExplanation={Boolean(currentExplanation)}
                  hasFix={Boolean(currentFix)}
                />

                {/* 6. AI Explanation Panel */}
                <ExplanationPanel
                  explanation={currentExplanation}
                  isLoading={isExplaining}
                  onTriggerExplain={handleExplain}
                />

                {/* 7. Fix & Unified Diff View */}
                <DiffViewer
                  fixData={currentFix}
                  isLoading={isFixing}
                  onTriggerFix={handleGenerateFix}
                />

                {/* 8. Pull Request Panel */}
                <PullRequestPanel
                  fixData={currentFix}
                  prData={currentPr}
                  isCreatingPr={isCreatingPr}
                  onCreatePr={handleCreatePr}
                  finding={selectedFinding}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d16] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Code Bro</span>
            <span>—</span>
            <span>AI Code Review & Vulnerability Detection Agent</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Rule engine & Grok AI remediation pipeline • Mock mode active
          </div>
        </div>
      </footer>
    </div>
  );
}
