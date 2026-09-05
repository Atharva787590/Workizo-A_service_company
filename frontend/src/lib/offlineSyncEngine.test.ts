import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkOfflineActionPermitted,
  assertPayloadExcludesSensitiveData,
  generateIdempotencyKey,
  queueOfflineAction,
  processSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  saveCachedJobs,
  getCachedJobs,
  recordOfflineJobNote,
  updateOfflineJobProgress,
  resetFailedItemsForRetry
} from './offlineSyncEngine';
import { CachedJobRecord } from '../types/offline';

describe('offlineSyncEngine', () => {
  beforeEach(() => {
    clearSyncQueue();
  });

  describe('Offline restrictions & safety checks', () => {
    it('permits safe operational actions when offline', () => {
      expect(checkOfflineActionPermitted('RECORD_TASK_NOTE').isPermitted).toBe(true);
      expect(checkOfflineActionPermitted('UPDATE_TASK_PROGRESS').isPermitted).toBe(true);
      expect(checkOfflineActionPermitted('LOG_ARRIVAL').isPermitted).toBe(true);
      expect(checkOfflineActionPermitted('SAVE_DRAFT_PROFILE').isPermitted).toBe(true);
    });

    it('strictly blocks financial and identity verification actions offline with explanations', () => {
      const paymentCheck = checkOfflineActionPermitted('CONFIRM_PAYMENT');
      expect(paymentCheck.isPermitted).toBe(false);
      expect(paymentCheck.reason).toContain('Payment confirmation requires immediate bank');

      const payoutCheck = checkOfflineActionPermitted('INITIATE_PAYOUT');
      expect(payoutCheck.isPermitted).toBe(false);
      expect(payoutCheck.reason).toContain('Payout distribution requires real-time cooperative treasury');

      const kycCheck = checkOfflineActionPermitted('SUBMIT_AADHAAR_KYC');
      expect(kycCheck.isPermitted).toBe(false);
      expect(kycCheck.reason).toContain('Aadhaar e-KYC and identity verification require live UIDAI');
    });

    it('refuses to queue sensitive financial and identity data in offline storage', () => {
      // Clean payload passes
      expect(
        assertPayloadExcludesSensitiveData({
          job_id: 101,
          task_note: 'Replaced kitchen mixer valve washer.',
        })
      ).toBe(true);

      // Leaked Aadhaar rejected
      expect(() =>
        assertPayloadExcludesSensitiveData({
          job_id: 101,
          aadhaar_number: '123456789012',
        })
      ).toThrow(/Refusing to queue sensitive credential 'aadhaar_number'/);

      // Leaked PAN rejected
      expect(() =>
        assertPayloadExcludesSensitiveData({
          job_id: 101,
          pan_number: 'ABCDE1234F',
        })
      ).toThrow(/Refusing to queue sensitive credential 'pan_number'/);

      // Leaked bank account rejected
      expect(() =>
        assertPayloadExcludesSensitiveData({
          job_id: 101,
          bank_account: '9876543210',
        })
      ).toThrow(/Refusing to queue sensitive credential 'bank_account'/);

      // Leaked password/pin rejected
      expect(() =>
        assertPayloadExcludesSensitiveData({
          user: { pin: '1234' },
        })
      ).toThrow(/Refusing to queue sensitive credential 'pin'/);
    });
  });

  describe('Action queueing & idempotency', () => {
    it('generates unique idempotency keys containing action type and timestamp', () => {
      const key1 = generateIdempotencyKey('RECORD_TASK_NOTE');
      const key2 = generateIdempotencyKey('RECORD_TASK_NOTE');
      expect(key1).toContain('UNN-SYNC-RECORD_TASK_NOTE');
      expect(key2).toContain('UNN-SYNC-RECORD_TASK_NOTE');
      expect(key1).not.toBe(key2);
    });

    it('queues permitted actions and stores them with PENDING_SYNC status', () => {
      const item = queueOfflineAction({
        actionType: 'RECORD_TASK_NOTE',
        endpoint: '/api/bookings/jobs/10/notes/',
        payload: { note: 'Inspected switchboard circuit.' },
        description: 'Task note for job #10',
        entityId: 10,
      });

      expect(item.status).toBe('PENDING_SYNC');
      expect(item.idempotencyKey).toBeDefined();

      const queue = getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].description).toBe('Task note for job #10');
    });

    it('throws when trying to queue restricted action', () => {
      expect(() =>
        queueOfflineAction({
          actionType: 'CONFIRM_PAYMENT' as any,
          endpoint: '/api/billing/confirm/',
          payload: { amount: 500 },
          description: 'Payment confirmation',
        })
      ).toThrow(/Payment confirmation requires immediate bank/);
    });
  });

  describe('Synchronization, retries & conflict handling', () => {
    it('successfully processes queue with dispatcher and marks items SYNCED', async () => {
      queueOfflineAction({
        actionType: 'LOG_ARRIVAL',
        endpoint: '/api/bookings/jobs/15/arrival/',
        payload: { arrived: true },
        description: 'Worker arrived at premises',
        entityId: 15,
      });

      const mockDispatcher = async () => ({
        success: true,
        serverTimestamp: new Date().toISOString(),
      });

      const result = await processSyncQueue(mockDispatcher);
      expect(result.totalProcessed).toBe(1);
      expect(result.syncedCount).toBe(1);
      expect(result.failedCount).toBe(0);

      // Queue is empty or synced
      const queue = getSyncQueue();
      expect(queue.length).toBe(0);
    });

    it('handles transient network failures with retry count and transitions to SYNC_FAILED upon exceeding maxRetries', async () => {
      queueOfflineAction({
        actionType: 'RECORD_TASK_NOTE',
        endpoint: '/api/bookings/jobs/20/notes/',
        payload: { note: 'Attempting sync' },
        description: 'Test note',
        entityId: 20,
        maxRetries: 2,
      });

      const failingDispatcher = async () => ({
        success: false,
        error: 'Network timeout (504)',
      });

      // Attempt 1: retry count 1, still PENDING_SYNC
      let result = await processSyncQueue(failingDispatcher);
      expect(result.failedCount).toBe(1);
      let queue = getSyncQueue();
      expect(queue[0].retryCount).toBe(1);
      expect(queue[0].status).toBe('PENDING_SYNC');

      // Attempt 2: retry count 2 >= maxRetries 2 -> SYNC_FAILED
      result = await processSyncQueue(failingDispatcher);
      queue = getSyncQueue();
      expect(queue[0].status).toBe('SYNC_FAILED');
      expect(queue[0].lastError).toBe('Network timeout (504)');

      // Reset for retry
      const resetCount = resetFailedItemsForRetry();
      expect(resetCount).toBe(1);
      queue = getSyncQueue();
      expect(queue[0].status).toBe('PENDING_SYNC');
      expect(queue[0].retryCount).toBe(0);
    });

    it('detects server conflict when server timestamp is older than queued baseline', async () => {
      const pastServerTime = new Date(Date.now() - 120000).toISOString();

      queueOfflineAction({
        actionType: 'UPDATE_TASK_PROGRESS',
        endpoint: '/api/bookings/jobs/30/status/',
        payload: { status: 'IN_PROGRESS' },
        description: 'Update progress',
        entityId: 30,
        serverTimestampAtQueue: new Date().toISOString(),
      });

      const conflictDispatcher = async () => ({
        success: true,
        serverTimestamp: pastServerTime, // Out of date / stale conflict
      });

      const result = await processSyncQueue(conflictDispatcher);
      expect(result.conflictCount).toBe(1);

      const queue = getSyncQueue();
      expect(queue[0].status).toBe('CONFLICT_DETECTED');
      expect(queue[0].lastError).toContain('Server conflict detected');
    });
  });

  describe('Offline task operations & job cache', () => {
    const sampleJobs: CachedJobRecord[] = [
      {
        id: 101,
        tracking_id: 'WRK-101',
        customer_name: 'Anita Desai',
        customer_phone: '+919876543210',
        service_name: 'Ceiling Fan Servicing',
        service_category: 'Electrician',
        problem_description: 'Fan speed fluctuation',
        address: 'B-201, Green Acres, SG Highway',
        city: 'Ahmedabad',
        status: 'accepted',
        cachedAt: new Date().toISOString(),
        lastServerUpdated: new Date().toISOString(),
        isStale: false,
      },
    ];

    it('caches and loads jobs from offline local storage', () => {
      saveCachedJobs(sampleJobs);
      const loaded = getCachedJobs();
      expect(loaded.length).toBe(1);
      expect(loaded[0].tracking_id).toBe('WRK-101');
    });

    it('records an offline task note, updates the cached job view, and queues sync mutation', () => {
      saveCachedJobs(sampleJobs);
      const { cachedJob, queuedItem } = recordOfflineJobNote(101, 'Replaced 2.5uF capacitor.');

      expect(queuedItem.actionType).toBe('RECORD_TASK_NOTE');
      expect(queuedItem.status).toBe('PENDING_SYNC');

      expect(cachedJob).toBeDefined();
      expect(cachedJob?.pendingNotes?.length).toBe(1);
      expect(cachedJob?.pendingNotes?.[0].note).toBe('Replaced 2.5uF capacitor.');
    });

    it('updates permitted task progress offline and updates cached job view', () => {
      saveCachedJobs(sampleJobs);
      const { cachedJob, queuedItem } = updateOfflineJobProgress(101, 'repair_started');

      expect(queuedItem.actionType).toBe('UPDATE_TASK_PROGRESS');
      expect(queuedItem.payload.status).toBe('repair_started');

      expect(cachedJob?.status).toBe('repair_started');
      expect(cachedJob?.pendingProgressStatus).toBe('repair_started');
    });

    it('strictly throws when attempting unpermitted progress like payment release offline', () => {
      saveCachedJobs(sampleJobs);
      expect(() => updateOfflineJobProgress(101, 'PAYMENT_RELEASED')).toThrow(
        /Final payment confirmation and settlement require server connection/
      );
    });
  });
});
