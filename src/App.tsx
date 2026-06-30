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
  Code,
  Plus,
  Trash2,
  ExternalLink,
  Power,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import ThreeHero from './components/ThreeHero';
import CustomCursor from './components/CustomCursor';
import LoadingScreen from './components/LoadingScreen';
import NewProjectModal from './components/NewProjectModal';
import { audio } from './utils/audio';
import { Project } from './types';

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
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/25 to-transparent"></div>

      <div className="relative w-28 h-28 flex items-center justify-center">
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

// Interactive 3D tilt "Add Project" Card
interface AddProjectCardProps {
  onClick: () => void;
}

function AddProjectCard({ onClick }: AddProjectCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    
    const tiltX = (yc - y) / 14;
    const tiltY = (x - xc) / 14;
    
    card.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="premium-glass-card rounded-2xl border-2 border-dashed border-[#00D4FF]/25 hover:border-[#00D4FF]/60 bg-[#0A1628]/35 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[240px] relative overflow-hidden group shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
    >
      <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/0 to-[#7C3AED]/0 group-hover:from-[#00D4FF]/5 group-hover:to-[#7C3AED]/5 transition-all duration-500"></div>

      <div className="p-4 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all duration-300 mb-4">
        <Plus className="w-8 h-8 text-[#00D4FF]" />
      </div>
      <h3 className="text-xs font-display font-extrabold text-white tracking-widest uppercase">
        Import Project
      </h3>
      <p className="text-[10px] text-[#4A6080] mt-2 max-w-[200px] leading-relaxed">
        Connect repository, validate bot token, and deploy serverless python node instantly.
      </p>
    </div>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // GitHub state
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const [repos, setRepos] = useState<any[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Project modal & listings state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [botActionLoading, setBotActionLoading] = useState<string | null>(null);

  // Real data telemetry stats state
  const [stats, setStats] = useState({
    cpu: 1.5,
    memory: 42.0,
    latency: 75,
    totalRequests: 1482,
    activeNodes: 0,
    status: 'healthy'
  });

  // Fetch GitHub User and Repos
  const fetchGitHubUserAndRepos = async (token: string) => {
    setIsFetchingUser(true);
    setIsFetchingRepos(true);
    try {
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

      const reposResp = await fetch(`/api/repos?token=${token}`);
      if (reposResp.ok) {
        const reposData = await reposResp.json();
        setRepos(reposData);
      }
    } catch (err) {
      console.error('Failed to fetch GitHub details:', err);
    } finally {
      setIsFetchingUser(false);
      setIsFetchingRepos(false);
    }
  };

  // Fetch projects and telemetry stats from real data endpoints
  const fetchProjectsAndStats = async () => {
    try {
      const projResp = await fetch('/api/projects');
      if (projResp.ok) {
        const projData = await projResp.json();
        setActiveProjects(projData);
      }

      const statsResp = await fetch('/api/stats');
      if (statsResp.ok) {
        const statsData = await statsResp.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch stats/projects:', err);
    }
  };

  // Sync details on mount or token changes
  useEffect(() => {
    if (githubToken) {
      fetchGitHubUserAndRepos(githubToken);
      fetchProjectsAndStats();
      
      // Pull real-time telemetry every 4 seconds
      const timer = setInterval(fetchProjectsAndStats, 4000);
      return () => clearInterval(timer);
    }
  }, [githubToken]);

  // Smooth Scroll setup
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

  // GitHub Authentication redirects
  const handleConnectGitHub = async () => {
    audio.playClick();
    try {
      const response = await fetch('/api/login');
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error || errData.message || 'Failed to fetch authorization URL from server.';
        alert(`Server Error: ${errMsg}`);
        throw new Error(errMsg);
      }
      const data = await response.json();
      if (data.url) {
        const popup = window.open(data.url, 'github_oauth_popup', 'width=600,height=700');
        if (!popup) {
          const popupBlockedMsg = 'Popup blocked! Please allow popups for this site, or open the app in a new tab to continue.';
          alert(popupBlockedMsg);
          throw new Error(popupBlockedMsg);
        }
      } else {
        const invalidUrlMsg = 'Authentication endpoint did not return a valid redirection URL.';
        alert(invalidUrlMsg);
        throw new Error(invalidUrlMsg);
      }
    } catch (e: any) {
      console.error('GitHub OAuth redirect error:', e);
      throw e;
    }
  };

  const handleDisconnectGitHub = () => {
    audio.playClick();
    localStorage.removeItem('github_token');
    setGithubToken(null);
    setGitHubUser(null);
    setRepos([]);
    setActiveProjects([]);
  };

  const handleSaveManualToken = (token: string) => {
    localStorage.setItem('github_token', token);
    setGithubToken(token);
  };

  // Synchronize callbacks from popup oauth
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

      if (!isAllowedOrigin) return;
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        const token = event.data.token;
        localStorage.setItem('github_token', token);
        setGithubToken(token);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Sync token from direct callback query
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('github_token', token);
      setGithubToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Bot Node Action controls
  const handleStopBot = async (repoName: string) => {
    audio.playClick();
    setBotActionLoading(repoName);
    try {
      const resp = await fetch('/api/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: repoName,
          github_token: githubToken || 'demo_p_token'
        })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
      }
    } catch (err) {
      console.error('Failed to stop bot:', err);
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleStartBot = async (project: Project) => {
    audio.playClick();
    setBotActionLoading(project.repo_name);
    try {
      const resp = await fetch('/api/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: project.repo_name,
          bot_token: project.bot_token,
          script_name: project.script_name,
          github_token: githubToken || 'demo_p_token'
        })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
        window.dispatchEvent(new Event('test-webhook-triggered'));
      }
    } catch (err) {
      console.error('Failed to start bot:', err);
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleDeleteProject = async (repoName: string) => {
    audio.playClick();
    if (!confirm('Are you sure you want to remove this project from your dashboard?')) return;
    setBotActionLoading(repoName);
    try {
      const resp = await fetch('/api/projects/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: repoName })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleToggleMute = () => {
    const status = audio.toggleMute();
    setIsMuted(status);
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
          <CustomCursor />

          {/* Background overlays & WebGL effects */}
          <div className="noise-overlay" />
          <div className="glow-blob w-[500px] h-[500px] top-[10%] right-[5%] bg-cyan-500/10" style={{ animationDelay: '0s' }} />
          <div className="glow-blob w-[600px] h-[600px] bottom-[15%] left-[2%] bg-purple-500/5" style={{ animationDelay: '4s' }} />
          <div className="glow-blob w-[450px] h-[450px] top-[60%] right-[10%] bg-pink-500/5" style={{ animationDelay: '2s' }} />

          {/* Floating Glassmorphism Navbar */}
          <nav 
            className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full flex items-center justify-between z-50 w-[90%] max-w-[1000px] transition-all duration-300 border ${
              isScrolled 
                ? 'bg-[#0A1628]/80 border-[#00D4FF]/15 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(0,212,255,0.04)] backdrop-blur-md' 
                : 'bg-transparent border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00D4FF]/30 animate-rotate-slow"></div>
                <svg className="w-5 h-5 text-[#00D4FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 22 7.5 22 18.5 12 24 2 18.5 2 7.5" />
                </svg>
              </div>
              <span className="font-display font-extrabold text-xs tracking-widest text-[#F0F6FF] hidden sm:inline-block">
                MULTI-BOT ENGINE
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 text-[11px] font-mono tracking-wider">
              <button 
                onClick={handleToggleMute}
                className="p-1.5 rounded-full border border-[#00D4FF]/10 bg-[#0A1628]/40 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all cursor-pointer"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleDisconnectGitHub}
                className="transition-all px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer text-[10px] font-mono tracking-wider font-semibold uppercase"
              >
                Sign Out
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <section id="hero" className="relative min-h-[85vh] flex items-center justify-center pt-32 pb-16 overflow-hidden">
            <ThreeHero />

            <div className="perspective-container">
              <div className="perspective-grid opacity-30" />
            </div>

            <div className="max-w-[1200px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              {/* Hero Left Info */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="lg:col-span-7 space-y-6 text-left"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] neon-extrusion-text">
                  Multi-Bot <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#7C3AED] to-[#FF3B6B]">
                    Hosting Platform
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#4A6080] font-sans max-w-lg leading-relaxed">
                  A high-performance hosting platform to provision and run resilient Telegram Python daemon nodes 24x7. Managed through automated workflow integrations.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      audio.playClick();
                      setIsNewProjectOpen(true);
                    }}
                    className="px-6 py-3.5 rounded-xl bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#050B18] font-sans text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00D4FF]/10"
                  >
                    <Plus className="w-4 h-4" />
                    Deploy New Project
                  </button>
                </div>
              </motion.div>

              {/* Hero Right Metrics (Real Data Wired) */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-5 relative h-[380px] hidden lg:block"
              >
                {/* Floating Card 1: Active Nodes */}
                <div 
                  className="absolute top-[5%] left-[5%] w-[270px] premium-glass-card rounded-2xl p-5 border-[#00D4FF]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.04]"
                  style={{ transform: 'perspective(600px) rotateX(10deg) rotateY(-8deg) translateZ(30px)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider">// SYSTEM STATUS</span>
                    <Server className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white flex items-baseline gap-1">
                    <AnimatedCounter value={stats.activeNodes} />
                    <span className="text-[#4A6080] text-sm">/</span>
                    <AnimatedCounter value={activeProjects.length} />
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Active Serverless Nodes Online</p>
                </div>

                {/* Floating Card 2: Gateway Loads */}
                <div 
                  className="absolute top-[38%] left-[25%] w-[270px] premium-glass-card rounded-2xl p-5 border-[#7C3AED]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.04]"
                  style={{ transform: 'perspective(600px) rotateX(8deg) rotateY(12deg) translateZ(40px)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#7C3AED] uppercase tracking-wider">// TRIGGER LOAD</span>
                    <Zap className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white">
                    <AnimatedCounter value={stats.totalRequests} />
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Gateway Events Routed</p>
                </div>

                {/* Floating Card 3: Network Response */}
                <div 
                  className="absolute top-[70%] left-[10%] w-[270px] premium-glass-card rounded-2xl p-5 border-emerald-500/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.04]"
                  style={{ transform: 'perspective(600px) rotateX(-6deg) rotateY(-8deg) translateZ(20px)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#00FF87] uppercase tracking-wider">// EDGE RESPONSE</span>
                    <Cpu className="w-4 h-4 text-[#00FF87]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white flex items-baseline">
                    ~<AnimatedCounter value={stats.latency} />
                    <span className="text-xs font-mono font-medium text-emerald-400 ml-1">ms</span>
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Global Routing Latency</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Main Dashboard Panel */}
          <div className="max-w-[1200px] mx-auto px-6 pb-24 relative z-10">
            <section id="dashboard-section" className="space-y-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="premium-glass-card rounded-2xl border border-[#00D4FF]/10 bg-[#0A1628]/40 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden"
              >
                <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>

                {/* GitHub Profile Sync Header */}
                <div className="flex flex-col md:flex-row items-center md:justify-between gap-6 pb-8 border-b border-[#00D4FF]/10 mb-10">
                  <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#00D4FF]/30 animate-rotate-slow"></div>
                      <div className="p-1">
                        {gitHubUser?.avatar_url ? (
                          <img
                            src={gitHubUser.avatar_url}
                            alt={gitHubUser.login}
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
                        <h2 className="text-lg font-display font-bold text-white tracking-tight">
                          {gitHubUser?.name || gitHubUser?.login || 'Connecting Developer...'}
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => githubToken && fetchGitHubUserAndRepos(githubToken)}
                      disabled={isFetchingRepos || isFetchingUser}
                      className="p-2.5 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/60 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/35 transition-all cursor-pointer disabled:opacity-40"
                      title="Reload integrations"
                    >
                      <RefreshCw className={`w-4 h-4 ${(isFetchingRepos || isFetchingUser) ? 'animate-spin text-[#00D4FF]' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectGitHub}
                      className="px-4 py-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 transition-all font-mono text-[10px] uppercase tracking-wider cursor-pointer font-bold"
                    >
                      Disconnect Node
                    </button>
                  </div>
                </div>

                {/* Dashboard Metrics Panels (Real Data Wired) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                  <CircularProgress
                    value={stats.cpu}
                    max={100}
                    label="CPU Allocation"
                    unit="%"
                    color="#00D4FF"
                  />
                  <CircularProgress
                    value={stats.memory}
                    max={512}
                    label="Memory Utilization"
                    unit="MB"
                    color="#7C3AED"
                  />
                  <CircularProgress
                    value={stats.latency}
                    max={150}
                    label="System Latency"
                    unit="ms"
                    color="#00FF87"
                  />
                </div>

                {/* Projects Section Grid */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#00D4FF]/5">
                    <h3 className="text-sm font-display font-extrabold text-[#F0F6FF] tracking-wider uppercase">
                      Active Deployment Nodes
                    </h3>
                    <span className="text-[10px] font-mono text-[#00D4FF] font-semibold">
                      {activeProjects.length} Nodes Configured
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add Project Card Button */}
                    <AddProjectCard onClick={() => setIsNewProjectOpen(true)} />

                    {/* Active Deployed Project Cards */}
                    {activeProjects.map((project) => {
                      const isOnline = project.status === 'online';
                      const isLoadingAction = botActionLoading === project.repo_name;

                      return (
                        <div
                          key={project.id}
                          className="premium-glass-card rounded-2xl p-5 border border-[#00D4FF]/10 bg-[#050B18]/40 flex flex-col justify-between min-h-[240px] relative overflow-hidden group hover:border-[#00D4FF]/30 transition-all duration-300"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00D4FF]/5 to-transparent rounded-full filter blur-xl pointer-events-none"></div>

                          <div className="space-y-4">
                            {/* Card status and username line */}
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono text-[#4A6080] tracking-wider truncate max-w-[150px]" title={project.repo_name}>
                                {project.repo_name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-[#4A6080]/40'}`}></span>
                                <span className={`text-[9px] font-mono uppercase font-bold tracking-widest ${isOnline ? 'text-emerald-400' : 'text-[#4A6080]'}`}>
                                  {project.status}
                                </span>
                              </div>
                            </div>

                            {/* Bot Details */}
                            <div className="space-y-1">
                              <a
                                href={`https://t.me/${project.username}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-display font-extrabold text-white hover:text-[#00D4FF] transition-all flex items-center gap-1.5"
                              >
                                @{project.username}
                                <ExternalLink className="w-3.5 h-3.5 text-[#4A6080] group-hover:text-[#00D4FF]" />
                              </a>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-semibold">
                                  {project.script_name.replace('.py', '')}
                                </span>
                              </div>
                            </div>

                            {/* Live Telemetry inside Card */}
                            <div className="pt-3 border-t border-[#00D4FF]/5 grid grid-cols-2 gap-2 font-mono text-[10px]">
                              <div>
                                <span className="text-[#4A6080] block">TRIGGER HIT</span>
                                <span className="text-white font-bold">{project.request_count} times</span>
                              </div>
                              <div>
                                <span className="text-[#4A6080] block">PROVISIONED</span>
                                <span className="text-white">
                                  {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick controls bar */}
                          <div className="flex items-center gap-2 pt-4 border-t border-[#00D4FF]/5">
                            {isOnline ? (
                              <button
                                onClick={() => handleStopBot(project.repo_name)}
                                disabled={isLoadingAction}
                                className="flex-1 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 font-mono text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                              >
                                {isLoadingAction ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                                ) : (
                                  <>
                                    <Power className="w-3 h-3" />
                                    Stop Node
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartBot(project)}
                                disabled={isLoadingAction}
                                className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-mono text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                              >
                                {isLoadingAction ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                                ) : (
                                  <>
                                    <Play className="w-3 h-3 fill-current" />
                                    Start Node
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteProject(project.repo_name)}
                              disabled={isLoadingAction}
                              className="p-2 rounded-xl border border-rose-500/15 text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer disabled:opacity-40"
                              title="Delete project from dashboard"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </section>

            <footer className="pt-24 border-t border-[#00D4FF]/10 text-center text-[10px] font-mono text-[#4A6080]">
              <p>Multi-Bot Hosting Platform  —  Built on Express & Vercel-style Actions  —  2026</p>
            </footer>
          </div>

          {/* Vercel-Style Integration Multi-Step Wizard Modal */}
          <NewProjectModal
            isOpen={isNewProjectOpen}
            onClose={() => setIsNewProjectOpen(false)}
            repos={repos}
            isFetchingRepos={isFetchingRepos}
            githubToken={githubToken || 'demo_github_token'}
            onDeploySuccess={fetchProjectsAndStats}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
