import React, { useState, useEffect, useRef } from 'react';
import { Bot, Key, Code, HelpCircle, Plus, Trash2, Settings, Terminal, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';

interface ProjectConfigFormProps {
  selectedRepo: string;
  botToken: string;
  setBotToken: (token: string) => void;
  selectedScript: string;
  setSelectedScript: (script: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  envVars: { key: string; value: string }[];
  setEnvVars: React.Dispatch<React.SetStateAction<{ key: string; value: string }[]>>;
  verifiedBotInfo: { botName: string; botUsername: string; botId: number } | null;
  setVerifiedBotInfo: (info: { botName: string; botUsername: string; botId: number } | null) => void;
}

export default function ProjectConfigForm({
  selectedRepo,
  botToken,
  setBotToken,
  selectedScript,
  setSelectedScript,
  onSubmit,
  onBack,
  envVars,
  setEnvVars,
  verifiedBotInfo,
  setVerifiedBotInfo,
}: ProjectConfigFormProps) {
  const [projectName, setProjectName] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  
  // Verification states
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const lastValidatedToken = useRef('');

  // Auto-initialize project name from repo name on select
  useEffect(() => {
    if (selectedRepo) {
      const parts = selectedRepo.split('/');
      const repoName = parts[parts.length - 1];
      setProjectName(repoName);
      // Prefill default start command
      if (!selectedScript) {
        setSelectedScript('python bot.py');
      }
    }
  }, [selectedRepo]);

  // Debounce hook for BOT_TOKEN typing
  useEffect(() => {
    if (!botToken.trim()) {
      setValidationError(null);
      setVerifiedBotInfo(null);
      setIsValidating(false);
      lastValidatedToken.current = '';
      return;
    }

    const timer = setTimeout(() => {
      validateToken(botToken.trim());
    }, 800);

    return () => clearTimeout(timer);
  }, [botToken]);

  const validateToken = async (token: string) => {
    if (!token.trim()) {
      setValidationError(null);
      setVerifiedBotInfo(null);
      setIsValidating(false);
      lastValidatedToken.current = '';
      return;
    }

    if (token === lastValidatedToken.current) return;
    lastValidatedToken.current = token;

    setIsValidating(true);
    setValidationError(null);
    setVerifiedBotInfo(null);

    try {
      const resp = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      if (resp.ok) {
        const data = await resp.json();
        if (data.ok && data.result) {
          setVerifiedBotInfo({
            botName: data.result.first_name,
            botUsername: data.result.username,
            botId: data.result.id,
          });
          setValidationError(null);
        } else {
          setValidationError('Invalid token. Get it from @BotFather');
          setVerifiedBotInfo(null);
        }
      } else {
        setValidationError('Invalid token. Get it from @BotFather');
        setVerifiedBotInfo(null);
      }
    } catch (err) {
      console.error('Error validating bot token:', err);
      setValidationError('Failed to validate token. Please check internet connection.');
      setVerifiedBotInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBlur = () => {
    if (botToken.trim()) {
      validateToken(botToken.trim());
    }
  };

  const handleAddSecret = () => {
    if (newKey.trim() && newValue.trim()) {
      const formattedKey = newKey.toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();
      // Avoid duplicate keys
      if (envVars.some(v => v.key === formattedKey)) return;
      setEnvVars([...envVars, { key: formattedKey, value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemoveSecret = (index: number) => {
    setEnvVars(envVars.filter((_, idx) => idx !== index));
  };

  const isSubmitDisabled = isValidating || (botToken.trim().length > 0 && (!verifiedBotInfo || validationError !== null));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Side: Inputs and settings (8 columns) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-[#00D4FF] uppercase font-bold">
            STEP 2 // CONFIGURATION
          </span>
          <h3 className="text-xl font-display font-extrabold text-white tracking-tight uppercase">
            Configure Bot Environment
          </h3>
          <p className="text-xs text-[#4A6080]">
            Your bot source code remains untouched in your GitHub repository. Here, you configure how the multi-bot platform executes your daemon process and manages secrets.
          </p>
        </div>
 
        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-[#00D4FF]" />
            Project Name
          </label>
          <input
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 h-12 sm:h-11 py-3 text-base sm:text-xs text-[#F0F6FF] outline-none transition-all font-mono"
            placeholder="my-cool-bot"
          />
        </div>

        {/* Custom Start Command */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#7C3AED]" />
            Start Command (Executed in Workflow)
          </label>
          <input
            type="text"
            required
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-4 h-12 sm:h-11 py-3 text-base sm:text-xs text-[#F0F6FF] font-mono outline-none transition-all"
            placeholder="python bot.py"
          />
          <p className="text-[10px] text-[#4A6080] leading-relaxed">
            The script or command required to run your bot. Examples: <code className="text-[#00D4FF] font-mono">python bot.py</code>, <code className="text-[#00D4FF] font-mono">node index.js</code>, or <code className="text-[#00D4FF] font-mono">npm start</code>. If left blank or unspecified, the workflow will attempt to auto-detect Python or Node main script entry points.
          </p>
        </div>

        {/* Secrets Configuration Panel */}
        <div className="space-y-4 pt-4 border-t border-[#00D4FF]/5">
          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#FF3B6B]" />
              Repository Secrets Configuration
            </h4>
            <p className="text-[11px] text-[#4A6080]">
              Secrets are securely encrypted using public-key cryptography (libsodium) and saved directly inside your GitHub repository settings. They are never stored in plain text on our servers.
            </p>
          </div>

          {/* Special Bot Token Field */}
          <div className="space-y-3 p-4 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/40">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#00D4FF]" />
                Telegram Bot Token (Optional BOT_TOKEN)
              </span>
              <span className="text-[9px] lowercase text-[#4A6080]">
                Saved to secrets.BOT_TOKEN
              </span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                onBlur={handleBlur}
                className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl pl-4 pr-16 h-12 sm:h-11 py-3 text-base sm:text-xs text-[#F0F6FF] font-mono outline-none transition-all placeholder:text-[#4A6080]"
                placeholder="1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ... (Optional)"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isValidating && (
                  <Loader2 className="w-4 h-4 text-[#00D4FF] animate-spin shrink-0" />
                )}
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-[#4A6080] hover:text-white transition-colors cursor-pointer p-0.5"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {validationError && (
              <p className="text-xs text-rose-400 font-mono flex items-center gap-1 mt-1.5" id="bot-validation-error">
                <span className="text-sm">⚠</span> {validationError}
              </p>
            )}

            {/* Green verification details card */}
            {verifiedBotInfo && !validationError && (
              <div className="p-4 border-l-[3px] border-emerald-500 bg-emerald-500/5 rounded-r-xl space-y-1 w-full text-left mt-2" id="bot-verified-box">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="text-base">✓</span>
                  <span>Bot Verified</span>
                </div>
                <div className="text-[14px] font-mono text-slate-300">
                  <span className="text-[#4A6080]">Name:</span> {verifiedBotInfo.botName}
                </div>
                <div className="text-[14px] font-mono text-slate-300">
                  <span className="text-[#4A6080]">Username:</span> <span className="text-cyan-400 font-bold">@{verifiedBotInfo.botUsername}</span>
                </div>
              </div>
            )}
          </div>

          {/* Other Custom Environment Secrets */}
          <div className="space-y-3 p-4 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/20">
            <span className="text-[10px] font-mono font-bold text-[#4A6080] uppercase tracking-wider block mb-1">
              Custom Repository Secrets ({envVars.length})
            </span>

            {envVars.length > 0 && (
              <div className="space-y-2 mb-4">
                {envVars.map((item, index) => (
                  <div key={index} className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-[#050B18]/40 border border-[#00D4FF]/10 rounded-xl pr-12">
                    <div className="w-full sm:flex-1 font-mono text-[11px] bg-[#050B18] border border-[#00D4FF]/5 rounded-lg px-3 py-2 text-[#00D4FF] truncate">
                      {item.key}
                    </div>
                    <div className="w-full sm:flex-1 font-mono text-[11px] bg-[#050B18]/60 border border-[#00D4FF]/10 rounded-lg px-3 py-2 text-[#F0F6FF] truncate">
                      ••••••••••••••••
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecret(index)}
                      className="absolute top-1/2 -translate-y-1/2 right-3 w-8 h-8 flex items-center justify-center text-rose-500 hover:text-rose-400 bg-transparent hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer border border-transparent"
                      title="Remove secret"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Secret Adder */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#00D4FF]/5 w-full">
              <input
                type="text"
                placeholder="SECRET_NAME"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full sm:flex-1 bg-[#050B18] border border-[#00D4FF]/10 rounded-xl px-4 h-12 sm:h-11 py-3 text-base sm:text-xs font-mono text-white outline-none focus:border-[#00D4FF] transition-all uppercase placeholder:text-[#4A6080]"
              />
              <input
                type="password"
                placeholder="Enter secret value"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full sm:flex-1 bg-[#050B18] border border-[#00D4FF]/10 rounded-xl px-4 h-12 sm:h-11 py-3 text-base sm:text-xs font-mono text-white outline-none focus:border-[#00D4FF] transition-all placeholder:text-[#4A6080]"
              />
              <button
                type="button"
                onClick={handleAddSecret}
                disabled={!newKey.trim() || !newValue.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-[#050B18] rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Secret
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Sidebar overview (4 columns) */}
      <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
        <div className="p-6 rounded-2xl border border-[#00D4FF]/15 bg-[#0A1628]/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-6">
          <div className="pb-4 border-b border-[#00D4FF]/10">
            <span className="text-[9px] font-mono text-[#00D4FF] tracking-widest uppercase block mb-1">
              // READY TO AUTO-SETUP
            </span>
            <h4 className="text-sm font-display font-extrabold text-white truncate">
              {projectName || 'Configuring Bot'}
            </h4>
          </div>

          <div className="space-y-4 font-mono text-[10px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">REPOSITORY:</span>
              <span className="text-white truncate max-w-[150px]" title={selectedRepo}>
                {selectedRepo}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">START COMMAND:</span>
              <span className="text-purple-400">{selectedScript || 'python main.py'}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">BOT SECRETS:</span>
              <span className="text-white">{envVars.length + (botToken ? 1 : 0)} secure</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">ACTIONS RUNNER:</span>
              <span className="text-[#00D4FF]">24x7 DEPLOYMENT</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 h-11 rounded-xl border border-[rgba(255,255,255,0.08)] bg-transparent text-[#8B949E] hover:text-[#F0F6FC] hover:bg-white/5 font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              BACK
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitDisabled}
              className="flex-1 h-11 rounded-xl bg-[#00D4FF] text-[#080C14] hover:bg-[#00D4FF]/90 font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              CONTINUE
            </button>
          </div>
        </div>

        {/* Workflow preview box */}
        <div className="p-4 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/30 space-y-2">
          <span className="text-[9px] font-mono text-[#4A6080] uppercase font-bold tracking-wider block">
            Generated Workflow (.github/workflows/mbhp_bot.yml)
          </span>
          <pre className="text-[8px] font-mono text-[#4A6080] bg-[#050B18]/85 p-3 rounded-lg border border-[#00D4FF]/5 max-h-[140px] overflow-y-auto scrollbar-none leading-tight select-text text-left">
{`name: 24x7 Bot Runner
on:
  schedule:
    - cron: '0 */4 * * *'
  workflow_dispatch:
  push:
    branches: [ main, master ]
concurrency:
  group: bot-runner
  cancel-in-progress: true`}
          </pre>
        </div>
      </div>
    </div>
  );
}
