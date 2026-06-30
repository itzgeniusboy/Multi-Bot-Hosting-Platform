import React, { useState } from 'react';
import { X, ArrowLeft, GitBranch, Settings, Terminal, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RepoSelector from './RepoSelector';
import ProjectConfigForm from './ProjectConfigForm';
import DeploymentConsole from './DeploymentConsole';
import ProjectLiveView from './ProjectLiveView';

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
  const [selectedScript, setSelectedScript] = useState('movie_bot.py');
  const [deployResult, setDeployResult] = useState<any>(null);

  // Sync initialData for duplication config cloned runs
  React.useEffect(() => {
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
        setSelectedScript('movie_bot.py');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Handle successful deployment
  const handleDeploymentSuccess = (result: any) => {
    setDeployResult(result);
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
    setSelectedScript('movie_bot.py');
    setDeployResult(null);
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
                Vercel-Style Integration
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
              <div key={st.key} className="flex items-center gap-2 shrink-0">
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
                {i < stepsList.length - 1 && (
                  <span className="text-[10px] font-mono text-[#4A6080]/40">/</span>
                )}
              </div>
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
                />
              )}

              {step === 'deploying' && (
                <DeploymentConsole
                  repoName={selectedRepo}
                  botToken={botToken}
                  scriptName={selectedScript}
                  githubToken={githubToken}
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
