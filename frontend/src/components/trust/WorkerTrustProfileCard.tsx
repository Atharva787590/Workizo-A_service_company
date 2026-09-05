import React, { useState } from 'react';
import {
  ShieldCheck,
  Star,
  Award,
  Users,
  CheckCircle2,
  EyeOff,
  UserCheck,
  Building2,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkerTrustProfile, VerificationState } from '@/types/trust';
import { getVerificationBadgeMeta } from '@/lib/trustEngine';
import { PeerEndorsementModal } from './PeerEndorsementModal';

export interface WorkerTrustProfileCardProps {
  profile: WorkerTrustProfile;
  canEndorse?: boolean;
  onEndorsementSuccess?: () => void;
  className?: string;
}

export const WorkerTrustProfileCard: React.FC<WorkerTrustProfileCardProps> = ({
  profile,
  canEndorse = false,
  onEndorsementSuccess,
  className
}) => {
  const [isEndorsementModalOpen, setIsEndorsementModalOpen] = useState(false);

  const verificationItems: Array<{
    label: string;
    state: VerificationState;
    icon: React.ReactNode;
  }> = [
    {
      label: 'Identity Document (पहचान पत्र)',
      state: profile.verification_states.identity_verification,
      icon: <UserCheck className="w-4 h-4 text-emerald-600" />
    },
    {
      label: 'Aadhaar e-KYC (आधार सत्यापन)',
      state: profile.verification_states.aadhaar_ekyc,
      icon: <FileCheck className="w-4 h-4 text-blue-600" />
    },
    {
      label: 'Police Verification (पुलिस सत्यापन)',
      state: profile.verification_states.police_verification,
      icon: <Building2 className="w-4 h-4 text-purple-600" />
    },
    {
      label: 'Skill Certification (कौशल प्रमाणन)',
      state: profile.verification_states.skill_certification,
      icon: <Award className="w-4 h-4 text-amber-600" />
    }
  ];

  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-6',
        className
      )}
    >
      {/* Top Banner: Name, Category, Trust Score & Rating */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            UNNATI Verified Trust Profile
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            {profile.full_name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {profile.service_category} • {profile.experience_years} Years Experience
          </p>
        </div>

        {/* Trust Score Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400 block">Trust Score</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {profile.trust_score}/100
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{profile.average_rating}</span>
            <span className="text-xs font-normal text-slate-400">({profile.total_reviews})</span>
          </div>
        </div>
      </div>

      {/* Sensitive Identity Masking Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5 text-slate-500" />
            Privacy-Protected Identification
          </span>
          <span className="text-[11px] font-semibold text-emerald-600">Masked for Security</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="text-xs">
            <span className="text-slate-500 block">Aadhaar Number:</span>
            <code className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {profile.masked_identifiers.aadhaar_masked || 'Not Disclosed'}
            </code>
          </div>
          <div className="text-xs">
            <span className="text-slate-500 block">PAN Identifier:</span>
            <code className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {profile.masked_identifiers.pan_masked || 'Not Disclosed'}
            </code>
          </div>
        </div>
      </div>

      {/* Provider-Ready Verification States Grid */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Verification Records (सत्यापन रिकॉर्ड)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {verificationItems.map((item, idx) => {
            const meta = getVerificationBadgeMeta(item.state);
            return (
              <div
                key={idx}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0',
                    meta.colorClass
                  )}
                >
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peer Endorsements Section */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Peer Cooperative Endorsements ({profile.peer_endorsements.count})
            </span>
          </div>

          {canEndorse && (
            <button
              onClick={() => setIsEndorsementModalOpen(true)}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              + Endorse Skill
            </button>
          )}
        </div>

        {profile.peer_endorsements.count === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No peer endorsements recorded yet. Verified guild members can endorse skills after collaborative bookings.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.peer_endorsements.endorsements.map((end) => (
              <span
                key={end.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
              >
                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                {end.skill_name}
                <span className="text-[10px] text-purple-400">by {end.endorser_name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Peer Endorsement Modal */}
      <PeerEndorsementModal
        isOpen={isEndorsementModalOpen}
        onClose={() => setIsEndorsementModalOpen(false)}
        workerId={profile.worker_id}
        workerName={profile.full_name}
        existingSkills={profile.peer_endorsements.endorsements.map((e) => e.skill_name)}
        onEndorsed={() => {
          onEndorsementSuccess?.();
          setIsEndorsementModalOpen(false);
        }}
      />
    </div>
  );
};
