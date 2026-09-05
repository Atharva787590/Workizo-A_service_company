import React from 'react';
import { Building2, Calendar, Vote, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GovernanceAnnouncement } from '@/types/notification';

export interface GovernanceAnnouncementCardProps {
  announcement: GovernanceAnnouncement;
  className?: string;
}

export const GovernanceAnnouncementCard: React.FC<GovernanceAnnouncementCardProps> = ({
  announcement,
  className
}) => {
  const isVoting = announcement.title.toLowerCase().includes('vote') || announcement.message.toLowerCase().includes('voting');

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-2.5 transition-all',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          {isVoting ? <Vote className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
          Cooperative Governance (सहकारी शासन)
        </span>
        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(announcement.created_at).toLocaleDateString()}
        </span>
      </div>

      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
        {announcement.title}
      </h4>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        {announcement.message}
      </p>

      <div className="pt-1 flex items-center gap-2 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
        <Building2 className="w-3 h-3" />
        <span>UNNATI Worker Cooperative General Assembly</span>
      </div>
    </div>
  );
};
