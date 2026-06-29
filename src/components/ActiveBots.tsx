import React from 'react';
import { Bot } from '../types';
import { Cpu, Play, Pause, Trash2, Send, Layers, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveBotsProps {
  bots: Bot[];
  selectedBotId: string;
  onSelectBot: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDeleteBot: (id: string) => void;
  onSendTestWebhook: (bot: Bot, text: string) => void;
}

const getBotTypeLabel = (behavior: string) => {
  if (behavior === 'welcome') return 'Support agent';
  if (behavior === 'feedback') return 'Feedback agent';
  if (behavior === 'echo') return 'Auto-reply agent';
  return behavior || 'Support agent';
};

export default function ActiveBots({
  bots,
  selectedBotId,
  onSelectBot,
  onToggleStatus,
  onDeleteBot,
  onSendTestWebhook,
}: ActiveBotsProps) {

  // JS Mouse Move Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = -y * (10 / (rect.height / 2));
    const rotateY = x * (10 / (rect.width / 2));
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">// INFRASTRUCTURE</span>
          <h2 className="text-2xl font-display font-bold text-[#F0F6FF] tracking-tight flex items-center gap-2 mt-1">
            <Cpu className="w-5 h-5 text-[#00D4FF]" />
            Active Webhook Nodes
          </h2>
          <p className="text-xs text-[#4A6080] font-sans mt-1">
            Active bots listening to Telegram update webhooks 24/7 on our low-latency gateway.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0A1628]/80 border border-[#00D4FF]/10 rounded-full text-[10px] font-mono text-[#F0F6FF] self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-[#00FF87] animate-pulse"></span>
          <span>SYSTEM STATE: NOMINAL</span>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="premium-glass-card rounded-2xl p-10 text-center max-w-lg mx-auto relative overflow-hidden">
          <div className="absolute inset-0 card-grid-pattern opacity-10"></div>
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 bg-[#00D4FF]/10 rounded-full animate-pulse"></div>
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#0A1628] border border-[#00D4FF]/20 text-[#00D4FF]">
              <Server className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-[#F0F6FF] mb-2 font-display">No Webhook Nodes Registered</h3>
          <p className="text-xs text-[#4A6080] mb-6 font-sans">
            Launch a Telegram bot with the form below to initiate an active webhook instance on the server.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-4">
          <AnimatePresence mode="popLayout">
            {bots.map((bot, index) => {
              const isSelected = selectedBotId === bot.id;
              const isOnline = bot.status === 'online';

              return (
                <motion.div
                  key={bot.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -15 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => onSelectBot(bot.id)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className={`server-rack-card rack-stack cursor-pointer ${
                    isSelected ? 'active-rack' : ''
                  } ${isOnline ? 'active-rack' : 'stopped-rack'}`}
                >
                  <div className="flex h-full min-h-[220px]">
                    {/* Pulsing Status Bar on Left Edge */}
                    <div className={isOnline ? 'pulsing-bar-live' : 'pulsing-bar-stopped'} />

                    {/* Node Card Details */}
                    <div className="flex-1 p-5 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>

                      <div>
                        {/* Title and Badge Header */}
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <div className="min-w-0">
                            <h3 className="font-display font-semibold text-sm text-[#F0F6FF] truncate">
                              @{bot.username}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Layers className="w-3.5 h-3.5 text-[#00D4FF]" />
                              <span className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-wider">
                                {getBotTypeLabel(bot.behavior)}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-medium flex items-center gap-1.5 ${
                            isOnline 
                              ? 'bg-[#00FF87]/10 text-[#00FF87] border border-[#00FF87]/20' 
                              : 'bg-[#FF3B6B]/10 text-[#FF3B6B] border border-[#FF3B6B]/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#00FF87]' : 'bg-[#FF3B6B]'}`} />
                            {isOnline ? '• Live' : '• Stopped'}
                          </span>
                        </div>

                        {/* Connection Details */}
                        <div className="space-y-2 mb-4 font-mono text-[10px] bg-[#030812]/80 p-3 rounded-lg border border-[#00D4FF]/5 relative z-10">
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-[#4A6080]">SECRET_TOKEN:</span>
                            <span className="text-[#F0F6FF] truncate font-medium" title={bot.token}>
                              {bot.token.substring(0, 10)}...
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-[#4A6080]">ROUTING:</span>
                            <span className="text-[#00D4FF]/80 truncate font-medium" title={`https://${bot.vercelDomain}/api/webhook/${bot.token}/${bot.behavior}`}>
                              /api/webhook/{bot.token.substring(0, 5)}...
                            </span>
                          </div>
                        </div>

                        {/* Telemetry Grid */}
                        <div className="grid grid-cols-2 gap-3 text-center mb-4 relative z-10">
                          <div className="bg-[#030812]/50 border border-[#00D4FF]/5 rounded-lg p-2">
                            <p className="text-[9px] text-[#4A6080] font-sans">Availability</p>
                            <p className="text-[11px] font-mono font-bold text-[#F0F6FF] mt-0.5">24/7 (100%)</p>
                          </div>
                          <div className="bg-[#030812]/50 border border-[#00D4FF]/5 rounded-lg p-2">
                            <p className="text-[9px] text-[#4A6080] font-sans">Request load</p>
                            <p className="text-[11px] font-mono font-bold text-[#F0F6FF] mt-0.5">{bot.request_count}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#00D4FF]/5 relative z-10">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleStatus(bot.id);
                            }}
                            className={`p-2 rounded-lg border transition-all ${
                              isOnline
                                ? 'bg-[#FF3B6B]/10 text-[#FF3B6B] border-[#FF3B6B]/20 hover:bg-[#FF3B6B]/20'
                                : 'bg-[#00FF87]/10 text-[#00FF87] border-[#00FF87]/20 hover:bg-[#00FF87]/20'
                            }`}
                            title={isOnline ? 'Pause bot webhook node' : 'Resume bot webhook node'}
                          >
                            {isOnline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteBot(bot.id);
                            }}
                            className="p-2 rounded-lg bg-[#FF3B6B]/10 text-[#FF3B6B] border border-[#FF3B6B]/20 hover:bg-[#FF3B6B]/20 transition-all"
                            title="Remove bot configuration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendTestWebhook(bot, '/start');
                          }}
                          disabled={!isOnline}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-sans font-semibold text-xs transition-all ${
                            isOnline
                              ? 'bg-linear-to-r from-[#00D4FF] to-[#7C3AED] text-white hover:scale-[1.03] cursor-pointer shadow-lg shadow-[#00D4FF]/10'
                              : 'bg-[#030812] text-[#4A6080] cursor-not-allowed border border-[#00D4FF]/5'
                          }`}
                        >
                          <Send className="w-3 h-3" />
                          Trigger /start
                        </button>
                      </div>

                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
