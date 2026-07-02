import React, { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Terminal, AlertCircle } from 'lucide-react';
import sodium from 'libsodium-wrappers';

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
    { id: 'secrets', name: 'Configuring Encryption & Secrets', status: 'pending' },
    { id: 'register', name: 'Registering Bot Node', status: 'pending' },
    { id: 'launch', name: 'Launching Runner Thread', status: 'pending' },
  ]);

  const [logs, setLogs] = useState<LogLine[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const hasTriggeredDeploy = useRef(false);

  const addLog = (text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { text, type, timestamp }]);
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
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

      const [owner, repo] = repoName.split('/');
      const headers = {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      };

      // 1. Setup GitHub Workflows
      updateStage('workflow', 'running');
      addLog('Generating modern YAML configuration for 24x7 bot runtime...', 'info');
      await new Promise((r) => setTimeout(r, 600));

      const workflowYml = `name: 24x7 Bot Runner

on:
  schedule:
    - cron: '0 */4 * * *'
  workflow_dispatch:
  push:
    branches: [ main, master, dev ]

concurrency:
  group: bot-runner-\${{ github.repository }}
  cancel-in-progress: true

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          if [ -f requirements.txt ]; then
            pip install -r requirements.txt
          elif [ -f package.json ]; then
            sudo apt-get install -y nodejs npm
            npm install
          else
            pip install pyTelegramBotAPI telebot aiogram httpx
          fi

      - name: Run Bot Node
        env:
          BOT_TOKEN: \${{ secrets.BOT_TOKEN }}
        run: |
          RUN_COMMAND="\${{ secrets.RUN_COMMAND }}"
          if [ -z "$RUN_COMMAND" ]; then
            if [ -f bot.py ]; then RUN_COMMAND="python bot.py"
            elif [ -f main.py ]; then RUN_COMMAND="python main.py"
            elif [ -f index.js ]; then RUN_COMMAND="node index.js"
            elif [ -f package.json ]; then RUN_COMMAND="npm start"
            else RUN_COMMAND="python bot.py"
            fi
          fi
          echo "Executing start command: $RUN_COMMAND"
          eval $RUN_COMMAND
`;

      try {
        addLog('Checking for existing workflow file SHA...', 'info');
        let sha = null;
        const workflowPath = '.github/workflows/mbhp_bot.yml';
        const checkUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${workflowPath}`;
        
        try {
          const checkResp = await fetch(checkUrl, { headers });
          if (checkResp.ok) {
            const checkData = await checkResp.json();
            sha = checkData.sha;
            addLog(`Found existing workflow at SHA: ${sha}`, 'info');
          }
        } catch (e) {
          console.warn("Error checking for existing workflow file:", e);
        }

        addLog('Committing new workflow template to GitHub...', 'info');
        const base64Content = btoa(unescape(encodeURIComponent(workflowYml)));
        const putBody = {
          message: '[Platform] Setup 24x7 Continuous Bot Runner Workflow',
          content: base64Content,
          ...(sha && { sha })
        };

        const putResp = await fetch(checkUrl, {
          method: 'PUT',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putBody)
        });

        if (putResp.status !== 200 && putResp.status !== 201) {
          const text = await putResp.text();
          if (putResp.status === 403) {
            throw new Error(`Repository Workflow Read/Write Restriction: ${text}`);
          }
          throw new Error(`Failed to commit workflow: ${text}`);
        }

        const putData = await putResp.json();
        updateStage('workflow', 'success');
        addLog('Successfully committed .github/workflows/mbhp_bot.yml to the main branch.', 'success');
        addLog(`Commit SHA: ${putData.commit?.sha || 'N/A'}`, 'info');

        // 2. Encrypt & commit secrets (BOT_TOKEN and other keys)
        updateStage('secrets', 'running');
        addLog('Initializing libsodium-wrappers secure encryption layer...', 'info');
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
          
          // Fetch repository public key once
          const pubKeyResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, { headers });
          if (!pubKeyResp.ok) {
            const text = await pubKeyResp.text();
            throw new Error(`Failed to fetch public key for repository secrets: ${text}`);
          }
          const pubKeyData = await pubKeyResp.json();
          const { key_id, key: publicKeyBase64 } = pubKeyData;

          // Prepare libsodium
          await sodium.ready;
          const binkey = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL);

          for (const sec of secretsToSet) {
            addLog(`Encrypting secret: ${sec.key}...`, 'info');
            
            const binsec = sodium.from_string(sec.value);
            const encBytes = sodium.crypto_box_seal(binsec, binkey);
            const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

            const secUrl = `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${sec.key}`;
            const secResp = await fetch(secUrl, {
              method: 'PUT',
              headers: {
                ...headers,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                encrypted_value,
                key_id,
              })
            });

            if (secResp.status !== 201 && secResp.status !== 204) {
              const text = await secResp.text();
              throw new Error(`Failed to save secret ${sec.key}: ${text}`);
            }
            addLog(`Secret ${sec.key} securely bound to repository secrets context.`, 'success');
            await new Promise((r) => setTimeout(r, 200));
          }
        } else {
          addLog('No repository secrets configured. Skipping encryption stage.', 'info');
        }

        updateStage('secrets', 'success');
        addLog('All environment variables and credentials secured on GitHub Secrets API.', 'success');

        // 3. Register project to multi-bot platform database (local tracking only)
        updateStage('register', 'running');
        addLog('Registering repository reference in system cluster state...', 'info');
        await new Promise((r) => setTimeout(r, 600));

        const projectData = {
          repo_name: repoName,
          script_name: scriptName || 'python main.py',
          created_at: new Date().toISOString()
        };

        updateStage('register', 'success');
        addLog(`Registered bot node: ${repoName} in local state.`, 'success');

        // 4. Dispatch and trigger workflow
        updateStage('launch', 'running');
        addLog('Dispatching start trigger to GitHub Actions API gateway...', 'info');
        await new Promise((r) => setTimeout(r, 600));

        const dispatchUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/mbhp_bot.yml/dispatches`;
        const startResp = await fetch(dispatchUrl, {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'main', // Default branch to dispatch
          })
        });

        // Fallback to bot.yml if mbhp_bot.yml doesn't dispatch instantly or is not visible yet
        if (startResp.status !== 204) {
          addLog('Direct mbhp_bot.yml dispatch missed, trying master/dev branches...', 'warning');
          const branchesToCheck = ['master', 'dev'];
          let success = false;
          for (const br of branchesToCheck) {
            const retryResp = await fetch(dispatchUrl, {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ref: br })
            });
            if (retryResp.status === 204) {
              success = true;
              break;
            }
          }

          if (!success) {
            const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/bot.yml/dispatches`;
            const fbResp = await fetch(fallbackUrl, {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'application/json' },
              body: JSON.stringify({ ref: 'main' })
            });
            if (fbResp.status !== 204) {
              const text = await fbResp.text();
              throw new Error(`Workflow run dispatch rejected by GitHub: ${text}`);
            }
          }
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
              <p className="text-[11px] text-[#4A6080] leading-relaxed text-left">
                {deployError} Please verify that your GitHub Token is correct and has the necessary permissions (<code className="text-rose-400">repo</code> and <code className="text-rose-400">workflow</code> scopes) to configure workflows and secure secrets on your repository.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
