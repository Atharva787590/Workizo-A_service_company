import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { UnnatiHelpModal } from './UnnatiHelpModal';

export interface UnnatiHelpButtonProps {
  className?: string;
  label?: string;
}

export const UnnatiHelpButton: React.FC<UnnatiHelpButtonProps> = ({
  className,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const buttonLabel = label || t('help_button_label');

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t('help_modal_title')}
        title={t('help_modal_title')}
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20',
          className
        )}
      >
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
        </span>
        <span className="hidden sm:inline tracking-tight">{buttonLabel}</span>
      </button>

      <UnnatiHelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default UnnatiHelpButton;
