import React, { useEffect, useState } from 'react';
import { Github, Loader2, CheckCircle2, XCircle, Shield, Key, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function OAuthCallback() {
  const [status, setStatus] = useState<'connecting' | 'success' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { label: 'Tunnel established with GitHub gateway', sub: 'Initializing secure SSL/TLS tunnel' },
    { label: 'Exchanging temporary auth code', sub: 'Exchanging security grant with GitHub OAuth API' },
    { label: 'Decrypting and verifying tokens', sub: 'Retrieving secure authentication key' },
    { label: 'Injecting workspace credentials', sub: 'Syncing workflow runner configuration' },
  ];

  // Increment simulated steps to show granular progress
  useEffect(() => {
    if (status !== 'connecting') return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(interval);
  }, [status, steps.length]);

  useEffect(() => {
    const exchangeCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        setStatus('error');
        setErrorMessage('Authorization code not found in URL.');
        return;
      }

      try {
        // Exchange code with our secure backend
        const response = await fetch(new URL(`/api/callback?code=${code}`, window.location.href).href, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Server returned status ${response.status}`);
        }

        const data = await response.json();
        const token = data.access_token;

        if (!token) {
          throw new Error('Failed to retrieve secure access token from GitHub.');
        }

        // Add a tiny buffer so the user sees the final step activation
        setTimeout(() => {
          setStatus('success');

          // Post success back to main window if it was opened as a popup
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: token }, '*');
            setTimeout(() => {
              window.close();
            }, 1500);
          } else {
            // Fallback if not opened in a popup (e.g. redirected directly)
            localStorage.setItem('github_token', token);
            setTimeout(() => {
              window.location.href = '/?token=' + token;
            }, 1500);
          }
        }, 1200);
      } catch (err: any) {
        console.error('OAuth code exchange error:', err);
        setStatus('error');
        setErrorMessage(err.message || 'An unexpected authentication error occurred.');
      }
    };

    exchangeCode();
  }, []);

  return (
    <div className="min-h-screen bg-[#030812] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic background particles and grid */}
      <div className="absolute inset-0 card-grid-pattern opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#00D4FF]/5 to-[#7C3AED]/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Floating abstract glowing nodes in background */}
      <div className="absolute top-10 left-10 w-24 h-24 rounded-full bg-[#00D4FF]/2 blur-xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 rounded-full bg-[#7C3AED]/2 blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="premium-glass-card rounded-2xl p-8 max-w-lg w-full border border-[#00D4FF]/20 relative z-10 space-y-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Top visual laser/scanner bar across the glass card */}
        {status === 'connecting' && (
          <motion.div
            animate={{ y: [0, 340, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent pointer-events-none z-20"
          />
        )}

        {/* Dynamic color identity top line */}
        <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl transition-all duration-500 ${
          status === 'success'
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
            : status === 'error'
            ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600'
            : 'bg-gradient-to-r from-[#00D4FF] via-[#7C3AED] to-[#FF3B6B]'
        }`}></div>

        {status === 'connecting' && (
          <div className="space-y-6">
            {/* Header section with brand and security tags */}
            <div className="flex justify-between items-center pb-4 border-b border-[#00D4FF]/10">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="text-[10px] font-mono tracking-wider text-[#00D4FF] uppercase">AUTHENTICATION PROTOCOL</span>
              </div>
              <span className="text-[9px] font-mono text-[#4A6080] bg-[#030812]/80 px-2.5 py-1 rounded-md border border-[#00D4FF]/5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping"></span>
                ACTIVE SECURE HANDSHAKE
              </span>
            </div>

            {/* Glowing animated concentric center display */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Concentric glowing pulse wave rings */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.4, 0.15] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full border-2 border-[#00D4FF]/20"
              />
              <motion.div
                animate={{ scale: [1.1, 1.45, 1.1], opacity: [0.08, 0.25, 0.08] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
                className="absolute inset-2 rounded-full border border-[#7C3AED]/20"
              />
              <div className="absolute inset-3 rounded-full bg-[#030812]/80 border border-[#00D4FF]/15 flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.1)]">
                <Github className="w-9 h-9 text-[#F0F6FF]" />
              </div>
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-t border-b border-transparent border-l-[#00D4FF] border-r-[#7C3AED]"
              />
            </div>

            {/* Explanatory titles */}
            <div className="space-y-2 text-center">
              <h2 className="text-xl font-display font-bold text-[#F0F6FF] tracking-tight">
                Authenticating via GitHub OAuth
              </h2>
              <p className="text-xs text-[#4A6080] font-sans leading-relaxed max-w-sm mx-auto">
                Exchanging secure authorization code with GitHub servers to spin up your 24x7 automated runner system.
              </p>
            </div>

            {/* Step checklist tracking validation status */}
            <div className="space-y-3 bg-[#030812]/60 rounded-xl p-4 border border-[#00D4FF]/5 text-left">
              <p className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-wider mb-2">// PIPELINE HANDSHAKE STEPS</p>
              
              <div className="space-y-3 font-mono">
                {steps.map((step, idx) => {
                  const isDone = activeStep > idx;
                  const isActive = activeStep === idx;
                  
                  return (
                    <div key={idx} className="flex items-start gap-3 text-xs transition-opacity duration-300">
                      <div className="mt-0.5 flex-shrink-0">
                        {isDone ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          </div>
                        ) : isActive ? (
                          <div className="w-4 h-4 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center">
                            <Loader2 className="w-2.5 h-2.5 animate-spin text-[#00D4FF]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[#030812] border border-[#4A6080]/20 flex items-center justify-center">
                            <span className="w-1 h-1 rounded-full bg-[#4A6080]/30"></span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className={`text-[11px] leading-tight font-medium ${
                          isDone ? 'text-emerald-400' : isActive ? 'text-[#00D4FF]' : 'text-[#4A6080]'
                        }`}>
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="text-[9px] text-[#4A6080]/80 mt-0.5 font-sans leading-relaxed italic animate-pulse">
                            {step.sub}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secure workspace handshake terminal log */}
            <div className="flex items-center justify-between text-[10px] text-[#4A6080] font-mono bg-[#030812]/85 py-2.5 px-4 rounded-lg border border-[#00D4FF]/5">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[#7C3AED]" />
                Handshake Step {activeStep + 1} of {steps.length}
              </span>
              <span className="text-[#00D4FF] flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                Processing
              </span>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 py-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20"
            >
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </motion.div>

            <div className="space-y-2 text-center">
              <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase">// SECURE HANDSHAKE COMPLETED</span>
              <h2 className="text-xl font-display font-bold text-[#F0F6FF]">GitHub Authorized Successfully</h2>
              <p className="text-xs text-[#4A6080] font-sans leading-relaxed px-4 max-w-sm mx-auto">
                Your credentials are encrypted. Syncing repositories with your multi-bot hosting dashboard...
              </p>
            </div>

            <div className="bg-[#030812]/40 rounded-xl p-4 border border-emerald-500/10 max-w-sm mx-auto">
              <p className="text-[11px] font-mono text-emerald-400 text-center flex items-center justify-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Workspace tokens successfully loaded
              </p>
            </div>

            <p className="text-[10px] text-emerald-400/80 font-mono text-center">This window will close automatically.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 py-4">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
              <XCircle className="w-9 h-9 text-rose-400" />
            </div>

            <div className="space-y-2 text-center">
              <span className="text-[10px] font-mono tracking-wider text-rose-400 uppercase">// SECURE PROTOCOL FAULT</span>
              <h2 className="text-xl font-display font-bold text-[#F0F6FF]">Authorization Failed</h2>
              <p className="text-xs text-[#4A6080] font-sans px-4">
                The secure credential exchange protocol could not be established.
              </p>
            </div>

            <div className="space-y-2 max-w-sm mx-auto">
              <p className="text-xs text-rose-400/80 font-mono bg-rose-950/20 py-2 px-4 rounded-lg border border-rose-500/10 text-center break-words">
                {errorMessage}
              </p>
            </div>

            <button
              onClick={() => window.close()}
              className="w-full py-3 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-[#FF3B6B]/10 hover:bg-[#FF3B6B]/20 border border-[#FF3B6B]/20 text-[#FF3B6B] transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
