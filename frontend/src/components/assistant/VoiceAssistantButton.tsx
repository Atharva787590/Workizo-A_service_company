import React, { useState } from 'react';
import { Mic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoiceAssistantModal } from './VoiceAssistantModal';

export interface VoiceAssistantButtonProps {
  className?: string;
  label?: string;
}

export const VoiceAssistantButton: React.FC<VoiceAssistantButtonProps> = ({
  className,
  label = 'आवाज़ सहायक (AI Assistant)'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open UNNATI Voice Assistant"
        title="Open UNNATI Multilingual Voice Assistant"
        className={cn(
          'fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/20',
          className
        )}
      >
        <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
          <Mic className="w-4 h-4 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </span>
        <span className="hidden sm:inline tracking-tight">{label}</span>
      </button>

      <VoiceAssistantModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
