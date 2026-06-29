import React, { useEffect, useRef } from 'react';
import { Bot, LogEntry } from '../types';
import { Terminal, Cpu } from 'lucide-react';

interface SimulatorProps {
  bots: Bot[];
  selectedBotId: string;
  logs: LogEntry[];
  onClearLogs: () => void;
}

export default function Simulator({
  bots,
  selectedBotId,
  logs,
  onClearLogs,
}: SimulatorProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const selectedBot = bots.find((b) => b.id === selectedBotId);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'text-purple-400';
      case 'WARNING':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-display font-semibold text-slate-300 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-purple-400" />
          FastAPI Server Console Logs
        </h3>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-[10px] text-slate-400 hover:text-white font-mono flex items-center gap-1 px-3 py-1 bg-slate-950 border border-slate-900 rounded-lg cursor-pointer transition-colors"
          >
            Clear Console
          </button>
        )}
      </div>

      {/* Console view */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 font-mono text-[11px] leading-relaxed overflow-hidden flex flex-col h-[350px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-900/60 text-slate-500 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span className="ml-1 text-slate-400 text-[10px]">uvicorn@vercel-serverless-node</span>
          </div>
          <span className="text-[10px] bg-slate-900 px-2.5 py-0.5 rounded-md text-purple-400 font-medium">
            FASTAPI LIVE
          </span>
        </div>

        {/* Logs body */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-4">
              <Cpu className="w-6 h-6 mb-2 text-slate-800 animate-pulse" />
              <p>Waiting for server webhook executions...</p>
              <p className="text-[10px] text-slate-700 mt-1">
                Deploy and trigger actions from your active webhook nodes to watch live python server responses.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border-b border-slate-900/10 pb-2">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className="text-slate-600 font-light">[{log.timestamp}]</span>
                  <span className={`font-bold ${getLogColor(log.level)}`}>[{log.level}]</span>
                  <span className="text-purple-400 font-semibold truncate max-w-[200px]">
                    {log.method} {log.path}
                  </span>
                  <span className={`font-mono ${log.status_code < 400 ? 'text-purple-400' : 'text-rose-400'}`}>
                    {log.status_code}
                  </span>
                </div>
                <p className="text-slate-300 mt-1 pl-2 border-l border-slate-900">{log.message}</p>
                
                {log.payload_received && (
                  <details className="mt-1 pl-2 text-[10px] text-slate-500 cursor-pointer">
                    <summary className="hover:text-slate-400 select-none">View Telegram JSON Payload</summary>
                    <pre className="bg-slate-950 p-2 rounded-lg border border-slate-900 mt-1 overflow-x-auto text-[9px] text-slate-400">
                      {log.payload_received}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
