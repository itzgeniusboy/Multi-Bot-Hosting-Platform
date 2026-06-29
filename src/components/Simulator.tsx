import React, { useEffect, useRef, useState } from 'react';
import { Bot, LogEntry } from '../types';
import { Terminal, Cpu } from 'lucide-react';

interface SimulatorProps {
  bots: Bot[];
  selectedBotId: string;
  logs: LogEntry[];
  onClearLogs: () => void;
}

// Sub-component for typewriter reveal on the latest log entry message
function LogMessage({ text, isLast }: { text: string; isLast: boolean }) {
  const [displayed, setDisplayed] = useState(isLast ? '' : text);

  useEffect(() => {
    if (isLast) {
      setDisplayed('');
      let current = '';
      let index = 0;
      const interval = setInterval(() => {
        current += text.charAt(index);
        setDisplayed(current);
        index++;
        if (index >= text.length) {
          clearInterval(interval);
        }
      }, 6);
      return () => clearInterval(interval);
    } else {
      setDisplayed(text);
    }
  }, [text, isLast]);

  return <span>{displayed}</span>;
}

export default function Simulator({
  bots,
  selectedBotId,
  logs,
  onClearLogs,
}: SimulatorProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColorClass = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'text-[#00D4FF]';
      case 'WARNING':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-[#FF3B6B]';
      default:
        return 'text-[#4A6080]';
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">// SIMULATOR CONSOLE</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-display font-semibold text-[#F0F6FF] flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00D4FF]" />
          Gateway Server Console Logs
        </h3>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[10px] text-[#F0F6FF] hover:text-[#00D4FF] font-mono flex items-center gap-1 px-3 py-1.5 bg-[#0A1628]/80 border border-[#00D4FF]/10 rounded-lg cursor-pointer transition-colors"
          >
            Clear Console
          </button>
        )}
      </div>

      {/* Terminal View with Scanline Overlay */}
      <div className="terminal-container rounded-2xl p-5 font-mono text-[11px] leading-relaxed overflow-hidden flex flex-col h-[380px] relative">
        <div className="terminal-scanlines" />

        {/* Header Bar with 3 Decorative Traffic Light Dots */}
        <div className="flex items-center justify-between pb-3 border-b border-[#00D4FF]/10 text-[#4A6080] mb-4 relative z-10 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B6B] opacity-80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF87] opacity-80"></span>
            <span className="ml-2 text-[#4A6080] text-[10px]">uvicorn@vercel-serverless-gateway</span>
          </div>
          <span className="text-[9px] bg-[#00D4FF]/10 px-2.5 py-1 rounded-md text-[#00D4FF] font-semibold tracking-wider">
            LIVE TELEMETRY
          </span>
        </div>

        {/* Logs Body */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 relative z-10">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#4A6080] text-center p-6">
              <Cpu className="w-8 h-8 mb-3 text-[#4A6080]/30 animate-pulse" />
              <p className="font-semibold text-[#F0F6FF]">Awaiting gateway hook executions...</p>
              <p className="text-[10px] text-[#4A6080] mt-1 font-sans">
                Trigger webhook /start signals from your active cards to watch live JSON server routing.
              </p>
            </div>
          ) : (
            logs.map((log, index) => {
              const isLast = index === logs.length - 1;
              return (
                <div key={log.id} className="border-b border-[#00D4FF]/5 pb-3">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[#4A6080]">[{log.timestamp}]</span>
                    <span className={`font-bold ${getLogColorClass(log.level)}`}>
                      [{log.level}]
                    </span>
                    <span className="text-[#7C3AED] font-semibold truncate max-w-[250px]">
                      {log.method} {log.path}
                    </span>
                    <span className={`font-mono font-bold ${log.status_code < 400 ? 'text-[#00FF87]' : 'text-[#FF3B6B]'}`}>
                      {log.status_code}
                    </span>
                  </div>
                  
                  <p className="text-[#F0F6FF] mt-1.5 pl-3 border-l border-[#00D4FF]/20">
                    <LogMessage text={log.message} isLast={isLast} />
                    {isLast && <span className="terminal-cursor" />}
                  </p>
                  
                  {log.payload_received && (
                    <details className="mt-2 pl-3 text-[10px] text-[#4A6080] cursor-pointer">
                      <summary className="hover:text-[#00D4FF] select-none font-sans font-medium">
                        View Telegram JSON Payload
                      </summary>
                      <pre className="bg-[#030812] p-3 rounded-lg border border-[#00D4FF]/10 mt-2 overflow-x-auto text-[10px] text-[#4A6080] leading-relaxed">
                        {log.payload_received}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
