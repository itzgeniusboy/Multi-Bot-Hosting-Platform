import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  'INITIALIZING EDGE INTEGRITY CHECK...',
  'CONNECTING CLOUD ROUTING SUITE...',
  'CONFIGURING WEBHOOK ROUTER NODES...',
  'SECURING INSTANT TUNNEL HANDSHAKE...',
  'SYNCHRONIZING FASTAPI METRICS...',
  'SYSTEM INTRUSION DETECTOR NOMINAL...',
  'MULTI-BOT HOSTING INTERACTION ENGINE ARMED...'
];

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Stagger loading log additions
    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < BOOT_LOGS.length) {
        setLogs((prev) => [...prev, BOOT_LOGS[logIndex]]);
        logIndex++;
        audio.playTick();
      } else {
        clearInterval(logInterval);
      }
    }, 200);

    // Smoothly increment progress counter
    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(Math.floor(calculatedProgress));

      if (calculatedProgress < 100) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsDone(true);
        audio.playBoot();
        setTimeout(() => {
          onComplete();
        }, 600); // Allow fadeout transition
      }
    };

    requestAnimationFrame(updateProgress);

    return () => {
      clearInterval(logInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#050B18] z-[99999] flex flex-col items-center justify-center p-6 select-none font-mono">
      {/* Abstract Background Grid */}
      <div className="absolute inset-0 card-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-xl flex flex-col items-stretch space-y-8 relative z-10">
        
        {/* Futuristic Platform Logo Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <motion.div 
            className="relative w-12 h-12 flex items-center justify-center mb-1"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
          >
            {/* Hexagonal glowing logo border */}
            <svg className="w-10 h-10 text-[#00D4FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 8px #00D4FF)' }}>
              <polygon points="12 2 22 7.5 22 18.5 12 24 2 18.5 2 7.5" />
            </svg>
            <div className="absolute w-2 h-2 bg-[#7C3AED] rounded-full" />
          </motion.div>
          <h2 className="text-sm font-bold tracking-[0.25em] text-[#F0F6FF] font-display uppercase">
            MULTI-BOT ENGINE v2.0
          </h2>
          <span className="text-[9px] text-[#4A6080] tracking-widest uppercase font-mono">
            GATEWAY BOOT LOADER
          </span>
        </div>

        {/* Console Log Reader Mock Terminal */}
        <div className="bg-[#030812]/90 border border-[#00D4FF]/10 rounded-xl p-5 h-44 overflow-y-hidden text-[10px] text-left text-[#4A6080] space-y-1.5 shadow-2xl relative">
          <div className="absolute inset-0 bg-linear-to-b from-[#030812]/0 via-[#030812]/10 to-[#030812] pointer-events-none" />
          {logs.map((log, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <span className="text-[#00FF87]">//</span>
              <span className={i === logs.length - 1 ? 'text-[#00D4FF] font-bold' : ''}>{log}</span>
            </motion.div>
          ))}
          {logs.length < BOOT_LOGS.length && (
            <div className="flex items-center gap-2 text-[#00D4FF]">
              <span className="text-[#00FF87]">//</span>
              <span className="inline-block w-2.5 h-3.5 bg-[#00D4FF] animate-pulse" />
            </div>
          )}
        </div>

        {/* Glowing Loading Bar and Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-[#4A6080] uppercase tracking-wider">// PLATFORM READYNESS</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-[#0A1628] rounded-full overflow-hidden border border-[#00D4FF]/5 p-0.5 relative">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] via-[#7C3AED] to-[#FF3B6B]"
              style={{ width: `${progress}%`, boxShadow: '0 0 10px rgba(0, 212, 255, 0.4)' }}
            />
          </div>

          <div className="flex justify-between items-center text-[9px] text-[#4A6080] font-mono">
            <span>SECURE SHAKE: ESTABLISHED</span>
            <span>PING: 14ms (EDGE_LOCAL)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
