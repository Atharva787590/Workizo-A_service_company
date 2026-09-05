import React, { useState } from 'react';
import { X, Award, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface AddCertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  className?: string;
}

const COMMON_ISSUERS = [
  'National Skill Development Corporation (NSDC)',
  'Skill India / MSDE',
  'National Council for Vocational Training (NCVT)',
  'State Skill Development Mission (SSDM)',
  'Sector Skill Council (SSC)',
  'Recognized Polytechnic / ITI',
  'UNNATI Cooperative Guild Academy'
];

export const AddCertificationModal: React.FC<AddCertificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  className
}) => {
  const [certName, setCertName] = useState('');
  const [issuer, setIssuer] = useState(COMMON_ISSUERS[0]);
  const [credentialId, setCredentialId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!certName.trim() || !issuer.trim() || !issueDate) {
      toast.error('Certificate name, issuer, and issue date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/workers/certifications/', {
        certification_name: certName.trim(),
        issuing_organization: issuer.trim(),
        credential_id: credentialId.trim(),
        issue_date: issueDate,
        expiry_date: expiryDate || null,
        document_url: documentUrl.trim()
      });

      toast.success('Certificate submitted for cooperative review!');
      setCertName('');
      setCredentialId('');
      setIssueDate('');
      setExpiryDate('');
      setDocumentUrl('');
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to submit certificate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-cert-title"
        className={cn(
          'w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden',
          className
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-cert-title" className="text-base font-black text-slate-900 dark:text-white">
                Submit Micro-Certification
              </h3>
              <p className="text-xs text-slate-500">कौशल प्रमाणपत्र सत्यापन हेतु दर्ज करें</p>
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
              Certificate Title / Trade
            </label>
            <input
              type="text"
              required
              value={certName}
              onChange={(e) => setCertName(e.target.value)}
              placeholder="e.g. Wireman Trade Certificate, Plumber SSC Level 4"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Issuing Organization
            </label>
            <select
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              {COMMON_ISSUERS.map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Credential / Enrollment ID (Optional)
            </label>
            <input
              type="text"
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
              placeholder="e.g. NSDC-2024-98124"
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Expiry Date (If applicable)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Document URL / DigiLocker Link
            </label>
            <input
              type="url"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
              placeholder="https://digilocker.gov.in/certificate/..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit for Peer Verification'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
