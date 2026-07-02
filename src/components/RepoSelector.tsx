import React, { useState } from 'react';
import { Search, GitBranch, Globe, Lock, Loader2, Database, ChevronRight, Github } from 'lucide-react';
import { use3DTilt } from '../hooks/use3DTilt';

interface Repo {
  id: number | string;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

interface RepoSelectorProps {
  repos: Repo[];
  selectedRepo: string;
  onSelectRepo: (repoFullName: string) => void;
  isFetchingRepos: boolean;
  onNext: () => void;
}

// Fallback high-fidelity demo repositories if the user's GitHub list is empty
const DEMO_REPOS: Repo[] = [
  { id: 'demo-1', name: 'telegram-support-agent', full_name: 'sandbox/telegram-support-agent', private: true, default_branch: 'main' },
  { id: 'demo-2', name: 'movie-recommender-bot', full_name: 'sandbox/movie-recommender-bot', private: false, default_branch: 'master' },
  { id: 'demo-3', name: 'feedback-moderator', full_name: 'sandbox/feedback-moderator', private: true, default_branch: 'main' },
];

interface RepoCardProps {
  repo: Repo;
  isSelected: boolean;
  onSelect: (fullName: string) => void;
  index: number;
}

function RepoCard({ repo, isSelected, onSelect, index }: RepoCardProps) {
  const tiltRef = use3DTilt(true);

  return (
    <div
      ref={tiltRef}
      onClick={() => onSelect(repo.full_name)}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`animate-card-fade-in p-4 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer group relative ${
        isSelected
          ? 'bg-[#00D4FF]/8 border-[#00D4FF] border-l-4 border-l-[#00D4FF] shadow-[0_0_20px_rgba(0,212,255,0.08)]'
          : 'bg-[#050B18]/40 border-[#00D4FF]/10 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/2'
      }`}
    >
      {/* Checkmark in top-right corner */}
      {isSelected && (
        <div className="absolute top-2.5 right-2.5 text-[#00D4FF]">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg border transition-colors ${
          isSelected ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-[#050B18]/80 border-[#00D4FF]/5 text-[#4A6080] group-hover:text-white'
        }`}>
          <Github className="w-4 h-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#F0F6FF] group-hover:text-[#00D4FF] transition-colors truncate max-w-[130px] sm:max-w-[180px]" title={repo.name}>
              {repo.name}
            </span>
            <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded-full bg-[#050B18]/80 border border-[#00D4FF]/10 text-[#4A6080] flex items-center gap-1">
              {repo.private ? <Lock className="w-2 h-2 text-rose-400" /> : <Globe className="w-2 h-2 text-emerald-400" />}
              {repo.private ? 'Private' : 'Public'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#4A6080] font-mono">
            <GitBranch className="w-3 h-3 text-[#4A6080]" />
            <span>{repo.default_branch}</span>
          </div>
        </div>
      </div>

      <div
        className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider uppercase transition-all flex items-center gap-1 shrink-0 whitespace-nowrap ${
          isSelected
            ? 'bg-[#00D4FF]/20 text-[#00D4FF]'
            : 'bg-[#050B18]/60 text-[#4A6080] group-hover:text-white'
        }`}
      >
        {isSelected ? 'Selected' : 'Select'}
      </div>
    </div>
  );
}

export default function RepoSelector({
  repos,
  selectedRepo,
  onSelectRepo,
  isFetchingRepos,
  onNext
}: RepoSelectorProps) {
  const [search, setSearch] = useState('');

  // Use real repos if available, otherwise fallback to high-fidelity sandbox repos for a fluid user experience
  const activeRepos = repos.length > 0 ? repos : DEMO_REPOS;

  const filteredRepos = activeRepos.filter(repo =>
    repo.full_name.toLowerCase().includes(search.toLowerCase()) ||
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-display font-bold text-white tracking-tight">
          Import Git Repository
        </h3>
        <p className="text-xs text-[#4A6080]">
          Search and select the repository where your daemon host scripts and GitHub Action loops will be committed.
        </p>
      </div>

      {/* Search Input bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A6080]" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#050B18]/60 border border-[#00D4FF]/10 hover:border-[#00D4FF]/25 focus:border-[#00D4FF] focus:ring-1 focus:ring-[#00D4FF] rounded-xl pl-11 pr-4 py-3 text-xs text-[#F0F6FF] font-mono outline-none transition-all placeholder:text-[#4A6080]"
        />
      </div>

      {/* Repos list */}
      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
        {isFetchingRepos ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 bg-[#050B18]/30 rounded-xl border border-[#00D4FF]/5">
            <Loader2 className="w-6 h-6 text-[#00D4FF] animate-spin" />
            <span className="text-xs font-mono text-[#4A6080]">Fetching repositories from GitHub...</span>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 bg-[#050B18]/30 rounded-xl border border-[#00D4FF]/5">
            <Database className="w-6 h-6 text-[#4A6080]" />
            <span className="text-xs text-[#4A6080]">No matching repositories found.</span>
          </div>
        ) : (
          filteredRepos.map((repo, idx) => (
            <RepoCard
              key={repo.id}
              repo={repo}
              isSelected={selectedRepo === repo.full_name}
              onSelect={onSelectRepo}
              index={idx}
            />
          ))
        )}
      </div>

      {repos.length === 0 && !isFetchingRepos && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2.5">
          <Database className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-[#4A6080] leading-relaxed">
            No active GitHub repositories loaded. We have supplied sandbox environments for quick setup. Click to select a repo and continue.
          </p>
        </div>
      )}

      {/* Continue Button */}
      <div className="pt-4 border-t border-[#00D4FF]/10 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedRepo}
          className={`w-full py-3 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            selectedRepo
              ? 'bg-[#00D4FF] text-[#050B18] hover:bg-[#00D4FF]/90 shadow-lg shadow-[#00D4FF]/10'
              : 'bg-[#0A1628] border border-[#00D4FF]/10 text-[#4A6080] opacity-40 pointer-events-none'
          }`}
        >
          Continue to Configuration
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
