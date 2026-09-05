import React, { useState } from 'react';
import { Award, Plus, Calendar, Building, ShieldCheck, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerCertificationRecord } from '@/types/skill';
import { getCertificationStatusBadge } from '@/lib/skillEngine';
import { AddCertificationModal } from './AddCertificationModal';

export interface CertificationListCardProps {
  certifications: WorkerCertificationRecord[];
  onCertificationAdded?: () => void;
  className?: string;
}

export const CertificationListCard: React.FC<CertificationListCardProps> = ({
  certifications,
  onCertificationAdded,
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
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Vocational Credentials (प्रमाणपत्र)
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Skill India & NSDC Micro-Certifications
            </h3>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload Certificate (प्रमाणपत्र जोड़ें)</span>
          </button>
        </div>

        {/* List */}
        {certifications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
            <FileCheck className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No vocational certificates registered
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Submit your Skill India, NCVT, or trade micro-credential for cooperative peer verification.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {certifications.map((c) => {
              const badge = getCertificationStatusBadge(c.verification_status, c.expiry_date);
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {c.certification_name}
                      </span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                          badge.colorClass
                        )}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {c.issuing_organization}
                      </span>
                      {c.credential_id && (
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          ID: {c.credential_id}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Issued: {c.issue_date}
                        {c.expiry_date ? ` (Exp: ${c.expiry_date})` : ' (No Expiry)'}
                      </span>
                    </div>

                    {c.verification_notes && (
                      <p className="text-[11px] italic text-slate-500 pt-0.5">
                        Note: {c.verification_notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Verification Standards Notice */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Certifications are validated against recognized vocational registries. UNNATI never fabricates credentials.
          </span>
        </div>
      </div>

      <AddCertificationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          onCertificationAdded?.();
        }}
      />
    </>
  );
};
