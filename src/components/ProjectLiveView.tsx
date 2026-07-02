import React from 'react';
import { CheckCircle, ExternalLink } from 'lucide-react';

interface ProjectLiveViewProps {
  deployResult: {
    repo_name?: string;
    botName?: string;
    botUsername?: string;
    botId?: number;
    scriptName?: string;
    deployedAt?: string;
  };
  onClose: () => void;
}

const PaperPlaneIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

const getLanguageLabel = (script?: string) => {
  if (!script) return 'Python • bot.py';
  const entry = script.split(' ').pop() || 'bot.py';
  const isPython = script.toLowerCase().includes('python') || script.toLowerCase().includes('.py');
  return `${isPython ? 'Python' : 'Node.js'} • ${entry}`;
};

const formatDeployedAt = (dateString?: string) => {
  if (!dateString) return 'Today';
  const d = new Date(dateString);
  const now = new Date();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return `Today at ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  } else {
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${timeStr}`;
  }
};

export default function ProjectLiveView({ deployResult, onClose }: ProjectLiveViewProps) {
  const botUsername = deployResult.botUsername;
  const telegramUrl = botUsername ? `https://t.me/${botUsername}` : 'https://t.me';
  
  return (
    <div className="space-y-8 py-4 flex flex-col items-center text-center max-w-full" id="project-live-view-container">
      {/* Glow check icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl scale-125"></div>
        <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 relative">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
      </div>

      {/* Hero success message */}
      <div className="space-y-2">
        <h3 className="text-2xl font-display font-extrabold text-white tracking-tight uppercase">
          Project is Live
        </h3>
        <p className="text-xs text-[#4A6080] max-w-sm mx-auto leading-relaxed">
          Your Telegram daemon has been successfully provisioned. Real-time pooling cycles are now active.
        </p>
      </div>

      {/* Deployment summary card */}
      <div className="w-full max-w-md p-5 rounded-2xl border border-[#00D4FF]/10 bg-[#050B18]/60 space-y-1.5 text-left font-mono text-[11px] overflow-hidden" id="live-info-table">
        
        {/* Row 1: DEPLOYMENT STATE */}
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-1.5 min-[400px]:gap-4 py-3 border-b border-[#00D4FF]/5 min-h-[44px]">
          <span className="text-[#4A6080] shrink-0">DEPLOYMENT STATE:</span>
          <span className="text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[9px] flex items-center gap-1 w-fit">
            ACTIVE (24X7) ✓
          </span>
        </div>

        {/* Row 2: BOT TELEGRAM ID */}
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-1.5 min-[400px]:gap-4 py-3 border-b border-[#00D4FF]/5 min-h-[44px]">
          <span className="text-[#4A6080] shrink-0">BOT TELEGRAM ID:</span>
          {botUsername ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold select-text min-h-[30px]"
            >
              @{botUsername} ✓
              <ExternalLink className="w-3.5 h-3.5 text-[#00D4FF]" />
            </a>
          ) : (
            <span className="text-[#4A6080] italic">Not configured</span>
          )}
        </div>

        {/* Row 3: BOT NAME */}
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-1.5 min-[400px]:gap-4 py-3 border-b border-[#00D4FF]/5 min-h-[44px]">
          <span className="text-[#4A6080] shrink-0">BOT NAME:</span>
          <span className="text-white font-bold truncate select-text">
            {deployResult.botName || 'Telegram Bot'}
          </span>
        </div>

        {/* Row 4: GITHUB REPOSITORY */}
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-1.5 min-[400px]:gap-4 py-3 border-b border-[#00D4FF]/5 min-h-[44px]">
          <span className="text-[#4A6080] shrink-0">GITHUB REPOSITORY:</span>
          <span className="text-white truncate select-text max-w-full sm:max-w-[200px]" title={deployResult.repo_name}>
            {deployResult.repo_name}
          </span>
        </div>

        {/* Row 5: LANGUAGE */}
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-1.5 min-[400px]:gap-4 py-3 border-b border-[#00D4FF]/5 min-h-[44px]">
          <span className="text-[#4A6080] shrink-0">LANGUAGE:</span>
          <span className="text-purple-400 font-bold select-text">
            {getLanguageLabel(deployResult.scriptName)}
          </span>
        </div>

        {/* Row 6: DEPLOYED AT */}
        <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between gap-1.5 min-[400px]:gap-4 py-3 min-h-[44px]">
          <span className="text-[#4A6080] shrink-0">DEPLOYED AT:</span>
          <span className="text-[#F0F6FF] select-text">
            {formatDeployedAt(deployResult.deployedAt)}
          </span>
        </div>

      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <button
          onClick={() => window.open(telegramUrl, '_blank')}
          className="w-full h-[48px] rounded-xl bg-[#00D4FF] hover:bg-[#00D4FF]/90 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] text-[#050B18] font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
          id="launch-telegram-bot-btn"
        >
          <PaperPlaneIcon />
          {botUsername ? 'LAUNCH TELEGRAM BOT' : 'OPEN TELEGRAM'}
        </button>
        
        <button
          onClick={onClose}
          className="w-full h-[48px] rounded-xl border border-[#00D4FF]/15 hover:border-[#00D4FF]/35 hover:bg-[#00D4FF]/5 text-[#4A6080] hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0"
          id="return-dashboard-btn"
        >
          Return To Dashboard
        </button>
      </div>
    </div>
  );
}
