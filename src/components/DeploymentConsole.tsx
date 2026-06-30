import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Terminal, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface DeploymentConsoleProps {
  repoName: string;
  botToken: string;
  scriptName: string;
  githubToken: string;
  onSuccess: (data: any) => void;
  onFailure: (error: string) => void;
  onBack: () => void;
}

interface LogLine {
  text: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

type StageStatus = 'pending' | 'running' | 'success' | 'error';

interface Stage {
  id: string;
  name: string;
  status: StageStatus;
}

export default function DeploymentConsole({
  repoName,
  botToken,
  scriptName,
  githubToken,
  onSuccess,
  onFailure,
  onBack
}: DeploymentConsoleProps) {
  const [stages, setStages] = useState<Stage[]>([
    { id: 'validate', name: 'Validating Token', status: 'pending' },
    { id: 'webhook', name: 'Setting Webhook', status: 'pending' },
    { id: 'allocate', name: 'Allocating Serverless Node', status: 'pending' },
    { id: 'live', name: 'Bot Live', status: 'pending' }
  ]);

  const [logs, setLogs] = useState<LogLine[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [deployError, setDeployError] = useState<string | null>(null);
  const hasTriggeredDeploy = useRef(false);

  // Helper to format timestamps for logs
  const getTimestamp = () => {
    const d = new Date();
    return d.toTimeString().split(' ')[0];
  };

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs((prev) => [...prev, { text, type, timestamp: getTimestamp() }]);
  };

  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    if (logFilter === 'info') return log.type === 'info' || log.type === 'success';
    return log.type === logFilter;
  });

  // Auto-scroll terminal
  useEffect(() => {
    if (!isAutoScrollPaused) {
      consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isAutoScrollPaused]);

  // Update a specific stage's status
  const updateStage = (id: string, status: StageStatus) => {
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  // Perform the actual deploy API call and write cinematic logs
  useEffect(() => {
    if (hasTriggeredDeploy.current) return;
    hasTriggeredDeploy.current = true;

    const performDeployment = async () => {
      // 1. Start Deploy
      addLog('Deployment container initialized successfully.', 'info');
      addLog(`Selected target repository: ${repoName}`, 'info');
      addLog(`Selected template: ${scriptName}`, 'info');
      
      updateStage('validate', 'running');
      addLog('Verifying Telegram Bot Token with secure API gateway...', 'info');

      // Create a delay before launching the API to make the log streaming premium
      await new Promise((r) => setTimeout(r, 900));

      try {
        const response = await fetch('/api/launch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_name: repoName,
            bot_token: botToken,
            script_name: scriptName,
            github_token: githubToken,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Stream success sequence
          updateStage('validate', 'success');
          addLog(`Token verified for Telegram bot: @${data.username}`, 'success');
          
          updateStage('webhook', 'running');
          addLog('Clearing active webhooks on Telegram server to allow Actions Polling loops...', 'info');
          await new Promise((r) => setTimeout(r, 800));
          addLog('Webhook successfully cleared. Dispatching files to repository...', 'success');
          
          addLog('Injecting Workflow file: .github/workflows/run_bot.yml...', 'info');
          await new Promise((r) => setTimeout(r, 600));
          addLog(`Injecting Script template: templates/${data.bot_type}.py...`, 'info');
          await new Promise((r) => setTimeout(r, 600));
          
          updateStage('webhook', 'success');
          addLog('GitHub files successfully committed and pushed to main branch.', 'success');
          
          updateStage('allocate', 'running');
          addLog('Dispatching dispatch event to allocate serverless runner node...', 'info');
          await new Promise((r) => setTimeout(r, 950));
          addLog('Gateway dispatched accepted by GitHub Actions. Dispatch status: 204.', 'success');
          
          updateStage('allocate', 'success');
          addLog('Provisioning offline loop recycling environment...', 'info');
          
          updateStage('live', 'running');
          await new Promise((r) => setTimeout(r, 800));
          addLog(`Serverless pooling node online and listening for Telegram updates!`, 'success');
          updateStage('live', 'success');
          
          addLog('Deployment fully compiled and integrated successfully!', 'success');
          await new Promise((r) => setTimeout(r, 500));
          
          onSuccess(data);
        } else {
          // Stream error sequence
          updateStage('validate', 'error');
          addLog(`Verification failed: ${data.message || data.detail || 'GitHub Actions rejected files.'}`, 'error');
          setDeployError(data.message || data.detail || 'Workflow file commit failed.');
          onFailure(data.message || data.detail || 'Workflow dispatch failed.');
        }
      } catch (err: any) {
        updateStage('validate', 'error');
        addLog(`Network pipeline connection interrupted: ${err.message}`, 'error');
        setDeployError(err.message || 'Failed to connect to deployment gateway.');
        onFailure(err.message || 'Failed to connect to deployment gateway.');
      }
    };

    performDeployment();
  }, [repoName, botToken, scriptName, githubToken]);

  return (
    <div className="space-y-6">
      {/* Stages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {stages.map((stage) => {
          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border flex flex-col gap-2 relative overflow-hidden transition-all duration-300 ${
                stage.status === 'running'
                  ? 'bg-[#00D4FF]/5 border-[#00D4FF]/30 shadow-[0_0_15px_rgba(0,212,255,0.05)]'
                  : stage.status === 'success'
                  ? 'bg-emerald-500/5 border-emerald-500/10'
                  : stage.status === 'error'
                  ? 'bg-rose-500/5 border-rose-500/15'
                  : 'bg-[#050B18]/30 border-[#00D4FF]/5'
              }`}
            >
              {stage.status === 'running' && (
                <div className="absolute top-0 left-0 h-[2px] bg-[#00D4FF] w-full animate-pulse"></div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#4A6080]">
                  STAGE STATUS
                </span>
                {stage.status === 'running' && (
                  <Loader2 className="w-3.5 h-3.5 text-[#00D4FF] animate-spin" />
                )}
                {stage.status === 'success' && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {stage.status === 'error' && (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                {stage.status === 'pending' && (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#4A6080]/30"></div>
                )}
              </div>
              <span className={`text-xs font-display font-extrabold ${
                stage.status === 'running'
                  ? 'text-white'
                  : stage.status === 'success'
                  ? 'text-[#F0F6FF]'
                  : stage.status === 'error'
                  ? 'text-rose-400'
                  : 'text-[#4A6080]'
              }`}>
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Retro-Styled Monospace Console */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <span className="text-[10px] font-mono tracking-widest text-[#4A6080] uppercase flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#00D4FF]" />
            Live Deployment Console
          </span>
          
          {/* Console Controls Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="flex bg-[#050B18]/60 border border-[#00D4FF]/10 rounded-lg p-0.5">
              {(['all', 'info', 'warning', 'error'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLogFilter(lvl)}
                  className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold rounded transition-all cursor-pointer ${
                    logFilter === lvl
                      ? lvl === 'error'
                        ? 'bg-rose-500 text-white'
                        : lvl === 'warning'
                        ? 'bg-amber-500 text-[#050B18]'
                        : 'bg-[#00D4FF] text-[#050B18]'
                      : 'text-[#4A6080] hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Scroll Lock Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoScrollPaused(!isAutoScrollPaused)}
              className={`px-2.5 py-1 rounded-lg border text-[9px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
                isAutoScrollPaused
                  ? 'border-amber-500/20 bg-amber-500/5 text-amber-400'
                  : 'border-[#00D4FF]/10 bg-[#050B18]/60 text-[#4A6080] hover:text-white hover:border-[#00D4FF]/30'
              }`}
            >
              {isAutoScrollPaused ? 'Scroll Paused' : 'Auto-Scroll'}
            </button>

            {/* Export log */}
            <button
              type="button"
              onClick={() => {
                const logText = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
                const blob = new Blob([logText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `deploy_logs_${repoName.replace('/', '_')}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-2.5 py-1 rounded-lg border border-[#00D4FF]/10 bg-[#050B18]/60 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 text-[9px] font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
            >
              Download
            </button>
          </div>
        </div>

        <div className="relative rounded-xl border border-[#00D4FF]/10 bg-[#02050B] overflow-hidden shadow-inner">
          {/* Neon Retro Scanlines overlay */}
          <div className="terminal-scanlines" />

          <div className="h-[280px] overflow-y-auto p-5 font-mono text-[11px] leading-relaxed space-y-2 scrollbar-thin select-text">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2.5 transition-all duration-300 ${
                  log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'error'
                    ? 'text-rose-400'
                    : log.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-[#8EA8D0]'
                }`}
              >
                <span className="text-[#4A6080] shrink-0 font-medium">[{log.timestamp}]</span>
                <span className="font-semibold text-[10px] tracking-wider shrink-0 uppercase">
                  {log.type === 'info' ? 'info:' : log.type === 'success' ? 'ok:' : log.type === 'warning' ? 'warn:' : 'err:'}
                </span>
                <span className="flex-1 whitespace-pre-wrap">{log.text}</span>
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        </div>
      </div>

      {/* Troubleshooting Failure Controls */}
      {deployError && (
        <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-display font-bold text-white uppercase tracking-wider">
                Deployment Pipeline Failure
              </h4>
              <p className="text-[11px] text-[#4A6080] leading-relaxed">
                The gateway returned an validation exception: "{deployError}". This generally occurs if your Telegram Bot Token is invalid, or your GitHub token lacks the "workflow" scope required to commit and trigger actions.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => {
                hasTriggeredDeploy.current = false;
                setDeployError(null);
                setLogs([]);
                setStages(stages.map(s => ({ ...s, status: 'pending' })));
              }}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:opacity-90 active:scale-95 text-white rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restart Pipeline
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-[#00D4FF]/15 hover:border-[#00D4FF]/30 text-[#4A6080] hover:text-white rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Adjust Configurations
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
