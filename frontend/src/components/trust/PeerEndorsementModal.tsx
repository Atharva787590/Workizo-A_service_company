import React, { useState } from 'react';
import { Award, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateEndorsementRule } from '@/lib/trustEngine';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface PeerEndorsementModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: number;
  workerName: string;
  existingSkills?: string[];
  onEndorsed?: () => void;
  className?: string;
}

export const PeerEndorsementModal: React.FC<PeerEndorsementModalProps> = ({
  isOpen,
  onClose,
  workerId,
  workerName,
  existingSkills = [],
  onEndorsed,
  className
}) => {
  const [skillName, setSkillName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ruleCheck = validateEndorsementRule(
      0, // Will be checked server-side with request.user.id
      workerId,
      true,
      skillName,
      existingSkills
    );

    if (!ruleCheck.valid) {
      toast.error(ruleCheck.error || 'Invalid endorsement.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/workers/peer-endorse/', {
        worker_id: workerId,
        skill_name: skillName.trim(),
        note: note.trim()
      });

      toast.success(`Skill '${skillName}' endorsed for ${workerName}!`);
      setSkillName('');
      setNote('');
      onEndorsed?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to submit endorsement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Endorse Peer Skill"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4',
        className
      )}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Endorse Peer Skill (कौशल समर्थन)
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Vouch for <b>{workerName}</b>'s craft expertise. Endorsements reflect verified guild craftsmanship.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Skill Name (कौशल का नाम) *
            </label>
            <input
              type="text"
              required
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g. Copper Pipe Fitting, Three-Phase Wiring"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Endorsement Note (वैकल्पिक टिप्पणी)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="संक्षिप्त विवरण दें कि आपने इनके साथ किस कार्य में सहयोग किया..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>
              <b>Governance Rule:</b> Self-endorsement is prohibited. Duplicate endorsements for the same skill from the same peer are rejected.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !skillName.trim()}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Confirm Endorsement (समर्थन दें)'}
          </button>
        </form>
      </div>
    </div>
  );
};
