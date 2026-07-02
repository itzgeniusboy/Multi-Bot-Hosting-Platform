import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Loader2, Play, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

interface LogsViewerProps {
  repoName: string;
  githubToken: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StepLog {
  name: string;
  status: 'success' | 'failure' | 'in_progress' | 'queued' | 'skipped' | 'unknown';
  number: number;
  logs: string;
}

export default function LogsViewer({ repoName, githubToken, isOpen, onClose }: LogsViewerProps) {
  const [steps, setSteps] = useState<StepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(6000); // Poll every 6 seconds
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const resp = await fetch(new URL(`/api/workflow/logs?repo_name=${encodeURIComponent(repoName)}&github_token=${encodeURIComponent(githubToken)}`, window.location.href).href);
        if (!resp.ok) {
          throw new Error('No active runs or logs available yet.');
        }
        const data = await resp.json();
        
        if (isMounted) {
          if (data.steps && data.steps.length > 0) {
            setSteps(data.steps);
            // Default active step to the currently running step or the last one if all are done
            if (activeStep === null) {
              const currentStep = data.steps.find((s: any) => s.status === 'in_progress');
              if (currentStep) {
                setActiveStep(currentStep.number);
              } else {
                setActiveStep(data.steps[data.steps.length - 1].number);
              }
            }
          } else {
            setSteps([]);
          }
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve workflow stream logs.');
          setLoading(false);
        }
      }
    };

    fetchLogs();

    // Auto-refresh interval
    const timer = setInterval(() => {
      fetchLogs();
    }, refreshInterval);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [repoName, githubToken, isOpen, triggerRefresh, refreshInterval]);

  // Scroll to bottom when logs change
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [steps, activeStep]);

  if (!isOpen) return null;

  const currentStepLogs = steps.find(s => s.number === activeStep)?.logs || 'No log output captured for this step.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none overflow-hidden">
      {/* Backdrop glass blur overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#02050B]/85 backdrop-blur-md"
      />

      {/* Main logs terminal view */}
      <div className="w-full max-w-4xl premium-glass-card rounded-3xl border border-[#00D4FF]/20 bg-[#0A1628]/95 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden z-10 flex flex-col h-[80vh]">
        <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>

        {/* Header */}
        <div className="p-5 border-b border-[#00D4FF]/10 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/15 text-[#00D4FF]">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-widest text-[#00D4FF] uppercase font-bold">
                REAL-TIME LIVE TERMINAL
              </span>
              <h2 className="text-sm font-display font-bold text-white tracking-tight truncate max-w-[280px] sm:max-w-[400px]">
                {repoName} Actions Stream
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTriggerRefresh(prev => prev + 1)}
              className="p-2 rounded-xl border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 text-[#4A6080] hover:text-[#00D4FF] transition-all cursor-pointer"
              title="Force reload logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 text-[#4A6080] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Panel: Split view for steps and console output */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          
          {/* Left panel: Steps list (35% width) */}
          <div className="w-full md:w-[35%] border-b md:border-b-0 md:border-r border-[#00D4FF]/10 bg-[#050B18]/30 overflow-y-auto p-4 space-y-2 shrink-0 max-h-[220px] md:max-h-none">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#4A6080] block mb-2">
              Workflow Steps Execution
            </span>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 text-[#00D4FF] animate-spin" />
                <span className="text-[10px] font-mono text-[#4A6080]">Loading active workflow runs...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 rounded-xl border border-rose-500/10 bg-rose-500/5 flex items-start gap-2 text-left">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-rose-400 block uppercase">No Logs Available</span>
                  <p className="text-[10px] text-[#4A6080] leading-relaxed">{error}</p>
                </div>
              </div>
            ) : steps.length === 0 ? (
              <div className="py-12 text-center text-[11px] font-mono text-[#4A6080]">
                Waiting for the first workflow run to trigger...
              </div>
            ) : (
              steps.map((st) => {
                const isActive = activeStep === st.number;
                const isSuccess = st.status === 'success';
                const isFailed = st.status === 'failure';
                const isRunning = st.status === 'in_progress';

                return (
                  <button
                    key={st.number}
                    onClick={() => setActiveStep(st.number)}
                    className={`w-full p-2.5 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 shadow-[0_0_15px_rgba(0,212,255,0.05)]'
                        : 'bg-[#050B18]/50 border-[#00D4FF]/5 hover:border-[#00D4FF]/15 hover:bg-[#00D4FF]/2'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0">
                        {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {isFailed && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                        {isRunning && <Loader2 className="w-3.5 h-3.5 text-[#00D4FF] animate-spin" />}
                        {!isSuccess && !isFailed && !isRunning && <div className="w-2.5 h-2.5 rounded-full bg-[#4A6080]/30 ml-0.5" />}
                      </div>
                      <span className={`text-[11px] font-mono truncate ${isActive ? 'text-white font-bold' : 'text-[#90A4AE] group-hover:text-white'}`}>
                        {st.name}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right panel: Raw Console (65% width) */}
          <div className="flex-1 bg-[#02050B] overflow-hidden flex flex-col h-full">
            <div className="px-4 py-2 border-b border-[#00D4FF]/5 bg-[#050B18]/50 flex items-center justify-between">
              <span className="text-[9px] font-mono text-[#4A6080] uppercase tracking-wider">
                Raw Output Stream
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-[#4A6080]">
                  POLL INTERVAL:
                </span>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-[#050B18] border border-[#00D4FF]/10 rounded-lg px-2 py-0.5 text-[9px] font-mono text-[#4A6080] outline-none cursor-pointer"
                >
                  <option value={3000}>3s</option>
                  <option value={6000}>6s</option>
                  <option value={10000}>10s</option>
                </select>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] text-[#A0B0C0] space-y-1.5 selection:bg-[#00D4FF]/20 select-text text-left">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-[#4A6080]">
                  <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
                  <span>Connecting to actions telemetry pipeline...</span>
                </div>
              ) : (
                currentStepLogs.split('\n').map((line, index) => {
                  // Basic color formatting for output line prefixes
                  const isError = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
                  const isWarning = line.toLowerCase().includes('warn');
                  const isSuccess = line.toLowerCase().includes('success') || line.toLowerCase().includes('successfully');
                  
                  return (
                    <div 
                      key={index} 
                      className={`leading-relaxed break-all ${
                        isError 
                          ? 'text-rose-400 font-semibold' 
                          : isWarning 
                          ? 'text-amber-400' 
                          : isSuccess 
                          ? 'text-emerald-400' 
                          : 'text-[#90A4AE]'
                      }`}
                    >
                      {line}
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
