import React, { useState } from 'react';
import { Rocket, ShieldAlert, Wand2, RefreshCcw, Cpu } from 'lucide-react';

interface LaunchFormProps {
  onLaunch: (token: string, type: string) => Promise<void>;
  isLaunching: boolean;
}

export default function LaunchForm({ onLaunch, isLaunching }: LaunchFormProps) {
  const [token, setToken] = useState('');
  const [botType, setBotType] = useState('welcome');
  const [error, setError] = useState('');

  const validate = () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Telegram Bot Token is required');
      return false;
    }
    // Standard format validation
    const tokenRegex = /^\d+:[A-Za-z0-9_-]{35,50}$/;
    if (!tokenRegex.test(trimmed) && trimmed !== '827419365:AAH_CyberMindAssistant_DemoSecureKey') {
      setError('Invalid format. Example: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ');
      return false;
    }
    setError('');
    return true;
  };

  const handleLaunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onLaunch(token.trim(), botType);
    setToken('');
  };

  const fillDemoCredentials = () => {
    setToken('827419365:AAH_CyberMindAssistant_DemoSecureKey');
    setError('');
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-900 p-6 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-400" />
            Connect and Launch Bot
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set webhook on Telegram servers to host your bot 24/7 on Serverless Node.
          </p>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 text-xs font-medium hover:bg-purple-500/20 hover:scale-102 cursor-pointer transition-all font-sans"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Auto-fill Demo Bot
        </button>
      </div>

      <form onSubmit={handleLaunchSubmit} className="space-y-5">
        {/* Telegram Bot Token */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Telegram Bot Token</span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Get token from @BotFather</span>
          </label>
          <input
            type="text"
            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              if (error) setError('');
            }}
            className={`w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-purple-500/50 transition-colors font-mono ${
              error ? 'border-rose-500/50' : 'border-slate-850'
            }`}
          />
          {error && (
            <p className="text-[10px] text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {error}
            </p>
          )}
        </div>

        {/* Dropdown Select Menu: Select Bot Template/Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>Select Bot Template / Type</span>
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">Choose pre-built handler logic</span>
          </label>
          <div className="relative">
            <select
              value={botType}
              onChange={(e) => setBotType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-hidden focus:border-purple-500/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="welcome">Welcome / Support Bot (Welcomes users and answers queries)</option>
              <option value="feedback">Feedback / Contact Bot (Collects and forwards feedback)</option>
              <option value="echo">Echo / Auto-Reply Bot (Repeats any text received instantly)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <Cpu className="w-4 h-4 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLaunching}
          className={`w-full py-3 rounded-xl text-sm font-semibold font-sans tracking-wide transition-all ${
            isLaunching
              ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-850'
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 cursor-pointer shadow-lg shadow-purple-500/25 hover:scale-[1.01]'
          }`}
        >
          {isLaunching ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4 animate-spin" />
              Detecting Bot Details & Setting Webhook...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4" />
              Launch Bot Node 24x7
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
