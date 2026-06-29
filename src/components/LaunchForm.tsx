import React, { useState, useEffect } from 'react';
import { Rocket, ShieldAlert, Cpu, Github, LogOut, RefreshCw, Layers, Key, User, Shield, ExternalLink, Sparkles } from 'lucide-react';

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

interface LaunchFormProps {
  githubToken: string | null;
  onConnectGitHub: () => Promise<void>;
  onDisconnectGitHub: () => void;
  onSaveManualToken: (token: string) => void;
  repos: Repo[];
  isFetchingRepos: boolean;
  onFetchRepos: () => void;
  onLaunch: (repoName: string, token: string, scriptName: string) => Promise<void>;
  isLaunching: boolean;
}

export default function LaunchForm({
  githubToken,
  onConnectGitHub,
  onDisconnectGitHub,
  onSaveManualToken,
  repos,
  isFetchingRepos,
  onFetchRepos,
  onLaunch,
  isLaunching,
}: LaunchFormProps) {
  // Authentication method tab selection
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  
  // Manual PAT form states
  const [manualUsername, setManualUsername] = useState('');
  const [manualPat, setManualPat] = useState('');
  const [manualError, setManualError] = useState('');
  const [isValidatingManual, setIsValidatingManual] = useState(false);

  // Deployment form states
  const [token, setToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [scriptName, setScriptName] = useState('movie_bot');
  const [error, setError] = useState('');

  const tokenRegex = /^\d+:[A-Za-z0-9_-]{35,50}$/;
  const isTokenValid = tokenRegex.test(token.trim()) || token.trim() === '827419365:AAH_CyberMindAssistant_DemoSecureKey';

  // Set default repo selection when repos list updates
  useEffect(() => {
    if (repos.length > 0 && !selectedRepo) {
      setSelectedRepo(repos[0].full_name);
    }
  }, [repos, selectedRepo]);

  const validate = () => {
    const trimmedToken = token.trim();
    if (!githubToken) {
      setError('Please connect your GitHub account first.');
      return false;
    }
    if (!selectedRepo) {
      setError('Please select a GitHub repository to deploy to.');
      return false;
    }
    if (!trimmedToken) {
      setError('Telegram Bot Token is required.');
      return false;
    }
    if (!isTokenValid) {
      setError('Invalid token format. Expected: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onLaunch(selectedRepo, token.trim(), scriptName);
    setToken('');
  };

  const fillDemoCredentials = () => {
    setToken('827419365:AAH_CyberMindAssistant_DemoSecureKey');
    setError('');
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError('');
    
    const username = manualUsername.trim();
    const pat = manualPat.trim();

    if (!username) {
      setManualError('GitHub Username is required.');
      return;
    }
    if (!pat) {
      setManualError('GitHub Personal Access Token (PAT) is required.');
      return;
    }

    setIsValidatingManual(true);
    try {
      // Validate credentials by fetching repositories using the PAT directly
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'telegram-bot-backend-onboarding',
        }
      });

      if (!response.ok) {
        throw new Error('Invalid token or username. Verify the token has proper scopes and is active.');
      }

      const userData = await response.json();
      if (userData.login.toLowerCase() !== username.toLowerCase()) {
        throw new Error(`The provided token belongs to user "${userData.login}", but you entered "${username}".`);
      }

      // If valid, save manual token to application state
      onSaveManualToken(pat);
    } catch (err: any) {
      console.error('Manual validation error:', err);
      setManualError(err.message || 'Validation failed. Please verify token scopes (repo, workflow).');
    } finally {
      setIsValidatingManual(false);
    }
  };

  return (
    <div className="premium-glass-card corner-accent-line rounded-2xl p-8 relative overflow-hidden" id="launch-provisioner">
      {/* Decorative inner pattern */}
      <div className="absolute inset-0 card-grid-pattern opacity-10 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">// SYSTEM PROVISIONER</span>
          <h2 className="text-xl font-display font-bold text-[#F0F6FF] flex items-center gap-2 mt-1">
            <Rocket className="w-5 h-5 text-[#00D4FF]" />
            Onboarding & Deployment Hub
          </h2>
          <p className="text-xs text-[#4A6080] mt-1 font-sans leading-relaxed">
            Configure your GitHub environment to spin up automated runner systems and execute Telegram bots directly on your repositories.
          </p>
        </div>

        {githubToken && (
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#F0F6FF] text-xs font-semibold hover:bg-[#7C3AED]/20 cursor-pointer transition-all font-sans"
          >
            Auto-fill Demo Credentials
          </button>
        )}
      </div>

      {!githubToken ? (
        /* Phase 1: Authentication Selection (Vercel-style Onboarding) */
        <div className="relative z-10 max-w-xl mx-auto space-y-6">
          
          {/* Custom Tabs */}
          <div className="flex p-1 rounded-xl bg-[#030812]/80 border border-[#00D4FF]/10">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('oauth');
                setManualError('');
              }}
              className={`flex-1 py-3 text-xs font-sans font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMethod === 'oauth'
                  ? 'bg-gradient-to-r from-[#00D4FF]/10 to-[#7C3AED]/10 border border-[#00D4FF]/25 text-[#F0F6FF] shadow-inner'
                  : 'text-[#4A6080] hover:text-[#F0F6FF] border border-transparent'
              }`}
            >
              <Shield className="w-4 h-4 text-[#00D4FF]" />
              Secure OAuth
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('pat');
                setError('');
              }}
              className={`flex-1 py-3 text-xs font-sans font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMethod === 'pat'
                  ? 'bg-gradient-to-r from-[#00D4FF]/10 to-[#7C3AED]/10 border border-[#00D4FF]/25 text-[#F0F6FF] shadow-inner'
                  : 'text-[#4A6080] hover:text-[#F0F6FF] border border-transparent'
              }`}
            >
              <Key className="w-4 h-4 text-[#7C3AED]" />
              Personal Token (PAT)
            </button>
          </div>

          {authMethod === 'oauth' ? (
            /* Option A: OAuth Onboarding Path */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-[#00D4FF]/5 rounded-full flex items-center justify-center mx-auto border border-[#00D4FF]/20 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
                <Github className="w-8 h-8 text-[#00D4FF]" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-[#F0F6FF] font-display">Connect via GitHub OAuth</h3>
                <p className="text-xs text-[#4A6080] font-sans leading-relaxed">
                  Authenticate securely through standard GitHub OAuth protocol. Our server registers the token to orchestrate workflow runs on your repositories.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#030812]/50 border border-[#00D4FF]/5 text-left max-w-md mx-auto space-y-2">
                <span className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> SECURITY COMPLIANCE
                </span>
                <p className="text-[11px] text-[#4A6080] font-mono leading-relaxed">
                  Required scopes: <code className="text-[#F0F6FF]">repo</code>, <code className="text-[#F0F6FF]">workflow</code>, and <code className="text-[#F0F6FF]">admin:repo_hook</code> to automatically inject Actions workflow descriptors.
                </p>
              </div>

              <button
                onClick={onConnectGitHub}
                className="w-full max-w-md mx-auto py-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:from-[#00E5FF] hover:to-[#8B5CF6] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#00D4FF]/10 cursor-pointer hover:scale-[1.01] transition-all"
              >
                <Github className="w-4 h-4" />
                Continue with GitHub OAuth
              </button>
            </div>
          ) : (
            /* Option B: Manual Personal Access Token (PAT) Path */
            <form onSubmit={handleManualConnect} className="space-y-6 py-2">
              <div className="space-y-2 max-w-md mx-auto text-center mb-6">
                <h3 className="text-sm font-semibold text-[#F0F6FF] font-display">Authenticate via Personal Access Token</h3>
                <p className="text-xs text-[#4A6080] font-sans leading-relaxed">
                  Perfect if you prefer manual API keys over OAuth popups. Enter your GitHub credentials directly to sync repositories.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub Username */}
                <div className="floating-label-group">
                  <input
                    type="text"
                    id="manual_username"
                    placeholder=" "
                    value={manualUsername}
                    onChange={(e) => {
                      setManualUsername(e.target.value);
                      if (manualError) setManualError('');
                    }}
                    className="bottom-border-input font-mono text-xs"
                  />
                  <label htmlFor="manual_username" className="floating-label font-sans flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#00D4FF]" /> GitHub Username
                  </label>
                  <span className="focus-underline"></span>
                </div>

                {/* Personal Access Token (PAT) */}
                <div className="floating-label-group">
                  <input
                    type="password"
                    id="manual_pat"
                    placeholder=" "
                    value={manualPat}
                    onChange={(e) => {
                      setManualPat(e.target.value);
                      if (manualError) setManualError('');
                    }}
                    className="bottom-border-input font-mono text-xs"
                  />
                  <label htmlFor="manual_pat" className="floating-label font-sans flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#7C3AED]" /> Personal Access Token (PAT)
                  </label>
                  <span className="focus-underline"></span>
                </div>
              </div>

              {/* Action Scopes Guide Box */}
              <div className="p-4 rounded-xl bg-[#030812]/50 border border-[#7C3AED]/10 text-left space-y-2 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#7C3AED] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Shield className="w-3.5 h-3.5" /> HOW TO CREATE A TELEGRAM-BOT PAT
                  </span>
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    referrerPolicy="no-referrer"
                    className="text-[10px] text-[#00D4FF] hover:underline flex items-center gap-1 font-sans"
                  >
                    Generate PAT <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-[#4A6080] leading-relaxed">
                  Please generate a classic token containing the <code className="text-[#F0F6FF]">repo</code> and <code className="text-[#F0F6FF]">workflow</code> scopes. No password required.
                </p>
              </div>

              {manualError && (
                <p className="text-[11px] text-[#FF3B6B] flex items-center gap-1.5 font-sans justify-center bg-rose-950/10 py-2.5 px-4 rounded-lg border border-[#FF3B6B]/15">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {manualError}
                </p>
              )}

              <button
                type="submit"
                disabled={isValidatingManual}
                className="w-full py-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-linear-to-r from-[#7C3AED] to-[#FF3B6B] hover:from-[#8B5CF6] hover:to-[#FF5E89] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/10 cursor-pointer hover:scale-[1.01] transition-all"
              >
                {isValidatingManual ? (
                  <>
                    <span className="spinning-arc-loader"></span>
                    VERIFYING CRITIQUE GATEWAY HANDSHAKE...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Authenticate & Connect Token
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      ) : (
        /* Phase 2: Deploy Form */
        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#030812]/50 border border-[#00D4FF]/5">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <p className="text-[11px] font-mono text-[#F0F6FF] font-semibold">Workspace Handshake Established</p>
                <p className="text-[10px] text-[#4A6080] font-sans">Verified GitHub credentials cached securely in browser storage</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onFetchRepos}
                disabled={isFetchingRepos}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D4FF]/5 text-[#00D4FF] border border-[#00D4FF]/10 text-[10px] font-mono hover:bg-[#00D4FF]/10 transition-all cursor-pointer"
                title="Force refresh repositories list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRepos ? 'animate-spin' : ''}`} />
                {isFetchingRepos ? 'Syncing...' : 'Sync'}
              </button>
              <button
                type="button"
                onClick={onDisconnectGitHub}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF3B6B]/5 text-[#FF3B6B] border border-[#FF3B6B]/10 text-[10px] font-mono hover:bg-[#FF3B6B]/10 transition-all cursor-pointer"
                title="Revoke access token"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>
          </div>

          {/* Repository Selector Dropdown */}
          <div className="floating-label-group">
            {isFetchingRepos ? (
              <div className="bottom-border-input flex items-center justify-between border-b-[#00D4FF]/20 py-2.5">
                <span className="text-xs text-[#4A6080] font-mono animate-pulse">Querying repositories from GitHub API...</span>
                <span className="spinning-arc-loader w-4 h-4"></span>
              </div>
            ) : (
              <select
                id="github_repo"
                value={selectedRepo}
                onChange={(e) => {
                  setSelectedRepo(e.target.value);
                  if (error) setError('');
                }}
                className="bottom-border-input cursor-pointer font-mono appearance-none pr-8 border-b-[#00D4FF]/20 focus:border-b-transparent text-xs text-[#F0F6FF]"
              >
                {repos.length === 0 ? (
                  <option value="" disabled className="bg-[#0A1628]">No repositories found on GitHub</option>
                ) : (
                  repos.map((repo) => (
                    <option key={repo.id} value={repo.full_name} className="bg-[#0A1628] text-[#F0F6FF]">
                      {repo.full_name} {repo.private ? '🔒' : '🌐'}
                    </option>
                  ))
                )}
              </select>
            )}
            <label htmlFor="github_repo" className="floating-label font-sans">
              Select Target GitHub Repository
            </label>
            <span className="focus-underline"></span>
            <div className="pointer-events-none absolute right-0 top-3 text-[#00D4FF]">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between mt-1 text-[10px] text-[#4A6080]">
              <span>We will inject workflows directly to this repository branch.</span>
            </div>
          </div>

          {/* Telegram Bot Token Input */}
          <div className="floating-label-group">
            <input
              type="text"
              id="bot_token"
              placeholder=" "
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (error) setError('');
              }}
              style={isTokenValid ? { boxShadow: '0 0 10px rgba(0, 212, 255, 0.08) inset' } : {}}
              className={`bottom-border-input font-mono tracking-wide ${
                error && !selectedRepo ? 'border-b-[#FF3B6B]/60 focus:border-b-[#FF3B6B]/60' : 'border-b-[#00D4FF]/20 focus:border-b-transparent'
              }`}
            />
            <label htmlFor="bot_token" className="floating-label font-sans">
              Telegram Bot Token
            </label>
            <span className="focus-underline"></span>
            <div className="flex items-center justify-between mt-1 text-[10px] text-[#4A6080]">
              <span>Expected format: 123456789:ABCdef...</span>
              <span className="font-mono">Get from @BotFather</span>
            </div>
          </div>

          {/* Script Selection Dropdown */}
          <div className="floating-label-group">
            <select
              id="script_name"
              value={scriptName}
              onChange={(e) => setScriptName(e.target.value)}
              className="bottom-border-input cursor-pointer font-sans appearance-none pr-8 border-b-[#00D4FF]/20 focus:border-b-transparent"
            >
              <option value="movie_bot" className="bg-[#0A1628] text-[#F0F6FF]">Movie Catalog Suggestion Agent (Suggests top cine classics)</option>
              <option value="support_bot" className="bg-[#0A1628] text-[#F0F6FF]">Interactive Customer Support Agent (Saves tickets & FAQ responder)</option>
              <option value="feedback_bot" className="bg-[#0A1628] text-[#F0F6FF]">Feedback & Contact Collector Agent (Records customer reviews)</option>
            </select>
            <label htmlFor="script_name" className="floating-label font-sans">
              Select Script Agent Template
            </label>
            <span className="focus-underline"></span>
            <div className="pointer-events-none absolute right-0 top-3 text-[#00D4FF]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          {error && (
            <p className="text-[11px] text-[#FF3B6B] flex items-center gap-1.5 mt-2 font-sans">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}

          {/* Submit Deploy Button */}
          <button
            type="submit"
            disabled={isLaunching || isFetchingRepos || repos.length === 0}
            className={`w-full py-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all cta-launch-btn flex items-center justify-center gap-2 text-[#F0F6FF] ${
              isLaunching || isFetchingRepos || repos.length === 0
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer hover:scale-[1.01]'
            }`}
          >
            {isLaunching ? (
              <>
                <span className="spinning-arc-loader"></span>
                Writing code files & Triggering GitHub Dispatch daemon...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Deploy Bot 24x7
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
