import React from 'react';
import { Award, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillCertificationProfile } from '@/types/unnati';

export interface SkillCertificationBadgeProps {
  skills: SkillCertificationProfile;
  tradeName?: string;
  className?: string;
}

export const SkillCertificationBadge: React.FC<SkillCertificationBadgeProps> = ({
  skills,
  tradeName = 'Certified Tradesperson',
  className
}) => {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Skills & National Certification
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            कौशल एवं प्रमाणन प्रोफाइल (Skill India & NSDC Status)
          </h3>
        </div>

        {/* Verification Pill */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto',
            skills.nsdcCertified
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:border-slate-700'
          )}
        >
          {skills.nsdcCertified ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{skills.nsdcCertified ? 'NSDC Certified' : 'Standard Cooperative Member'}</span>
        </span>
      </div>

      {/* Certification Details */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Recognized Trade:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">
              {skills.nsdcTradeName || tradeName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Certificate Ref:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              {skills.nsdcCertNumber || 'Self-Declared / Guild Member'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400 block">Skill India Verification:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {skills.skillIndiaVerified ? 'Government Verified ✓' : 'Self-Reported'}
            </span>
          </div>
        </div>

        {/* Demo/Sandbox Label */}
        {skills.isDemoCertificate && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              <b>Provider-Ready Sandbox:</b> Digital Skill India certification sync adapter is ready for live API integration.
            </span>
          </div>
        )}
      </div>

      {/* Badges / Competency Tags */}
      {skills.skillBadges && skills.skillBadges.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Endorsed Trade Competencies (अनुमोदित कौशल):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skills.skillBadges.map((badge, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs font-medium border border-blue-200 dark:border-blue-800"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
