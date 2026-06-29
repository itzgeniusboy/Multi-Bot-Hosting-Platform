import React, { useState, useEffect, useRef } from 'react';
import { Bot, LogEntry } from './types';
import ActiveBots from './components/ActiveBots';
import LaunchForm from './components/LaunchForm';
import Simulator from './components/Simulator';
import CodeExporter from './components/CodeExporter';
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
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    <div ref={elementRef} className="premium-glass-card rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
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
  const [bots, setBots] = useState<Bot[]>(initialDemoBots);
  const [selectedBotId, setSelectedBotId] = useState<string>('cyber_bot_1');
  const [logs, setLogs] = useState<LogEntry[]>(initialDemoLogs);
  const [activePanel, setActivePanel] = useState<'monitor' | 'code'>('monitor');
  const [isLaunching, setIsLaunching] = useState(false);
  const [totalRequests, setTotalRequests] = useState(4);
  const [activeSection, setActiveSection] = useState<'hero' | 'dashboard' | 'documentation' | 'status'>('hero');

  // System status mock telemetry data
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memoryUsage, setMemoryUsage] = useState(44);
  const [responseTime, setResponseTime] = useState(82);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 8) + 8);
      setMemoryUsage(Math.floor(Math.random() * 3) + 42);
      setResponseTime(Math.floor(Math.random() * 20) + 75);
    }, 4000);
    return () => clearInterval(interval);
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
  }, [bots]);

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

  const handleLaunchBot = async (token: string, type: string) => {
    setIsLaunching(true);
    const domain = window.location.host;

    try {
      const response = await fetch('/api/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bot_token: token,
          bot_type: type,
          vercel_domain: domain,
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
          vercelDomain: domain,
          behavior: type,
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
          data.message || `Success! @${botUsername} is now live 24x7!`,
          JSON.stringify(data.telegram_response, null, 2)
        );
      } else {
        const errorMsg = data.message || 'Failed to connect bot webhook.';
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
        vercelDomain: domain,
        behavior: type,
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
        `Success! @${mockUsername} is now live 24x7! (Simulated Preview Mode)`,
        JSON.stringify({ ok: true, result: { username: mockUsername }, description: "Set webhook successful via mockup connection" }, null, 2)
      );
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
        `De-registering webhook endpoint on Telegram servers for @${targetBot.username}...`
      );

      try {
        await fetch('/api/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ bot_token: targetBot.token }),
        });

        addLog(
          'INFO',
          botId,
          targetBot.username,
          'POST',
          `/api/stop`,
          200,
          `Successfully stopped webhook node. Status updated to Stopped.`
        );
      } catch (err) {
        addLog(
          'WARNING',
          botId,
          targetBot.username,
          'POST',
          `/api/stop`,
          200,
          `Deactivation signal delivered. Webhook state offline.`
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
        `Re-launching webhook listener for @${targetBot.username}...`
      );

      try {
        await fetch('/api/launch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bot_token: targetBot.token,
            bot_type: targetBot.behavior,
            vercel_domain: targetBot.vercelDomain
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
      `Teardown webhook trigger received. Removing @${targetBot.username} from active nodes.`
    );

    try {
      await fetch('/api/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bot_token: targetBot.token }),
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
      `/api/webhook/${bot.token.substring(0, 6)}.../${bot.behavior}`,
      200,
      `Incoming Telegram Update. Message: "${text}"`,
      JSON.stringify(mockTelegramUpdate, null, 2)
    );

    try {
      const response = await fetch(`/api/webhook/${bot.token}/${bot.behavior}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockTelegramUpdate),
      });
      const resData = await response.json();

      addLog(
        'INFO',
        bot.id,
        bot.username,
        'POST',
        `/api/webhook/${bot.token.substring(0, 6)}.../${bot.behavior}`,
        200,
        `Compiled response delivered successfully via Telegram API. Action: ${resData.action || 'reply_sent'}`
      );
    } catch (e) {
      // Local fallback logs
      setTimeout(() => {
        addLog(
          'INFO',
          bot.id,
          bot.username,
          'POST',
          `/api/webhook/${bot.token.substring(0, 6)}.../${bot.behavior}`,
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

  return (
    <div className="min-h-screen bg-[#050B18] text-[#F0F6FF] font-sans overflow-x-hidden relative selection:bg-[#00D4FF]/30 selection:text-[#00D4FF]">
      
      {/* Background Noise and Radial Atmosphere */}
      <div className="noise-overlay" />
      <div className="absolute top-0 right-0 w-[45%] h-[45%] bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.08)_0%,transparent_70%)] pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.06)_0%,transparent_70%)] pointer-events-none z-0"></div>

      {/* Floating Pill Navbar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 floating-navbar px-6 py-3 rounded-full flex items-center justify-between gap-12 z-50 w-[90%] max-w-[1000px] shadow-2xl">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Rotating inner ring */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#00D4FF]/30 animate-rotate-slow"></div>
            {/* Geometric hexagon logo */}
            <svg className="w-5 h-5 text-[#00D4FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 22 7.5 22 18.5 12 24 2 18.5 2 7.5" />
            </svg>
          </div>
          <span className="font-display font-bold text-xs tracking-widest text-[#F0F6FF] hidden sm:inline-block">
            MULTI-BOT ENGINE
          </span>
        </div>

        <div className="flex items-center gap-6 text-[11px] font-mono tracking-wider">
          <a
            href="#hero"
            onClick={(e) => handleSmoothScroll(e, 'hero')}
            className={`transition-all relative py-1 ${activeSection === 'hero' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
          >
            Start
            {activeSection === 'hero' && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
            )}
          </a>
          <a
            href="#dashboard"
            onClick={(e) => handleSmoothScroll(e, 'dashboard')}
            className={`transition-all relative py-1 ${activeSection === 'dashboard' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
          >
            Dashboard
            {activeSection === 'dashboard' && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
            )}
          </a>
          <a
            href="#documentation"
            onClick={(e) => handleSmoothScroll(e, 'documentation')}
            className={`transition-all relative py-1 ${activeSection === 'documentation' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
          >
            Documentation
            {activeSection === 'documentation' && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
            )}
          </a>
          <a
            href="#status"
            onClick={(e) => handleSmoothScroll(e, 'status')}
            className={`transition-all relative py-1 ${activeSection === 'status' ? 'text-[#00D4FF]' : 'text-[#4A6080] hover:text-[#F0F6FF]'}`}
          >
            Telemetry
            {activeSection === 'status' && (
              <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#00D4FF]" />
            )}
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-[95vh] flex items-center justify-center pt-32 pb-16 overflow-hidden">
        {/* Animated Perspective grid tunnel inside Hero */}
        <div className="perspective-container">
          <div className="perspective-grid" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="animated-particle w-1.5 h-1.5 top-[25%] left-[15%]" style={{ animationDelay: '0s', animationDuration: '18s' }} />
          <div className="animated-particle w-2 h-2 top-[55%] left-[85%]" style={{ animationDelay: '4s', animationDuration: '24s' }} />
          <div className="animated-particle w-1 h-1 top-[75%] left-[30%]" style={{ animationDelay: '2s', animationDuration: '20s' }} />
          <div className="animated-particle w-2.5 h-2.5 top-[85%] left-[70%]" style={{ animationDelay: '6s', animationDuration: '28s' }} />
        </div>

        <div className="max-w-[1200px] w-full mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Hero left text block */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00D4FF]/10 border border-[#00D4FF]/20 rounded-full text-[10px] font-mono tracking-widest text-[#00D4FF]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00D4FF]" />
              SECURE WEBHOOK INTEGRATION LAYER
            </div>
            
            {/* Title with Layered Extrusion */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-white leading-[1.1] neon-extrusion-text">
              Multi-Bot <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">
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
                className="px-6 py-3.5 rounded-xl bg-linear-to-r from-[#00D4FF] to-[#7C3AED] hover:scale-[1.03] transition-all text-xs font-bold font-sans uppercase tracking-wider text-white shadow-lg shadow-[#00D4FF]/25 flex items-center gap-2"
              >
                Launch dashboard
                <ArrowUpRight className="w-4 h-4 text-white" />
              </a>
              <a
                href="#documentation"
                onClick={(e) => handleSmoothScroll(e, 'documentation')}
                className="px-6 py-3.5 rounded-xl border border-[#00D4FF]/20 bg-[#0A1628]/40 hover:bg-[#0A1628]/80 transition-all text-xs font-bold font-sans uppercase tracking-wider text-[#F0F6FF]"
              >
                Read instructions
              </a>
            </div>
          </div>

          {/* Hero right floating Stat Cards block */}
          <div className="lg:col-span-5 relative h-[380px] hidden lg:block">
            {/* Card 1: Active Nodes */}
            <div 
              className="absolute top-[5%] left-[5%] w-[260px] premium-glass-card rounded-2xl p-5"
              style={{ transform: 'perspective(600px) rotateX(10deg) rotateY(-8deg) translateZ(30px)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider">// PLATFORM STATUS</span>
                <Server className="w-4 h-4 text-[#00D4FF]" />
              </div>
              <p className="text-2xl font-display font-bold text-white">
                {bots.filter((b) => b.status === 'online').length} / {bots.length}
              </p>
              <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Active Serverless Nodes Online</p>
            </div>

            {/* Card 2: Total Triggers */}
            <div 
              className="absolute top-[38%] left-[25%] w-[260px] premium-glass-card rounded-2xl p-5"
              style={{ transform: 'perspective(600px) rotateX(8deg) rotateY(12deg) translateZ(40px)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                <span className="text-[9px] font-mono text-[#7C3AED] uppercase tracking-wider">// TRIGGER LOAD</span>
                <Activity className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <p className="text-2xl font-display font-bold text-white">{totalRequests}</p>
              <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Gateway Events Routed</p>
            </div>

            {/* Card 3: Network Response */}
            <div 
              className="absolute top-[70%] left-[10%] w-[260px] premium-glass-card rounded-2xl p-5"
              style={{ transform: 'perspective(600px) rotateX(-6deg) rotateY(-8deg) translateZ(20px)' }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                <span className="text-[9px] font-mono text-[#00FF87] uppercase tracking-wider">// EDGE RESPONSE</span>
                <Cpu className="w-4 h-4 text-[#00FF87]" />
              </div>
              <p className="text-2xl font-display font-bold text-white">~78ms</p>
              <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Global Routing Latency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-[1200px] mx-auto px-6 space-y-32 pb-24 relative z-10">

        {/* Dashboard Node Control Section */}
        <section id="dashboard" className="scroll-reveal pt-16">
          <div className="flex items-center justify-between bg-[#0A1628]/60 border border-[#00D4FF]/10 rounded-xl p-2 mb-10 max-w-sm">
            <button
              onClick={() => setActivePanel('monitor')}
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
              onClick={() => setActivePanel('code')}
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
                <LaunchForm onLaunch={handleLaunchBot} isLaunching={isLaunching} />

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
            <div className="premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[180px]">
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
            <div className="premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[180px]">
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
            <div className="premium-glass-card rounded-2xl p-6 relative overflow-hidden min-h-[180px]">
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
          <div className="bg-[#0A1628]/40 border border-[#00D4FF]/10 rounded-2xl p-6 mt-8 relative overflow-hidden">
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
                <span className="text-[#4A6080]">POST /api/webhook/&#123;bot_token&#125;/&#123;bot_type&#125;</span>
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
    </div>
  );
}
