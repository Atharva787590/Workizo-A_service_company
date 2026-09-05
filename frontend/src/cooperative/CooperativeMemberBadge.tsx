import { ShieldCheck, Award, Users, Vote, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GuildTier } from '@/types/unnati';

export interface CooperativeMemberBadgeProps {
  coopId?: string;
  guildTier?: GuildTier;
  tradeName?: string;
  isVerified?: boolean;
  peerEndorsements?: number;
  votingEligible?: boolean;
  className?: string;
}

const tierConfig: Record<GuildTier, { label: string; hindiLabel: string; bg: string; text: string; border: string }> = {
  apprentice: {
    label: 'Apprentice Member',
    hindiLabel: 'प्रशिक्षु सदस्य',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  member: {
    label: 'Certified Guildsman',
    hindiLabel: 'प्रमाणित गिल्ड सदस्य',
    bg: 'bg-blue-50 dark:bg-blue-950/80',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  guild_lead: {
    label: 'Guild Lead',
    hindiLabel: 'गिल्ड प्रमुख',
    bg: 'bg-amber-50 dark:bg-amber-950/80',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  master_craftsman: {
    label: 'Master Craftsman',
    hindiLabel: 'वरिष्ठ शिल्पकार',
    bg: 'bg-emerald-50 dark:bg-emerald-950/80',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
};

export const CooperativeMemberBadge: React.FC<CooperativeMemberBadgeProps> = ({
  coopId = 'UNN-COOP-GJ-7182',
  guildTier = 'member',
  tradeName = 'Electrician Guild',
  isVerified = true,
  peerEndorsements = 12,
  votingEligible = true,
  className,
}) => {
  const currentTier = tierConfig[guildTier] || tierConfig.member;

  return (
    <div
      className={cn(
        'w-full p-4 rounded-2xl border transition-shadow shadow-xs',
        currentTier.bg,
        currentTier.border,
        className
      )}
      role="region"
      aria-label="Cooperative Member Credentials"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Member Identity & Guild */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs shrink-0">
            <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('unnati-badge', currentTier.bg, currentTier.text, 'border', currentTier.border)}>
                {currentTier.label} • {currentTier.hindiLabel}
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                ID: {coopId}
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {tradeName} Cooperative
            </h3>
          </div>
        </div>

        {/* Badges / Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* KYC Status */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
              isVerified
                ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-amber-100/70 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
            )}
            title={isVerified ? 'Aadhaar & PAN Government KYC Verified' : 'KYC Pending Verification'}
          >
            {isVerified ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            )}
            <span>{isVerified ? 'KYC Verified' : 'KYC Pending'}</span>
          </div>

          {/* Peer Endorsements */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
            title="Peer Endorsements by fellow cooperative trade members"
          >
            <Users className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
            <span>{peerEndorsements} Peer Endorsements</span>
          </div>

          {/* Democratic Voting Right */}
          {votingEligible && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100/80 border border-purple-300 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
              title="1 Member = 1 Vote democratic right in platform policies"
            >
              <Vote className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <span>Voting Eligible (मताधिकार)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CooperativeMemberBadge;
