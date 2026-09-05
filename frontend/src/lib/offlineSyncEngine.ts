/**
 * UNNATI Offline-First Synchronization & Task Operations Engine
 * -------------------------------------------------------------
 * Provides reliable offline queueing with idempotency keys, sensitive data exclusion,
 * safe task progress updates, conflict resolution, and retry logic.
 */

import {
  SyncQueueItem,
  PermittedOfflineActionType,
  CachedJobRecord,
  SyncResult,
  OfflineRestrictionInfo
} from '../types/offline';

export const QUEUE_STORAGE_KEY = 'unnati_sync_queue_v1';
export const CACHED_JOBS_KEY = 'unnati_cached_jobs_v1';

export const PERMITTED_OFFLINE_ACTIONS: PermittedOfflineActionType[] = [
  'RECORD_TASK_NOTE',
  'UPDATE_TASK_PROGRESS',
  'LOG_ARRIVAL',
  'ADD_JOB_PHOTO_NOTE',
  'SAVE_DRAFT_PROFILE',
];

export const RESTRICTED_ACTIONS_MAP: Record<string, { en: string; hi: string }> = {
  CONFIRM_PAYMENT: {
    en: 'Payment confirmation requires immediate bank and UPI gateway settlement. It cannot be verified offline.',
    hi: 'भुगतान की पुष्टि के लिए बैंक सर्वर से तुरंत संपर्क आवश्यक है। यह ऑफलाइन संभव नहीं है।',
  },
  INITIATE_PAYOUT: {
    en: 'Payout distribution requires real-time cooperative treasury authorization and direct banking verification.',
    hi: 'भुगतान निकासी के लिए तुरंत बैंक सत्यापन आवश्यक है।',
  },
  SUBMIT_AADHAAR_KYC: {
    en: 'Aadhaar e-KYC and identity verification require live UIDAI server validation.',
    hi: 'आधार ई-केवाईसी के लिए यूआईडीएआई सर्वर से सीधा संपर्क आवश्यक है।',
  },
  DELETE_ACCOUNT: {
    en: 'Irreversible account modification requires active server authentication.',
    hi: 'खाता हटाने के लिए सक्रिय सर्वर प्रमाणीकरण आवश्यक है।',
  },
  ADMIN_RESOLVE_DISPUTE: {
    en: 'Governance arbitration decisions must be immutably recorded directly on the live cooperative ledger.',
    hi: 'विवाद निपटान निर्णय सीधे सर्वर पर दर्ज होना आवश्यक है।',
  },
  WITHDRAW_WALLET: {
    en: 'Fund withdrawal requires active transaction processing.',
    hi: 'वॉलेट निकासी के लिए लाइव नेटवर्क आवश्यक है।',
  },
};

const SENSITIVE_DATA_KEYS = [
  'aadhaar',
  'aadhaar_number',
  'pan',
  'pan_number',
  'card_number',
  'cvv',
  'pin',
  'password',
  'secret',
  'token',
  'bank_account',
];

/**
 * Validates if an action is permitted offline.
 */
export function checkOfflineActionPermitted(actionType: string): OfflineRestrictionInfo {
  if (PERMITTED_OFFLINE_ACTIONS.includes(actionType as PermittedOfflineActionType)) {
    return { isPermitted: true };
  }

  const restricted = RESTRICTED_ACTIONS_MAP[actionType];
  if (restricted) {
    return {
      isPermitted: false,
      reason: restricted.en,
      reasonHi: restricted.hi,
    };
  }

  return {
    isPermitted: false,
    reason: `Action '${actionType}' requires an active internet connection to ensure cooperative ledger integrity.`,
    reasonHi: `कार्रवाई '${actionType}' के लिए इंटरनेट कनेक्शन आवश्यक है।`,
  };
}

/**
 * Asserts that a payload does not contain sensitive financial or identity credentials.
 * Throws an error if any sensitive field is present.
 */
export function assertPayloadExcludesSensitiveData(payload: Record<string, unknown>): boolean {
  for (const key of Object.keys(payload)) {
    const normalizedKey = key.toLowerCase();
    for (const sensitive of SENSITIVE_DATA_KEYS) {
      if (normalizedKey.includes(sensitive)) {
        throw new Error(
          `Security Violation: Refusing to queue sensitive credential '${key}' in offline sync storage.`
        );
      }
    }
    // Check nested objects
    const val = payload[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      assertPayloadExcludesSensitiveData(val as Record<string, unknown>);
    }
  }
  return true;
}

/**
 * Generates an idempotent transaction key for queued mutations.
 */
export function generateIdempotencyKey(actionType: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `UNN-SYNC-${actionType}-${Date.now()}-${randomSuffix}`;
}

