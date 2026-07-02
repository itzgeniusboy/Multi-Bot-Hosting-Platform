import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, GitBranch, Settings, Terminal, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RepoSelector from './RepoSelector';
import ProjectConfigForm from './ProjectConfigForm';
import DeploymentConsole from './DeploymentConsole';
import ProjectLiveView from './ProjectLiveView';
import { use3DTilt } from '../hooks/use3DTilt';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: any[];
  isFetchingRepos: boolean;
  githubToken: string;
  onDeploySuccess: () => void;
  initialData?: {
    repoName: string;
    botToken: string;
    scriptName: string;
  } | null;
}

type WizardStep = 'select_repo' | 'configure' | 'deploying' | 'live';

export default function NewProjectModal({
  isOpen,
  onClose,
  repos,
  isFetchingRepos,
  githubToken,
  onDeploySuccess,
  initialData = null
}: NewProjectModalProps) {
  const [step, setStep] = useState<WizardStep>('select_repo');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [botToken, setBotToken] = useState('');
  const [selectedScript, setSelectedScript] = useState('python main.py');
  const [deployResult, setDeployResult] = useState<any>(null);
  const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
  const [verifiedBotInfo, setVerifiedBotInfo] = useState<{ botName: string; botUsername: string; botId: number } | null>(null);

  const tiltRef = use3DTilt(true);

  // Lock body scroll when wizard is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Sync initialData for duplication/clone configs
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSelectedRepo(initialData.repoName);
        setBotToken(initialData.botToken);
        setSelectedScript(initialData.scriptName);
        setStep('configure');
      } else {
        setStep('select_repo');
        setSelectedRepo('');
        setBotToken('');
        setSelectedScript('python bot.py');
        setEnvVars([]);
      }
    }
  }, [isOpen, initialData]);

  // Auto-detect script entry point in repository root
  useEffect(() => {
    if (selectedRepo && githubToken && step === 'configure' && !initialData) {
      const headers = {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      };
      fetch(`https://api.github.com/repos/${selectedRepo}/contents`, { headers })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Failed to auto-detect entry point');
        })
        .then((items) => {
          if (Array.isArray(items)) {
            const fileNames = items.map((item: any) => item.name);
            if (fileNames.includes("bot.py")) {
              setSelectedScript("python bot.py");
            } else if (fileNames.includes("main.py")) {
              setSelectedScript("python main.py");
            } else if (fileNames.includes("bot.js")) {
              setSelectedScript("node bot.js");
            } else if (fileNames.includes("index.js")) {
              setSelectedScript("node index.js");
            }
          }
        })
        .catch((err) => console.error("Error auto-detecting entry point:", err));
    }
  }, [selectedRepo, githubToken, step, initialData]);

  if (!isOpen) return null;

  // Handle successful deployment
  const handleDeploymentSuccess = (result: any) => {
    const entryFile = selectedScript.split(' ').pop() || 'bot.py';
    const language = selectedScript.toLowerCase().includes('python') || selectedScript.toLowerCase().includes('.py') ? 'python' : 'node';
    const [owner, name] = selectedRepo.split('/');
    
    const enrichedResult = {
      ...result,
      botName: verifiedBotInfo?.botName,
      botUsername: verifiedBotInfo?.botUsername,
      botId: verifiedBotInfo?.botId,
      deployedAt: new Date().toISOString(),
      scriptName: selectedScript,
    };
    setDeployResult(enrichedResult);
    
    try {
      const botObject = {
        id: Date.now(),
        repoOwner: owner || 'username',
        repoName: name || 'reponame', 
        repoFullName: selectedRepo,
        language: language,
        entryFile: entryFile,
        deployedAt: new Date().toISOString(),
        workflowFile: "mbhp_bot.yml",
        botName: verifiedBotInfo?.botName || undefined,
        botUsername: verifiedBotInfo?.botUsername || undefined,
        botId: verifiedBotInfo?.botId || undefined
      };

      const saved = localStorage.getItem('multi_bot_saved_bots');
      const list = saved ? JSON.parse(saved) : [];
      const filtered = list.filter((b: any) => b.repoFullName !== selectedRepo);
      filtered.push(botObject);
      localStorage.setItem('multi_bot_saved_bots', JSON.stringify(filtered));
    } catch (e) {
      console.error("Error saving bot to localStorage:", e);
    }

    setStep('live');
    onDeploySuccess(); // refresh parent dashboard active bot listings
  };

  const handleBackToConfigure = () => {
    setStep('configure');
  };

  const handleClose = () => {
    // Reset wizard on close
    setStep('select_repo');
    setSelectedRepo('');
    setBotToken('');
    setSelectedScript('python bot.py');
    setEnvVars([]);
    setDeployResult(null);
    setVerifiedBotInfo(null);
    onClose();
  };

  // Steps indicator mapping
  const stepsList = [
    { key: 'select_repo', label: '1. Select Repo', icon: GitBranch },
    { key: 'configure', label: '2. Configure', icon: Settings },
    { key: 'deploying', label: '3. Deploy', icon: Terminal },
    { key: 'live', label: '4. Live', icon: CheckCircle }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden">
      {/* Dimmed glass background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-[#02050B]/85 backdrop-blur-md"
      />

      {/* Main glassmorphic dialog card */}
      <motion.div
        ref={tiltRef}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-full max-w-4xl premium-glass-card rounded-3xl border border-[#00D4FF]/20 bg-[#0A1628]/95 shadow-[0_30px_100px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Subtle grid decoration inside modal */}
        <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-[#00D4FF]/10 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            {step !== 'select_repo' && step !== 'live' && (
              <button
                onClick={() => setStep(step === 'configure' ? 'select_repo' : 'configure')}
                className="p-1.5 rounded-lg border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 text-[#4A6080] hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-widest text-[#00D4FF] uppercase font-bold">
                // CREATING NEW PROJECT
              </span>
              <h2 className="text-sm font-display font-extrabold text-[#F0F6FF] tracking-wider">
                GitHub Action Bot Setup
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl border border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 text-[#4A6080] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Path Progress Indicators */}
        <div className="px-6 py-3 bg-[#050B18]/40 border-b border-[#00D4FF]/5 flex items-center gap-6 shrink-0 overflow-x-auto scrollbar-none">
          {stepsList.map((st, i) => {
            const IconComponent = st.icon;
            const isActive = step === st.key;
            const isCompleted = 
              (step === 'configure' && i < 1) ||
              (step === 'deploying' && i < 2) ||
              (step === 'live' && i < 3);

            return (
              <React.Fragment key={st.key}>
                <div 
                  className={`items-center gap-2 shrink-0 animate-step-slide ${isActive ? 'flex' : 'hidden sm:flex'}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className={`flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider ${
                    isActive
                      ? 'text-[#00D4FF]'
                      : isCompleted
                      ? 'text-emerald-400'
                      : 'text-[#4A6080]'
                  }`}>
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{st.label}</span>
                  </div>
                </div>
                {i < stepsList.length - 1 && (
                  <span className={`text-[10px] font-mono text-[#4A6080]/40 ${isActive ? 'inline' : 'hidden sm:inline'}`}>/</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content Section with motion transitions */}
        <div className="p-6 overflow-y-auto flex-1 relative z-10 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.22 }}
              className="h-full"
            >
              {step === 'select_repo' && (
                <RepoSelector
                  repos={repos}
                  selectedRepo={selectedRepo}
                  onSelectRepo={setSelectedRepo}
                  isFetchingRepos={isFetchingRepos}
                  onNext={() => setStep('configure')}
                />
              )}

              {step === 'configure' && (
                <ProjectConfigForm
                  selectedRepo={selectedRepo}
                  botToken={botToken}
                  setBotToken={setBotToken}
                  selectedScript={selectedScript}
                  setSelectedScript={setSelectedScript}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep('deploying');
                  }}
                  onBack={() => setStep('select_repo')}
                  envVars={envVars}
                  setEnvVars={setEnvVars}
                  verifiedBotInfo={verifiedBotInfo}
                  setVerifiedBotInfo={setVerifiedBotInfo}
                />
              )}

              {step === 'deploying' && (
                <DeploymentConsole
                  repoName={selectedRepo}
                  botToken={botToken}
                  scriptName={selectedScript}
                  githubToken={githubToken}
                  envVars={envVars}
                  onSuccess={handleDeploymentSuccess}
                  onFailure={(err) => console.error('Deployment error callback:', err)}
                  onBack={handleBackToConfigure}
                />
              )}

              {step === 'live' && deployResult && (
                <ProjectLiveView
                  deployResult={deployResult}
                  onClose={handleClose}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
