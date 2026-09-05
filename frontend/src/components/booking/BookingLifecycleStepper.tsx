import React from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Navigation,
  MapPin,
  Wrench,
  CheckCheck,
  CreditCard,
  AlertOctagon,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mapWorkizoStatusToUnnati } from '@/lib/bookingEngine';

export interface BookingLifecycleStepperProps {
  currentStatus: string;
  bookingType?: 'instant' | 'scheduled' | 'collective';
  className?: string;
}

const LIFECYCLE_STEPS: Array<{
  key: string;
  title: string;
  hindiTitle: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'REQUESTED', title: 'Requested', hindiTitle: 'अनुरोधित', icon: FileText },
  { key: 'MATCHING', title: 'Matching', hindiTitle: 'मिलान', icon: Search },
  { key: 'ACCEPTED', title: 'Accepted', hindiTitle: 'स्वीकृत', icon: CheckCircle2 },
  { key: 'SCHEDULED', title: 'Scheduled', hindiTitle: 'निर्धारित', icon: Calendar },
  { key: 'WORKER_ARRIVING', title: 'On The Way', hindiTitle: 'रास्ते में', icon: Navigation },
  { key: 'ARRIVED', title: 'Arrived', hindiTitle: 'पहुंच गए', icon: MapPin },
  { key: 'IN_PROGRESS', title: 'In Progress', hindiTitle: 'कार्य प्रगति पर', icon: Wrench },
  { key: 'COMPLETED', title: 'Completed', hindiTitle: 'पूर्ण', icon: CheckCheck },
  { key: 'PAYMENT_RELEASED', title: 'Released', hindiTitle: 'भुगतान जारी', icon: CreditCard },
];

export const BookingLifecycleStepper: React.FC<BookingLifecycleStepperProps> = ({
  currentStatus,
  bookingType = 'instant',
  className,
}) => {
  const canonical = mapWorkizoStatusToUnnati(currentStatus);

  if (canonical === 'CANCELLED') {
    return (
      <div className={cn('p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-900 flex items-center gap-3', className)}>
        <AlertOctagon className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-red-900 dark:text-red-200">
            Booking Cancelled (रद्द किया गया)
          </h4>
          <p className="text-xs text-red-700 dark:text-red-300">
            This service booking was cancelled under UNNATI fair-cancellation rules.
          </p>
        </div>
      </div>
    );
  }

  if (canonical === 'DISPUTED') {
    return (
      <div className={cn('p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-900 flex items-center gap-3', className)}>
        <Scale className="w-6 h-6 text-purple-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">
            Under Dispute Arbitration (मध्यस्थता समीक्षा)
          </h4>
          <p className="text-xs text-purple-700 dark:text-purple-300">
            Cooperative resolution committee is actively reviewing this contract.
          </p>
        </div>
      </div>
    );
  }

  // Filter steps: if instant, omit SCHEDULED; if scheduled, keep it
  const visibleSteps = bookingType === 'instant'
    ? LIFECYCLE_STEPS.filter(s => s.key !== 'SCHEDULED')
    : LIFECYCLE_STEPS;

  const currentIndex = visibleSteps.findIndex(s => s.key === canonical);
  const activeIdx = currentIndex !== -1 ? currentIndex : 0;

  return (
    <div className={cn('w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Booking Lifecycle (कार्य प्रगति चक्र)
        </h4>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {visibleSteps[activeIdx]?.title} • {visibleSteps[activeIdx]?.hindiTitle}
        </span>
      </div>

      {/* Responsive Horizontal / Scrollable Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto py-2 no-scrollbar" role="list">
        {visibleSteps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < activeIdx;
          const isCurrent = idx === activeIdx;

          return (
            <div
              key={step.key}
              role="listitem"
              className={cn(
                'flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                isCurrent
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-400 border-zinc-200 dark:border-zinc-700'
              )}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingLifecycleStepper;
