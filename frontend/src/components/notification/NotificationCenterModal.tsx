import React, { useState, useEffect } from 'react';
import {
  Bell,
  Sliders,
  CheckCheck,
  X,
  Sparkles,
  Calendar,
  Building2,
  AlertTriangle,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  NotificationRecord,
  OpportunityAlertRecord,
  GovernanceAnnouncement,
  NotificationCategory
} from '@/types/notification';
import {
  filterNotificationsByCategory,
  getChannelDeliveryBadge,
  getOfflineNotificationQueue,
  scrubClientPrivacyData
} from '@/lib/notificationEngine';
import { OpportunityAlertCard } from './OpportunityAlertCard';
import { GovernanceAnnouncementCard } from './GovernanceAnnouncementCard';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import api from '@/services/api';
import toast from 'react-hot-toast';

export interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'all' | NotificationCategory>('all');
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityAlertRecord[]>([]);
  const [announcements, setAnnouncements] = useState<GovernanceAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [notifRes, oppRes, govRes] = await Promise.allSettled([
        api.get('/api/notifications/'),
        api.get('/api/opportunities/'),
        api.get('/api/governance-announcements/')
      ]);

      if (notifRes.status === 'fulfilled') {
        const notifs = notifRes.value.data?.results || notifRes.value.data || [];
        setNotifications(Array.isArray(notifs) ? notifs : []);
      }
      if (oppRes.status === 'fulfilled') {
        const opps = oppRes.value.data?.results || oppRes.value.data || [];
        setOpportunities(Array.isArray(opps) ? opps : []);
      }
      if (govRes.status === 'fulfilled') {
        const govs = govRes.value.data || [];
        setAnnouncements(Array.isArray(govs) ? govs : []);
      }
    } catch (err) {
      console.warn('Notification fetch error, checking offline cache:', err);
      const offlineQueue = getOfflineNotificationQueue();
      if (offlineQueue.length) {
        setNotifications(offlineQueue);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.post(`/api/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all/');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read.');
    }
  };

  const handleAcceptOpportunity = async (oppId: number) => {
    try {
      await api.post(`/api/opportunities/${oppId}/accept/`);
      toast.success('Opportunity accepted! Details added to your schedule.');
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, status: 'ACCEPTED' } : o))
      );
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to accept opportunity.');
    }
  };

  const handleDismissOpportunity = async (oppId: number) => {
    try {
      await api.post(`/api/opportunities/${oppId}/dismiss/`);
      setOpportunities((prev) => prev.filter((o) => o.id !== oppId));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to dismiss.');
    }
  };

  const filteredNotifications = filterNotificationsByCategory(notifications, activeTab);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="notif-center-title"
          className={cn(
            'w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]',
            className
          )}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[10px] flex items-center justify-center border-2 border-white dark:border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h3 id="notif-center-title" className="text-lg font-black text-slate-900 dark:text-white">
                  Notification & Opportunity Center
                </h3>
                <p className="text-xs text-slate-500">सूचना एवं अवसर केंद्र (UNNATI)</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPreferencesOpen(true)}
                title="Notification Preferences"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button
                onClick={fetchAllData}
                disabled={isLoading}
                title="Refresh"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              </button>
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Offline Banner */}
          {isOffline && (
            <div className="px-4 py-2 bg-amber-500 text-white text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-4 h-4" />
                Offline Mode: Showing cached notifications. Actions will sync upon reconnection.
              </span>
            </div>
          )}

          {/* Category Tabs */}
          <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'pb-3 text-xs font-bold border-b-2 transition whitespace-nowrap',
                  activeTab === 'all'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('opportunity')}
                className={cn(
                  'pb-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1',
                  activeTab === 'opportunity'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Opportunities ({opportunities.filter((o) => o.status === 'AVAILABLE').length})
              </button>
              <button
                onClick={() => setActiveTab('booking')}
                className={cn(
                  'pb-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1',
                  activeTab === 'booking'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('governance')}
                className={cn(
                  'pb-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1',
                  activeTab === 'governance'
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                )}
              >
                <Building2 className="w-3.5 h-3.5" />
                Governance ({announcements.length})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="pb-3 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Tab Content List */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Opportunities Section if Tab is 'all' or 'opportunity' */}
            {(activeTab === 'all' || activeTab === 'opportunity') &&
              opportunities.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Nearby Opportunities (निकटवर्ती रोजगार)
                  </span>
                  {opportunities.map((opp) => (
                    <OpportunityAlertCard
                      key={opp.id}
                      alert={opp}
                      onAccept={handleAcceptOpportunity}
                      onDismiss={handleDismissOpportunity}
                    />
                  ))}
                </div>
              )}

            {/* Governance Section if Tab is 'all' or 'governance' */}
            {(activeTab === 'all' || activeTab === 'governance') &&
              announcements.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Cooperative Governance (सहकारी निर्णय व सभा)
                  </span>
                  {announcements.map((ann) => (
                    <GovernanceAnnouncementCard key={ann.id} announcement={ann} />
                  ))}
                </div>
              )}

            {/* General & Booking Notifications */}
            {filteredNotifications.length > 0 ? (
              <div className="space-y-2.5">
                {(activeTab === 'all' || activeTab === 'booking' || activeTab === 'general' || activeTab === 'payment') && (
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Recent Alerts (हालिया सूचनाएं)
                  </span>
                )}
                {filteredNotifications.map((notif) => {
                  const badge = getChannelDeliveryBadge(
                    notif.delivered_channel,
                    notif.channel_delivery_history
                  );
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                      className={cn(
                        'p-4 rounded-2xl border transition-all cursor-pointer space-y-2',
                        notif.is_read
                          ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-80'
                          : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/30 dark:bg-blue-950/10 hover:border-blue-300'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                              badge.color
                            )}
                          >
                            {badge.label} {badge.fallbackText}
                          </span>
                          {notif.is_urgent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <h4
                        className={cn(
                          'text-sm font-bold',
                          notif.is_read
                            ? 'text-slate-800 dark:text-slate-200'
                            : 'text-blue-950 dark:text-blue-100 font-extrabold'
                        )}
                      >
                        {scrubClientPrivacyData(notif.title)}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {scrubClientPrivacyData(notif.message)}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Empty state when nothing in this tab */}
            {filteredNotifications.length === 0 &&
              opportunities.length === 0 &&
              announcements.length === 0 && (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No notifications in this category
                  </p>
                  <p className="text-xs text-slate-500">
                    You're all caught up with your cooperative and booking alerts.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </>
  );
};
