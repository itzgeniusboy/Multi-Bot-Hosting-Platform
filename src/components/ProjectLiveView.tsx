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
    <div className="space-y-6 py-2 flex flex-col items-center text-center max-w-full" id="project-live-view-container">
      {/* Glow check icon */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl scale-110"></div>
        <div className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#3FB950] relative">
          <CheckCircle className="w-12 h-12 text-[#3FB950]" />
        </div>
      </div>

      {/* Hero success message */}
      <div className="space-y-1">
        <h3 className="text-[20px] font-bold text-[#F0F6FC] tracking-tight uppercase">
          Project is Live
        </h3>
        <p className="text-[13px] text-[#8B949E] max-w-sm mx-auto truncate">
          Your Telegram daemon is now successfully provisioned and active.
        </p>
      </div>

      {/* Deployment summary card */}
      <div className="w-full max-w-md p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0D1117] space-y-0 text-left font-mono" id="live-info-table">
        
        {/* Row 1: DEPLOYMENT STATE */}
        <div className="flex items-center justify-between py-0 h-10 border-b border-[rgba(255,255,255,0.04)]">
          <span className="text-[12px] text-[#8B949E]">DEPLOYMENT STATE:</span>
          <span className="text-[#3FB950] font-bold uppercase tracking-wider bg-[#3FB950]/10 border border-[#3FB950]/20 px-2 py-0.5 rounded-md text-[9px] flex items-center gap-1 select-none">
            ACTIVE (24X7) ✓
          </span>
        </div>

        {/* Row 2: BOT TELEGRAM ID */}
        <div className="flex items-center justify-between py-0 h-10 border-b border-[rgba(255,255,255,0.04)]">
          <span className="text-[12px] text-[#8B949E]">BOT TELEGRAM ID:</span>
          {botUsername ? (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#00D4FF] hover:text-cyan-300 flex items-center gap-1 font-bold text-[13px] transition-colors"
            >
              @{botUsername} ✓
              <ExternalLink className="w-3 h-3 text-[#00D4FF]" />
            </a>
          ) : (
            <span className="text-[#8B949E] italic text-[13px]">Not configured</span>
          )}
        </div>

        {/* Row 3: BOT NAME */}
        <div className="flex items-center justify-between py-0 h-10 border-b border-[rgba(255,255,255,0.04)]">
          <span className="text-[12px] text-[#8B949E]">BOT NAME:</span>
          <span className="text-[#F0F6FC] font-semibold text-[13px] truncate max-w-[200px]">
            {deployResult.botName || 'Telegram Bot'}
          </span>
        </div>

        {/* Row 4: GITHUB REPOSITORY */}
        <div className="flex items-center justify-between py-0 h-10 border-b border-[rgba(255,255,255,0.04)]">
          <span className="text-[12px] text-[#8B949E]">GITHUB REPOSITORY:</span>
          <span className="text-[#F0F6FC] font-semibold text-[13px] truncate max-w-[200px]" title={deployResult.repo_name}>
            {deployResult.repo_name}
          </span>
        </div>

        {/* Row 5: LANGUAGE */}
        <div className="flex items-center justify-between py-0 h-10 border-b border-[rgba(255,255,255,0.04)]">
          <span className="text-[12px] text-[#8B949E]">LANGUAGE:</span>
          <span className="text-purple-400 font-semibold text-[13px]">
            {getLanguageLabel(deployResult.scriptName)}
          </span>
        </div>

        {/* Row 6: DEPLOYED AT */}
        <div className="flex items-center justify-between py-0 h-10">
          <span className="text-[12px] text-[#8B949E]">DEPLOYED AT:</span>
          <span className="text-[#F0F6FC] text-[13px]">
            {formatDeployedAt(deployResult.deployedAt)}
          </span>
        </div>

      </div>

      {/* Action buttons - Stacked layout */}
      <div className="flex flex-col items-center gap-2 w-full max-w-md pb-0">
        <button
          onClick={() => window.open(telegramUrl, '_blank')}
          className="w-full h-12 rounded-xl bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#080C14] font-sans text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
          id="launch-telegram-bot-btn"
        >
          <PaperPlaneIcon />
          <span>{botUsername ? 'LAUNCH TELEGRAM BOT' : 'OPEN TELEGRAM'}</span>
        </button>
        
        <button
          onClick={onClose}
          className="w-full h-8 flex items-center justify-center text-[#8B949E] hover:text-[#00D4FF] font-sans text-xs font-semibold tracking-wider hover:underline transition-colors cursor-pointer bg-transparent border-none mt-1"
          id="return-dashboard-btn"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