class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

const memoryStore = new MemoryStorage();

export function getOfflineStorage(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  clear: () => void;
} {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Access to localStorage might be restricted
  }
  return memoryStore;
}

/**
 * Retrieves the current offline sync queue from localStorage.
 */
export function getSyncQueue(): SyncQueueItem[] {
  try {
    const storage = getOfflineStorage();
    const raw = storage.getItem(QUEUE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to read offline sync queue', err);
    return [];
  }
}

/**
 * Persists the sync queue to localStorage.
 */
export function saveSyncQueue(queue: SyncQueueItem[]): void {
  try {
    const storage = getOfflineStorage();
    storage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to persist sync queue', err);
  }
}

/**
 * Queues an action for later synchronization with server-authoritative idempotency.
 */
export function queueOfflineAction(params: {
  actionType: PermittedOfflineActionType;
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  payload: Record<string, unknown>;
  description: string;
  entityId?: string | number;
  serverTimestampAtQueue?: string;
  maxRetries?: number;
}): SyncQueueItem {
  // 1. Enforce safety restrictions
  const check = checkOfflineActionPermitted(params.actionType);
  if (!check.isPermitted) {
    throw new Error(check.reason);
  }

  // 2. Enforce sensitive data exclusion
  assertPayloadExcludesSensitiveData(params.payload);

  const queue = getSyncQueue();
  const idempotencyKey = generateIdempotencyKey(params.actionType);

  const item: SyncQueueItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    idempotencyKey,
    actionType: params.actionType,
    endpoint: params.endpoint,
    method: params.method || 'POST',
    payload: params.payload,
    status: 'PENDING_SYNC',
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: params.maxRetries || 3,
    entityId: params.entityId,
    description: params.description,
    serverTimestampAtQueue: params.serverTimestampAtQueue || new Date().toISOString(),
  };

  queue.push(item);
  saveSyncQueue(queue);
  return item;
}

/**
 * Processes the sync queue.
 * Allows custom dispatcher injection for testability or integration with axios/fetch.
 */
export async function processSyncQueue(
  dispatcher: (item: SyncQueueItem) => Promise<{ success: boolean; serverTimestamp?: string; error?: string }>
): Promise<SyncResult> {
  const queue = getSyncQueue();
  const result: SyncResult = {
    totalProcessed: 0,
    syncedCount: 0,
    failedCount: 0,
    conflictCount: 0,
    errors: [],
  };

  const updatedQueue: SyncQueueItem[] = [];

  for (const item of queue) {
    if (item.status === 'SYNCED') {
      // Already completed, can be pruned
      continue;
    }

    result.totalProcessed++;
    item.status = 'SYNCING';

    try {
      const response = await dispatcher(item);

      if (response.success) {
        // Safe check: server state remains authoritative
        if (
          response.serverTimestamp &&
          item.serverTimestampAtQueue &&
          new Date(response.serverTimestamp).getTime() < new Date(item.serverTimestampAtQueue).getTime() - 60000
        ) {
          // Flagged conflict if server returned an older stale timestamp
          item.status = 'CONFLICT_DETECTED';
          item.lastError = 'Server conflict detected. Server state remains authoritative.';
          result.conflictCount++;
          updatedQueue.push(item);
        } else {
          item.status = 'SYNCED';
          result.syncedCount++;
          // Synced item is removed or retained as history
        }
      } else {
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          item.status = 'SYNC_FAILED';
          item.lastError = response.error || 'Exceeded maximum sync retry limit.';
        } else {
          item.status = 'PENDING_SYNC';
          item.lastError = response.error || 'Temporary sync failure; will retry.';
        }
        result.failedCount++;
        result.errors.push({ id: item.id, error: item.lastError });
        updatedQueue.push(item);
      }
    } catch (err: unknown) {
      item.retryCount++;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (item.retryCount >= item.maxRetries) {
        item.status = 'SYNC_FAILED';
      } else {
        item.status = 'PENDING_SYNC';
      }
      item.lastError = errMsg;
      result.failedCount++;
      result.errors.push({ id: item.id, error: errMsg });
      updatedQueue.push(item);
    }
  }

  saveSyncQueue(updatedQueue);
  return result;
}

/**
 * Cached Jobs Local Storage
 */
