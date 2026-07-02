import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Terminal, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';

interface DeploymentConsoleProps {
  repoName: string;
  botToken: string;
  scriptName: string; // Used for START_COMMAND
  githubToken: string;
  envVars: { key: string; value: string }[];
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
  envVars,
  onSuccess,
  onFailure,
  onBack
}: DeploymentConsoleProps) {
  const [stages, setStages] = useState<Stage[]>([
    { id: 'workflow', name: 'Creating GitHub Workflow', status: 'pending' },
    { id: 'secrets', name: 'Encrypting & Committing Secrets', status: 'pending' },
    { id: 'register', name: 'Registering Bot Node', status: 'pending' },
    { id: 'launch', name: 'Dispatching Live Run Event', status: 'pending' }
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

  // Perform deployment setup and trigger actions
  useEffect(() => {
    if (hasTriggeredDeploy.current) return;
    hasTriggeredDeploy.current = true;

    const performDeployment = async () => {
      addLog('Initiating deployment environment orchestration...', 'info');
      addLog(`Selected repository namespace: ${repoName}`, 'info');
      addLog(`Configured daemon launch sequence: ${scriptName || 'python main.py'}`, 'info');

      // 1. Setup GitHub Workflows
      updateStage('workflow', 'running');
      addLog('Generating modern YAML configuration for 24x7 bot runtime...', 'info');
      await new Promise((r) => setTimeout(r, 600));

      try {
        const wfResp = await fetch(new URL('/api/workflow/setup', window.location.href).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_name: repoName, github_token: githubToken })
        });

        if (!wfResp.ok) {
          const wfErrData = await wfResp.json();
          throw new Error(wfErrData.error || 'Failed to setup GitHub workflow file.');
        }

        const wfData = await wfResp.json();
        updateStage('workflow', 'success');
        addLog('Successfully committed .github/workflows/bot.yml to the main branch.', 'success');
        addLog(`Commit SHA: ${wfData.commit_sha || 'N/A'}`, 'info');

        // 2. Encrypt & commit secrets (BOT_TOKEN and other keys)
        updateStage('secrets', 'running');
        addLog('Initializing Sodium-based public-key encryption layer...', 'info');
        await new Promise((r) => setTimeout(r, 500));

        // Prepare secrets list
        const secretsToSet: { key: string; value: string }[] = [];
        if (botToken) {
          secretsToSet.push({ key: 'BOT_TOKEN', value: botToken });
        }
        if (scriptName) {
          secretsToSet.push({ key: 'RUN_COMMAND', value: scriptName });
        }
        envVars.forEach(v => {
          secretsToSet.push({ key: v.key, value: v.value });
        });

        if (secretsToSet.length > 0) {
          addLog(`Queued ${secretsToSet.length} secrets for encryption and remote repository binding...`, 'info');
          
          for (const sec of secretsToSet) {
            addLog(`Encrypting secret: ${sec.key}...`, 'info');
            const secResp = await fetch(new URL('/api/secrets/set', window.location.href).href, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                repo_name: repoName,
                github_token: githubToken,
                secret_name: sec.key,
                secret_value: sec.value
              })
            });

            if (!secResp.ok) {
              const secErrData = await secResp.json();
              throw new Error(secErrData.error || `Failed to encrypt and save secret ${sec.key}`);
            }
            addLog(`Secret ${sec.key} securely bound to repository secrets context.`, 'success');
            await new Promise((r) => setTimeout(r, 300));
          }
        } else {
          addLog('No repository secrets configured. Skipping encryption stage.', 'info');
        }

        updateStage('secrets', 'success');
        addLog('All environment variables and credentials secured on GitHub Secrets API.', 'success');

        // 3. Register project to multi-bot platform database
        updateStage('register', 'running');
        addLog('Registering repository reference in system cluster state...', 'info');
        await new Promise((r) => setTimeout(r, 600));

        const regResp = await fetch(new URL('/api/projects', window.location.href).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo_name: repoName,
            github_token: githubToken,
            script_name: scriptName || 'python main.py',
            username: repoName.split('/')[1] || 'telegram_bot'
          })
        });

        if (!regResp.ok) {
          const regErrData = await regResp.json();
          throw new Error(regErrData.error || 'Failed to register bot project in system state.');
        }

        const projectData = await regResp.json();
        updateStage('register', 'success');
        addLog(`Registered bot node: ${repoName} in local state.`, 'success');

        // 4. Dispatch and trigger workflow
        updateStage('launch', 'running');
        addLog('Dispatching start trigger to GitHub Actions API gateway...', 'info');
        await new Promise((r) => setTimeout(r, 600));

        const startResp = await fetch(new URL('/api/workflow/start', window.location.href).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repo_name: repoName,
            github_token: githubToken
          })
        });

        if (!startResp.ok) {
          const startErr = await startResp.json();
          throw new Error(startErr.error || 'Failed to trigger starting workflow run on GitHub.');
        }

        updateStage('launch', 'success');
        addLog('Workflow dispatch event accepted by GitHub (Status: 204). Bot node is now Queued!', 'success');
        addLog('Deployment orchestration completed successfully!', 'success');

        await new Promise((r) => setTimeout(r, 800));
        onSuccess(projectData);

      } catch (err: any) {
        const errorMsg = err.message || 'An unexpected error occurred during build/deployment.';
        setDeployError(errorMsg);
        addLog(`DEPLOYMENT CRITICAL FAILURE: ${errorMsg}`, 'error');
        
        // Update any running stages to 'error'
        stages.forEach(s => {
          if (s.status === 'running' || s.status === 'pending') {
            updateStage(s.id, 'error');
          }
        });
        
        onFailure(errorMsg);
      }
    };

    performDeployment();
  }, [repoName, botToken, scriptName, githubToken, envVars]);

  return (
    <div className="space-y-6">
      {/* Stages layout */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl border border-[#00D4FF]/5 bg-[#050B18]/40">
        {stages.map((st) => {
          const isPending = st.status === 'pending';
          const isRunning = st.status === 'running';
          const isSuccess = st.status === 'success';
          const isError = st.status === 'error';

          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                isRunning
                  ? 'bg-[#00D4FF]/5 border-[#00D4FF]/30 shadow-[0_0_15px_rgba(0,212,255,0.05)]'
                  : isSuccess
                  ? 'bg-emerald-500/5 border-emerald-500/15'
                  : isError
                  ? 'bg-rose-500/5 border-rose-500/15'
                  : 'bg-[#050B18]/10 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono tracking-wider text-[#4A6080] uppercase">
                  {st.id}
                </span>
                {isRunning && <Loader2 className="w-3.5 h-3.5 text-[#00D4FF] animate-spin" />}
                {isSuccess && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                {isError && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                {isPending && <div className="w-2.5 h-2.5 rounded-full bg-[#4A6080]/20" />}
              </div>
              <span className="text-xs font-display font-bold text-[#F0F6FF] truncate">
                {st.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal View */}
      <div className="rounded-2xl border border-[#00D4FF]/10 bg-[#02050B] overflow-hidden flex flex-col h-[340px] relative">
        <div className="px-4 py-2.5 bg-[#050B18] border-b border-[#00D4FF]/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span className="text-[10px] font-mono text-[#4A6080] uppercase font-bold tracking-wider">
              Deployment Stream logs
            </span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={logFilter}
              onChange={(e: any) => setLogFilter(e.target.value)}
              className="bg-[#050B18]/80 border border-[#00D4FF]/10 rounded-lg px-2.5 py-1 text-[9px] font-mono text-[#4A6080] outline-none cursor-pointer hover:text-white transition-colors"
            >
              <option value="all">ALL LOGS</option>
              <option value="info">INFO</option>
              <option value="warning">WARNINGS</option>
              <option value="error">ERRORS</option>
            </select>

            <button
              onClick={() => setIsAutoScrollPaused(!isAutoScrollPaused)}
              className={`text-[9px] font-mono tracking-wider uppercase border rounded-lg px-2 py-1 transition-all ${
                isAutoScrollPaused
                  ? 'border-amber-500/30 text-amber-500 hover:bg-amber-500/5'
                  : 'border-[#4A6080]/15 text-[#4A6080] hover:text-white'
              }`}
            >
              {isAutoScrollPaused ? 'PAUSED' : 'AUTO-SCROLL'}
            </button>
          </div>
        </div>

        {/* Scrollable logs body */}
        <div className="p-4 flex-1 overflow-y-auto font-mono text-[11px] space-y-2 select-text text-left">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-3 leading-relaxed">
              <span className="text-[#4A6080] select-none shrink-0">[{log.timestamp}]</span>
              <span
                className={
                  log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'error'
                    ? 'text-rose-400 font-bold'
                    : log.type === 'warning'
                    ? 'text-amber-400'
                    : 'text-[#90A4AE]'
                }
              >
                {log.text}
              </span>
            </div>
          ))}
          <div ref={consoleEndRef} />
        </div>
      </div>

      {deployError && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 w-full">
            <span className="text-xs font-mono font-bold text-rose-400 block uppercase">
              Build & Integration Error
            </span>
            {deployError.includes("Repository Workflow Read/Write Restriction") ? (
              <div className="space-y-2 mt-1">
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-rose-400">CRITICAL ERROR:</strong> Your GitHub Token has valid scopes, but the target repository is blocking automated workflow creation.
                </p>
                <div className="bg-[#050B18]/80 border border-[#00D4FF]/20 p-4 rounded-xl text-[11px] text-[#F0F6FF] space-y-2 leading-relaxed">
                  <span className="text-[#00D4FF] font-mono font-bold block tracking-wider uppercase text-[10px]">
                    🛠️ WORKFLOW PERMISSION AUTO-FIX GUIDE:
                  </span>
                  <div className="space-y-1.5 font-sans text-slate-300">
                    <p>1. Open your repository <strong className="text-white font-mono bg-slate-800 px-1 py-0.5 rounded">{repoName}</strong> on GitHub.</p>
                    <p>2. Click on the <strong className="text-[#00D4FF]">Settings</strong> tab at the top of the page.</p>
                    <p>3. In the left sidebar, navigate to <strong className="text-[#00D4FF]">Actions</strong> &rarr; <strong className="text-[#00D4FF]">General</strong>.</p>
                    <p>4. Scroll down to the <strong className="text-white">Workflow permissions</strong> section.</p>
                    <p>5. Select <strong className="text-emerald-400 font-bold">'Read and Write permissions'</strong> and tick <strong className="text-white">"Allow GitHub Actions to create and approve pull requests"</strong>.</p>
                    <p>6. Click <strong className="text-[#00D4FF]">Save</strong> and try deploying again!</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#4A6080] leading-relaxed">
                {deployError} Please verify that your GitHub Token is correct and has the necessary permissions (<code className="text-rose-400">repo</code> and <code className="text-rose-400">workflow</code> scopes) to configure workflows and secure secrets on your repository.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
