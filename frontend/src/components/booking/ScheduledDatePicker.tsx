import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ScheduledDatePickerProps {
  value?: string | null;
  onChange: (isoDateTime: string) => void;
  className?: string;
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (सुबह)', time: '09:00', desc: '09:00 AM - 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon (दोपहर)', time: '13:00', desc: '01:00 PM - 04:00 PM' },
  { id: 'evening', label: 'Evening (शाम)', time: '17:00', desc: '05:00 PM - 08:00 PM' },
];

export const ScheduledDatePicker: React.FC<ScheduledDatePickerProps> = ({
  value,
  onChange,
  className,
}) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  const formatDateForInput = (d: Date) => d.toISOString().split('T')[0];

  const minDateStr = formatDateForInput(today);
  const maxDateStr = formatDateForInput(maxDate);

  const [selectedDate, setSelectedDate] = useState<string>(
    value ? value.split('T')[0] : formatDateForInput(tomorrow)
  );
  const [selectedSlot, setSelectedSlot] = useState<string>('morning');

  useEffect(() => {
    if (selectedDate) {
      const slot = TIME_SLOTS.find(s => s.id === selectedSlot) || TIME_SLOTS[0];
      const combined = `${selectedDate}T${slot.time}:00.000Z`;
      onChange(combined);
    }
  }, [selectedDate, selectedSlot]);

  return (
    <div className={cn('p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200 dark:border-zinc-800 space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Schedule Up to 30 Days Ahead
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select your preferred service appointment date and time window
          </p>
        </div>
      </div>

      {/* Date Input */}
      <div>
        <label htmlFor="scheduled-date-input" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
          Service Date (दिनांक)
        </label>
        <input
          id="scheduled-date-input"
          type="date"
          min={minDateStr}
          max={maxDateStr}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="unnati-touch-target w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        />
      </div>

      {/* Time Slot Picker */}
      <div>
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
          Preferred Time Slot (समय स्लॉट)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Appointment Time Slots">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedSlot(slot.id)}
                className={cn(
                  'unnati-touch-target p-3 rounded-xl border text-left flex flex-col justify-between transition-all focus:outline-none focus:ring-2 focus:ring-blue-500',
                  isSelected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                )}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{slot.label}</span>
                </div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {slot.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-100/60 dark:bg-blue-950/40 text-[11px] text-blue-800 dark:text-blue-300">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Free cancellation is guaranteed up to 2 hours before your scheduled appointment.
        </span>
      </div>
    </div>
  );
};

export default ScheduledDatePicker;
