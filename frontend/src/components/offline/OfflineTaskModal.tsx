import React, { useState } from 'react';
import { recordOfflineJobNote, updateOfflineJobProgress } from '../../lib/offlineSyncEngine';
import toast from 'react-hot-toast';
import {
  X,
  FileText,
  Send,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface OfflineTaskModalProps {
  jobId: number;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

export const OfflineTaskModal: React.FC<OfflineTaskModalProps> = ({
  jobId,
  isOpen,
  onClose,
  onTaskUpdated,
}) => {
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('repair_started');

  if (!isOpen) return null;

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      toast.error('Please enter a task note.');
      return;
    }
    try {
      recordOfflineJobNote(jobId, noteText);
      toast.success('Task note saved locally (Pending Sync)!');
      setNoteText('');
      if (onTaskUpdated) onTaskUpdated();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save task note.');
    }
  };

  const handleUpdateStatus = () => {
    try {
      updateOfflineJobProgress(jobId, selectedStatus);
      toast.success(`Progress set to ${selectedStatus.replace('_', ' ')} (Pending Sync)!`);
      if (onTaskUpdated) onTaskUpdated();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Status cannot be updated offline.');
    }
  };

  const handleAttemptRestrictedAction = () => {
    toast.error(
      'Payment confirmation requires immediate bank / UPI network connection and cannot be completed offline.',
      { duration: 5000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-task-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 id="offline-task-modal-title" className="text-base font-bold text-gray-900 dark:text-gray-100">
                Offline Task Actions • Job #{jobId}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Changes are saved locally and queued with idempotency keys
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Record Offline Task Note */}
        <form onSubmit={handleSaveNote} className="space-y-3">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Record Work Inspection / Progress Note
          </label>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="e.g. Replaced capacitor, checked circuit voltage, customer approved scope..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            id="offline-note-textarea"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            id="save-offline-note-btn"
          >
            <Send className="w-3.5 h-3.5" />
            Save Note (Queue for Sync)
          </button>
        </form>

        {/* Section 2: Update Permitted Task Progress */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Update Permitted Task Milestone
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              id="offline-status-select"
            >
              <option value="on_the_way">On The Way (WORKER_ARRIVING)</option>
              <option value="arrived">Arrived at Customer Location</option>
              <option value="repair_started">Repair Started (IN_PROGRESS)</option>
              <option value="repair_completed">Repair Completed (Awaiting Verification)</option>
            </select>
            <button
              type="button"
              onClick={handleUpdateStatus}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-xs font-bold transition-colors"
              id="update-offline-status-btn"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Update Milestone
            </button>
          </div>
        </div>

        {/* Section 3: Safety Guard against offline financial settlements */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              Restricted Actions (Requires Internet)
            </div>
            <button
              onClick={handleAttemptRestrictedAction}
              className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold underline hover:text-amber-900"
            >
              Why blocked?
            </button>
          </div>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Final payment confirmation, wallet payouts, and customer identity checks are strictly blocked offline to protect against financial discrepancies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineTaskModal;
