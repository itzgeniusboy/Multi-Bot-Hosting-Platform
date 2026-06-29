import React, { useState } from 'react';
import { Rocket, ShieldAlert, Wand2, Cpu } from 'lucide-react';

interface LaunchFormProps {
  onLaunch: (token: string, type: string) => Promise<void>;
  isLaunching: boolean;
}

export default function LaunchForm({ onLaunch, isLaunching }: LaunchFormProps) {
  const [token, setToken] = useState('');
  const [botType, setBotType] = useState('welcome');
  const [error, setError] = useState('');

  const tokenRegex = /^\d+:[A-Za-z0-9_-]{35,50}$/;
  const isTokenValid = tokenRegex.test(token.trim()) || token.trim() === '827419365:AAH_CyberMindAssistant_DemoSecureKey';

  const validate = () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError('Telegram Bot Token is required');
      return false;
    }
    if (!isTokenValid) {
      setError('Invalid token format. Expected: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ');
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
    <div className="premium-glass-card corner-accent-line rounded-2xl p-8 relative overflow-hidden">
      {/* Decorative inner pattern */}
      <div className="absolute inset-0 card-grid-pattern opacity-10 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">// PROVISIONER</span>
          <h2 className="text-xl font-display font-bold text-[#F0F6FF] flex items-center gap-2 mt-1">
            <Rocket className="w-5 h-5 text-[#00D4FF]" />
            Connect and Launch Bot Node
          </h2>
          <p className="text-xs text-[#4A6080] mt-1 font-sans">
            Register webhook endpoints dynamically to host your automated agents on our serverless edge router.
          </p>
        </div>
        <button
          type="button"
          onClick={fillDemoCredentials}
          className="flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-lg border border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#F0F6FF] text-xs font-semibold hover:bg-[#7C3AED]/20 cursor-pointer transition-all font-sans"
        >
          <Wand2 className="w-3.5 h-3.5 text-[#00D4FF]" />
          Auto-fill Demo Node
        </button>
      </div>

      <form onSubmit={handleLaunchSubmit} className="space-y-8 relative z-10">
        {/* Telegram Bot Token (Bottom-border only, Monospaced) */}
        <div className="floating-label-group">
          <input
            type="text"
            id="bot_token"
            placeholder=" "
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              if (error) setError('');
            }}
            style={isTokenValid ? { boxShadow: '0 0 10px rgba(0, 212, 255, 0.08) inset' } : {}}
            className={`bottom-border-input font-mono tracking-wide ${
              error ? 'border-b-[#FF3B6B]/60 focus:border-b-[#FF3B6B]/60' : 'border-b-[#00D4FF]/20 focus:border-b-transparent'
            }`}
          />
          <label htmlFor="bot_token" className="floating-label font-sans">
            Telegram Bot Token
          </label>
          <span className="focus-underline"></span>
          
          <div className="flex items-center justify-between mt-1 text-[10px] text-[#4A6080]">
            <span>Expected format: 123456789:ABCdef...</span>
            <span className="font-mono">Get from @BotFather</span>
          </div>

          {error && (
            <p className="text-[11px] text-[#FF3B6B] flex items-center gap-1.5 mt-2 font-sans">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}
        </div>

        {/* Dropdown Select Menu (Bottom-border style) */}
        <div className="floating-label-group">
          <select
            id="bot_type"
            value={botType}
            onChange={(e) => setBotType(e.target.value)}
            className="bottom-border-input cursor-pointer font-sans appearance-none pr-8 border-b-[#00D4FF]/20 focus:border-b-transparent"
          >
            <option value="welcome" className="bg-[#0A1628] text-[#F0F6FF]">Welcome / Support Agent (Answers questions and logs tickets)</option>
            <option value="feedback" className="bg-[#0A1628] text-[#F0F6FF]">Feedback / Contact Agent (Collects reviews and forwards comments)</option>
            <option value="echo" className="bg-[#0A1628] text-[#F0F6FF]">Echo / Auto-Reply Agent (Instantly mirrors back custom messages)</option>
          </select>
          <label htmlFor="bot_type" className="floating-label font-sans">
            Select Handler Template
          </label>
          <span className="focus-underline"></span>
          <div className="pointer-events-none absolute right-0 top-3 text-[#00D4FF]">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        {/* Submit button (CTA style with loading spinning arc) */}
        <button
          type="submit"
          disabled={isLaunching}
          className={`w-full py-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider transition-all cta-launch-btn flex items-center justify-center gap-2 text-[#F0F6FF] ${
            isLaunching
              ? 'opacity-80 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isLaunching ? (
            <>
              <span className="spinning-arc-loader"></span>
              Initializing Bot Routing and Testing Serverless Tunnel...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Launch Bot Node
            </>
          )}
        </button>
      </form>
    </div>
  );
}
