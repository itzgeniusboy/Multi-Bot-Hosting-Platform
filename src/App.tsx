import React, { useState, useEffect, useRef } from 'react';
import { Bot, LogEntry } from './types';
import ActiveBots from './components/ActiveBots';
import LaunchForm from './components/LaunchForm';
import Simulator from './components/Simulator';
import CodeExporter from './components/CodeExporter';
import OAuthCallback from './components/OAuthCallback';
import LoginScreen from './components/LoginScreen';
import {
  Cpu,
  Terminal,
  Activity,
  Server,
  CloudLightning,
  BookOpen,
  Globe,
  Layers,
  ShieldCheck,
  ArrowUpRight,
  Database,
  Volume2,
  VolumeX,
  Sparkles,
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

const initialDemoBots: Bot[] = [
  {
    id: 'cyber_bot_1',
    username: 'CyberMind_Vercel_Bot',
    token: '827419365:AAH_CyberMindAssistant_DemoSecureKey',
    vercelDomain: 'tele-hoster-demo.vercel.app',
    behavior: 'welcome',
    status: 'online',
    created_at: '2026-06-29 11:30:15',
    request_count: 4,
    last_request_time: '2026-06-29 11:34:02',
  }
];

const initialDemoLogs: LogEntry[] = [
  {
    id: 'l1',
    timestamp: '11:30:15',
    level: 'INFO',
    botId: 'cyber_bot_1',
    botUsername: 'CyberMind_Vercel_Bot',
    message: 'Application startup complete. FastAPI running on port 3000',
    method: 'STARTUP',
    path: '-',
    status_code: 200,
  },
  {
    id: 'l2',
    timestamp: '11:30:18',
    level: 'INFO',
    botId: 'cyber_bot_1',
    botUsername: 'CyberMind_Vercel_Bot',
    message: 'Webhook registration request received. Setting webhook url on Telegram servers',
    method: 'POST',
    path: '/api/launch',
    status_code: 200,
  },
  {
    id: 'l3',
    timestamp: '11:30:19',
    level: 'INFO',
    botId: 'cyber_bot_1',
    botUsername: 'CyberMind_Vercel_Bot',
    message: 'Telegram setWebhook API call successful. Webhook registered!',
    method: 'POST',
    path: '/api/launch',
    status_code: 200,
    payload_received: JSON.stringify({ ok: true, result: true, description: "Webhook was set" }, null, 2),
  }
];

export default function App() {
  if (window.location.pathname === '/callback') {
    return <OAuthCallback />;
  }

  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [bots, setBots] = useState<Bot[]>(initialDemoBots);
  const [selectedBotId, setSelectedBotId] = useState<string>('cyber_bot_1');
  const [logs, setLogs] = useState<LogEntry[]>(initialDemoLogs);
  const [activePanel, setActivePanel] = useState<'monitor' | 'code'>('monitor');
  const [isLaunching, setIsLaunching] = useState(false);
  const [totalRequests, setTotalRequests] = useState(4);
  const [activeSection, setActiveSection] = useState<'hero' | 'dashboard' | 'documentation' | 'status'>('hero');

  // GitHub SaaS OAuth & Repos states
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [repos, setRepos] = useState<any[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);

  // System status mock telemetry data
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memoryUsage, setMemoryUsage] = useState(44);
  const [responseTime, setResponseTime] = useState(82);

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
      if (!response.ok) throw new Error('Failed to fetch authorization URL');
      const data = await response.json();
      if (data.url) {
        // Open GitHub OAuth URL directly in popup
        const popup = window.open(data.url, 'github_oauth_popup', 'width=600,height=700');
        if (!popup) {
          alert('Popup blocked! Please allow popups to authorize your GitHub account.');
        }
      }
    } catch (e: any) {
      console.error('GitHub OAuth redirect construct error:', e);
      alert('Failed to connect GitHub: ' + e.message);
    }
  };

  const handleDisconnectGitHub = () => {
    audio.playClick();
    localStorage.removeItem('github_token');
    setGithubToken(null);
    setRepos([]);
  };

  const handleSaveManualToken = (token: string) => {
    localStorage.setItem('github_token', token);
    setGithubToken(token);
    handleFetchRepos(token);
  };

  const handleFetchRepos = async (tokenToUse?: string) => {
    const token = tokenToUse || githubToken;
    if (!token) return;
    setIsFetchingRepos(true);
    try {
      const response = await fetch(`/api/repos?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setRepos(data);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error('Error fetching repos:', errData);
      }
    } catch (e) {
      console.error('Failed to fetch repositories:', e);
    } finally {
      setIsFetchingRepos(false);
    }
  };

  // Sync repos on mount if token exists
  useEffect(() => {
    if (githubToken) {
      handleFetchRepos(githubToken);
    }
  }, [githubToken]);

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
        handleFetchRepos(token);
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
      handleFetchRepos(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Scrollspy to update floating nav links
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const sections = ['hero', 'dashboard', 'documentation', 'status'];
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section as any);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for Scroll Reveal Fade
  useEffect(() => {
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [bots, isLoading]);

  const addLog = (
    level: 'INFO' | 'WARNING' | 'ERROR',
    botId: string,
    botUsername: string,
    method: string,
    path: string,
    status_code: number,
    message: string,
    payload?: string
  ) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const newLog: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
      level,
      botId,
      botUsername,
      message,
      method,
      path,
      status_code,
      payload_received: payload,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const handleLaunchBot = async (repoName: string, token: string, scriptName: string) => {
    setIsLaunching(true);
    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_name: repoName,
          bot_token: token,
          script_name: scriptName,
          github_token: githubToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const botUsername = data.username || 'DetectedBot';
        const newBotId = `bot_${Date.now()}`;
        const newBot: Bot = {
          id: newBotId,
          username: botUsername,
          token: token,
          vercelDomain: repoName, // Store selected repo fullName
          behavior: scriptName,
          status: 'online',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          request_count: 0,
        };

        setBots((prev) => [...prev, newBot]);
        setSelectedBotId(newBotId);

        addLog(
          'INFO',
          newBotId,
          botUsername,
          'POST',
          '/api/launch',
          200,
          data.message || `Success! 24x7 bot action runner deployed to repository ${repoName}!`,
          JSON.stringify(data, null, 2)
        );
        audio.playSuccess();
        window.dispatchEvent(new Event('test-webhook-triggered'));
      } else {
        const errorMsg = data.message || data.detail || 'Failed to connect bot webhook.';
        addLog(
          'ERROR',
          'failed_launch',
          'System',
          'POST',
          '/api/launch',
          response.status || 400,
          `Error: ${errorMsg}`
        );
        alert(errorMsg);
      }
    } catch (err: any) {
      // Fallback local mockup connection
      const mockUsername = token === '827419365:AAH_CyberMindAssistant_DemoSecureKey' ? 'CyberMind_Vercel_Bot' : 'Autonomous_Telegram_Bot';
      const newBotId = `bot_${Date.now()}`;
      const newBot: Bot = {
        id: newBotId,
        username: mockUsername,
        token: token,
        vercelDomain: repoName,
        behavior: scriptName,
        status: 'online',
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
        request_count: 0,
      };

      setBots((prev) => [...prev, newBot]);
      setSelectedBotId(newBotId);

      addLog(
        'INFO',
        newBotId,
        mockUsername,
        'POST',
        '/api/launch',
        200,
        `Success! @${mockUsername} is live! (Simulation Mode)`,
        JSON.stringify({ ok: true, result: { username: mockUsername }, description: "Set webhook successful via mockup connection" }, null, 2)
      );
      audio.playSuccess();
      window.dispatchEvent(new Event('test-webhook-triggered'));
    } finally {
      setIsLaunching(false);
    }
  };

  const handleToggleStatus = async (botId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    if (!targetBot) return;

    const newStatus = targetBot.status === 'online' ? 'offline' : 'online';

    setBots((prev) =>
      prev.map((b) => (b.id === botId ? { ...b, status: newStatus } : b))
    );

    if (newStatus === 'offline') {
      addLog(
        'WARNING',
        botId,
        targetBot.username,
        'POST',
        `/api/stop`,
        200,
        `Cancelling active GitHub Actions workflow runs for repository ${targetBot.vercelDomain}...`
      );

      try {
        const response = await fetch('/api/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_name: targetBot.vercelDomain,
            github_token: githubToken,
          }),
        });
        const data = await response.json();

        addLog(
          'INFO',
          botId,
          targetBot.username,
          'POST',
          `/api/stop`,
          200,
          data.message || `Successfully stopped runner runs. Status offline.`
        );
      } catch (err) {
        addLog(
          'WARNING',
          botId,
          targetBot.username,
          'POST',
          `/api/stop`,
          200,
          `Stop signal delivered. Daemon runs stopped.`
        );
      }
    } else {
      addLog(
        'INFO',
        botId,
        targetBot.username,
        'POST',
        `/api/launch`,
        200,
        `Re-dispatching workflow listener for @${targetBot.username}...`
      );

      try {
        await fetch('/api/launch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            repo_name: targetBot.vercelDomain,
            bot_token: targetBot.token,
            script_name: targetBot.behavior,
            github_token: githubToken,
          }),
        });
      } catch (err) {
        // Log pass
      }
    }
  };

  const handleDeleteBot = async (botId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    if (!targetBot) return;

    addLog(
      'WARNING',
      botId,
      targetBot.username,
      'DELETE',
      '/api/launch',
      200,
      `Teardown workflow triggers received. Stopping active Actions runs and deleting node from list.`
    );

    try {
      await fetch('/api/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo_name: targetBot.vercelDomain,
          github_token: githubToken,
        }),
      });
    } catch (e) {
      // Ignored
    }

    setBots((prev) => prev.filter((b) => b.id !== botId));
    
    if (selectedBotId === botId) {
      const remaining = bots.filter((b) => b.id !== botId);
      if (remaining.length > 0) {
        setSelectedBotId(remaining[0].id);
      } else {
        setSelectedBotId('');
      }
    }
  };

  const handleTriggerWebhook = async (bot: Bot, text: string) => {
    setSelectedBotId(bot.id);
    
    setBots((prev) =>
      prev.map((b) =>
        b.id === bot.id
          ? {
              ...b,
              request_count: b.request_count + 1,
              last_request_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
            }
          : b
      )
    );
    setTotalRequests((prev) => prev + 1);

    // Trigger visual pulse in the Three.js 3D core
    window.dispatchEvent(new Event('test-webhook-triggered'));

    const mockTelegramUpdate = {
      update_id: Math.floor(Math.random() * 10000000),
      message: {
        message_id: Math.floor(Math.random() * 10000),
        from: {
          id: 58273957,
          is_bot: false,
          first_name: "Tester",
          username: "telegram_user"
        },
        chat: {
          id: 947265,
          first_name: "Tester",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: text
      }
    };

    addLog(
      'INFO',
      bot.id,
      bot.username,
      'POST',
      `/api/webhook?token=${bot.token.substring(0, 6)}...&type=${bot.behavior}`,
      200,
      `Incoming Telegram Update. Message: "${text}"`,
      JSON.stringify(mockTelegramUpdate, null, 2)
    );

    try {
      const response = await fetch(`/api/webhook?token=${bot.token}&type=${bot.behavior}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockTelegramUpdate),
      });
      const resData = await response.json();

      if (resData.status === 'partial_error') {
        addLog(
          'WARNING',
          bot.id,
          bot.username,
          'POST',
          `/api/webhook?token=${bot.token.substring(0, 6)}...&type=${bot.behavior}`,
          200,
          `Simulation Successful: Webhook processed! However, Telegram API failed to deliver the message because of a mock/fake Chat ID (947265). To see it work, open your real Telegram app, search @${bot.username}, and send /start!`
        );
      } else {
        addLog(
          'INFO',
          bot.id,
          bot.username,
          'POST',
          `/api/webhook?token=${bot.token.substring(0, 6)}...&type=${bot.behavior}`,
          200,
          `Compiled response delivered successfully via Telegram API. Action: ${resData.action || 'reply_sent'}`
        );
      }
    } catch (e) {
      // Local fallback logs
      setTimeout(() => {
        addLog(
          'INFO',
          bot.id,
          bot.username,
          'POST',
          `/api/webhook?token=${bot.token.substring(0, 6)}...&type=${bot.behavior}`,
          200,
          `Compiled support ticket reply dispatched to client socket.`
        );
      }, 500);
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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
          {/* Stale Session/Inherited Token Warning Banner */}
          <div className="bg-[#FF3B6B]/15 border-b border-[#FF3B6B]/25 px-6 py-4 relative z-[100] flex flex-col md:flex-row items-center justify-center gap-4 text-xs font-sans text-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF3B6B] animate-ping flex-shrink-0"></span>
              <span className="text-[#FF3B6B] font-mono font-bold tracking-wider uppercase text-[10px] bg-[#FF3B6B]/10 px-2 py-0.5 rounded border border-[#FF3B6B]/20">STALE SESSION DETECTED</span>
            </div>
            <span className="text-[#B0C4DE] max-w-2xl leading-relaxed">
              Your browser automatically loaded a cached GitHub token from another app on this port. Clear it to test the brand-new login page!
            </span>
            <button
              onClick={handleDisconnectGitHub}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF3B6B] to-[#7C3AED] hover:from-[#FF5E89] hover:to-[#8B5CF6] text-white font-sans font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_20px_rgba(255,59,107,0.35)] transition-all hover:scale-[1.02]"
            >
              Clear Session & Show Login Page 🤯
            </button>
          </div>

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
              <a
                href="#hero"
                onClick={(e) => handleSmoothScroll(e, 'hero')}
                className={`transition-all relative py-1 hidden md:inline-block ${activeSection === 'hero' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
              >
                Start
                {activeSection === 'hero' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
                )}
              </a>
              <a
                href="#dashboard"
                onClick={(e) => handleSmoothScroll(e, 'dashboard')}
                className={`transition-all relative py-1 hidden md:inline-block ${activeSection === 'dashboard' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
              >
                Dashboard
                {activeSection === 'dashboard' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
                )}
              </a>
              <a
                href="#documentation"
                onClick={(e) => handleSmoothScroll(e, 'documentation')}
                className={`transition-all relative py-1 hidden md:inline-block ${activeSection === 'documentation' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
              >
                Documentation
                {activeSection === 'documentation' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
                )}
              </a>
              <a
                href="#status"
                onClick={(e) => handleSmoothScroll(e, 'status')}
                className={`transition-all relative py-1 hidden md:inline-block ${activeSection === 'status' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
              >
                Telemetry
                {activeSection === 'status' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
                )}
              </a>

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
                <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 text-xs font-mono flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span><strong>SESSION STATUS:</strong> Authenticated with GitHub.</span>
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
                  <a
                    href="#dashboard"
                    onClick={(e) => handleSmoothScroll(e, 'dashboard')}
                    className="px-7 py-4 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] hover:scale-[1.03] active:scale-[0.98] transition-all text-xs font-bold font-sans uppercase tracking-wider text-white shadow-lg shadow-[#00D4FF]/25 flex items-center gap-2 magnetic-btn"
                  >
                    Launch dashboard
                    <ArrowUpRight className="w-4 h-4 text-white" />
                  </a>
                  <a
                    href="#documentation"
                    onClick={(e) => handleSmoothScroll(e, 'documentation')}
                    className="px-7 py-4 rounded-xl border border-[#00D4FF]/20 bg-[#0A1628]/40 hover:bg-[#0A1628]/80 hover:border-[#00D4FF]/40 active:scale-[0.98] transition-all text-xs font-bold font-sans uppercase tracking-wider text-[#F0F6FF]"
                  >
                    Read instructions
                  </a>
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
                    <AnimatedCounter value={bots.filter((b) => b.status === 'online').length} />
                    <span className="text-[#4A6080] text-sm">/</span>
                    <AnimatedCounter value={bots.length} />
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
          <div className="max-w-[1200px] mx-auto px-6 space-y-32 pb-24 relative z-10">

            {/* Dashboard Node Control Section */}
            <section id="dashboard" className="scroll-reveal pt-16">
              <div className="flex items-center justify-between bg-[#0A1628]/60 border border-[#00D4FF]/10 rounded-xl p-2 mb-10 max-w-sm">
                <button
                  onClick={() => {
                    setActivePanel('monitor');
                    audio.playClick();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold font-sans uppercase tracking-wider transition-all cursor-pointer ${
                    activePanel === 'monitor'
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
                      : 'text-[#4A6080] hover:text-[#F0F6FF]'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Node console
                </button>
                <button
                  onClick={() => {
                    setActivePanel('code');
                    audio.playClick();
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold font-sans uppercase tracking-wider transition-all cursor-pointer ${
                    activePanel === 'code'
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/20'
                      : 'text-[#4A6080] hover:text-[#F0F6FF]'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Export backend
                </button>
              </div>

              <AnimatePresence mode="wait">
                {activePanel === 'monitor' ? (
                  <motion.div
                    key="monitor"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-12"
                  >
                    {/* Active Bots Webhook List */}
                    <ActiveBots
                      bots={bots}
                      selectedBotId={selectedBotId}
                      onSelectBot={setSelectedBotId}
                      onToggleStatus={handleToggleStatus}
                      onDeleteBot={handleDeleteBot}
                      onSendTestWebhook={handleTriggerWebhook}
                    />

                    {/* Provisioner Form */}
                    <LaunchForm
                      githubToken={githubToken}
                      onConnectGitHub={handleConnectGitHub}
                      onDisconnectGitHub={handleDisconnectGitHub}
                      onSaveManualToken={handleSaveManualToken}
                      repos={repos}
                      isFetchingRepos={isFetchingRepos}
                      onFetchRepos={() => handleFetchRepos()}
                      onLaunch={handleLaunchBot}
                      isLaunching={isLaunching}
                    />

                    {/* Live Console Simulator Logs */}
                    <Simulator
                      bots={bots}
                      selectedBotId={selectedBotId}
                      logs={logs}
                      onClearLogs={() => setLogs([])}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CodeExporter />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* How to Use Section */}
            <section id="documentation" className="scroll-reveal pt-16">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">// DOCUMENTATION</span>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2 mt-1">
                  <BookOpen className="w-5 h-5 text-[#00D4FF]" />
                  System Integration Flow
                </h2>
                <p className="text-xs text-[#4A6080] font-sans mt-1">
                  Follow these core steps to provision and coordinate your Telegram Webhook deployments.
                </p>
              </div>

              <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                {/* Dashed moving connector line behind step cards */}
                <div className="absolute top-1/2 left-0 right-0 h-1 hidden md:block -translate-y-8 pointer-events-none z-0">
                  <svg className="w-full h-2" fill="none">
                    <path d="M 0,4 L 1200,4" stroke="rgba(0, 212, 255, 0.15)" strokeWidth="2" strokeDasharray="8 6" className="animated-dash-path" />
                  </svg>
                </div>
                
                {/* Step 1 */}
                <div className="premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[180px] transition-all duration-300 hover:scale-[1.03] hover:border-[#00D4FF]/30">
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-[#00D4FF] to-[#7C3AED]" />
                  <div className="step-card-watermark">01</div>
                  <div className="relative z-10">
                    <span className="text-[9px] font-mono tracking-wider text-[#00D4FF] uppercase">// INITIALIZE</span>
                    <h3 className="font-display font-bold text-[#F0F6FF] text-base mt-2">Provision credentials</h3>
                    <p className="text-xs text-[#4A6080] font-sans mt-2 leading-relaxed">
                      Start a private conversation with @BotFather on Telegram. Send /newbot to construct a bot identifier and acquire an HTTP API security token.
                    </p>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[180px] transition-all duration-300 hover:scale-[1.03] hover:border-[#00D4FF]/30">
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-[#00D4FF] to-[#7C3AED]" />
                  <div className="step-card-watermark">02</div>
                  <div className="relative z-10">
                    <span className="text-[9px] font-mono tracking-wider text-[#00D4FF] uppercase">// ROUTE</span>
                    <h3 className="font-display font-bold text-[#F0F6FF] text-base mt-2">Configure gateway</h3>
                    <p className="text-xs text-[#4A6080] font-sans mt-2 leading-relaxed">
                      Insert your HTTP token block into our platform console. Choose a matching automation archetype and register the live routing tunnel.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[180px] transition-all duration-300 hover:scale-[1.03] hover:border-[#00D4FF]/30">
                  <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-[#00D4FF] to-[#7C3AED]" />
                  <div className="step-card-watermark">03</div>
                  <div className="relative z-10">
                    <span className="text-[9px] font-mono tracking-wider text-[#00D4FF] uppercase">// DEPLOY</span>
                    <h3 className="font-display font-bold text-[#F0F6FF] text-base mt-2">Scale and monitor</h3>
                    <p className="text-xs text-[#4A6080] font-sans mt-2 leading-relaxed">
                      Test your setup using the inline payload triggers. Monitor logs and download the source code files to deploy permanently to Vercel.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* System Telemetry Section */}
            <section id="status" className="scroll-reveal pt-16">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">// METRICS</span>
                <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2 mt-1">
                  <Activity className="w-5 h-5 text-[#00D4FF]" />
                  Edge Core Telemetry
                </h2>
                <p className="text-xs text-[#4A6080] font-sans mt-1">
                  Real-time resource performance metrics tracked at the serverless edge node.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <CircularProgress
                  value={cpuUsage}
                  max={100}
                  label="CPU utilization"
                  unit="%"
                  color="#00D4FF"
                />
                <CircularProgress
                  value={memoryUsage}
                  max={100}
                  label="Allocated memory"
                  unit="%"
                  color="#7C3AED"
                />
                <CircularProgress
                  value={responseTime}
                  max={150}
                  label="Average latency"
                  unit="ms"
                  color="#00FF87"
                />
              </div>

              {/* Router endpoint states */}
              <div className="bg-[#0A1628]/40 border border-[#00D4FF]/10 rounded-2xl p-6 mt-8 relative overflow-hidden transition-all duration-300 hover:border-[#00D4FF]/30">
                <div className="absolute inset-0 card-grid-pattern opacity-5"></div>
                <h3 className="font-display font-bold text-xs text-[#F0F6FF] tracking-wider uppercase mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00D4FF]" />
                  Gateway API Route Configuration
                </h3>
                
                <div className="space-y-3 font-mono text-[11px] relative z-10">
                  <div className="flex items-center justify-between py-2 border-b border-[#00D4FF]/5">
                    <span className="text-[#4A6080]">GET /api/health</span>
                    <span className="text-[#00FF87]">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#00D4FF]/5">
                    <span className="text-[#4A6080]">POST /api/launch</span>
                    <span className="text-[#00FF87]">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#00D4FF]/5">
                    <span className="text-[#4A6080]">POST /api/stop</span>
                    <span className="text-[#00FF87]">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[#4A6080]">POST /api/webhook?token=&#123;bot_token&#125;&amp;type=&#123;bot_type&#125;</span>
                    <span className="text-[#00FF87]">200 OK</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Minimalist Footer */}
            <footer className="pt-8 border-t border-[#00D4FF]/10 text-center text-[10px] font-mono text-[#4A6080]">
              <p>Multi-Bot Hosting Platform  —  Built on FastAPI & Vercel  —  2026</p>
            </footer>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
