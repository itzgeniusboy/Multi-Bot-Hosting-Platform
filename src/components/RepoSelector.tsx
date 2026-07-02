import React, { useState } from 'react';
import { Search, GitBranch, Globe, Lock, Loader2, Database, ChevronRight, Github } from 'lucide-react';
import { use3DTilt } from '../hooks/use3DTilt';

interface Repo {
  id: number | string;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  language?: string;
  stargazers_count?: number;
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
  { id: 'demo-1', name: 'telegram-support-agent', full_name: 'sandbox/telegram-support-agent', private: true, default_branch: 'main', language: 'Python', stargazers_count: 5 },
  { id: 'demo-2', name: 'movie-recommender-bot', full_name: 'sandbox/movie-recommender-bot', private: false, default_branch: 'master', language: 'TypeScript', stargazers_count: 12 },
  { id: 'demo-3', name: 'feedback-moderator', full_name: 'sandbox/feedback-moderator', private: true, default_branch: 'main', language: 'JavaScript', stargazers_count: 3 },
];

interface RepoCardProps {
  repo: Repo;
  isSelected: boolean;
  onSelect: (fullName: string) => void;
  index: number;
}

function RepoCard({ repo, isSelected, onSelect, index }: RepoCardProps) {
  const tiltRef = use3DTilt(true);
  const lang = repo.language || 'TypeScript';
  const stars = repo.stargazers_count !== undefined ? repo.stargazers_count : 2;

  return (
    <div
      ref={tiltRef}
      onClick={() => onSelect(repo.full_name)}
      style={{ animationDelay: `${index * 80}ms` }}
      className={`animate-card-fade-in h-[72px] px-4 rounded-xl border transition-all duration-300 flex items-center justify-between cursor-pointer group relative ${
        isSelected
          ? 'bg-[#00D4FF]/10 border-l-[3px] border-l-[#00D4FF] border-y-[rgba(0,212,255,0.3)] border-r-[rgba(0,212,255,0.3)] shadow-[0_0_15px_rgba(0,212,255,0.06)]'
          : 'bg-[#0D1117] border-[rgba(255,255,255,0.08)] hover:border-white/20 hover:bg-[#161B22]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-lg border shrink-0 ${
          isSelected ? 'bg-[#00D4FF]/10 border-[#00D4FF]/20 text-[#00D4FF]' : 'bg-[#161B22] border-[rgba(255,255,255,0.08)] text-[#8B949E]'
        }`}>
          <Github className="w-5 h-5" />
        </div>
        <div className="space-y-0.5 min-w-0">
          <div className="text-[14px] font-bold text-[#F0F6FC] truncate group-hover:text-[#00D4FF] transition-colors" title={repo.full_name}>
            {repo.name}
          </div>
          <div className="text-[12px] text-[#8B949E] font-mono flex items-center gap-2">
            <span>{lang}</span>
            <span className="text-[#484F58]">•</span>
            <span>★ {stars}</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 ml-4">
        {isSelected ? (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold text-[#3FB950] border border-[#3FB950]/25 bg-[#3FB950]/10 flex items-center gap-1 select-none">
            SELECTED ✓
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full text-[11px] font-bold text-[#00D4FF] border border-[#00D4FF]/25 bg-transparent group-hover:bg-[#00D4FF]/10 transition-colors">
            IMPORT →
          </span>
        )}
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
      <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!selectedRepo}
          className={`px-6 h-11 rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
            selectedRepo
              ? 'bg-[#00D4FF] text-[#080C14] hover:bg-[#00D4FF]/90'
              : 'bg-[#161B22] border border-[rgba(255,255,255,0.08)] text-[#484F58] opacity-40 pointer-events-none'
          }`}
        >
          <span>CONTINUE →</span>
        </button>
      </div>
    </div>
  );
}
