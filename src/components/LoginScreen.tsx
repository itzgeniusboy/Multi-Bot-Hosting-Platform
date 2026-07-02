import React, { useState, useRef, useEffect } from 'react';
import { Key, Eye, EyeOff, Info, ShieldCheck, Lock, ChevronDown, ChevronUp, Volume2, VolumeX, Sparkles, Bot, Github, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface LoginScreenProps {
  onSaveManualToken: (token: string, userData: any) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];
    const colors = ['rgba(0, 212, 255, 0.12)', 'rgba(124, 58, 237, 0.08)', 'rgba(255, 59, 107, 0.06)'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(0, 212, 255, ${0.04 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export default function LoginScreen({
  onSaveManualToken,
  isMuted,
  onToggleMute,
}: LoginScreenProps) {
  const [pat, setPat] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'401' | '403' | 'network' | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleToggleShowToken = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audio.playClick();
    setShowToken(!showToken);
  };

  // Masking presentation helper: shows first 4 and last 4 characters when blurred, raw value when focused
  const displayValue = !isFocused && pat.length > 8
    ? `${pat.slice(0, 4)}••••••••••••${pat.slice(-4)}`
    : pat;

  // Determine actual password/text field behavior
  // Mask is bypassable if we are not focused (we explicitly show masked string), or if user toggled eye
  const inputType = isFocused && !showToken ? 'password' : 'text';

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    audio.playClick();
    setError(null);
    setErrorType(null);

    const trimmedPat = pat.trim();

    if (!trimmedPat) {
      setError('Please enter your GitHub Personal Access Token.');
      triggerShake();
      return;
    }

    setIsValidating(true);

    try {
      // Validate token on GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${trimmedPat}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.status === 200) {
        const userData = await response.json();
        
        // Retrieve and parse X-OAuth-Scopes to verify permissions
        const scopesHeader = response.headers.get('X-OAuth-Scopes');
        if (scopesHeader !== null) {
          const scopes = scopesHeader.split(',').map((s) => s.trim().toLowerCase());
          const hasRepo = scopes.includes('repo');
          const hasWorkflow = scopes.includes('workflow');
          const hasReadUser = scopes.includes('read:user') || scopes.includes('user');

          if (!hasRepo || !hasWorkflow || !hasReadUser) {
            setError('Token missing required permissions. Please regenerate with repo + workflow + read:user scopes.');
            setErrorType('403');
            triggerShake();
            setIsValidating(false);
            return;
          }
        }

        audio.playSuccess();
        onSaveManualToken(trimmedPat, userData);
      } else if (response.status === 401) {
        setError('Invalid token. Please check and try again.');
        setErrorType('401');
        triggerShake();
      } else if (response.status === 403) {
        setError('Token missing required permissions. Please regenerate with repo + workflow + read:user scopes.');
        setErrorType('403');
        triggerShake();
      } else {
        setError(`Validation failed: Server returned HTTP ${response.status}`);
        triggerShake();
      }
    } catch (err) {
      console.error('Validation network error:', err);
      setError('Connection failed. Check your internet and try again.');
      setErrorType('network');
      triggerShake();
    } finally {
      setIsValidating(false);
    }
  };

  const triggerShake = () => {
    audio.playError();
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="min-h-screen bg-[#050B18] text-[#F0F6FF] font-sans relative flex flex-col justify-center items-center py-8 px-4 overflow-y-auto selection:bg-[#00D4FF]/30 selection:text-[#00D4FF] select-none">
      
      {/* Interactive visual canvas in the background */}
      <ParticleBackground />

      {/* Decorative atmospherics */}
      <div className="noise-overlay pointer-events-none" />
      <div className="absolute top-[15%] right-[8%] w-[350px] h-[350px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-purple-500/3 blur-[120px] rounded-full pointer-events-none" />

      {/* Floating System Mute Controls (Top Right) */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={() => {
            audio.playClick();
            onToggleMute();
          }}
          className="p-2.5 rounded-full border border-[#00D4FF]/10 bg-[#0A1628]/45 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all cursor-pointer flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          title={isMuted ? "Unmute system sounds" : "Mute system sounds"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Glassmorphic Form Card Wrapper */}
      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
        
        {/* App Logo & Brand Header */}
        <div className="flex flex-col items-center text-center gap-2.5 mb-6">
          <div className="relative w-11 h-11 flex items-center justify-center">
            {/* Pulsing visual circles */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#00D4FF]/35 animate-rotate-slow"></div>
            <div className="absolute inset-1.5 bg-[#00D4FF]/5 rounded-full animate-ping opacity-20" />
            <Bot className="w-5.5 h-5.5 text-[#00D4FF]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="font-display font-extrabold text-[15px] tracking-[0.16em] text-white uppercase">
              MULTI-BOT DASHBOARD
            </h1>
            <p className="text-[10px] text-[#4A6080] font-mono tracking-widest uppercase">
              // Continuous Execution Engine
            </p>
          </div>
        </div>

        {/* The Connection Card */}
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full premium-glass-card rounded-2xl p-5 sm:p-8 border border-[#00D4FF]/15 bg-[#0A1628]/70 shadow-[0_25px_65px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col gap-6"
          id="login-card"
        >
          {/* Animated scanner scanning laser line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D4FF]/55 to-transparent animate-pulse"></div>

          <div className="space-y-1">
            <h2 className="text-[14px] font-display font-extrabold text-[#F0F6FF] uppercase tracking-wider">
              Secure PAT Authentication
            </h2>
            <p className="text-[11px] text-[#4A6080] font-sans">
              Enter a Personal Access Token to grant safe local-only browser synchronization.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            
            {/* Custom Interactive Token Input */}
            <motion.div
              animate={isShaking ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`relative flex flex-col gap-1.5 rounded-xl border bg-[#030812]/90 px-3.5 py-2 transition-all ${
                isFocused 
                  ? 'border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.08)]' 
                  : error 
                  ? 'border-rose-500/40' 
                  : 'border-[#00D4FF]/15'
              }`}
            >
              <div className="flex justify-between items-center text-[9px] font-mono tracking-wider uppercase">
                <span className={isFocused ? 'text-[#00D4FF]' : 'text-[#4A6080]'}>// GITHUB PAT TOKEN</span>
                <span className="text-[#4A6080]">SECURE ENCRYPTED</span>
              </div>

              <div className="flex items-center gap-2">
                <Key className={`w-4 h-4 shrink-0 transition-colors ${isFocused ? 'text-[#00D4FF]' : 'text-[#4A6080]'}`} />
                <input
                  type={inputType}
                  placeholder="Paste GitHub Token (ghp_...)"
                  value={displayValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    // If focused, update the underlying token state
                    if (isFocused) {
                      setPat(val);
                    }
                  }}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  className="w-full h-11 bg-transparent border-none outline-none font-mono text-[16px] text-white placeholder-neutral-600 tracking-wide"
                  style={{ fontSize: '16px' }} // Explicitly prevent iOS auto-zoom
                  id="pat-token-input"
                />

                {/* Show/Hide eye toggles */}
                {pat && (
                  <button
                    type="button"
                    onClick={handleToggleShowToken}
                    className="p-1.5 rounded-lg text-[#4A6080] hover:text-[#00D4FF] hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px]"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Inline Error Displays */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="p-3 rounded-lg border border-rose-500/15 bg-rose-500/5 text-rose-400 text-[11px] leading-relaxed font-sans flex items-start gap-2 text-left"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-[9px] tracking-wider text-rose-400">
                      {errorType === '403' ? 'PERMISSION DENIED' : errorType === '401' ? 'AUTHENTICATION FAULT' : 'CONNECTION ERROR'}
                    </p>
                    <p className="text-neutral-300 font-sans">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CONNECT & LOGIN BUTTON */}
            <button
              type="submit"
              disabled={isValidating}
              className="w-full h-[52px] rounded-xl font-display font-extrabold text-xs tracking-widest uppercase transition-all bg-[#00D4FF] text-[#050B18] hover:bg-[#00D4FF]/95 hover:shadow-[0_0_20px_rgba(0,212,255,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              id="connect-login-btn"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#050B18]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  VALIDATING TOKEN...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  CONNECT & LOGIN
                </>
              )}
            </button>
          </form>

          {/* GENERATE TOKEN LINK */}
          <div className="space-y-3 pt-2 border-t border-[#00D4FF]/10 text-center">
            <span className="text-[10px] text-[#4A6080] font-sans block">
              Don't have a token? Generate one instantly:
            </span>
            
            <a
              href="https://github.com/settings/tokens/new?description=MBHP-Bot-Token&scopes=repo,workflow,read:user"
              target="_blank"
              rel="noreferrer"
              onClick={() => audio.playClick()}
              className="w-full h-11 rounded-xl border border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/5 font-display font-extrabold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer select-text shrink-0 min-h-[44px]"
              id="generate-token-link"
            >
              <Github className="w-3.5 h-3.5" />
              Generate Token on GitHub
            </a>

            {/* Permission pills below token button */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-neutral-400">
                <Info className="w-2.5 h-2.5 text-[#00D4FF]" />
                repo
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-neutral-400">
                <Info className="w-2.5 h-2.5 text-[#00D4FF]" />
                workflow
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-neutral-400">
                <Info className="w-2.5 h-2.5 text-[#00D4FF]" />
                read:user
              </span>
            </div>
          </div>

          {/* COLLAPSIBLE INSTRUCTIONS */}
          <div className="border-t border-[#00D4FF]/10 pt-4 flex flex-col">
            <button
              onClick={() => {
                audio.playClick();
                setIsInstructionsExpanded(!isInstructionsExpanded);
              }}
              className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase text-[#00D4FF] hover:text-[#00E5FF] transition-colors cursor-pointer select-none"
              id="instructions-toggle-btn"
            >
              <span>// HOW TO GENERATE TOKEN</span>
              {isInstructionsExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {isInstructionsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 text-[11px] text-neutral-400 leading-relaxed space-y-2 select-text font-sans text-left">
                    <p><strong className="text-[#00D4FF] font-mono">1.</strong> Click <span className="text-white font-semibold">"Generate Token on GitHub"</span> above (log in to GitHub if required).</p>
                    <p><strong className="text-[#00D4FF] font-mono">2.</strong> Verify the permissions checkbox selections are pre-checked (<code className="text-emerald-400">repo</code>, <code className="text-emerald-400">workflow</code>, <code className="text-emerald-400">read:user</code>).</p>
                    <p><strong className="text-[#00D4FF] font-mono">3.</strong> Scroll to the bottom and click the green <span className="text-emerald-400 font-semibold">"Generate token"</span> button.</p>
                    <p><strong className="text-[#00D4FF] font-mono">4.</strong> Copy the generated key starting with <code className="text-white">ghp_...</code> (Important: you will only see this key once!).</p>
                    <p><strong className="text-[#00D4FF] font-mono">5.</strong> Paste the token into the input field above and tap Connect.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </motion.div>

        {/* Security & Local Storage disclaimer below connection card */}
        <p className="mt-5 text-[10px] text-[#4A6080] font-mono leading-relaxed text-center max-w-sm px-4 select-text">
          <Lock className="w-3 h-3 text-[#00D4FF] inline mr-1.5 -mt-0.5" />
          Your token is stored locally on your device only. We never send it to any server. All GitHub API calls are made directly from your browser.
        </p>

      </div>

      {/* Decorative Branding Footer */}
      <footer className="mt-8 relative z-10 text-[10px] text-[#4A6080] font-mono text-center border-t border-neutral-900 w-full max-w-[420px] pt-4 select-text">
        <span>© 2026 MULTI-BOT HOSTING PLATFORM</span>
      </footer>

    </div>
  );
}
