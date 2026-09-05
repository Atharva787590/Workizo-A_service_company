import React from 'react';
import { Zap, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BookingType } from '@/types/unnati';

export interface BookingTypeSelectorProps {
  selectedType: BookingType;
  onSelect: (type: BookingType) => void;
  className?: string;
}

const options: Array<{
  type: BookingType;
  title: string;
  hindiTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}> = [
  {
    type: 'instant',
    title: 'Instant Booking',
    hindiTitle: 'तत्काल सेवा',
    description: 'Dispatch nearest available cooperative craftsman immediately.',
    icon: Zap,
    badge: 'Fastest (<15m)',
  },
  {
    type: 'scheduled',
    title: 'Scheduled Booking',
    hindiTitle: 'निर्धारित सेवा',
    description: 'Book up to 30 days in advance at your preferred time slot.',
    icon: Calendar,
    badge: 'Flexible',
  },
  {
    type: 'collective',
    title: 'Collective Group',
    hindiTitle: 'सामूहिक दल सेवा',
    description: 'Deploy 2 to 10 verified craftsmen on a unified contract.',
    icon: Users,
    badge: 'Multi-worker',
  },
];

export const BookingTypeSelector: React.FC<BookingTypeSelectorProps> = ({
  selectedType,
  onSelect,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)} role="radiogroup" aria-label="Select Service Booking Type">
      <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block">
        Choose Service Mode (सेवा प्रकार चुनें)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selectedType === opt.type;

          return (
            <button
              key={opt.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(opt.type)}
              className={cn(
                'unnati-touch-target relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-blue-500',
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      'p-2 rounded-xl',
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'text-[11px] font-bold px-2 py-0.5 rounded-full',
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    )}
                  >
                    {opt.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {opt.title}
                </h4>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {opt.hindiTitle}
                </p>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookingTypeSelector;
