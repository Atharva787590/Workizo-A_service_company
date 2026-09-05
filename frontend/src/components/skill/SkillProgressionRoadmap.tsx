import React from 'react';
import { TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerSkillRecord, WorkerCertificationRecord } from '@/types/skill';
import { calculateSkillProgression } from '@/lib/skillEngine';

export interface SkillProgressionRoadmapProps {
  skills: WorkerSkillRecord[];
  certifications: WorkerCertificationRecord[];
  className?: string;
}

const TIERS = [
  { level: 1, name: 'Apprentice (प्रशिक्षु)', desc: 'Foundational trade capabilities' },
  { level: 2, name: 'Skilled (कुशल)', desc: 'Demonstrated field competencies' },
  { level: 3, name: 'Certified (प्रमाणित)', desc: 'Vocational NSDC/Skill India credentials' },
  { level: 4, name: 'Master (उस्ताद)', desc: 'Multi-trade leader & peer reviewer' }
];

export const SkillProgressionRoadmap: React.FC<SkillProgressionRoadmapProps> = ({
  skills,
  certifications,
  className
}) => {
  const meta = calculateSkillProgression(skills, certifications);

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Skill Progression Roadmap (कारीगर प्रगति)
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            {meta.title}
          </h3>
        </div>

        <div className="text-right self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-400 block">Current Guild Tier</span>
          <span className="text-lg font-black text-purple-600 dark:text-purple-400">
            Tier {meta.level} / 4
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>Guild Advancement</span>
          <span>{meta.progressPercent}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 via-emerald-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${meta.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stepper Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
        {TIERS.map((tier) => {
          const isReached = meta.level >= tier.level;
          const isCurrent = meta.level === tier.level;

          return (
            <div
              key={tier.level}
              className={cn(
                'p-3.5 rounded-2xl border transition-all space-y-1',
                isCurrent
                  ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                  : isReached
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">TIER {tier.level}</span>
                {isReached && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                {tier.name}
              </div>
              <div className="text-[11px] text-slate-500 leading-tight">
                {tier.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Milestone Box */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-bold text-slate-900 dark:text-white block">
            Next Advancement Milestone:
          </span>
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {meta.nextMilestone}
          </span>
        </div>
      </div>
    </div>
  );
};
