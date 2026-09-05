import { describe, it, expect } from 'vitest';
import {
  AccessibilitySettingsSchema,
  CooperativeMembershipSchema,
  GovernanceVoteSchema,
  WelfareClaimSchema,
} from '../schemas/unnati';

describe('UNNATI Schemas & Accessibility Baseline', () => {
  it('should validate default accessibility settings correctly', () => {
    const defaultSettings = AccessibilitySettingsSchema.parse({});
    expect(defaultSettings.highContrast).toBe(false);
    expect(defaultSettings.reducedMotion).toBe(false);
    expect(defaultSettings.largeText).toBe(false);
    expect(defaultSettings.lowBandwidthMode).toBe(false);
    expect(defaultSettings.language).toBe('en');
  });

  it('should accept valid cooperative membership registration data', () => {
    const sampleMember = {
      fullName: 'Ramesh Patel',
      phone: '9876543210',
      email: 'ramesh@example.com',
      serviceCategoryId: 1,
      aadhaarNumber: '123456789012',
      panNumber: 'ABCDE1234F',
      bankAccount: '1234567890',
      ifscCode: 'SBIN0001234',
      welfareOptIn: true,
      emergencyNomineeName: 'Sita Patel',
      emergencyNomineePhone: '9876543211',
    };

    const parsed = CooperativeMembershipSchema.safeParse(sampleMember);
    expect(parsed.success).toBe(true);
  });

  it('should reject invalid Aadhaar number formats', () => {
    const invalidMember = {
      fullName: 'Ramesh Patel',
      phone: '9876543210',
      email: 'ramesh@example.com',
      serviceCategoryId: 1,
      aadhaarNumber: '1234', // invalid length
      panNumber: 'ABCDE1234F',
      bankAccount: '1234567890',
      ifscCode: 'SBIN0001234',
      welfareOptIn: true,
      emergencyNomineeName: 'Sita Patel',
      emergencyNomineePhone: '9876543211',
    };

    const parsed = CooperativeMembershipSchema.safeParse(invalidMember);
    expect(parsed.success).toBe(false);
  });

  it('should validate democratic governance vote submissions', () => {
    const validVote = {
      resolutionId: 'RES-2026-001',
      choice: 'for' as const,
      comments: 'Support lowering cooperative commission rate to 5%',
    };

    const parsed = GovernanceVoteSchema.safeParse(validVote);
    expect(parsed.success).toBe(true);
  });

  it('should enforce single claim upper limit on welfare fund requests', () => {
    const excessiveClaim = {
      fundType: 'emergency_credit' as const,
      requestedAmount: 999999, // Exceeds 50,000 limit
      reason: 'Urgent medical expenses',
    };

    const parsed = WelfareClaimSchema.safeParse(excessiveClaim);
    expect(parsed.success).toBe(false);
  });
});
