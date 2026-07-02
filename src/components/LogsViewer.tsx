import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

interface LogsViewerProps {
  repoName: string; // e.g. "username/repo"
  githubToken: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LogsViewer({ repoName, githubToken, isOpen, onClose }: LogsViewerProps) {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZip, setIsZip] = useState(false);
  const [trigger, setTrigger] = useState(0);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  // Parse repo owner and repo name
  const [owner, repo] = repoName.split('/');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    setIsZip(false);
    try {
      const headers = {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      };

      // 1. Get latest run ID
      const runsResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`, { headers });
      if (!runsResp.ok) {
        throw new Error(`GitHub runs status error: ${runsResp.statusText}`);
      }
      const runsData = await runsResp.json();
      const run = runsData.workflow_runs?.[0];
      if (!run) {
        throw new Error("No workflow runs found yet. Push a commit or trigger workflow first.");
      }

      const runId = run.id;

      // 2. Get jobs for that run
      const jobsResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`, { headers });
      if (!jobsResp.ok) {
        throw new Error(`GitHub jobs fetch failed: ${jobsResp.statusText}`);
      }
      const jobsData = await jobsResp.json();
      const job = jobsData.jobs?.[0];
      if (!job) {
        throw new Error("No jobs found for the latest run.");
      }

      const jobId = job.id;

      // 3. Try to get log URL or fetch actual logs
      let logsText = '';
      try {
        const logResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`, {
          headers,
          redirect: 'follow'
        });
        
        if (logResp.status === 404 || logResp.status === 410) {
          throw new Error("Logs not ready or already expired on GitHub Actions runner.");
        }
        
        if (!logResp.ok) {
          throw new Error(`Log fetch failed with HTTP ${logResp.status}`);
        }

        const contentType = logResp.headers.get('content-type') || '';
        if (contentType.includes('application/zip') || contentType.includes('octet-stream')) {
          setIsZip(true);
        } else {
          logsText = await logResp.text();
          if (logsText.startsWith('PK\x03\x04') || logsText.includes('PK\x03\x04')) {
            setIsZip(true);
          }
        }
      } catch (clientErr: any) {
        console.warn("Client-side log fetch CORS/Redirect or other error, showing direct GitHub link...", clientErr);
        throw new Error(`CORS policy blocked direct log streaming. Please click "View Live on GitHub" above to watch execution logs directly in your browser: ${clientErr.message || clientErr}`);
      }

      if (logsText) {
        // Display last 100 lines
        const lines = logsText.split('\n');
        const last100 = lines.slice(-100).join('\n');
        setLogs(last100);
      } else if (!isZip) {
        setLogs("Waiting for runner logs stream...");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while fetching live logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [repoName, githubToken, isOpen, trigger]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, loading]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 100) {
      onClose();
    }
  };

  const renderLogLine = (line: string, index: number) => {
    if (!line) return <div key={index} className="h-4" />;
    
    const isError = /error|fail|exception/i.test(line);
    const isSuccess = /success|started|connected/i.test(line);
    
    let textColor = 'text-[#F0F6FC]';
    if (isError) textColor = 'text-[#F85149]';
    else if (isSuccess) textColor = 'text-[#3FB950]';
    
    // Check for ISO timestamp (e.g. 2026-07-02T12:34:56.789Z)
    const tsMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s*(.*)$/);
    if (tsMatch) {
      const [, timestamp, rest] = tsMatch;
      return (
        <div key={index} className="leading-relaxed whitespace-pre-wrap py-0.5 select-text font-mono text-[12px] flex items-start gap-2">
          <span className="text-[#484F58] select-none shrink-0">{timestamp}</span>
          <span className={textColor}>{rest}</span>
        </div>
      );
    }
    
    return (
      <div key={index} className={`leading-relaxed whitespace-pre-wrap py-0.5 select-text font-mono text-[12px] ${textColor}`}>
        {line}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex flex-col justify-end">
        {/* Dark overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 cursor-pointer"
        />

        {/* Bottom sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className="relative w-full max-w-xl mx-auto h-[75vh] bg-[#0D1117] border-t border-[rgba(255,255,255,0.08)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-[151] select-text font-sans"
        >
          {/* Drag Handle Bar */}
          <div className="w-full flex justify-center py-3 cursor-grab shrink-0">
            <div className="w-12 h-1.5 bg-[#484F58] rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pb-3 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between shrink-0">
            <h3 className="font-display font-extrabold text-[#F0F6FC] text-xs sm:text-sm tracking-wider uppercase truncate max-w-[80%]">
              LIVE LOGS — {repoName}
            </h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg hover:bg-white/5 text-[#8B949E] hover:text-[#F0F6FC] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body terminal panel */}
          <div className="flex-1 p-4 overflow-y-auto bg-[#080C14] font-mono text-[12px] flex flex-col">
            <div className="flex-grow flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
                  <span className="text-[#8B949E] font-mono text-[12px]">Fetching logs...</span>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Compact 60px error banner */}
                  <div className="h-[60px] flex items-center gap-2.5 px-4 bg-[#F85149]/10 border border-[#F85149]/30 text-[#F85149] rounded-xl text-[12px] shrink-0">
                    <AlertCircle className="w-4 h-4 text-[#F85149] shrink-0" />
                    <span className="truncate text-[12px] font-medium">{error}</span>
                  </div>

                  {/* Terminal panel filling remaining height */}
                  <div className="flex-grow bg-[#0D1117] border border-[rgba(255,255,255,0.08)] rounded-xl flex items-center justify-center p-4">
                    <span className="text-[#484F58] font-mono text-xs">No logs available</span>
                  </div>
                </div>
              ) : isZip ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
                  <div className="w-10 h-10 rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#00D4FF] animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[#00D4FF] font-bold text-sm">Logs downloading</p>
                    <p className="text-[#8B949E] text-[11px]">
                      GitHub has packaged the active log stream into a ZIP file.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed select-text pr-2 text-[#F0F6FC]">
                  {logs.split('\n').map((line, idx) => renderLogLine(line, idx))}
                </div>
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Footer - Always visible, sticky bottom */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#0D1117] shrink-0 grid grid-cols-2 gap-3">
            <a
              href={`https://github.com/${owner}/${repo}/actions`}
              target="_blank"
              rel="noreferrer"
              className="h-11 rounded-xl bg-transparent border border-[rgba(255,255,255,0.08)] text-[#8B949E] hover:text-[#F0F6FC] hover:border-white/20 font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in GitHub</span>
            </a>
            
            <button
              onClick={() => {
                setTrigger(prev => prev + 1);
              }}
              disabled={loading}
              className="h-11 rounded-xl bg-[#00D4FF] text-[#080C14] hover:bg-[#00D4FF]/90 font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
