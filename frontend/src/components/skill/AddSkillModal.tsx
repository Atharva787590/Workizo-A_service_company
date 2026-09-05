import React, { useState } from 'react';
import { X, Wrench, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillProficiency } from '@/types/skill';
import { validateSkillForm } from '@/lib/skillEngine';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface AddSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasVerifiedCert?: boolean;
  onSuccess?: () => void;
  className?: string;
}

const PROFICIENCY_OPTIONS: { id: SkillProficiency; label: string; desc: string }[] = [
  { id: 'BEGINNER', label: 'Beginner / Apprentice', desc: 'Basic understanding, learning trade under supervision' },
  { id: 'SKILLED', label: 'Skilled Practitioner', desc: 'Independent competency on standard tasks' },
  { id: 'CERTIFIED', label: 'Certified Artisan', desc: 'Verified vocational certificate from Skill India/NSDC/NCVT' },
  { id: 'EXPERT', label: 'Expert Craftsman', desc: '3+ years experience with specialized diagnostics' }
];

export const AddSkillModal: React.FC<AddSkillModalProps> = ({
  isOpen,
  onClose,
  hasVerifiedCert = false,
  onSuccess,
  className
}) => {
  const [name, setName] = useState('');
  const [proficiency, setProficiency] = useState<SkillProficiency>('SKILLED');
  const [years, setYears] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateSkillForm(name, proficiency, years, hasVerifiedCert);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid skill data.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/workers/skills/', {
        name: name.trim(),
        proficiency,
        years_of_experience: years
      });

      toast.success(`Skill '${name.trim()}' added successfully!`);
      setName('');
      setProficiency('SKILLED');
      setYears(2);
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to save skill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-skill-title"
        className={cn(
          'w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-skill-title" className="text-base font-black text-slate-900 dark:text-white">
                Add Trade Skill
              </h3>
              <p className="text-xs text-slate-500">कौशल दर्ज करें (UNNATI)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Skill or Trade Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Copper Pipe Brazing, Inverter Troubleshooting"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Proficiency Level
            </label>
            <div className="space-y-2">
              {PROFICIENCY_OPTIONS.map((opt) => {
                const isSelected = proficiency === opt.id;
                const isDisabled = opt.id === 'CERTIFIED' && !hasVerifiedCert;

                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setProficiency(opt.id)}
                    disabled={isDisabled}
                    className={cn(
                      'w-full p-3 rounded-2xl border text-left flex items-start justify-between gap-2 transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40',
                      isDisabled && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-slate-500">{opt.desc}</div>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {!hasVerifiedCert && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Upload an approved vocational certificate to unlock 'Certified' level.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Years of Experience
              </label>
              <span className="text-xs font-bold text-blue-600">{years} Years</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Skill to Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
