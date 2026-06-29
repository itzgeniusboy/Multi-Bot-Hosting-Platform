import React, { useState, useEffect, useRef } from 'react';
import OAuthCallback from './components/OAuthCallback';
import LoginScreen from './components/LoginScreen';
import {
  Cpu,
  Server,
  ShieldCheck,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import ThreeHero from './components/ThreeHero';
import CustomCursor from './components/CustomCursor';
import LoadingScreen from './components/LoadingScreen';
import { audio } from './utils/audio';

// Dynamic statistical counter with smooth animation on mount/value change
interface AnimatedCounterProps {
  value: number;
  duration?: number;
}

function AnimatedCounter({ value, duration = 800 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    let start = prevValue.current;
    const end = value;
    if (start === end) {
      setCount(end);
      return;
    }
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress); // EaseOutQuad
      const current = Math.floor(start + eased * (end - start));
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = end;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
}

// Circular Progress Meter Component with IntersectionObserver + requestAnimationFrame
interface CircularProgressProps {
  value: number;
  max?: number;
  label: string;
  unit: string;
  color: string;
}

function CircularProgress({ value, max = 100, label, unit, color }: CircularProgressProps) {
  const [currentVal, setCurrentVal] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 1200; // ms
          const startTime = performance.now();

          const animate = (timestamp: number) => {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = progress * (2 - progress); // easeOutQuad
            setCurrentVal(Math.round(easeProgress * value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  useEffect(() => {
    if (hasAnimated) {
      setCurrentVal(value);
    }
  }, [value]);

  const radius = 45;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentVal / max) * circumference;

  return (
    <div ref={elementRef} className="premium-glass-card rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:border-[#00D4FF]/40 hover:shadow-[0_0_30px_rgba(0,212,255,0.08)]">
      <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>
      
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/25 to-transparent"></div>

      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Decorative rotating ring */}
        <div className="absolute inset-1.5 rounded-full border border-dashed border-[#00D4FF]/5 animate-rotate-slow"></div>
        
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="rgba(0, 212, 255, 0.03)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${color}60)`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-mono font-bold text-[#F0F6FF]">{currentVal}{unit}</span>
        </div>
      </div>
      
      <span className="text-[10px] font-mono tracking-widest text-[#4A6080] uppercase mt-4 text-center">
        {label}
      </span>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // GitHub SaaS OAuth & Repos states
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));

  // System status mock telemetry data
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memoryUsage, setMemoryUsage] = useState(44);
  const [responseTime, setResponseTime] = useState(82);
  const [totalRequests, setTotalRequests] = useState(1482);

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    if (isLoading) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleScrollEvent = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScrollEvent);

    return () => {
      lenis.destroy();
      window.removeEventListener('scroll', handleScrollEvent);
    };
  }, [isLoading]);

  // Telemetry jitter simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 8) + 8);
      setMemoryUsage(Math.floor(Math.random() * 3) + 42);
      setResponseTime(Math.floor(Math.random() * 20) + 75);
      setTotalRequests((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // =========================================================================
  // GITHUB SAAS OAUTH & REGISTRATION HANDLERS
  // =========================================================================
  const handleConnectGitHub = async () => {
    audio.playClick();
    try {
      const response = await fetch('/api/login');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to fetch authorization URL from server.');
      }
      const data = await response.json();
      if (data.url) {
        // Open GitHub OAuth URL directly in popup
        const popup = window.open(data.url, 'github_oauth_popup', 'width=600,height=700');
        if (!popup) {
          throw new Error('Popup blocked! Please allow popups for this site, or open the app in a new tab to continue.');
        }
      } else {
        throw new Error('Authentication endpoint did not return a valid redirection URL.');
      }
    } catch (e: any) {
      console.error('GitHub OAuth redirect construct error:', e);
      throw e;
    }
  };

  const handleDisconnectGitHub = () => {
    audio.playClick();
    localStorage.removeItem('github_token');
    setGithubToken(null);
  };

  const handleSaveManualToken = (token: string) => {
    localStorage.setItem('github_token', token);
    setGithubToken(token);
  };

  // Listen for OAuth success messaging from callback popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('0.0.0.0') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        const token = event.data.token;
        localStorage.setItem('github_token', token);
        setGithubToken(token);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Check URL query parameters for fallback redirect OAuth token exchange
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('github_token', token);
      setGithubToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleToggleMute = () => {
    const status = audio.toggleMute();
    setIsMuted(status);
  };

  const handleTriggerSparkle = () => {
    audio.playSuccess();
    window.dispatchEvent(new Event('test-webhook-triggered'));
  };

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" onComplete={() => setIsLoading(false)} />
      ) : !githubToken ? (
        <LoginScreen
          key="login"
          onConnectGitHub={handleConnectGitHub}
          onSaveManualToken={handleSaveManualToken}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <motion.div 
          key="main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="min-h-screen bg-[#050B18] text-[#F0F6FF] font-sans overflow-x-hidden relative selection:bg-[#00D4FF]/30 selection:text-[#00D4FF]"
        >
          {/* Custom Animated Interactive Cursor */}
          <CustomCursor />

          {/* Background Noise and Cosmic Radial Atmospheres */}
          <div className="noise-overlay" />
          
          {/* Glowing colorful nebulas */}
          <div className="glow-blob w-[500px] h-[500px] top-[10%] right-[5%] bg-cyan-500/10" style={{ animationDelay: '0s' }} />
          <div className="glow-blob w-[600px] h-[600px] bottom-[15%] left-[2%] bg-purple-500/5" style={{ animationDelay: '4s' }} />
          <div className="glow-blob w-[450px] h-[450px] top-[60%] right-[10%] bg-pink-500/5" style={{ animationDelay: '2s' }} />

          {/* Fixed Glassmorphism Floating Navbar */}
          <nav 
            className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full flex items-center justify-between z-50 w-[90%] max-w-[1000px] transition-all duration-300 border ${
              isScrolled 
                ? 'bg-[#0A1628]/80 border-[#00D4FF]/15 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(0,212,255,0.04)] backdrop-blur-md' 
                : 'bg-transparent border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                {/* Rotating inner dash ring */}
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00D4FF]/30 animate-rotate-slow"></div>
                {/* Hexagonal logo */}
                <svg className="w-5 h-5 text-[#00D4FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 22 7.5 22 18.5 12 24 2 18.5 2 7.5" />
                </svg>
              </div>
              <span className="font-display font-extrabold text-xs tracking-widest text-[#F0F6FF] hidden sm:inline-block">
                MULTI-BOT ENGINE
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 text-[11px] font-mono tracking-wider">
              {/* Mute button */}
              <button 
                onClick={handleToggleMute}
                className="p-1.5 rounded-full border border-[#00D4FF]/10 bg-[#0A1628]/40 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all cursor-pointer"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              {/* Sign Out button */}
              <button
                onClick={handleDisconnectGitHub}
                className="transition-all px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer text-[10px] font-mono tracking-wider"
                title="Disconnect your GitHub account and return to login page"
              >
                Sign Out
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <section id="hero" className="relative min-h-screen flex items-center justify-center pt-32 pb-16 overflow-hidden">
            
            {/* Interactive Particle 3D WebGL Canvas */}
            <ThreeHero />

            {/* Subtle retro perspective grid background */}
            <div className="perspective-container">
              <div className="perspective-grid opacity-30" />
            </div>

            <div className="max-w-[1200px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              {/* Hero left text block */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="lg:col-span-7 space-y-8 text-left"
              >
                {/* Visual login test banner */}
                <div className="p-4 rounded-xl border text-xs font-mono flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-cyan-500/20 bg-cyan-500/5 text-cyan-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse bg-cyan-400"></span>
                    <span>
                      <strong>SESSION STATUS:</strong> Authenticated with GitHub.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDisconnectGitHub}
                    className="px-3.5 py-1.5 rounded-lg bg-[#FF3B6B]/15 hover:bg-[#FF3B6B]/25 text-[#FF3B6B] border border-[#FF3B6B]/30 transition-all font-sans font-bold text-[11px] cursor-pointer"
                  >
                    Sign Out / View Login Screen
                  </button>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#00D4FF]/8 border border-[#00D4FF]/15 rounded-full text-[10px] font-mono tracking-widest text-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.06)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
                  SECURE WEBHOOK INTEGRATION LAYER
                </div>
                
                {/* Title with Layered Extrusion */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] neon-extrusion-text">
                  Multi-Bot <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#7C3AED] to-[#FF3B6B]">
                    Hosting Platform
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-[#4A6080] max-w-xl font-sans leading-relaxed">
                  Dynamically route, configure, and simulate secure Telegram Bots in real-time. Mount robust serverless microservices with instant API synchronization and zero configuration latency.
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    onClick={handleTriggerSparkle}
                    className="px-7 py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:scale-[1.03] active:scale-[0.98] transition-all text-xs font-bold font-sans uppercase tracking-wider text-white shadow-lg shadow-[#00D4FF]/25 flex items-center gap-2 magnetic-btn cursor-pointer"
                  >
                    Trigger Particle Pulse
                    <Zap className="w-4 h-4 text-white" />
                  </button>
                  <div className="px-7 py-4 rounded-xl border border-[#00D4FF]/20 bg-[#0A1628]/40 text-xs font-bold font-sans uppercase tracking-wider text-[#F0F6FF] flex items-center">
                    Node status: Active
                  </div>
                </div>
              </motion.div>

              {/* Hero right floating Stat Cards block */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-5 relative h-[420px] hidden lg:block"
              >
                {/* Floating Card 1: Active Nodes */}
                <div 
                  className="absolute top-[5%] left-[5%] w-[270px] premium-glass-card rounded-2xl p-5 border-[#00D4FF]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.04] hover:border-[#00D4FF]/50"
                  style={{ transform: 'perspective(600px) rotateX(10deg) rotateY(-8deg) translateZ(30px)' }}
                >
                  <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-[#00D4FF] to-transparent"></div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider">// PLATFORM STATUS</span>
                    <Server className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white flex items-baseline gap-1">
                    <AnimatedCounter value={3} />
                    <span className="text-[#4A6080] text-sm">/</span>
                    <AnimatedCounter value={3} />
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Active Serverless Nodes Online</p>
                </div>

                {/* Floating Card 2: Total Triggers */}
                <div 
                  className="absolute top-[38%] left-[25%] w-[270px] premium-glass-card rounded-2xl p-5 border-[#7C3AED]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.04] hover:border-[#7C3AED]/50"
                  style={{ transform: 'perspective(600px) rotateX(8deg) rotateY(12deg) translateZ(40px)' }}
                >
                  <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-[#7C3AED] to-transparent"></div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#7C3AED] uppercase tracking-wider">// TRIGGER LOAD</span>
                    <Zap className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    <AnimatedCounter value={totalRequests} />
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Gateway Events Routed</p>
                </div>

                {/* Floating Card 3: Network Response */}
                <div 
                  className="absolute top-[70%] left-[10%] w-[270px] premium-glass-card rounded-2xl p-5 border-emerald-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:scale-[1.04] hover:border-emerald-500/30"
                  style={{ transform: 'perspective(600px) rotateX(-6deg) rotateY(-8deg) translateZ(20px)' }}
                >
                  <div className="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-[#00FF87] to-transparent"></div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#00FF87] uppercase tracking-wider">// EDGE RESPONSE</span>
                    <Cpu className="w-4 h-4 text-[#00FF87]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white flex items-baseline">
                    ~<AnimatedCounter value={responseTime} />
                    <span className="text-xs font-mono font-medium text-emerald-400 ml-1">ms</span>
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Global Routing Latency</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Main Container */}
          <div className="max-w-[1200px] mx-auto px-6 pb-24 relative z-10">
            {/* Minimalist Footer */}
            <footer className="pt-24 border-t border-[#00D4FF]/10 text-center text-[10px] font-mono text-[#4A6080]">
              <p>Multi-Bot Hosting Platform  —  Built on FastAPI & Vercel  —  2026</p>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
