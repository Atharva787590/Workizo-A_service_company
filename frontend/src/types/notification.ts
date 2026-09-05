/**
 * UNNATI Notification & Opportunity Intelligence Type Contracts
 */

export type ChannelType = 'PUSH' | 'IN_APP' | 'SMS' | 'IVR';

export type NotificationCategory =
  | 'booking'
  | 'opportunity'
  | 'governance'
  | 'payment'
  | 'general';

export interface DeliveryAttempt {
  channel: ChannelType | 'ALL';
  status: 'DELIVERED' | 'FALLBACK_TRIGGERED' | 'FAILED' | 'SUPPRESSED_QUIET_HOURS';
  timestamp: string;
  note?: string;
}

export interface NotificationRecord {
  id: number;
  user?: number;
  title: string;
  message: string;
  notification_type?: string;
  category: NotificationCategory;
  delivered_channel?: ChannelType;
  channel_delivery_history?: DeliveryAttempt[];
  idempotency_key?: string | null;
  is_urgent?: boolean;
  language?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreference {
  id?: number;
  enabled_channels: ChannelType[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string; // "07:00"
  preferred_language: string;
  opportunity_radius_km: number;
  urgent_bypasses_quiet_hours: boolean;
}

export interface OpportunityAlertRecord {
  id: number;
  booking_id?: number | null;
  service_title: string;
  coarse_locality: string;
  coarse_distance_km: number;
  estimated_payout: number | string;
  status: 'AVAILABLE' | 'ACCEPTED' | 'DISMISSED' | 'EXPIRED';
  created_at: string;
}

export interface GovernanceAnnouncement {
  id: number;
  title: string;
  message: string;
  recipient_type: string;
  recipient_user_name?: string | null;
  created_at: string;
}
