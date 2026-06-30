import React, { useState, useEffect, useRef } from 'react';
import OAuthCallback from './components/OAuthCallback';
import LoginScreen from './components/LoginScreen';
import {
  Cpu,
  Server,
  ShieldCheck,
  Volume2,
  VolumeX,
  Zap,
  Github,
  Bot,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Code
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
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Form states
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [botToken, setBotToken] = useState<string>('');
  const [selectedScript, setSelectedScript] = useState<string>('movie_bot.py');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);
  const [deployError, setDeployError] = useState<string>('');

  // Fetch GitHub User and Repos
  const fetchGitHubUserAndRepos = async (token: string) => {
    setIsFetchingUser(true);
    setIsFetchingRepos(true);
    try {
      if (token.startsWith('mock_sandbox_') || token.startsWith('demo_')) {
        const mockUser = {
          login: 'sandbox-user',
          name: 'Sandbox Developer',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          html_url: 'https://github.com',
        };
        setGitHubUser(mockUser);

        // Fetch repos
        const reposResp = await fetch(`/api/repos?token=${token}`);
        if (reposResp.ok) {
          const reposData = await reposResp.json();
          setRepos(reposData);
          if (reposData.length > 0) {
            setSelectedRepo(reposData[0].full_name || reposData[0].name || '');
          }
        }
        return;
      }

      // 1. Fetch user profile
      const userResp = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });
      if (userResp.ok) {
        const userData = await userResp.json();
        setGitHubUser(userData);
      }

      // 2. Fetch repos
      const reposResp = await fetch(`/api/repos?token=${token}`);
      if (reposResp.ok) {
        const reposData = await reposResp.json();
        setRepos(reposData);
        if (reposData.length > 0) {
          setSelectedRepo(reposData[0].full_name || reposData[0].name || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch GitHub details:', err);
    } finally {
      setIsFetchingUser(false);
      setIsFetchingRepos(false);
    }
  };

  // Sync details on mount or token changes
  useEffect(() => {
    if (githubToken) {
      fetchGitHubUserAndRepos(githubToken);
    }
  }, [githubToken]);

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
    setGitHubUser(null);
    setRepos([]);
    setSelectedRepo('');
    setBotToken('');
    setDeployResult(null);
    setDeployError('');
  };

  const handleDeployBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !botToken || !selectedScript || !githubToken) {
      setDeployError('Please complete all form fields.');
      return;
    }
    setIsDeploying(true);
    setDeployResult(null);
    setDeployError('');
    audio.playClick();

    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_name: selectedRepo,
          bot_token: botToken,
          script_name: selectedScript,
          github_token: githubToken,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDeployResult(data);
        audio.playSuccess();
        // Trigger particle pulse animation
        window.dispatchEvent(new Event('test-webhook-triggered'));
      } else {
        setDeployError(data.message || data.detail || 'Deployment failed. Please check your token & workflow permissions.');
      }
    } catch (err: any) {
      setDeployError(err.message || 'Failed to connect to deployment gateway.');
    } finally {
      setIsDeploying(false);
    }
  };

  const handleSaveManualToken = (token: string) => {
    localStorage.setItem('github_token', token);
    setGithubToken(token);
  };

  // Listen for OAuth success messaging from callback popup
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      const isAllowedOrigin = 
        origin.endsWith('.run.app') || 
        origin.endsWith('.vercel.app') || 
        origin.includes('localhost') || 
        origin.includes('0.0.0.0') || 
        origin.includes('127.0.0.1') ||
        origin === window.location.origin;

      if (!isAllowedOrigin) {
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
            {/* Dashboard Section */}
            <section id="dashboard-section" className="pt-8 pb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="premium-glass-card rounded-2xl border border-[#00D4FF]/10 bg-[#0A1628]/40 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden group transition-all duration-300 hover:border-[#00D4FF]/25"
                style={{ transform: 'perspective(1000px)' }}
              >
                {/* Visual grid layout decoration inside card */}
                <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00D4FF]/5 to-transparent rounded-full filter blur-3xl pointer-events-none"></div>

                {/* GitHub Profile Header */}
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-6 pb-8 border-b border-[#00D4FF]/10 mb-8 relative z-10">
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                    <div className="relative">
                      {/* Avatar container with rotating border animation */}
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00D4FF]/30 animate-rotate-slow"></div>
                      <div className="p-1">
                        {gitHubUser?.avatar_url ? (
                          <img
                            src={gitHubUser.avatar_url}
                            alt={gitHubUser.login || 'GitHub User'}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-full border border-[#00D4FF]/20 object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full border border-[#00D4FF]/20 bg-[#050B18] flex items-center justify-center">
                            {isFetchingUser ? (
                              <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
                            ) : (
                              <Github className="w-7 h-7 text-[#4A6080]" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#050B18]"></span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <h2 className="text-xl font-display font-bold text-white tracking-tight">
                          {gitHubUser?.name || gitHubUser?.login || 'Connecting GitHub...'}
                        </h2>
                        {gitHubUser?.login && (
                          <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                            CONNECTED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#4A6080] font-sans">
                        {gitHubUser?.bio || gitHubUser?.html_url || 'Active developer session synchronized.'}
                      </p>
                      {gitHubUser?.public_repos !== undefined && (
                        <p className="text-[10px] font-mono text-cyan-400">
                          Repositories available: {gitHubUser.public_repos} public
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => githubToken && fetchGitHubUserAndRepos(githubToken)}
                      disabled={isFetchingRepos || isFetchingUser}
                      className="p-2.5 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/60 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/35 transition-all cursor-pointer disabled:opacity-40"
                      title="Reload repositories"
                    >
                      <RefreshCw className={`w-4 h-4 ${(isFetchingRepos || isFetchingUser) ? 'animate-spin text-[#00D4FF]' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGitHub}
                      className="px-4 py-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition-all font-mono text-[10px] uppercase tracking-wider cursor-pointer"
                    >
                      Disconnect Node
                    </button>
                  </div>
                </div>

                {/* Deployment Form */}
                <form onSubmit={handleDeployBot} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Repository Selector Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-[#00D4FF]" />
                        1. Target GitHub Repository
                      </label>
                      <div className="relative">
                        {isFetchingRepos ? (
                          <div className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 rounded-xl px-4 py-3.5 text-xs text-[#4A6080] flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 text-[#00D4FF] animate-spin" />
                            <span>Retrieving repositories from GitHub API...</span>
                          </div>
                        ) : (
                          <select
                            value={selectedRepo}
                            onChange={(e) => setSelectedRepo(e.target.value)}
                            required
                            className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl px-4 py-3.5 text-xs text-[#F0F6FF] font-mono outline-none transition-all cursor-pointer"
                          >
                            {repos.length === 0 ? (
                              <option value="">No repositories found</option>
                            ) : (
                              repos.map((repo) => (
                                <option key={repo.id || repo.full_name} value={repo.full_name}>
                                  {repo.full_name} {repo.private ? '🔒' : '🌐'}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                      </div>
                      <p className="text-[10px] text-[#4A6080] font-sans">
                        Select the repository where the loop runner & Python bot agent files will be injected.
                      </p>
                    </div>

                    {/* Script Selector Dropdown */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-[#7C3AED]" />
                        2. Python Bot Script Template
                      </label>
                      <select
                        value={selectedScript}
                        onChange={(e) => setSelectedScript(e.target.value)}
                        required
                        className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-xl px-4 py-3.5 text-xs text-[#F0F6FF] font-mono outline-none transition-all cursor-pointer"
                      >
                        <option value="movie_bot.py">movie_bot.py (Movie catalog suggestions agent)</option>
                        <option value="management_bot.py">management_bot.py (Customer support ticketing & management agent)</option>
                      </select>
                      <p className="text-[10px] text-[#4A6080] font-sans">
                        Choose the pre-built functional template to host. Both support auto-polling on actions.
                      </p>
                    </div>
                  </div>

                  {/* Telegram Bot Token Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A6080] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#FF3B6B]" />
                      3. Telegram Bot Token
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ..."
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        required
                        className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#FF3B6B] focus:ring-1 focus:ring-[#FF3B6B] rounded-xl px-4 py-3.5 pl-11 text-xs text-[#F0F6FF] font-mono outline-none transition-all placeholder:text-[#4A6080]"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <Bot className="w-4 h-4 text-[#FF3B6B]" />
                      </div>
                    </div>
                    <p className="text-[10px] text-[#4A6080] font-sans">
                      Token provided by Telegram's @BotFather when creating a new bot. Keep this strictly confidential.
                    </p>
                  </div>

                  {/* Feedback Status / Error Messages */}
                  {deployError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs flex items-start gap-2.5 font-sans"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <div>
                        <strong className="font-bold">Deployment Interrupted:</strong> {deployError}
                      </div>
                    </motion.div>
                  )}

                  {deployResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 font-sans"
                    >
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                        <div>
                          <strong className="font-bold text-white block mb-0.5 text-sm uppercase tracking-wider">SYSTEM ACTIVE</strong>
                          <p className="text-[#4A6080] text-xs leading-relaxed">
                            {deployResult.message}
                          </p>
                          <div className="mt-2 space-y-1 font-mono text-[11px] text-[#4A6080]">
                            <div>Target Repository: <span className="text-white">{deployResult.repo_name}</span></div>
                            <div>Bot Username: <span className="text-cyan-400">@{deployResult.username}</span></div>
                            <div>Template Deployed: <span className="text-purple-400">{deployResult.bot_type}</span></div>
                          </div>
                        </div>
                      </div>
                      <a
                        href={`https://t.me/${deployResult.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 active:scale-95 transition-all text-xs font-bold font-sans uppercase tracking-wider text-white text-center inline-block"
                      >
                        Launch Telegram Agent
                      </a>
                    </motion.div>
                  )}

                  {/* Action Deploy Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isDeploying || isFetchingRepos}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:opacity-95 active:scale-[0.99] transition-all text-xs font-bold font-sans uppercase tracking-widest text-white shadow-lg shadow-[#00D4FF]/15 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          PROVISIONING CORE WORKFLOWS...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-white" />
                          IMPORT & DEPLOY NODE
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </section>

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