export function getCachedJobs(): CachedJobRecord[] {
  try {
    const storage = getOfflineStorage();
    const raw = storage.getItem(CACHED_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to read cached jobs', err);
    return [];
  }
}

export function saveCachedJobs(jobs: CachedJobRecord[]): void {
  try {
    const storage = getOfflineStorage();
    storage.setItem(CACHED_JOBS_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.warn('Failed to save cached jobs', err);
  }
}

/**
 * Clears the queue and cached jobs (useful for testing or full reset).
 */
export function clearSyncQueue(): void {
  try {
    const storage = getOfflineStorage();
    storage.removeItem(QUEUE_STORAGE_KEY);
    storage.removeItem(CACHED_JOBS_KEY);
    if (typeof storage.clear === 'function') {
      storage.clear();
    }
  } catch {
    // ignore
  }
}

/**
 * Safely records an offline task note.
 * Appends note locally and queues `RECORD_TASK_NOTE` for background sync.
 */
export function recordOfflineJobNote(jobId: number, noteText: string): {
  cachedJob: CachedJobRecord | null;
  queuedItem: SyncQueueItem;
} {
  const cleanNote = noteText.trim();
  if (!cleanNote) {
    throw new Error('Task note cannot be empty.');
  }

  // 1. Queue synchronization mutation
  const queuedItem = queueOfflineAction({
    actionType: 'RECORD_TASK_NOTE',
    endpoint: `/api/bookings/jobs/${jobId}/notes/`,
    method: 'POST',
    payload: {
      booking_id: jobId,
      note: cleanNote,
      recorded_offline: true,
    },
    description: `Task Note on Job #${jobId}`,
    entityId: jobId,
  });

  // 2. Update local cached job view
  const jobs = getCachedJobs();
  let updatedJob: CachedJobRecord | null = null;
  const nextJobs: CachedJobRecord[] = jobs.map((j) => {
    if (j.id === jobId) {
      const pendingNotes = [...(j.pendingNotes || [])];
      pendingNotes.push({
        id: queuedItem.id,
        note: cleanNote,
        createdAt: new Date().toISOString(),
        synced: false,
      });
      const record: CachedJobRecord = {
        ...j,
        pendingNotes,
        lastUpdated: new Date().toISOString(),
      };
      updatedJob = record;
      return record;
    }
    return j;
  });

  saveCachedJobs(nextJobs);
  return { cachedJob: updatedJob, queuedItem };
}

/**
 * Safely updates permitted task progress offline (e.g. WORKER_ARRIVING, ARRIVED, IN_PROGRESS, COMPLETED).
 * Payment confirmations and administrative resolutions are strictly rejected.
 */
export function updateOfflineJobProgress(
  jobId: number,
  newStatus: string
): {
  cachedJob: CachedJobRecord | null;
  queuedItem: SyncQueueItem;
} {
  const PERMITTED_STATUSES = [
    'on_the_way',
    'WORKER_ARRIVING',
    'arrived',
    'ARRIVED',
    'repair_started',
    'IN_PROGRESS',
    'repair_completed',
    'waiting_approval',
  ];

  if (!PERMITTED_STATUSES.includes(newStatus)) {
    throw new Error(
      `Status update '${newStatus}' cannot be applied offline. Final payment confirmation and settlement require server connection.`
    );
  }

  // 1. Queue progress mutation
  const queuedItem = queueOfflineAction({
    actionType: 'UPDATE_TASK_PROGRESS',
    endpoint: `/api/bookings/jobs/${jobId}/status/`,
    method: 'PATCH',
    payload: {
      status: newStatus,
      updated_offline: true,
    },
    description: `Update Job #${jobId} to ${newStatus}`,
    entityId: jobId,
  });

  // 2. Update cached job view
  const jobs = getCachedJobs();
  let updatedJob: CachedJobRecord | null = null;
  const nextJobs: CachedJobRecord[] = jobs.map((j) => {
    if (j.id === jobId) {
      const record: CachedJobRecord = {
        ...j,
        status: newStatus,
        pendingProgressStatus: newStatus,
        lastUpdated: new Date().toISOString(),
      };
      updatedJob = record;
      return record;
    }
    return j;
  });

  saveCachedJobs(nextJobs);
  return { cachedJob: updatedJob, queuedItem };
}


/**
 * Returns the count of actions waiting to be synchronized.
 */
export function getPendingSyncCount(): number {
  const queue = getSyncQueue();
  return queue.filter((i) => i.status === 'PENDING_SYNC' || i.status === 'SYNC_FAILED').length;
}

/**
 * Resets all failed items back to PENDING_SYNC for manual retry.
 */
export function resetFailedItemsForRetry(): number {
  const queue = getSyncQueue();
  let resetCount = 0;
  const updated = queue.map((item) => {
    if (item.status === 'SYNC_FAILED') {
      item.status = 'PENDING_SYNC';
      item.retryCount = 0;
      resetCount++;
    }
    return item;
  });
  saveSyncQueue(updated);
  return resetCount;
}
