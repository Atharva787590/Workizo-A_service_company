import React, { useState, useEffect } from 'react';
import { X, Moon, Bell, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NotificationPreference, ChannelType } from '@/types/notification';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (pref: NotificationPreference) => void;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'en', name: 'English' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'or', name: 'ଓଡ଼ିଆ (Odia)' },
  { code: 'as', name: 'অসমীয়া (Assamese)' },
  { code: 'ur', name: 'اردو (Urdu)' }
];

const CHANNELS: { id: ChannelType; label: string; desc: string }[] = [
  { id: 'PUSH', label: 'Push Notifications', desc: 'Instant mobile alerts for urgent jobs' },
  { id: 'IN_APP', label: 'In-App Tray', desc: 'Always available in your dashboard' },
  { id: 'SMS', label: 'SMS Messages', desc: 'Fallback text alerts when offline' },
  { id: 'IVR', label: 'Voice / IVR Calls', desc: 'Automated call for critical updates' }
];

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  className
}) => {
  const [pref, setPref] = useState<NotificationPreference>({
    enabled_channels: ['PUSH', 'IN_APP', 'SMS'],
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    preferred_language: 'hi',
    opportunity_radius_km: 10,
    urgent_bypasses_quiet_hours: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api
        .get('/api/notifications/preferences/')
        .then((res) => {
          if (res.data) setPref(res.data);
        })
        .catch((err) => {
          console.warn('Preferences load error:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleChannel = (ch: ChannelType) => {
    setPref((prev) => {
      const exists = prev.enabled_channels.includes(ch);
      const updated = exists
        ? prev.enabled_channels.filter((c) => c !== ch)
        : [...prev.enabled_channels, ch];
      return { ...prev, enabled_channels: updated.length ? updated : ['IN_APP'] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/api/notifications/preferences/', pref);
      toast.success('Notification preferences saved successfully!');
      onSaved?.(res.data || pref);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-pref-title"
        className={cn(
          'w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
          className
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="notif-pref-title" className="text-lg font-black text-slate-900 dark:text-white">
                Notification Preferences
              </h3>
              <p className="text-xs text-slate-500">सूचना प्राथमिकताएं एवं शांत समय</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Priority Channels */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Multi-Channel Routing Hierarchy
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {CHANNELS.map((ch) => {
                const isChecked = pref.enabled_channels.includes(ch.id);
                return (
                  <button
                    type="button"
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all',
                      isChecked
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                    )}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {ch.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ch.desc}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center border text-white',
                        isChecked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-700'
                      )}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-purple-500" />
                Quiet Hours (शांत समय)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pref.quiet_hours_enabled}
                  onChange={(e) => setPref({ ...pref, quiet_hours_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {pref.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={pref.quiet_hours_start}
                    onChange={(e) => setPref({ ...pref, quiet_hours_start: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={pref.quiet_hours_end}
                    onChange={(e) => setPref({ ...pref, quiet_hours_end: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="urgent-override"
                checked={pref.urgent_bypasses_quiet_hours}
                onChange={(e) => setPref({ ...pref, urgent_bypasses_quiet_hours: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <label htmlFor="urgent-override" className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Urgent booking updates bypass quiet hours
              </label>
            </div>
          </div>

          {/* Language & Opportunity Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Notification Language
              </label>
              <select
                value={pref.preferred_language}
                onChange={(e) => setPref({ ...pref, preferred_language: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Opportunity Radius
                </label>
                <span className="text-xs font-bold text-blue-600">{pref.opportunity_radius_km} km</span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="1"
                value={pref.opportunity_radius_km}
                onChange={(e) => setPref({ ...pref, opportunity_radius_km: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>2 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Preferences (सहेजें)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
