import React, { useState, useEffect, useRef } from 'react';
import { Bot, Key, Code, HelpCircle, Loader2, CheckCircle, AlertTriangle, Eye, EyeOff, Plus, Trash2, Settings } from 'lucide-react';

interface ProjectConfigFormProps {
  selectedRepo: string;
  botToken: string;
  setBotToken: (token: string) => void;
  selectedScript: string;
  setSelectedScript: (script: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

interface EnvVar {
  key: string;
  value: string;
}

export default function ProjectConfigForm({
  selectedRepo,
  botToken,
  setBotToken,
  selectedScript,
  setSelectedScript,
  onSubmit,
  onBack
}: ProjectConfigFormProps) {
  const [botName, setBotName] = useState('');
  const [showToken, setShowToken] = useState(false);
  
  // Real-time token validation states
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; username?: string; error?: string } | null>(null);
  const [userHasTypedToken, setUserHasTypedToken] = useState(false);
  
  // Advanced environment variables state
  const [showEnvVars, setShowEnvVars] = useState(false);
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: 'LOG_LEVEL', value: 'INFO' },
    { key: 'AUTO_RECYCLE', value: 'true' },
    { key: 'RECYCLE_DURATION_SECS', value: '19800' }
  ]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  // Auto-initialize bot name from repo name on select
  useEffect(() => {
    if (selectedRepo) {
      const parts = selectedRepo.split('/');
      const repoName = parts[parts.length - 1];
      setBotName(repoName.replace(/[-_]/g, ' ') + ' host');
    }
  }, [selectedRepo]);

  // Debounced token validation
  useEffect(() => {
    if (!botToken || botToken.trim() === '') {
      setValidationResult(null);
      setIsValidating(false);
      return;
    }

    setUserHasTypedToken(true);
    setIsValidating(true);
    
    const delayDebounce = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/validate-token?token=${encodeURIComponent(botToken)}`);
        if (resp.ok) {
          const data = await resp.json();
          setValidationResult(data);
        } else {
          setValidationResult({ valid: false, error: 'Server response error' });
        }
      } catch (err: any) {
        setValidationResult({ valid: false, error: err.message || 'Validation failed' });
      } finally {
        setIsValidating(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(delayDebounce);
  }, [botToken]);

  const handleAddEnvVar = () => {
    if (newKey.trim() && newValue.trim()) {
      setEnvVars([...envVars, { key: newKey.toUpperCase().trim(), value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
    }
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, idx) => idx !== index));
  };

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration Fields - Left Side (8 Cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-display font-bold text-white tracking-tight">
            Configure Project
          </h3>
          <p className="text-xs text-[#4A6080]">
            Customize deployment settings, secure bot credentials, and configure system environment parameters.
          </p>
        </div>

        {/* Project Name Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-[#00D4FF]" />
            Project Display Name
          </label>
          <input
            type="text"
            required
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 py-3 text-xs text-[#F0F6FF] outline-none transition-all placeholder:text-[#4A6080]"
            placeholder="my-telegram-bot"
          />
        </div>

        {/* Telegram Bot Token Field with Real-Time Validation feedback */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#FF3B6B]" />
              Telegram Bot Token
            </span>
            <span className="text-[9px] lowercase text-[#4A6080] font-sans">
              From @BotFather
            </span>
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              required
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className={`w-full bg-[#050B18]/60 border rounded-xl pl-4 pr-12 py-3 text-xs text-[#F0F6FF] font-mono outline-none transition-all placeholder:text-[#4A6080] ${
                userHasTypedToken
                  ? isValidating
                    ? 'border-[#00D4FF]/30'
                    : validationResult?.valid
                    ? 'border-emerald-500/30 focus:border-emerald-500'
                    : 'border-rose-500/30 focus:border-rose-500'
                  : 'border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF]'
              }`}
              placeholder="1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ..."
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A6080] hover:text-white transition-colors cursor-pointer"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation Feedback Banner */}
          {userHasTypedToken && (
            <div className="transition-all duration-300">
              {isValidating ? (
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#00D4FF]">
                  <Loader2 className="w-3 h-3 animate-spin text-[#00D4FF]" />
                  <span>Validating credentials with Telegram servers...</span>
                </div>
              ) : validationResult?.valid ? (
                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Credential secure: Username registered as @{validationResult.username}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[10px] font-mono text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{validationResult?.error || 'Invalid Token: Telegram server rejected credentials.'}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Template Selector */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-[#7C3AED]" />
            Template Script Selection
          </label>
          <select
            value={selectedScript}
            onChange={(e) => setSelectedScript(e.target.value)}
            className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-4 py-3 text-xs text-[#F0F6FF] font-mono outline-none transition-all cursor-pointer"
          >
            <option value="movie_bot.py">movie_bot.py (Movie catalog & search agent)</option>
            <option value="management_bot.py">management_bot.py (Customer support & ticking logger)</option>
            <option value="custom_mod_bot.py">custom_mod_bot.py (Interactive moderation feedback agent)</option>
          </select>
        </div>

        {/* Collapsible advanced environment variables section */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowEnvVars(!showEnvVars)}
            className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider uppercase text-[#4A6080] hover:text-white transition-all cursor-pointer"
          >
            <Settings className={`w-3.5 h-3.5 text-[#00D4FF] transition-transform duration-300 ${showEnvVars ? 'rotate-90' : ''}`} />
            Advanced System Settings ({envVars.length} variables)
          </button>

          {showEnvVars && (
            <div className="mt-4 p-4 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/30 space-y-4">
              <div className="space-y-3">
                {envVars.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 font-mono text-[11px] bg-[#050B18] border border-[#00D4FF]/5 rounded-lg px-3 py-2 text-[#00D4FF] truncate">
                      {item.key}
                    </div>
                    <div className="flex-1 font-mono text-[11px] bg-[#050B18]/60 border border-[#00D4FF]/10 rounded-lg px-3 py-2 text-[#F0F6FF] truncate">
                      {item.value}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEnvVar(index)}
                      className="p-2 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Variable Inputs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#00D4FF]/5">
                <input
                  type="text"
                  placeholder="VARIABLE_KEY"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                  className="w-full sm:flex-1 bg-[#050B18] border border-[#00D4FF]/10 rounded-lg px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-[#00D4FF] transition-all"
                />
                <input
                  type="text"
                  placeholder="variable_value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full sm:flex-1 bg-[#050B18] border border-[#00D4FF]/10 rounded-lg px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-[#00D4FF] transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddEnvVar}
                  disabled={!newKey.trim() || !newValue.trim()}
                  className="w-full sm:w-auto px-4 py-2 bg-[#00D4FF]/10 text-[#00D4FF] hover:bg-[#00D4FF] hover:text-[#050B18] rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1.5" /> Add
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Project Summary Sidebar - Right Side (4 Cols) */}
      <div className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
        <div className="p-6 rounded-2xl border border-[#00D4FF]/15 bg-[#0A1628]/60 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-md space-y-6">
          <div className="pb-4 border-b border-[#00D4FF]/10">
            <span className="text-[9px] font-mono text-[#00D4FF] tracking-widest uppercase block mb-1">
              // PROJECT OVERVIEW
            </span>
            <h4 className="text-sm font-display font-extrabold text-white truncate">
              {botName || 'Configuring Project'}
            </h4>
          </div>

          <div className="space-y-4 font-mono text-[10px]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">DEPLOYMENT BASE:</span>
              <span className="text-white truncate max-w-[150px]" title={selectedRepo}>
                {selectedRepo}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">DAEMON RUNNER:</span>
              <span className="text-purple-400">{selectedScript}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">ENV VARIABLES:</span>
              <span className="text-white">{envVars.length} active</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">TARGET NETWORK:</span>
              <span className="text-[#00D4FF]">TELEGRAM POOLING</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[#4A6080]">CREDENTIAL STATUS:</span>
              <span className={`font-bold uppercase ${
                userHasTypedToken
                  ? isValidating
                    ? 'text-cyan-400'
                    : validationResult?.valid
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                  : 'text-[#4A6080]'
              }`}>
                {userHasTypedToken
                  ? isValidating
                    ? 'VALIDATING...'
                    : validationResult?.valid
                    ? 'VERIFIED'
                    : 'INVALID'
                  : 'PENDING'}
              </span>
            </div>
          </div>

          {/* Actions inside sidebar */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={userHasTypedToken && (isValidating || !validationResult?.valid)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] text-[#050B18] hover:opacity-95 active:scale-[0.99] transition-all font-sans text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#00D4FF]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              Deploy Project
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full py-3 rounded-xl border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/2 font-mono text-[10px] text-[#4A6080] hover:text-white uppercase tracking-wider transition-all cursor-pointer"
            >
              Choose Repo
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
