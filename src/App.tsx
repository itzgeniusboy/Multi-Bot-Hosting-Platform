import React, { useState, useEffect, useRef } from 'react';
import sodium from 'libsodium-wrappers';
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
  Play,
  Settings,
  Copy,
  RotateCw,
  Search,
  Globe,
  Terminal,
  Shield,
  Key,
  Database,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Lenis from 'lenis';
import ThreeHero from './components/ThreeHero';
import CustomCursor from './components/CustomCursor';
import LoadingScreen from './components/LoadingScreen';
import NewProjectModal from './components/NewProjectModal';
import LogsViewer from './components/LogsViewer';
import { audio } from './utils/audio';
import { Project, SavedBot } from './types';
import { use3DTilt } from './hooks/use3DTilt';

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
    if (start === end) return;

    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const timer = setInterval(() => {
      current += increment;
      setCount(current);
      if (current === end) {
        clearInterval(timer);
      }
    }, Math.max(stepTime, 20));

    prevValue.current = end;
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
}

interface AddProjectCardProps {
  onClick: () => void;
}

function AddProjectCard({ onClick }: AddProjectCardProps) {
  const tiltRef = use3DTilt(true);

  return (
    <div
      ref={tiltRef}
      onClick={onClick}
      className="animate-card-fade-in premium-glass-card rounded-2xl p-6 border border-dashed border-[#00D4FF]/20 bg-[#050B18]/20 flex flex-col items-center justify-center min-h-[260px] gap-3 group hover:border-[#00D4FF]/40 hover:bg-[#00D4FF]/5 transition-all duration-300 cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.4)]"
    >
      <div className="p-3.5 rounded-xl border border-dashed border-[#00D4FF]/30 bg-[#050B18]/40 group-hover:bg-[#00D4FF]/10 group-hover:border-[#00D4FF]/40 text-[#00D4FF] transition-all">
        <Plus className="w-6 h-6" />
      </div>
      <div className="text-center space-y-1">
        <h4 className="text-xs font-mono font-bold text-white tracking-widest uppercase group-hover:text-[#00D4FF] transition-colors">
          Deploy Daemon Node
        </h4>
        <p className="text-[10px] text-[#4A6080] font-sans max-w-[170px]">
          Bind a new GitHub action background worker loop
        </p>
      </div>
    </div>
  );
}

interface SavedBotCardProps {
  bot: SavedBot;
  statusInfo?: {
    status: 'RUNNING' | 'QUEUED' | 'FAILED' | 'STOPPED' | 'UNKNOWN';
    lastRunText: string;
    loading: boolean;
  };
  onStop: () => void;
  onRestart: () => void;
  onLogs: () => void;
  onDelete: () => void;
  actionLoading: 'stopping' | 'starting' | null;
  index: number;
}

