import React from 'react';
import { Bot } from '../types';
import { Cpu, Play, Pause, Trash2, Send, Link, Bot as BotIcon, Layers } from 'lucide-react';
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
  if (behavior === 'welcome') return 'Welcome / Support Bot';
  if (behavior === 'feedback') return 'Feedback / Contact Bot';
  if (behavior === 'echo') return 'Echo / Auto-Reply Bot';
  return behavior || 'Welcome / Support Bot';
};

export default function ActiveBots({
  bots,
  selectedBotId,
  onSelectBot,
  onToggleStatus,
  onDeleteBot,
  onSendTestWebhook,
}: ActiveBotsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            Active Webhook Nodes
          </h2>
          <p className="text-xs text-slate-400">
            Active bots listening to Telegram update webhooks 24/7.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/80 border border-purple-500/20 rounded-full text-[10px] font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          <span>SYSTEM LOAD: NOMINAL</span>
        </div>
      </div>

      {bots.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center border-dashed border-purple-500/20 max-w-lg mx-auto">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping"></div>
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              <Cpu className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No Active Webhook Nodes</h3>
          <p className="text-xs text-slate-400 mb-6">
            Enter your Telegram bot credentials below to launch a serverless listener instance instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => onSelectBot(bot.id)}
                  className={`relative group cursor-pointer transition-all duration-300 rounded-2xl p-5 border overflow-hidden ${
                    isSelected
                      ? 'bg-purple-950/20 border-purple-500/50 glow-purple'
                      : 'glass-panel border-slate-900 hover:border-purple-500/30 hover:bg-slate-900/40'
                  }`}
                >
                  {/* Decorative background grid and neon orb */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-purple-500/5 to-transparent rounded-full -mr-10 -mt-10 group-hover:from-purple-500/10 transition-all pointer-events-none"></div>
                  
                  {/* Neon orbiting accent inside the card to look like a 3D node */}
                  <div className="absolute top-3 right-3 flex items-center justify-center">
                    <span className="relative flex h-3 w-3">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-purple-400' : 'bg-rose-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-purple-500' : 'bg-rose-500'}`}></span>
                    </span>
                  </div>

                  {/* Node Heading */}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="relative flex-shrink-0">
                      {/* Orbit Ring */}
                      <div className={`absolute -inset-1 rounded-xl opacity-30 animate-rotate-slow border border-dashed ${isOnline ? 'border-purple-400' : 'border-rose-400'}`}></div>
                      <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-white font-display font-bold text-sm bg-linear-to-b ${
                        isOnline ? 'from-slate-900 to-slate-950 border border-purple-500/20' : 'from-slate-900 to-slate-950 border border-slate-800'
                      }`}>
                        <BotIcon className="w-5 h-5 text-purple-400" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-sm text-white truncate group-hover:text-purple-400 transition-colors">
                        @{bot.username}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] font-mono text-purple-400 truncate">
                          {getBotTypeLabel(bot.behavior)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bot Credentials Summary */}
                  <div className="space-y-2 mb-5 font-mono text-[10px] bg-slate-950/60 p-3 rounded-lg border border-slate-900">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">SECRET_TOKEN:</span>
                      <span className="text-slate-300 font-semibold truncate max-w-[140px]" title={bot.token}>
                        {bot.token.substring(0, 10)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-sans">HOOK_URL:</span>
                      <span className="text-purple-400/80 truncate max-w-[140px]" title={`https://${bot.vercelDomain}/api/webhook/${bot.token}/${bot.behavior}`}>
                        /api/webhook/{bot.token.substring(0, 6)}.../{bot.behavior}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-5 text-center">
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 font-sans">Uptime Guarantee</p>
                      <p className="text-xs font-mono font-semibold text-slate-300 mt-0.5">24/7 (100%)</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2">
                      <p className="text-[10px] text-slate-500 font-sans">Requests Handled</p>
                      <p className="text-xs font-mono font-semibold text-slate-300 mt-0.5">{bot.request_count}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(bot.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all ${
                          isOnline
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'
                        }`}
                        title={isOnline ? 'Pause Webhook Endpoint' : 'Resume Webhook Endpoint'}
                      >
                        {isOnline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBot(bot.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                        title="Delete Webhook Configuration"
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
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-sans font-medium text-xs transition-all ${
                        isOnline
                          ? 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-102 cursor-pointer shadow-lg shadow-purple-500/15'
                          : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      Trigger /start
                    </button>
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
