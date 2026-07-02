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
import { Project } from './types';
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

interface ProjectCardProps {
  project: Project;
  botActionLoading: string | null;
  activeSecretsProject: string | null;
  setActiveSecretsProject: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveLogsProject: React.Dispatch<React.SetStateAction<string | null>>;
  handleStopBot: (repoName: string) => void;
  handleStartBot: (repoName: string) => void;
  handleRestartBot: (repoName: string) => void;
  handleDeleteProject: (repoName: string) => void;
  handleSaveInlineSecret: (repoName: string) => void;
  inlineSecretKey: string;
  setInlineSecretKey: React.Dispatch<React.SetStateAction<string>>;
  inlineSecretValue: string;
  setInlineSecretValue: React.Dispatch<React.SetStateAction<string>>;
  isSavingSecret: boolean;
  index: number;
}

function ProjectCard({
  project,
  botActionLoading,
  activeSecretsProject,
  setActiveSecretsProject,
  setActiveLogsProject,
  handleStopBot,
  handleStartBot,
  handleRestartBot,
  handleDeleteProject,
  handleSaveInlineSecret,
  inlineSecretKey,
  setInlineSecretKey,
  inlineSecretValue,
  setInlineSecretValue,
  isSavingSecret,
  index
}: ProjectCardProps) {
  const isOnline = project.status === 'online';
  const isQueued = project.status === 'queued';
  const isFailed = project.status === 'failed';
  const isOffline = project.status === 'offline';
  const isLoadingAction = botActionLoading === project.repo_name;
  const isSecretsOpen = activeSecretsProject === project.repo_name;

  const tiltRef = use3DTilt(true);

  const getUptimeText = (startedAt: string | undefined) => {
    if (!isOnline || !startedAt) return 'Offline';
    const diff = Date.now() - new Date(startedAt).getTime();
    if (diff <= 0) return 'Just started';
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    
    if (days > 0) return `${days}d ${hrs % 24}h`;
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  return (
    <div
      ref={tiltRef}
      style={{ animationDelay: `${index * 80}ms` }}
      className="animate-card-fade-in premium-glass-card rounded-2xl p-5 border border-[#00D4FF]/10 bg-[#050B18]/40 flex flex-col justify-between min-h-[260px] relative overflow-hidden group hover:border-[#00D4FF]/30 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00D4FF]/5 to-transparent rounded-full filter blur-xl pointer-events-none"></div>

      <div className="space-y-4">
        {/* Header: Name and Status Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-[#F0F6FF] tracking-wide truncate max-w-[130px]" title={project.repo_name}>
            {stripEmojis(project.repo_name.split('/')[1] || project.repo_name)}
          </span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' :
              isQueued ? 'bg-cyan-400 animate-pulse' :
              isFailed ? 'bg-rose-500' : 'bg-slate-500'
            }`}></span>
            <span className={`text-[9px] font-mono uppercase font-bold tracking-widest ${
              isOnline ? 'text-emerald-400' :
              isQueued ? 'text-cyan-400' :
              isFailed ? 'text-rose-400' : 'text-[#4A6080]'
            }`}>
              {project.status || 'offline'}
            </span>
          </div>
        </div>

        {/* Details Namespace & Branch Link */}
        <div className="space-y-1">
          <a
            href={`https://github.com/${project.repo_name}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-[#4A6080] hover:text-[#00D4FF] transition-all flex items-center gap-1.5"
          >
            github.com/{stripEmojis(project.repo_name)}
            <ExternalLink className="w-3 h-3 text-[#4A6080]" />
          </a>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase font-semibold">
              {project.script_name || 'python main.py'}
            </span>
            <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-[#00D4FF]/5 text-[#00D4FF] border border-[#00D4FF]/10 uppercase font-semibold">
              {project.health || 'healthy'}
            </span>
          </div>
        </div>

        {/* Inline Uptime */}
        <div className="pt-3 border-t border-[#00D4FF]/5 grid grid-cols-2 gap-2 font-mono text-[10px]">
          <div>
            <span className="text-[#4A6080] block">TRIGGER LOAD</span>
            <span className="text-white font-bold">{project.request_count || 0} hits</span>
          </div>
          <div>
            <span className="text-[#4A6080] block">ACTIVE UPTIME</span>
            <span className={`font-bold ${isOnline ? 'text-emerald-400' : 'text-[#4A6080]'}`}>
              {getUptimeText(project.started_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible inline Secrets Form */}
      {isSecretsOpen && (
        <div className="mt-4 pt-3 border-t border-[#00D4FF]/10 bg-[#050B18]/60 p-3 rounded-xl space-y-2.5 text-left">
          <span className="text-[9px] font-mono text-[#00D4FF] uppercase tracking-wider block font-bold">
            Configure Secret Key
          </span>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="SECRET_KEY_NAME"
              value={inlineSecretKey}
              onChange={(e) => setInlineSecretKey(e.target.value.toUpperCase())}
              className="w-full bg-[#050B18] border border-[#00D4FF]/10 rounded-lg px-2.5 py-1 text-[10px] font-mono text-white outline-none focus:border-[#00D4FF] placeholder:text-[#4A6080]"
            />
            <input
              type="password"
              placeholder="Enter secret value"
              value={inlineSecretValue}
              onChange={(e) => setInlineSecretValue(e.target.value)}
              className="w-full bg-[#050B18] border border-[#00D4FF]/10 rounded-lg px-2.5 py-1 text-[10px] font-mono text-white outline-none focus:border-[#00D4FF] placeholder:text-[#4A6080]"
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isSavingSecret || !inlineSecretKey.trim() || !inlineSecretValue.trim()}
                onClick={() => handleSaveInlineSecret(project.repo_name)}
                className="flex-1 py-1.5 rounded-lg bg-[#00D4FF] text-[#050B18] text-[9px] font-mono font-bold uppercase hover:bg-[#00D4FF]/80 transition-all cursor-pointer disabled:opacity-40"
              >
                {isSavingSecret ? 'Saving...' : 'Save Secret'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInlineSecretKey('');
                  setInlineSecretValue('');
                  setActiveSecretsProject(null);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-[#4A6080]/20 text-[#4A6080] text-[9px] font-mono font-bold uppercase hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Controls Actions bar */}
      {!isSecretsOpen && (
        <div className="space-y-3 pt-4 border-t border-[#00D4FF]/5 mt-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <button
                type="button"
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
                type="button"
                onClick={() => handleStartBot(project.repo_name)}
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
              type="button"
              onClick={() => handleRestartBot(project.repo_name)}
              disabled={isLoadingAction}
              className="p-2 rounded-xl border border-[#00D4FF]/25 bg-[#00D4FF]/5 text-[#00D4FF] hover:bg-[#00D4FF]/15 transition-all cursor-pointer disabled:opacity-40"
              title="Restart Workflow"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoadingAction ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 text-[10px] font-mono text-[#4A6080]">
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setActiveSecretsProject(project.repo_name);
              }}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Key className="w-3 h-3" />
              Secrets
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playClick();
                setActiveLogsProject(project.repo_name);
              }}
              className="hover:text-[#00D4FF] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Terminal className="w-3 h-3" />
              Live Logs
            </button>
            <button
              type="button"
              onClick={() => handleDeleteProject(project.repo_name)}
              className="hover:text-rose-400 transition-colors cursor-pointer"
              title="Untrack Repository"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
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
  const [githubToken, setGithubToken] = useState<string | null>(localStorage.getItem('github_token'));
  const [gitHubUser, setGitHubUser] = useState<any>(null);
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
      }

      const reposResp = await fetch(getAbsoluteUrl(`/api/repos?token=${token}`));
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

  // Fetch projects from real data endpoints
  const fetchProjectsAndStats = async () => {
    try {
      const projResp = await fetch(getAbsoluteUrl('/api/projects'));
      if (projResp.ok) {
        const projData = await projResp.json();
        setActiveProjects(projData);
      }
    } catch (err) {
      console.error('Failed to fetch stats/projects:', err);
    }
  };

  // Poll active projects status every 8 seconds
  useEffect(() => {
    if (githubToken) {
      fetchProjectsAndStats();
      const interval = setInterval(() => {
        fetchProjectsAndStats();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [githubToken]);

  // Initial Boot loader delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    if (githubToken) {
      fetchGitHubUserAndRepos(githubToken);
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [githubToken]);

  const handleConnectGitHub = async () => {
    audio.playClick();
    addToast('Opening GitHub OAuth Gateway...', 'info');
    try {
      const resp = await fetch(getAbsoluteUrl('/api/login'));
      if (resp.ok) {
        const data = await resp.json();
        if (data.url) {
          const width = 600;
          const height = 700;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;
          const popup = window.open(
            data.url,
            'github_oauth_popup',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
          );
          if (!popup) {
            addToast('Popup blocked! Please allow popups for this site to log in.', 'error');
          }
        } else {
          throw new Error('No authentication redirect URL found.');
        }
      } else {
        const errText = await resp.text();
        throw new Error(errText || 'Authentication gateway offline.');
      }
    } catch (e: any) {
      console.error('GitHub OAuth redirect error:', e);
      addToast(e.message || 'Failed to initiate OAuth', 'error');
    }
  };

  const handleDisconnectClick = async () => {
    audio.playClick();
    if (!confirm('Are you absolutely sure you want to disconnect this node? Your active dashboard projects will be cleared.')) return;
    
    setIsDisconnecting(true);
    addToast('Disconnecting from GitHub...', 'info');
    
    try {
      await new Promise(r => setTimeout(r, 1000));
      localStorage.removeItem('github_token');
      setGithubToken(null);
      setGitHubUser(null);
      setRepos([]);
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

  const handleSaveManualToken = (token: string) => {
    localStorage.setItem('github_token', token);
    setGithubToken(token);
    addToast('GitHub token imported successfully.', 'success');
  };

  // Sync token from direct callback query
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('github_token', token);
      setGithubToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
      addToast('GitHub session restored.', 'success');
    }
  }, []);

  // Listen for success message from popup (after callback completes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('vercel.app')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data.token;
        if (token) {
          localStorage.setItem('github_token', token);
          setGithubToken(token);
          audio.playSuccess();
          addToast('Authorized successfully via GitHub OAuth!', 'success');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Bot Node Action controls
  const handleStopBot = async (repoName: string) => {
    audio.playClick();
    setBotActionLoading(repoName);
    addToast(`Requesting workflow run stop for ${repoName}...`, 'info');
    try {
      const resp = await fetch(getAbsoluteUrl('/api/workflow/stop'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: repoName,
          github_token: githubToken || 'demo_p_token'
        })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
        audio.playSuccess();
        addToast(`Workflow run stopped successfully for ${repoName}.`, 'success');
      } else {
        addToast('Failed to stop workflow run.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to stop bot:', err);
      addToast('Connection failed: ' + err.message, 'error');
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleStartBot = async (repoName: string) => {
    audio.playClick();
    setBotActionLoading(repoName);
    addToast(`Triggering start workflow run for ${repoName}...`, 'info');
    try {
      const resp = await fetch(getAbsoluteUrl('/api/workflow/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: repoName,
          github_token: githubToken || 'demo_p_token'
        })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
        audio.playSuccess();
        addToast(`Workflow run started successfully for ${repoName}.`, 'success');
      } else {
        addToast('Failed to trigger workflow run.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to start bot:', err);
      addToast('Connection failed: ' + err.message, 'error');
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleRestartBot = async (repoName: string) => {
    audio.playClick();
    setBotActionLoading(repoName);
    addToast(`Requesting workflow run restart for ${repoName}...`, 'info');
    try {
      const resp = await fetch(getAbsoluteUrl('/api/workflow/restart'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: repoName,
          github_token: githubToken || 'demo_p_token'
        })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
        audio.playSuccess();
        addToast(`Workflow run restarted successfully for ${repoName}.`, 'success');
      } else {
        addToast('Failed to restart workflow.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to restart bot:', err);
      addToast('Connection failed: ' + err.message, 'error');
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleDeleteProject = async (repoName: string) => {
    audio.playClick();
    if (!confirm('Are you sure you want to remove this project from your dashboard? This will untrack it.')) return;
    setBotActionLoading(repoName);
    addToast(`Untracking ${repoName}...`, 'info');
    try {
      const resp = await fetch(getAbsoluteUrl('/api/projects/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_name: repoName })
      });
      if (resp.ok) {
        await fetchProjectsAndStats();
        audio.playSuccess();
        addToast('Project untracked from dashboard successfully.', 'success');
      } else {
        addToast('Failed to untrack project.', 'error');
      }
    } catch (err: any) {
      console.error('Failed to delete project:', err);
      addToast('Connection failed: ' + err.message, 'error');
    } finally {
      setBotActionLoading(null);
    }
  };

  const handleSaveInlineSecret = async (repoName: string) => {
    if (!inlineSecretKey.trim() || !inlineSecretValue.trim()) return;
    setIsSavingSecret(true);
    addToast(`Encrypting and committing secret ${inlineSecretKey} to GitHub...`, 'info');
    try {
      const formattedKey = inlineSecretKey.toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();
      const resp = await fetch(getAbsoluteUrl('/api/secrets/set'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo_name: repoName,
          github_token: githubToken,
          secret_name: formattedKey,
          secret_value: inlineSecretValue.trim()
        })
      });
      if (resp.ok) {
        audio.playSuccess();
        addToast(`Secret ${formattedKey} successfully saved to GitHub.`, 'success');
        setInlineSecretKey('');
        setInlineSecretValue('');
        setActiveSecretsProject(null);
      } else {
        addToast('Failed to save secret to GitHub.', 'error');
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

  const runningNodesCount = activeProjects.filter(p => p.status === 'online').length;

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
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4A6080]" />
                      <input
                        type="text"
                        placeholder="Search active bots..."
                        value={botSearch}
                        onChange={(e) => setBotSearch(e.target.value)}
                        className="w-full bg-[#050B18] border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white font-mono outline-none transition-all placeholder:text-[#4A6080]"
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
                            className={`flex-1 sm:flex-initial text-center px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
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

                  <div className="flex items-center justify-between pb-4 border-b border-[#00D4FF]/5">
                    <h3 className="text-sm font-display font-extrabold text-[#F0F6FF] tracking-wider uppercase">
                      Tracked Bot Repositories
                    </h3>
                    <span className="text-[10px] font-mono text-[#00D4FF] font-semibold">
                      {activeProjects.length} Repos Registered
                    </span>
                  </div>

                  {/* Multi-bot Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Add Project Card Button */}
                    <AddProjectCard onClick={() => { audio.playClick(); setIsNewProjectOpen(true); }} />

                    {/* Active Deployed Project Cards */}
                    {activeProjects
                      .filter((project) => {
                        const matchesSearch = project.repo_name.toLowerCase().includes(botSearch.toLowerCase());
                        if (!matchesSearch) return false;
                        if (botFilter === 'all') return true;
                        return project.status === botFilter;
                      })
                      .map((project, idx) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          botActionLoading={botActionLoading}
                          activeSecretsProject={activeSecretsProject}
                          setActiveSecretsProject={setActiveSecretsProject}
                          setActiveLogsProject={setActiveLogsProject}
                          handleStopBot={handleStopBot}
                          handleStartBot={handleStartBot}
                          handleRestartBot={handleRestartBot}
                          handleDeleteProject={handleDeleteProject}
                          handleSaveInlineSecret={handleSaveInlineSecret}
                          inlineSecretKey={inlineSecretKey}
                          setInlineSecretKey={setInlineSecretKey}
                          inlineSecretValue={inlineSecretValue}
                          setInlineSecretValue={setInlineSecretValue}
                          isSavingSecret={isSavingSecret}
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
              fetchProjectsAndStats();
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