function SavedBotCard({
  bot,
  statusInfo,
  onStop,
  onRestart,
  onLogs,
  onDelete,
  actionLoading,
  index
}: SavedBotCardProps) {
  const tiltRef = use3DTilt(true);
  const isLoading = statusInfo?.loading ?? true;
  const status = statusInfo?.status ?? 'UNKNOWN';
  const lastRunText = statusInfo?.lastRunText ?? 'loading...';

  // Get badge colors
  const getBadgeStyles = () => {
    switch (status) {
      case 'RUNNING':
        return 'bg-[#00FF88]/15 text-[#00FF88] border-[#00FF88]/30';
      case 'QUEUED':
        return 'bg-[#FFB800]/15 text-[#FFB800] border-[#FFB800]/30';
      case 'FAILED':
        return 'bg-[#FF4444]/15 text-[#FF4444] border-[#FF4444]/30';
      case 'STOPPED':
        return 'bg-[#666666]/15 text-neutral-400 border-neutral-700/50';
      default:
        return 'bg-[#666666]/5 text-neutral-500 border-neutral-800';
    }
  };

  if (isLoading) {
    return (
      <div className="premium-glass-card rounded-2xl p-5 border border-[#00D4FF]/10 bg-[#050B18]/40 animate-pulse min-h-[240px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 bg-white/10 rounded w-1/2" />
            <div className="h-5 bg-white/10 rounded w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded w-1/3" />
            <div className="h-3 bg-white/5 rounded w-2/5" />
          </div>
        </div>
        <div className="border-t border-white/5 pt-4 grid grid-cols-3 gap-2">
          <div className="h-10 bg-white/5 rounded-xl" />
          <div className="h-10 bg-white/5 rounded-xl" />
          <div className="h-10 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  const botUsername = bot.botUsername;
  const botName = bot.botName || 'Telegram Bot';
  const telegramUrl = botUsername ? `https://t.me/${botUsername}` : 'https://t.me';

  return (
    <div
      ref={tiltRef}
      style={{ animationDelay: `${index * 80}ms` }}
      className="animate-card-fade-in premium-glass-card rounded-2xl p-5 border border-[#00D4FF]/15 bg-[#050B18]/50 hover:bg-[#050B18]/70 hover:border-[#00D4FF]/30 transition-all duration-300 flex flex-col justify-between min-h-[260px] relative group shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Delete/untrack hover button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-neutral-500 hover:text-rose-400 transition-all cursor-pointer z-10"
        title="Untrack Bot"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div>
        {/* Username/Repo & Status Badge */}
        <div className="flex items-center justify-between gap-2.5 mb-2.5">
          {botUsername ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-mono text-[14px] font-bold tracking-wide truncate max-w-[70%] cursor-pointer hover:underline flex items-center gap-1 min-h-[44px]"
            >
              @{botUsername}
              <ExternalLink className="w-3 h-3 text-[#00D4FF]/70" />
            </a>
          ) : (
            <span className="text-neutral-500 italic text-[13px] font-mono select-text min-h-[44px] flex items-center">
              @not_configured
            </span>
          )}
          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border shrink-0 ${getBadgeStyles()}`}>
            [{status}]
          </span>
        </div>

        {/* Bot Name & Repo Full Name */}
        <div className="space-y-1 mb-3.5">
          <h4 className="text-white font-bold text-sm select-text">
            {botName}
          </h4>
          <p className="text-[11px] text-[#4A6080] truncate select-text font-mono" title={bot.repoFullName}>
            {bot.repoFullName}
          </p>
        </div>

        {/* Language Badge & Info */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-md border border-[#00D4FF]/20 bg-[#00D4FF]/5 text-[#00D4FF] capitalize">
              {bot.language} • {bot.entryFile}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <RefreshCw className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <span className="font-mono text-[10px] sm:text-[11px] text-neutral-500">Last run: {lastRunText}</span>
          </div>
        </div>
      </div>

      {/* Control Buttons Container */}
      <div className="border-t border-[#00D4FF]/5 pt-4 mt-4">
        <div className="grid grid-cols-3 gap-2.5 w-full">
          {/* RESTART */}
          <button
            onClick={onRestart}
            disabled={actionLoading !== null}
            className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 active:bg-cyan-500/20 disabled:opacity-40 transition-all font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
          >
            {actionLoading === 'starting' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Play className="w-3 h-3 text-cyan-400" />
            )}
            <span>{actionLoading === 'starting' ? 'starting' : 'RESTART'}</span>
          </button>

          {/* STOP */}
          <button
            onClick={onStop}
            disabled={actionLoading !== null}
            className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 active:bg-rose-500/20 disabled:opacity-40 transition-all font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
          >
            {actionLoading === 'stopping' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
            ) : (
              <Power className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{actionLoading === 'stopping' ? 'stopping' : 'STOP'}</span>
          </button>

          {/* LOGS */}
          <button
            onClick={onLogs}
            disabled={actionLoading !== null}
            className="h-11 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 disabled:opacity-40 transition-all font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest cursor-pointer"
          >
            <Terminal className="w-3 h-3 text-neutral-400" />
            <span>LOGS</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const stripEmojis = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1FFFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|\u{FE0F}/gu, '').trim();
};

const getAbsoluteUrl = (path: string): string => {
  if (typeof window !== 'undefined' && window.location) {
    return new URL(path, window.location.href).href;
  }
  return path;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // System Preferences States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [reduceAnimation, setReduceAnimation] = useState(() => localStorage.getItem('pref_reduce_animation') === 'true');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('pref_theme') as 'dark' | 'light') || 'dark');
  const [enableNotifications, setEnableNotifications] = useState(() => localStorage.getItem('pref_notifications') !== 'false');

  // Custom Toast Notification States
  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Sync theme overrides
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [theme]);

  // GitHub state
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('gh_pat'));
  const [gitHubUser, setGitHubUser] = useState<any>(() => {
    const saved = localStorage.getItem('gh_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [repos, setRepos] = useState<any[]>([]);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Project modal & listings state
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [botActionLoading, setBotActionLoading] = useState<string | null>(null);
  const [botFilter, setBotFilter] = useState<'all' | 'online' | 'offline' | 'queued' | 'failed'>('all');
  const [botSearch, setBotSearch] = useState('');

  // Live status dashboard additions
  const [savedBots, setSavedBots] = useState<SavedBot[]>([]);
  const [botStatuses, setBotStatuses] = useState<Record<string, {
    status: 'RUNNING' | 'QUEUED' | 'FAILED' | 'STOPPED' | 'UNKNOWN';
    lastRunText: string;
    loading: boolean;
  }>>({});
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState<number>(0);
  const [isRefreshingStatuses, setIsRefreshingStatuses] = useState(false);
  const [botActionLoadingMap, setBotActionLoadingMap] = useState<Record<string, 'stopping' | 'starting' | null>>({});

  // Interactive logs and secrets state
  const [activeLogsProject, setActiveLogsProject] = useState<string | null>(null);
  const [activeSecretsProject, setActiveSecretsProject] = useState<string | null>(null);
  
  // Local inline secrets inputs
  const [inlineSecretKey, setInlineSecretKey] = useState('');
  const [inlineSecretValue, setInlineSecretValue] = useState('');
  const [isSavingSecret, setIsSavingSecret] = useState(false);

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
        localStorage.setItem('gh_user', JSON.stringify(userData));
      }

      // Fetch repos directly from GitHub API client-side!
      const reposResp = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        }
      });
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

  // Fetch saved bots from local storage
  const fetchSavedBots = async () => {
    try {
      const savedStr = localStorage.getItem('multi_bot_saved_bots');
      if (savedStr) {
        const parsed = JSON.parse(savedStr);
        setSavedBots(parsed);
        return parsed;
      }
    } catch (e) {
      console.error("Error reading saved bots:", e);
    }
    setSavedBots([]);
    return [];
  };

  const fetchGitHubStatuses = async (botsList?: SavedBot[]) => {
    const list = botsList || savedBots;
    if (!list || list.length === 0) return;

    setIsRefreshingStatuses(true);
    setBotStatuses(prev => {
      const next = { ...prev };
      list.forEach(bot => {
        if (!next[bot.repoFullName]) {
          next[bot.repoFullName] = { status: 'UNKNOWN', lastRunText: 'never run', loading: true };
        } else {
          next[bot.repoFullName] = { ...next[bot.repoFullName], loading: true };
        }
      });
      return next;
    });

    const token = githubToken || localStorage.getItem('gh_pat');
    const headers = {
      'Authorization': `token ${token || 'demo_github_token'}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    const timeAgo = (dateStr: string) => {
      try {
        const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
      } catch (e) {
        return 'recently';
      }
    };

    await Promise.all(list.map(async (bot) => {
      try {
        const resp = await fetch(`https://api.github.com/repos/${bot.repoOwner}/${bot.repoName}/actions/runs?per_page=3`, { headers });
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}`);
        }
        const data = await resp.json();
        const runs = data.workflow_runs || [];
        if (runs.length === 0) {
          setBotStatuses(prev => ({
            ...prev,
            [bot.repoFullName]: { status: 'UNKNOWN', lastRunText: 'No runs found', loading: false }
          }));
          return;
        }

        const latestRun = runs[0];
        const status = latestRun.status; 
        const conclusion = latestRun.conclusion; 
        
        let mappedStatus: 'RUNNING' | 'QUEUED' | 'FAILED' | 'STOPPED' | 'UNKNOWN' = 'UNKNOWN';
        if (status === 'in_progress') {
          mappedStatus = 'RUNNING';
        } else if (status === 'queued' || status === 'waiting') {
          mappedStatus = 'QUEUED';
        } else if (conclusion === 'failure') {
          mappedStatus = 'FAILED';
        } else if (conclusion === 'cancelled' || status === 'completed') {
          mappedStatus = 'STOPPED';
        }

        const lastRunTime = latestRun.created_at || latestRun.updated_at;
        const lastRunText = lastRunTime ? timeAgo(lastRunTime) : 'Never run';

        setBotStatuses(prev => ({
          ...prev,
          [bot.repoFullName]: { status: mappedStatus, lastRunText, loading: false }
        }));

      } catch (err) {
        console.error(`Failed to fetch status for ${bot.repoFullName}:`, err);
        setBotStatuses(prev => ({
          ...prev,
          [bot.repoFullName]: { status: 'UNKNOWN', lastRunText: 'Error connecting', loading: false }
        }));
      }
    }));

    setIsRefreshingStatuses(false);
    setLastUpdatedSecs(0);
  };

  // Silent validation on mount
  useEffect(() => {
    const checkTokenSilently = async () => {
      const token = localStorage.getItem('gh_pat');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        setIsFetchingUser(true);
        const userResp = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          }
        });

        if (userResp.status === 200) {
          const userData = await userResp.json();
          setGitHubUser(userData);
          localStorage.setItem('gh_user', JSON.stringify(userData));
          setGithubToken(token);
          
          // Pre-fetch repositories in the background
          fetchGitHubUserAndRepos(token);
        } else if (userResp.status === 401 || userResp.status === 403) {
          localStorage.removeItem('gh_pat');
          localStorage.removeItem('gh_user');
          localStorage.removeItem('multi_bot_saved_bots');
          setGithubToken(null);
          setGitHubUser(null);
          addToast('Session expired. Please reconnect.', 'error');
        }
      } catch (err) {
        console.error('Silent token validation error:', err);
      } finally {
        setIsFetchingUser(false);
        setIsLoading(false);
      }
    };

    checkTokenSilently();

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Poll saved bots statuses
  useEffect(() => {
    if (githubToken) {
      fetchSavedBots().then((list) => {
        if (list && list.length > 0) {
          fetchGitHubStatuses(list);
        }
      });
    }
  }, [githubToken]);

  // Set up 30 seconds interval & 1s counter increments
  useEffect(() => {
    if (!githubToken) return;

    const counterInterval = setInterval(() => {
      setLastUpdatedSecs(prev => {
        if (prev >= 29) {
          fetchGitHubStatuses();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(counterInterval);
  }, [githubToken, savedBots]);

  const handleDisconnectClick = async () => {
    audio.playClick();
    setIsDisconnecting(true);
    
    try {
      localStorage.removeItem('gh_pat');
      localStorage.removeItem('gh_user');
      localStorage.removeItem('multi_bot_saved_bots');
      localStorage.removeItem('github_token');
      localStorage.removeItem('tracked_bots');
      
      setGithubToken(null);
      setGitHubUser(null);
      setRepos([]);
      setSavedBots([]);
      setActiveProjects([]);
      audio.playSuccess();
      addToast('Disconnected successfully.', 'success');
    } catch (e: any) {
      addToast('Disconnection failed: ' + e.message, 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleRefreshRepos = async () => {
    if (!githubToken) return;
    setIsFetchingRepos(true);
    audio.playClick();
    addToast('Refreshing repository listings...', 'info');
    try {
      await fetchGitHubUserAndRepos(githubToken);
      audio.playSuccess();
      addToast('Repository listing updated.', 'success');
    } catch (e: any) {
      addToast('Failed to sync: ' + e.message, 'error');
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const handleSaveManualToken = (token: string, userData: any) => {
    localStorage.setItem('gh_pat', token);
    localStorage.setItem('gh_user', JSON.stringify(userData));
    setGithubToken(token);
    setGitHubUser(userData);
    fetchGitHubUserAndRepos(token);
    addToast(`Connected as @${userData.login}`, 'success');
  };

  // Bot Node Action controls (using direct GitHub integration)
  const handleStopBot = async (bot: SavedBot) => {
    audio.playClick();
    setBotActionLoadingMap(prev => ({ ...prev, [bot.repoFullName]: 'stopping' }));
    addToast(`Retrieving active runs for ${bot.repoFullName}...`, 'info');
    try {
      const token = githubToken || localStorage.getItem('github_token');
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };
      
      // 1. Fetch latest workflow runs
      const runsResp = await fetch(`https://api.github.com/repos/${bot.repoOwner}/${bot.repoName}/actions/runs?per_page=5`, { headers });
      if (!runsResp.ok) {
        throw new Error(`Failed to query workflow runs: HTTP ${runsResp.status}`);
      }
      const runsData = await runsResp.json();
      const activeRuns = (runsData.workflow_runs || []).filter(
        (run: any) => run.status === 'in_progress' || run.status === 'queued' || run.status === 'waiting'
      );

      if (activeRuns.length === 0) {
        addToast(`No active runs found to stop for ${bot.repoFullName}.`, 'info');
        // Force status refresh
        fetchGitHubStatuses();
        return;
      }

      // 2. Cancel active runs
      addToast(`Cancelling ${activeRuns.length} active run(s)...`, 'info');
      await Promise.all(activeRuns.map(async (run: any) => {
        const cancelResp = await fetch(`https://api.github.com/repos/${bot.repoOwner}/${bot.repoName}/actions/runs/${run.id}/cancel`, {
          method: 'POST',
          headers
        });
        if (!cancelResp.ok) {
          console.warn(`Failed to cancel run ${run.id}: ${cancelResp.status}`);
        }
      }));

      audio.playSuccess();
      addToast(`Workflow cancellation requested for ${bot.repoFullName}.`, 'success');
      
      // Poll to update status
      setTimeout(() => {
        fetchGitHubStatuses();
      }, 3000);

    } catch (err: any) {
      console.error('Failed to stop bot:', err);
      addToast('Stop failed: ' + err.message, 'error');
    } finally {
      setBotActionLoadingMap(prev => ({ ...prev, [bot.repoFullName]: null }));
    }
  };

  const handleRestartBot = async (bot: SavedBot) => {
    audio.playClick();
    setBotActionLoadingMap(prev => ({ ...prev, [bot.repoFullName]: 'starting' }));
    addToast(`Triggering bot workflow dispatch for ${bot.repoFullName}...`, 'info');
    
    try {
      const token = githubToken || localStorage.getItem('github_token');
      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      };

      // Try main first, fallback to master
      let success = false;
      let branchToTry = 'main';
      
      let resp = await fetch(`https://api.github.com/repos/${bot.repoOwner}/${bot.repoName}/actions/workflows/${bot.workflowFile}/dispatches`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ref: branchToTry })
      });

      if (resp.ok) {
        success = true;
      } else {
        console.warn(`Failed workflow dispatch on branch main, trying master...`);
        branchToTry = 'master';
        resp = await fetch(`https://api.github.com/repos/${bot.repoOwner}/${bot.repoName}/actions/workflows/${bot.workflowFile}/dispatches`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ ref: branchToTry })
        });
        if (resp.ok) {
          success = true;
        }
      }

      if (success) {
        audio.playSuccess();
        addToast(`Bot restart triggered on ${branchToTry} successfully!`, 'success');
        // Refresh status after 3 seconds
        setTimeout(() => {
          fetchGitHubStatuses();
        }, 3000);
      } else {
        const errorText = await resp.text();
        throw new Error(errorText || `Status code ${resp.status}`);
      }
    } catch (err: any) {
      console.error('Failed to start bot:', err);
      addToast('Restart failed: ' + err.message, 'error');
    } finally {
      setBotActionLoadingMap(prev => ({ ...prev, [bot.repoFullName]: null }));
    }
  };

  const handleDeleteProject = async (bot: SavedBot) => {
    audio.playClick();
    if (!confirm(`Are you sure you want to remove ${bot.repoFullName} from your dashboard? This will untrack it.`)) return;
    
    addToast(`Untracking ${bot.repoFullName}...`, 'info');
    try {
      const current = localStorage.getItem('multi_bot_saved_bots');
      if (current) {
        const parsed: SavedBot[] = JSON.parse(current);
        const filtered = parsed.filter(b => b.repoFullName !== bot.repoFullName);
        localStorage.setItem('multi_bot_saved_bots', JSON.stringify(filtered));
        setSavedBots(filtered);
      }
      
      // Also notify legacy API if needed
      await fetch(getAbsoluteUrl('/api/projects/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: bot.repoFullName })
      }).catch(e => console.warn("Legacy API sync skipped:", e));

      audio.playSuccess();
      addToast('Project untracked from dashboard successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      addToast('Untrack failed: ' + err.message, 'error');
    }
  };

  const handleSaveInlineSecret = async (repoName: string) => {
    if (!inlineSecretKey.trim() || !inlineSecretValue.trim()) return;
    setIsSavingSecret(true);
    const formattedKey = inlineSecretKey.toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();
    addToast(`Encrypting and committing secret ${formattedKey} to GitHub...`, 'info');
    try {
      const [owner, repo] = repoName.split('/');
      const token = githubToken || localStorage.getItem('gh_pat');
      if (!token) {
        throw new Error('No GitHub session found. Please reconnect.');
      }

      const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      };

      // 1. Get repository public key
      const pubKeyResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/public-key`, { headers });
      if (!pubKeyResp.ok) {
        const text = await pubKeyResp.text();
        throw new Error(`Failed to fetch public key: ${text}`);
      }
      const pubKeyData = await pubKeyResp.json();
      const { key_id, key: publicKeyBase64 } = pubKeyData;

      // 2. Encrypt using libsodium
      await sodium.ready;
      const binkey = sodium.from_base64(publicKeyBase64, sodium.base64_variants.ORIGINAL);
      const binsec = sodium.from_string(inlineSecretValue.trim());
      const encBytes = sodium.crypto_box_seal(binsec, binkey);
      const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

      // 3. Save secret via PUT request
      const putResp = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/secrets/${formattedKey}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encrypted_value,
          key_id,
        }),
      });

      if (putResp.status === 201 || putResp.status === 204) {
        audio.playSuccess();
        addToast(`Secret ${formattedKey} successfully saved to GitHub.`, 'success');
        setInlineSecretKey('');
        setInlineSecretValue('');
        setActiveSecretsProject(null);
      } else {
        const text = await putResp.text();
        throw new Error(text || `Failed with status ${putResp.status}`);
      }
    } catch (err: any) {
      console.error('Failed to set secret:', err);
      addToast('Failed to save secret: ' + err.message, 'error');
    } finally {
      setIsSavingSecret(false);
    }
  };

  const handleToggleMute = () => {
    const status = audio.toggleMute();
    setIsMuted(status);
  };

  const runningNodesCount = savedBots.filter(bot => botStatuses[bot.repoFullName]?.status === 'RUNNING').length;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <LoadingScreen key="loader" onComplete={() => setIsLoading(false)} />
      ) : !githubToken ? (
        <LoginScreen
          key="login"
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

          {/* Background overlays & Radial Atmos */}
          <div className="noise-overlay" />
          <div className="glow-blob w-[500px] h-[500px] top-[10%] right-[5%] bg-cyan-500/10" style={{ animationDelay: '0s' }} />
          <div className="glow-blob w-[600px] h-[600px] bottom-[15%] left-[2%] bg-purple-500/5" style={{ animationDelay: '4s' }} />
          <div className="glow-blob w-[450px] h-[450px] top-[60%] right-[10%] bg-pink-500/5" style={{ animationDelay: '2s' }} />

          {/* Floating Glassmorphism Navbar */}
          <nav 
            className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-full flex items-center justify-between z-[100] w-[90%] max-w-[1000px] transition-all duration-300 border ${
              isScrolled 
                ? 'bg-[#0A1628]/85 border-[#00D4FF]/15 shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_40px_rgba(0,212,255,0.04)] backdrop-blur-md' 
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
              <span className="font-display font-extrabold text-[10px] sm:text-xs tracking-widest text-[#F0F6FF] whitespace-nowrap">
                <span className="inline min-[400px]:hidden">MBHP</span>
                <span className="hidden min-[400px]:inline">MULTI-BOT ENGINE</span>
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-[11px] font-mono tracking-wider">
              <button 
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 rounded-full border border-[#00D4FF]/10 bg-[#0A1628]/40 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all cursor-pointer"
                title={isMuted ? "Unmute sounds" : "Mute sounds"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button 
                type="button"
                onClick={() => { audio.playClick(); setIsSettingsOpen(true); }}
                className="p-1.5 rounded-full border border-[#00D4FF]/10 bg-[#0A1628]/40 text-[#4A6080] hover:text-[#00D4FF] hover:border-[#00D4FF]/30 transition-all cursor-pointer"
                title="System Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDisconnectClick}
                disabled={isDisconnecting}
                className="transition-all px-3 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer text-[10px] font-mono tracking-wider font-semibold uppercase disabled:opacity-40"
              >
                {isDisconnecting ? 'Sign Out...' : 'Sign Out'}
              </button>
            </div>
          </nav>

          {/* Hero Section */}
          <section id="hero" className="relative min-h-[70vh] flex items-center justify-center pt-32 pb-16 overflow-hidden">
            <ThreeHero reduceAnimation={reduceAnimation} />

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
                <h1 className="animate-hero-title text-4xl sm:text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] neon-extrusion-text">
                  Multi-Bot <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] via-[#7C3AED] to-[#FF3B6B]">
                    Hosting Platform
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#4A6080] font-sans max-w-lg leading-relaxed">
                  Connect your repository, select your code, and let your bot run 24x7 live inside your own GitHub Actions workflow automatically. Secure, modular, and cloud-native.
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

              {/* Hero Right Metrics */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="lg:col-span-5 relative h-[300px] hidden lg:block"
              >
                {/* Real-time configured project count */}
                <div 
                  className="absolute top-[10%] left-[10%] w-[290px] premium-glass-card rounded-2xl p-5 border-[#00D4FF]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.04]"
                  style={{ transform: 'perspective(600px) rotateX(10deg) rotateY(-8deg) translateZ(30px)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider">// PLATFORM STATUS</span>
                    <Server className="w-4 h-4 text-[#00D4FF]" />
                  </div>
                  <p className="text-3xl font-display font-bold text-white flex items-baseline gap-1">
                    <AnimatedCounter value={runningNodesCount} />
                    <span className="text-[#4A6080] text-sm">/</span>
                    <AnimatedCounter value={activeProjects.length} />
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Active Serverless Nodes Online</p>
                </div>

                {/* Secure Encryption Card */}
                <div 
                  className="absolute top-[48%] left-[20%] w-[290px] premium-glass-card rounded-2xl p-5 border-[#7C3AED]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-all duration-300 hover:scale-[1.04]"
                  style={{ transform: 'perspective(600px) rotateX(8deg) rotateY(12deg) translateZ(40px)' }}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 mb-3">
                    <span className="text-[9px] font-mono text-[#7C3AED] uppercase tracking-wider">// ENCRYPTION LEVEL</span>
                    <ShieldCheck className="w-4 h-4 text-[#7C3AED]" />
                  </div>
                  <p className="text-lg font-display font-extrabold text-white">
                    LIBSODIUM 256
                  </p>
                  <p className="text-[10px] text-[#4A6080] mt-1 font-sans">Public-Key Secure Vault</p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Main Dashboard Panel */}
          <div className="max-w-[1200px] mx-auto px-6 pb-24 relative z-[1]">
            <section id="dashboard-section" className="pt-[70px] space-y-12 scroll-mt-[100px]">
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
                        {gitHubUser?.bio ? stripEmojis(gitHubUser.bio) : (gitHubUser?.html_url || 'Active developer session synchronized.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid Filters & Controls */}
                <div className="space-y-6">
                  
                  {/* Filters bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-[#00D4FF]/10 bg-[#050B18]/30">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A6080]" />
                      <input
                        type="text"
                        placeholder="Search active bots..."
                        value={botSearch}
                        onChange={(e) => setBotSearch(e.target.value)}
                        className="w-full bg-[#050B18] border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] rounded-xl pl-10 pr-3 h-12 sm:h-9 py-3 sm:py-1.5 text-base sm:text-xs text-white font-mono outline-none transition-all placeholder:text-[#4A6080]"
                      />
                    </div>

                    <div 
                      className="flex flex-nowrap items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {(['all', 'online', 'queued', 'failed', 'offline'] as const).map((filter) => {
                        const filterLabels = {
                          all: 'ALL',
                          online: 'RUNNING',
                          queued: 'QUEUED',
                          failed: 'FAILED',
                          offline: 'STOPPED'
                        };
                        return (
                          <button
                            key={filter}
                            onClick={() => {
                              audio.playClick();
                              setBotFilter(filter);
                            }}
                            className={`flex-1 sm:flex-initial text-center px-3.5 py-2 sm:py-1.5 rounded-lg font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                              botFilter === filter
                                ? 'bg-[#00D4FF]/15 border-[#00D4FF] text-[#00D4FF]'
                                : 'bg-transparent border-[#4A6080]/15 text-[#4A6080] hover:text-white hover:border-[#4A6080]/30'
                            }`}
                          >
                            {filterLabels[filter]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#00D4FF]/5 gap-2">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-display font-extrabold text-[#F0F6FF] tracking-wider uppercase">
                        Tracked Bot Repositories
                      </h3>
                      <p className="text-[10px] font-mono text-neutral-500">
                        Auto-refreshing in {30 - lastUpdatedSecs}s • Last updated {lastUpdatedSecs}s ago
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[#00D4FF] font-semibold">
                      {savedBots.length} Repos Registered
                    </span>
                  </div>

                  {/* Multi-bot Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add Project Card Button */}
                    <AddProjectCard onClick={() => { audio.playClick(); setIsNewProjectOpen(true); }} />

                    {/* Active Deployed Project Cards */}
                    {savedBots
                      .filter((bot) => {
                        const matchesSearch = bot.repoFullName.toLowerCase().includes(botSearch.toLowerCase());
                        if (!matchesSearch) return false;
                        if (botFilter === 'all') return true;
                        const status = botStatuses[bot.repoFullName]?.status || 'UNKNOWN';
                        if (botFilter === 'online') return status === 'RUNNING';
                        if (botFilter === 'queued') return status === 'QUEUED';
                        if (botFilter === 'failed') return status === 'FAILED';
                        if (botFilter === 'offline') return status === 'STOPPED';
                        return true;
                      })
                      .map((bot, idx) => (
                        <SavedBotCard
                          key={bot.id}
                          bot={bot}
                          statusInfo={botStatuses[bot.repoFullName]}
                          onStop={() => handleStopBot(bot)}
                          onRestart={() => handleRestartBot(bot)}
                          onLogs={() => {
                            audio.playClick();
                            setActiveLogsProject(bot.repoFullName);
                          }}
                          onDelete={() => handleDeleteProject(bot)}
                          actionLoading={botActionLoadingMap[bot.repoFullName] || null}
                          index={idx}
                        />
                      ))}
                  </div>
                </div>
              </motion.div>
            </section>

            <footer className="pt-24 border-t border-[#00D4FF]/10 text-center text-[10px] font-mono text-[#4A6080]">
              <p>Multi-Bot Hosting Platform  —  Built on Express & GitHub Actions  —  2026</p>
            </footer>
          </div>

          {/* Settings preferences drawer */}
          <AnimatePresence>
            {isSettingsOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSettingsOpen(false)}
                  className="fixed inset-0 bg-[#050B18]/80 backdrop-blur-sm z-[100] cursor-pointer"
                />
                
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#050B18] border-l border-[#00D4FF]/10 p-6 z-[101] shadow-2xl flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#00D4FF]/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse"></span>
                        <h3 className="text-sm font-display font-extrabold text-[#F0F6FF] tracking-wider uppercase">
                          System Preferences
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => { audio.playClick(); setIsSettingsOpen(false); }}
                        className="text-[#4A6080] hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold uppercase"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono tracking-widest text-[#4A6080] uppercase block">
                          Visual Interface Theme
                        </span>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#050B18]/80 border border-[#00D4FF]/10 rounded-xl">
                          <button
                            type="button"
                            onClick={() => {
                              audio.playClick();
                              setTheme('dark');
                              localStorage.setItem('pref_theme', 'dark');
                              addToast('Dark Theme configured successfully', 'success');
                            }}
                            className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              theme === 'dark'
                                ? 'bg-[#00D4FF] text-[#050B18]'
                                : 'text-[#4A6080] hover:text-white'
                            }`}
                          >
                            Dark Slate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              audio.playClick();
                              setTheme('light');
                              localStorage.setItem('pref_theme', 'light');
                              addToast('Light Theme configured successfully', 'success');
                            }}
                            className={`py-2 text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                              theme === 'light'
                                ? 'bg-[#00D4FF] text-[#050B18]'
                                : 'text-[#4A6080] hover:text-white'
                            }`}
                          >
                            Vercel Light
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#00D4FF]/5 bg-[#050B18]/40">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono tracking-widest text-[#F0F6FF] uppercase block font-bold">
                            Reduce Motion
                          </span>
                          <span className="text-[9px] text-[#4A6080] leading-relaxed block max-w-[180px]">
                            Disables the WebGL 3D particle background to conserve CPU resources.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            audio.playClick();
                            const next = !reduceAnimation;
                            setReduceAnimation(next);
                            localStorage.setItem('pref_reduce_animation', String(next));
                            addToast(next ? 'Animations disabled' : 'Animations enabled', 'info');
                          }}
                          className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                            reduceAnimation ? 'bg-[#00D4FF]' : 'bg-[#4A6080]/20'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-[#050B18] transition-transform ${
                            reduceAnimation ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#00D4FF]/5 bg-[#050B18]/40">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono tracking-widest text-[#F0F6FF] uppercase block font-bold">
                            Sound FX
                          </span>
                          <span className="text-[9px] text-[#4A6080] leading-relaxed block max-w-[180px]">
                            Enable auditory confirmation clicks and launch success signals.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !isMuted;
                            setIsMuted(next);
                            audio.toggleMute();
                            addToast(next ? 'Sound effects muted' : 'Sound effects unmuted', 'info');
                          }}
                          className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${
                            !isMuted ? 'bg-[#00D4FF]' : 'bg-[#4A6080]/20'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-[#050B18] transition-transform ${
                            !isMuted ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-[#4A6080] text-center pt-6 border-t border-[#00D4FF]/5">
                    Multi-Bot Host Engine  —  v3.0.0
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Custom Toast Notifications Container */}
          <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-4 rounded-xl border flex items-center gap-3 shadow-xl backdrop-blur-md pointer-events-auto ${
                    toast.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : toast.type === 'error'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-[#050B18]/90 border-[#00D4FF]/20 text-[#F0F6FF]'
                  }`}
                >
                  <span className="flex-1 text-xs font-mono font-medium leading-relaxed">
                    {toast.message}
                  </span>
                  <button
                    type="button"
                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                    className="text-[#4A6080] hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase font-mono px-1.5 py-0.5 rounded border border-transparent hover:border-[#4A6080]/30"
                  >
                    Dismiss
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Vercel-Style Integration Multi-Step Wizard Modal */}
          <NewProjectModal
            isOpen={isNewProjectOpen}
            onClose={() => {
              setIsNewProjectOpen(false);
            }}
            repos={repos}
            isFetchingRepos={isFetchingRepos}
            githubToken={githubToken || 'demo_github_token'}
            onDeploySuccess={() => {
              fetchSavedBots().then((list) => {
                if (list && list.length > 0) {
                  fetchGitHubStatuses(list);
                }
              });
            }}
          />

          {/* Workflow logs interactive drawer modal */}
          {activeLogsProject && (
            <LogsViewer
              repoName={activeLogsProject}
              githubToken={githubToken || 'demo_github_token'}
              isOpen={true}
              onClose={() => setActiveLogsProject(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
