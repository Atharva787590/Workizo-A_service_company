import React, { useState } from 'react';
import { Plus, CheckCircle2, Sparkles, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerSkillRecord } from '@/types/skill';
import { getProficiencyBadge } from '@/lib/skillEngine';
import { AddSkillModal } from './AddSkillModal';

export interface SkillProfileCardProps {
  skills: WorkerSkillRecord[];
  onSkillAdded?: () => void;
  hasVerifiedCert?: boolean;
  className?: string;
}

export const SkillProfileCard: React.FC<SkillProfileCardProps> = ({
  skills,
  onSkillAdded,
  hasVerifiedCert = false,
  className
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-5',
          className
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              Cooperative Trade Skills (कौशल प्रोफ़ाइल)
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Verified Artisan Competencies
            </h3>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Skill (कौशल जोड़ें)</span>
          </button>
        </div>

        {/* Skills Grid */}
        {skills.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
            <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No registered skills yet
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add your trade competencies to qualify for relevant customer bookings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skills.map((s) => {
              const badge = getProficiencyBadge(s.proficiency);
              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {s.name}
                      </span>
                      {s.is_verified && (
                        <span title="Verified Skill">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      {s.years_of_experience} {s.years_of_experience === 1 ? 'Year' : 'Years'} Exp.
                    </span>
                  </div>

                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap',
                      badge.colorClass
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddSkillModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        hasVerifiedCert={hasVerifiedCert}
        onSuccess={() => {
          setIsAddModalOpen(false);
          onSkillAdded?.();
        }}
      />
    </>
  );
};
