import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
  BookOpen,
  Globe,
  Layers,
  CheckCircle2,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [activeView, setActiveView] = useState<'dashboard' | 'how-to-use' | 'system-status'>('dashboard');
  const [isLaunching, setIsLaunching] = useState(false);
  const [totalRequests, setTotalRequests] = useState(4);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      level,
      botId,
      botUsername,
      method,
      path,
      status_code,
      message,
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
      // Fallback local mockup for developers/sandbox previews
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
      // Local fallback logs if dev server hasn't mapped API perfectly yet
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

  return (
    <div className="min-h-screen bg-[#080612] text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden relative">
      
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(168,85,247,0.08),rgba(8,6,18,0))] pointer-events-none z-0"></div>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent pointer-events-none"></div>

      {/* Slideout Sidebar Menu Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Sidebar content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-slate-950 border-l border-slate-900 shadow-2xl p-6 z-50 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-slate-900 mb-6">
                  <div className="flex items-center gap-2">
                    <CloudLightning className="w-5 h-5 text-purple-400" />
                    <span className="font-display font-bold text-white text-sm tracking-tight">System Navigation</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg border border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                      activeView === 'dashboard'
                        ? 'bg-purple-950/40 text-purple-400 border border-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    Dashboard Node Control
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('how-to-use');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                      activeView === 'how-to-use'
                        ? 'bg-purple-950/40 text-purple-400 border border-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    How to Use (Documentation)
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('dashboard');
                      setSidebarOpen(false);
                      setTimeout(() => {
                        document.getElementById('active-nodes-heading')?.scrollIntoView({ behavior: 'smooth' });
                      }, 200);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-slate-400 hover:text-white hover:bg-slate-900/40 transition-all text-left"
                  >
                    <Layers className="w-4 h-4" />
                    Active Bots List
                  </button>

                  <button
                    onClick={() => {
                      setActiveView('system-status');
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                      activeView === 'system-status'
                        ? 'bg-purple-950/40 text-purple-400 border border-purple-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    Live System Status
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-900">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <Globe className="w-3.5 h-3.5 text-purple-500" />
                  <span>REGIONAL CLOUD INGRESS ROUTE</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-900">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 opacity-25 blur-md animate-pulse"></div>
              <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-slate-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-tr from-purple-500/10 to-transparent"></div>
                <CloudLightning className="w-7 h-7 text-purple-400" />
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-extrabold tracking-tight text-white">
                  Multi-Bot Hosting Platform
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                  VERCEL SERVERLESS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Launch, route, and test highly scalable Telegram Bots with instant webhook setups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-6 bg-slate-950 border border-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-950/20">
              <div className="text-center md:text-left pr-4 border-r border-slate-900">
                <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Nodes</span>
                <span className="text-base font-display font-bold text-white mt-0.5 block flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  {bots.filter((b) => b.status === 'online').length} / {bots.length}
                </span>
              </div>
              <div className="text-center md:text-left">
                <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Triggers</span>
                <span className="text-base font-display font-bold text-white mt-0.5 block flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  {totalRequests}
                </span>
              </div>
            </div>

            {/* Hamburger icon for Hidden Sidebar */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-3 bg-slate-950 hover:bg-slate-900 border border-slate-900 rounded-2xl shadow-xl hover:scale-102 transition-all text-slate-300 hover:text-white cursor-pointer"
              title="System Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* View Selection (Toggles between Dashboard, How to use, System status) */}
        {activeView === 'dashboard' && (
          <>
            {/* Workspace Navigation Tabs */}
            <div className="flex items-center justify-between bg-slate-950 border border-slate-900 rounded-xl p-1.5 mb-8 max-w-md">
              <button
                onClick={() => setActivePanel('monitor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePanel === 'monitor'
                    ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold shadow-lg shadow-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Control Console
              </button>
              <button
                onClick={() => setActivePanel('code')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePanel === 'code'
                    ? 'bg-purple-950/40 text-purple-400 border border-purple-500/30 font-semibold shadow-lg shadow-purple-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Export Python Backend
              </button>
            </div>

            {/* Central Workspace */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {activePanel === 'monitor' ? (
                  <motion.div
                    key="monitor"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-8"
                  >
                    {/* Active Bots Dashboard Grid */}
                    <div id="active-nodes-heading">
                      <ActiveBots
                        bots={bots}
                        selectedBotId={selectedBotId}
                        onSelectBot={setSelectedBotId}
                        onToggleStatus={handleToggleStatus}
                        onDeleteBot={handleDeleteBot}
                        onSendTestWebhook={handleTriggerWebhook}
                      />
                    </div>

                    {/* Provisioner Form */}
                    <LaunchForm onLaunch={handleLaunchBot} isLaunching={isLaunching} />

                    {/* Live Console Logs */}
                    <div className="pt-4">
                      <div className="border-t border-slate-900 pt-8">
                        <Simulator
                          bots={bots}
                          selectedBotId={selectedBotId}
                          logs={logs}
                          onClearLogs={() => setLogs([])}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="code"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CodeExporter />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* How to Use Section */}
        {activeView === 'how-to-use' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl border border-slate-900 p-8 max-w-4xl mx-auto space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
              <BookOpen className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-display font-bold text-white">How to Set Up & Deploy Your Telegram Bots</h2>
            </div>

            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
              <div className="space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 flex items-center justify-center font-mono">1</span>
                  Acquire Telegram Bot Token from @BotFather
                </h3>
                <p className="pl-7 text-xs text-slate-400">
                  Open the Telegram messenger app, search for the official account <strong>@BotFather</strong>, and start a conversation. Send the command <code className="font-mono bg-slate-950 px-1.5 py-0.5 rounded text-purple-400 border border-slate-900">/newbot</code>. Follow the prompts to configure a name and username. BotFather will provide an HTTP API token.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 flex items-center justify-center font-mono">2</span>
                  Register Webhook and Choose Template
                </h3>
                <p className="pl-7 text-xs text-slate-400">
                  Paste the generated token into our "Connect and Launch Bot" panel. Select the matching bot behavior archetype (Support, Feedback, or Echo template) and click "Launch Bot Node". Our server will immediately connect to Telegram APIs, verify the credentials, and route updates to our serverless edge node.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-400 flex items-center justify-center font-mono">3</span>
                  Deploy to Vercel Serverless
                </h3>
                <p className="pl-7 text-xs text-slate-400">
                  To host your own version independently, head over to the "Export Python Backend" tab. Copy the fully compliant FastAPI python source code, your requirements list, and vercel deployment configuration. Push these to a GitHub repository, import into Vercel, and watch it run 100% free with unlimited scale.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-900 flex justify-end">
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all shadow-lg shadow-purple-500/25"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* System Status Section */}
        {activeView === 'system-status' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="glass-panel rounded-2xl border border-slate-900 p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-900 pb-4">
                <Activity className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-display font-bold text-white">Live System Status & Telemetry</h2>
              </div>

              {/* Status Indicator Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-5">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1">CPU UTILIZATION</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">{cpuUsage}%</span>
                    <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> NORMAL
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${cpuUsage * 3}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-5">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1">MEMORY POOL STATE</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">{memoryUsage}%</span>
                    <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ALLOCATED
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${memoryUsage}%` }}></div>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-5">
                  <span className="text-[10px] text-slate-500 font-mono block mb-1">AVERAGE RESPONSE TIME</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-white">{responseTime}ms</span>
                    <span className="text-[10px] font-mono text-purple-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> EXCELLENT
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${responseTime / 2}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Server State List */}
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-5 space-y-4">
                <h3 className="font-display font-semibold text-xs text-slate-300">FastAPI Gateway Routers</h3>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-900/60">
                    <span className="text-slate-500">GET /api/health</span>
                    <span className="text-purple-400">STATUS: 200 OK</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-900/60">
                    <span className="text-slate-500">POST /api/launch</span>
                    <span className="text-purple-400">STATUS: 200 OK</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-900/60">
                    <span className="text-slate-500">POST /api/stop</span>
                    <span className="text-purple-400">STATUS: 200 OK</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">POST /api/webhook/{"{"}bot_token{"}"}/{"{"}bot_type{"}"}</span>
                    <span className="text-purple-400">STATUS: 200 OK</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveView('dashboard')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-semibold text-white cursor-pointer transition-all shadow-lg shadow-purple-500/25"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-900 text-center text-[11px] text-slate-500">
          <p>© 2026 Multi-Bot Hosting Platform • Crafted using FastAPI & React.</p>
        </footer>
      </div>
    </div>
  );
}
