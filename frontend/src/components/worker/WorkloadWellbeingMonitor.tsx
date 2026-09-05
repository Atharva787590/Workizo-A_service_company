import React from 'react';
import { HeartPulse, Coffee, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WorkloadWellbeing } from '@/types/unnati';

export interface WorkloadWellbeingMonitorProps {
  wellbeing: WorkloadWellbeing;
  className?: string;
}

export const WorkloadWellbeingMonitor: React.FC<WorkloadWellbeingMonitorProps> = ({
  wellbeing,
  className
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'rose':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-800',
          text: 'text-rose-700 dark:text-rose-300',
          badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-300',
          badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300',
          icon: <Coffee className="w-4 h-4 text-amber-600" />
        };
      case 'blue':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300',
          icon: <Clock className="w-4 h-4 text-blue-600" />
        };
      case 'emerald':
      default:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-700 dark:text-emerald-300',
          badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        };
    }
  };

  const style = getColorClasses(wellbeing.color);

  return (
    <div
      className={cn(
        'rounded-3xl border p-6 shadow-xs space-y-4',
        style.bg,
        style.border,
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            Worker Well-Being & Workload Monitor
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            कार्यभार एवं विश्राम निगरानी (Platform Activity Indicator)
          </h3>
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto',
            style.badge
          )}
        >
          {style.icon}
          <span>{wellbeing.label}</span>
          <span className="text-[10px] font-normal opacity-80">({wellbeing.labelHi})</span>
        </span>
      </div>

      {/* Activity Meters */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 space-y-0.5">
          <span className="text-slate-500 dark:text-slate-400 block">Today's Completed Visits:</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            {wellbeing.todayCompletedJobs} visits
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 space-y-0.5">
          <span className="text-slate-500 dark:text-slate-400 block">Estimated Active Hours:</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            ~{wellbeing.activeHoursToday} hrs
          </span>
        </div>
      </div>

      {/* Rest Recommendation */}
      <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs">
        <Coffee className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
            Rest & Fatigue Guidance:
          </span>
          <span className="text-slate-600 dark:text-slate-300">
            {wellbeing.restRecommendation}
          </span>
        </div>
      </div>

      {/* Non-Medical Disclaimer */}
      <p className="text-[11px] text-slate-400 italic">
        *Disclaimer: {wellbeing.disclaimer} This workload monitor does not provide medical diagnosis or health treatment advice.
      </p>
    </div>
  );
};
