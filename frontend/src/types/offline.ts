/**
 * UNNATI Offline-First & Low-Bandwidth Architecture Types
 */

export type NetworkQualityState =
  | 'ONLINE'
  | 'OFFLINE'
  | 'POOR_CONNECTION'
  | 'SYNCING'
  | 'SYNC_COMPLETE'
  | 'SYNC_FAILED';

export type PermittedOfflineActionType =
  | 'RECORD_TASK_NOTE'
  | 'UPDATE_TASK_PROGRESS'
  | 'LOG_ARRIVAL'
  | 'ADD_JOB_PHOTO_NOTE'
  | 'SAVE_DRAFT_PROFILE';

export type RestrictedOfflineActionType =
  | 'CONFIRM_PAYMENT'
  | 'INITIATE_PAYOUT'
  | 'SUBMIT_AADHAAR_KYC'
  | 'DELETE_ACCOUNT'
  | 'ADMIN_RESOLVE_DISPUTE'
  | 'WITHDRAW_WALLET';

export type OfflineSyncStatus =
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'CONFLICT_DETECTED';

export interface SyncQueueItem {
  id: string;
  idempotencyKey: string;
  actionType: PermittedOfflineActionType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  payload: Record<string, unknown>;
  status: OfflineSyncStatus;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  serverTimestampAtQueue?: string;
  entityId?: string | number;
  description: string;
}

export interface CachedJobRecord {
  id: number;
  tracking_id: string;
  customer_name: string;
  customer_phone?: string;
  service_name: string;
  service_category: string;
  problem_description: string;
  address: string;
  city: string;
  status: string;
  cachedAt: string;
  lastServerUpdated: string;
  lastUpdated?: string;
  isStale: boolean;
  pendingNotes?: Array<{
    id: string;
    note: string;
    createdAt: string;
    synced: boolean;
  }>;
  pendingProgressStatus?: string;
}

export interface SyncResult {
  totalProcessed: number;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  errors: Array<{ id: string; error: string }>;
}

export interface OfflineRestrictionInfo {
  isPermitted: boolean;
  reason?: string;
  reasonHi?: string;
}
