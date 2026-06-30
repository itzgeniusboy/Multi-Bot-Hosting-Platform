import React from 'react';
import { CheckCircle, ExternalLink, Github, Send, Terminal, PowerOff, ArrowLeft } from 'lucide-react';

interface ProjectLiveViewProps {
  deployResult: {
    username: string;
    bot_type: string;
    repo_name: string;
    message?: string;
  };
  onClose: () => void;
}

export default function ProjectLiveView({ deployResult, onClose }: ProjectLiveViewProps) {
  const telegramUrl = `https://t.me/${deployResult.username}`;
  
  return (
    <div className="space-y-8 py-4 flex flex-col items-center text-center">
      {/* Glow check icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl scale-125"></div>
        <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 relative">
          <CheckCircle className="w-12 h-12 text-emerald-400" />
        </div>
      </div>

      {/* Hero success message */}
      <div className="space-y-2">
        <h3 className="text-2xl font-display font-extrabold text-white tracking-tight">
          Project is Live
        </h3>
        <p className="text-xs text-[#4A6080] max-w-sm mx-auto leading-relaxed">
          Your Telegram daemon has been successfully provisioned. Real-time pooling cycles are now active.
        </p>
      </div>

      {/* Deployment summary card */}
      <div className="w-full max-w-md p-5 rounded-2xl border border-[#00D4FF]/10 bg-[#050B18]/60 space-y-4 text-left font-mono text-[11px]">
        <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/5">
          <span className="text-[#4A6080]">DEPLOYMENT STATE:</span>
          <span className="text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px]">
            ACTIVE (24x7)
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#4A6080]">BOT TELEGRAM ID:</span>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
          >
            @{deployResult.username}
            <ExternalLink className="w-3 h-3 text-[#4A6080]" />
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#4A6080]">SYSTEM TEMPLATE:</span>
          <span className="text-purple-400 font-bold uppercase text-[10px]">
            {deployResult.bot_type}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#4A6080]">GITHUB REPOSITORY:</span>
          <span className="text-white truncate max-w-[180px]" title={deployResult.repo_name}>
            {deployResult.repo_name}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#4A6080]">WEBHOOK ROUTING:</span>
          <span className="text-[#4A6080] text-[10px]">
            ACTIVE / POLLING
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <a
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full py-3.5 rounded-xl bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#050B18] font-sans text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <Send className="w-3.5 h-3.5 fill-current" />
          Launch Telegram Bot
        </a>
        
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/2 text-[#4A6080] hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Return To Dashboard
        </button>
      </div>
    </div>
  );
}
