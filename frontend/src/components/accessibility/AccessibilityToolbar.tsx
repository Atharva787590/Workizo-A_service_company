import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility, type TextSize } from '@/context/AccessibilityContext';
import {
  Eye,
  Type,
  RotateCcw,
  X,
  SlidersHorizontal,
  Wifi,
  WifiOff,
} from 'lucide-react';

export const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    highContrast,
    textSize,
    reducedMotion,
    lowBandwidth,
    isOnline,
    toggleHighContrast,
    setTextSize,
    toggleReducedMotion,
    toggleLowBandwidth,
    resetSettings,
  } = useAccessibility();

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus modal when opened
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  const textSizes: { id: TextSize; label: string; sample: string }[] = [
    { id: 'normal', label: 'Normal (100%)', sample: 'Aa' },
    { id: 'large', label: 'Large (115%)', sample: 'Aa+' },
    { id: 'extra-large', label: 'Extra Large (130%)', sample: 'Aa++' },
  ];

  return (
    <>
      {/* Floating Accessibility Trigger Button */}
      <aside aria-label="Accessibility Assistance" className="fixed bottom-6 left-6 z-40">
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          className="unnati-touch-target flex items-center justify-center p-3 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-4 focus:ring-blue-300 transition-transform active:scale-95"
          aria-label="Open Accessibility & Usability Preferences"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title="Accessibility Preferences (WCAG 2.1 AA)"
        >
          <SlidersHorizontal className="w-6 h-6" aria-hidden="true" />
          <span className="sr-only">Accessibility Preferences</span>
        </button>
      </aside>

      {/* Accessibility Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="a11y-dialog-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 focus:outline-none max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Eye className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="a11y-dialog-title" className="text-lg font-bold">
                    Accessibility & Network
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    WCAG 2.1 AA Standards • UNNATI
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="unnati-touch-target p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close preferences dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-5">
              {/* Network Status Badge */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span>Status: {isOnline ? 'Online (Connected)' : 'Offline (Local Only)'}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isOnline
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                  }`}
                >
                  {isOnline ? 'Ready' : 'Offline'}
                </span>
              </div>

              {/* 1. High Contrast Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <label htmlFor="toggle-high-contrast" className="text-sm font-semibold cursor-pointer">
                    High-Contrast Mode
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Maximizes text contrast for low-vision readability (7:1 ratio)
                  </p>
                </div>
                <button
                  id="toggle-high-contrast"
                  role="switch"
                  aria-checked={highContrast}
                  onClick={toggleHighContrast}
                  className={`unnati-touch-target relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    highContrast ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      highContrast ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  <span className="sr-only">Toggle high contrast</span>
                </button>
              </div>

              {/* 2. Text Scaling */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    Text Size Scaling
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Text Size Options">
                  {textSizes.map((size) => {
                    const isSelected = textSize === size.id;
                    return (
                      <button
                        key={size.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setTextSize(size.id)}
                        className={`unnati-touch-target flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                            : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="text-base">{size.sample}</span>
                        <span className="text-xs mt-1">{size.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Reduced Motion Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <label htmlFor="toggle-reduced-motion" className="text-sm font-semibold cursor-pointer">
                    Reduced-Motion Mode
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Disables UI animations for vestibular or motion sensitivities
                  </p>
                </div>
                <button
                  id="toggle-reduced-motion"
                  role="switch"
                  aria-checked={reducedMotion}
                  onClick={toggleReducedMotion}
                  className={`unnati-touch-target relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    reducedMotion ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  <span className="sr-only">Toggle reduced motion</span>
                </button>
              </div>

              {/* 4. Low-Bandwidth Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 pr-2">
                  <label htmlFor="toggle-low-bandwidth" className="text-sm font-semibold cursor-pointer">
                    Low-Bandwidth (Data Saver)
                  </label>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Disables heavy background graphics and prioritzes text and essential data
                  </p>
                </div>
                <button
                  id="toggle-low-bandwidth"
                  role="switch"
                  aria-checked={lowBandwidth}
                  onClick={toggleLowBandwidth}
                  className={`unnati-touch-target relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    lowBandwidth ? 'bg-amber-600' : 'bg-zinc-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      lowBandwidth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  <span className="sr-only">Toggle low bandwidth mode</span>
                </button>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={resetSettings}
                className="unnati-touch-target flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                Reset Defaults
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="unnati-touch-target px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityToolbar;
