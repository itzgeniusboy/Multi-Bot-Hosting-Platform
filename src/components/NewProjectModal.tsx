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
        className="w-full max-w-[560px] premium-glass-card rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#0D1117] shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* Subtle grid decoration inside modal */}
        <div className="absolute inset-0 card-grid-pattern opacity-5 pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between relative z-10 shrink-0 bg-[#0D1117]">
          <div className="flex items-center gap-3">
            {step !== 'select_repo' && step !== 'live' && (
              <button
                onClick={() => setStep(step === 'configure' ? 'select_repo' : 'configure')}
                className="p-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] hover:bg-white/5 text-[#8B949E] hover:text-white transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-[18px] font-bold text-[#F0F6FC] tracking-tight">
              {step === 'select_repo' ? 'Import Repository' : step === 'configure' ? 'Configure Environment' : step === 'deploying' ? 'Deploying Bot Node' : 'Project is Live'}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl border border-[rgba(255,255,255,0.08)] hover:bg-white/5 text-[#8B949E] hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Path Progress Indicators */}
        <div className="px-6 py-4 bg-[#080C14] border-b border-[rgba(255,255,255,0.08)] shrink-0 flex flex-col items-center justify-center min-h-[60px]">
          {/* Mobile view indicator */}
          <div className="sm:hidden text-xs font-mono text-[#8B949E] tracking-widest uppercase">
            Step {step === 'select_repo' ? 1 : step === 'configure' ? 2 : step === 'deploying' ? 3 : 4} of 4: <span className="text-[#00D4FF] font-bold">
              {step === 'select_repo' ? 'Select Repo' : step === 'configure' ? 'Configure' : step === 'deploying' ? 'Deploy' : 'Live'}
            </span>
          </div>

          {/* Desktop progress bar */}
          <div className="hidden sm:flex items-center justify-between w-full max-w-[360px] relative">
            {/* Background connection line */}
            <div className="absolute top-[14px] left-0 right-0 h-[2px] bg-[rgba(255,255,255,0.08)] z-0" />
            
            {/* Done/Active connection line overlay */}
            <div 
              className="absolute top-[14px] left-0 h-[2px] bg-[#3FB950] transition-all duration-300 z-0"
              style={{
                width: 
                  step === 'select_repo' ? '0%' :
                  step === 'configure' ? '33.33%' :
                  step === 'deploying' ? '66.66%' :
                  '100%'
              }}
            />

            {stepsList.map((st, i) => {
              const isActive = step === st.key;
              const isCompleted = 
                (step === 'configure' && i < 1) ||
                (step === 'deploying' && i < 2) ||
                (step === 'live' && i < 3);

              const shortLabels = ['SELECT', 'CONFIG', 'DEPLOY', 'LIVE'];

              return (
                <div key={st.key} className="flex flex-col items-center z-10 relative">
                  {/* Circle (28px diameter) */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-[#3FB950] text-[#080C14]'
                      : isActive
                      ? 'bg-[#00D4FF] text-[#080C14] ring-4 ring-[#00D4FF]/25'
                      : 'bg-[#161B22] text-[#484F58] border border-[rgba(255,255,255,0.08)]'
                  }`}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  
                  {/* Label (10px, muted) */}
                  <span className={`text-[10px] font-semibold mt-1 transition-colors duration-300 font-sans tracking-wide ${
                    isActive ? 'text-[#00D4FF]' : isCompleted ? 'text-[#3FB950]' : 'text-[#484F58]'
                  }`}>
                    {shortLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>
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
