import React, { useState } from 'react';
import { Github, Key, User, Shield, ShieldAlert, Sparkles, Volume2, VolumeX, Terminal, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface LoginScreenProps {
  onConnectGitHub: () => Promise<void>;
  onSaveManualToken: (token: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function LoginScreen({
  onConnectGitHub,
  onSaveManualToken,
  isMuted,
  onToggleMute,
}: LoginScreenProps) {
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  const [username, setUsername] = useState('');
  const [pat, setPat] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    audio.playClick();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPat = pat.trim();

    if (!trimmedUsername) {
      setError('GitHub Username is required.');
      return;
    }
    if (!trimmedPat) {
      setError('Personal Access Token (PAT) is required.');
      return;
    }

    setIsValidating(true);
    try {
      // Direct API call to GitHub to validate token credentials
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${trimmedPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'telegram-bot-backend-onboarding',
        },
      });

      if (!response.ok) {
        throw new Error('Access denied. Please check that your PAT is valid and has proper scopes.');
      }

      const userData = await response.json();
      if (userData.login.toLowerCase() !== trimmedUsername.toLowerCase()) {
        throw new Error(`Credential mismatch: Token is registered to "${userData.login}", but you entered "${trimmedUsername}".`);
      }

      // Successful manual authentication
      audio.playSuccess();
      onSaveManualToken(trimmedPat);
    } catch (err: any) {
      console.error('Manual token authentication error:', err);
      setError(err.message || 'Authentication failed. Please verify your token scopes (repo, workflow).');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-[#F0F6FF] font-sans overflow-hidden relative flex flex-col justify-between p-6 selection:bg-[#00D4FF]/30 selection:text-[#00D4FF]">
      {/* Background Noise and Cosmic Radial Atmospheres */}
      <div className="noise-overlay" />
      
      {/* Glowing colorful nebulas */}
      <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[15%] left-[2%] w-[600px] h-[600px] bg-purple-500/3 blur-[140px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[60%] right-[10%] w-[450px] h-[450px] bg-pink-500/3 blur-[120px] rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* Retro perspective grid background */}
      <div className="perspective-container opacity-30">
        <div className="perspective-grid opacity-20" />
      </div>

      {/* Header with Applet branding */}
      <header className="relative z-10 flex justify-between items-center max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Rotating inner dash ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#00D4FF]/30 animate-rotate-slow"></div>
            {/* Hexagonal logo */}
            <svg className="w-5 h-5 text-[#00D4FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 22 7.5 22 18.5 12 24 2 18.5 2 7.5" />
            </svg>
          </div>
          <span className="font-display font-extrabold text-xs tracking-widest text-[#F0F6FF]">
            MULTI-BOT ENGINE
          </span>
        </div>

        {/* Audio/Mute feedback control */}
        <button
          type="button"
          onClick={() => {
            audio.playClick();
            onToggleMute();
          }}
          className="p-2 rounded-full border border-[#00D4FF]/10 bg-[#0A1628]/40 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all cursor-pointer flex items-center justify-center"
          title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </header>

      {/* Centered Premium Login Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-12">
        <div className="max-w-[1000px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 space-y-6 text-left hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00D4FF]/8 border border-[#00D4FF]/15 rounded-full text-[10px] font-mono tracking-widest text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.06)]">
              <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
              AUTHENTICATION & PROVISIONING STAGE
            </div>

            <h1 className="text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-white leading-tight">
              Access the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#7C3AED] to-[#FF3B6B]">
                Dashboard Terminal
              </span>
            </h1>

            <p className="text-xs text-[#4A6080] font-sans leading-relaxed max-w-md">
              Securely authenticate with your GitHub workspace credentials to orchestrate workflow dispatch engines, synchronize multi-agent Telegram microservices, and deploy real-time routing bots in 24x7 automated runner nodes.
            </p>

            <div className="flex gap-4 items-center">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-[#030812] border border-[#00D4FF]/30 flex items-center justify-center text-[10px] font-mono font-bold text-[#00D4FF]">G</div>
                <div className="w-7 h-7 rounded-full bg-[#030812] border border-[#7C3AED]/30 flex items-center justify-center text-[10px] font-mono font-bold text-[#7C3AED]">T</div>
                <div className="w-7 h-7 rounded-full bg-[#030812] border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono font-bold text-emerald-400">R</div>
              </div>
              <span className="text-[10px] text-[#4A6080] font-mono">
                Encrypted handshakes via official GitHub APIs.
              </span>
            </div>
          </motion.div>

          {/* Right Login Card Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="premium-glass-card corner-accent-line rounded-2xl p-8 relative overflow-hidden shadow-[0_25px_65px_rgba(0,0,0,0.8)] border border-[#00D4FF]/10">
              {/* Animated scanning laser line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent animate-pulse"></div>

              {/* Step indicator tag */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-mono tracking-wider text-[#00D4FF] uppercase">// ONBOARDING PATHWAY</span>
                <span className="text-[9px] font-mono text-[#4A6080] flex items-center gap-1 bg-[#030812]/55 px-2.5 py-1 rounded-md border border-[#00D4FF]/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse"></span>
                  PHASE 1
                </span>
              </div>

              {/* Title Header */}
              <div className="space-y-1 mb-6 text-center lg:text-left">
                <h2 className="text-lg font-display font-bold text-[#F0F6FF]">Connect Workspace</h2>
                <p className="text-xs text-[#4A6080] font-sans">
                  Choose a login path to authorize GitHub repository sync.
                </p>
              </div>

              {/* Tabs for choosing login mode */}
              <div className="flex p-1 rounded-xl bg-[#030812]/90 border border-[#00D4FF]/10 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    setAuthMethod('oauth');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMethod === 'oauth'
                      ? 'bg-gradient-to-r from-[#00D4FF]/10 to-[#7C3AED]/10 border border-[#00D4FF]/20 text-[#F0F6FF] shadow-inner'
                      : 'text-[#4A6080] hover:text-[#F0F6FF]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
                  Secure OAuth
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playClick();
                    setAuthMethod('pat');
                    setError('');
                  }}
                  className={`flex-1 py-2.5 text-[10px] font-sans font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authMethod === 'pat'
                      ? 'bg-gradient-to-r from-[#00D4FF]/10 to-[#7C3AED]/10 border border-[#00D4FF]/20 text-[#F0F6FF] shadow-inner'
                      : 'text-[#4A6080] hover:text-[#F0F6FF]'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Fallback PAT
                </button>
              </div>

              <AnimatePresence mode="wait">
                {authMethod === 'oauth' ? (
                  /* OPTION A: OAuth flow */
                  <motion.div
                    key="oauth"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="py-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-[#00D4FF]/5 rounded-full flex items-center justify-center mx-auto border border-[#00D4FF]/20">
                        <Github className="w-7 h-7 text-[#00D4FF]" />
                      </div>
                      <p className="text-xs text-[#4A6080] font-sans max-w-xs mx-auto leading-relaxed">
                        Redirect to GitHub security portal to grant safe read and write access to your workflow orchestrations and bot repositories.
                      </p>
                    </div>

                    <button
                      onClick={onConnectGitHub}
                      className="w-full py-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:from-[#00E5FF] hover:to-[#8B5CF6] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#00D4FF]/15 cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      <Github className="w-4 h-4" />
                      Continue with GitHub OAuth
                    </button>
                  </motion.div>
                ) : (
                  /* OPTION B: Manual fallback Personal Access Token */
                  <motion.form
                    key="pat"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleManualSubmit}
                    className="space-y-5"
                  >
                    {/* GitHub Username Input */}
                    <div className="floating-label-group">
                      <input
                        type="text"
                        id="login_username"
                        placeholder=" "
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="bottom-border-input font-mono text-xs"
                      />
                      <label htmlFor="login_username" className="floating-label font-sans flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#00D4FF]" /> GitHub Username
                      </label>
                      <span className="focus-underline"></span>
                    </div>

                    {/* GitHub PAT Input */}
                    <div className="floating-label-group">
                      <input
                        type="password"
                        id="login_pat"
                        placeholder=" "
                        value={pat}
                        onChange={(e) => setPat(e.target.value)}
                        className="bottom-border-input font-mono text-xs"
                      />
                      <label htmlFor="login_pat" className="floating-label font-sans flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-[#7C3AED]" /> Personal Access Token (PAT)
                      </label>
                      <span className="focus-underline"></span>
                    </div>

                    {error && (
                      <p className="text-[10px] text-[#FF3B6B] bg-rose-950/15 border border-[#FF3B6B]/25 py-2.5 px-3 rounded-lg flex items-start gap-2 font-sans">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isValidating}
                      className="w-full py-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-gradient-to-r from-[#7C3AED] to-[#FF3B6B] hover:from-[#8B5CF6] hover:to-[#FF5E89] text-white flex items-center justify-center gap-2 shadow-lg shadow-[#7C3AED]/15 cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      {isValidating ? (
                        <>
                          <span className="spinning-arc-loader"></span>
                          VERIFYING INTEGRITY CREDENTIALS...
                        </>
                      ) : (
                        <>
                          <Terminal className="w-4 h-4" />
                          Verify & Inject Token
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Secure note */}
              <div className="mt-6 flex items-center gap-2 justify-center text-[10px] font-mono text-[#4A6080]">
                <Cpu className="w-3 h-3 text-[#00D4FF]" />
                <span>Zero login passwords are required.</span>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto text-center border-t border-[#00D4FF]/5 pt-4 text-[10px] text-[#4A6080] font-mono flex flex-col sm:flex-row sm:justify-between items-center gap-2">
        <span>© 2026 MULTI-BOT PLATFORM INC. RUNNERS DEPLOYED 24x7</span>
        <span className="text-[#00D4FF]/60 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> SECURED BY ENCRYPTED TELEGRAM WEBHOOK BRIDGE
        </span>
      </footer>
    </div>
  );
}
