import { z } from 'zod';

/**
 * Zod validation schemas for UNNATI Cooperative domain entities
 */

export const CooperativeMembershipSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number'),
  email: z.string().email('Enter a valid email address'),
  serviceCategoryId: z.number().int().positive('Please select a valid service trade'),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN card format'),
  bankAccount: z.string().min(9, 'Bank account must be at least 9 digits'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  welfareOptIn: z.boolean().default(true),
  emergencyNomineeName: z.string().min(2, 'Nominee name required for welfare benefits'),
  emergencyNomineePhone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid nominee phone number'),
});

export const GovernanceVoteSchema = z.object({
  resolutionId: z.string().min(1),
  choice: z.enum(['for', 'against', 'abstain']),
  comments: z.string().max(500).optional(),
});

export const WelfareClaimSchema = z.object({
  fundType: z.enum(['health_cover', 'emergency_credit', 'accident_relief', 'equipment_loan']),
  requestedAmount: z.number().positive().max(50000, 'Maximum single claim limit is ₹50,000'),
  reason: z.string().min(10, 'Please provide detailed reason for claim'),
});

export const AccessibilitySettingsSchema = z.object({
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  largeText: z.boolean().default(false),
  lowBandwidthMode: z.boolean().default(false),
  language: z.enum(['en', 'hi', 'gu', 'mr', 'ta', 'te']).default('en'),
});

export const UnnatiBookingCreateSchema = z.object({
  serviceCategoryId: z.number().int().positive('Please select a service trade'),
  bookingType: z.enum(['instant', 'scheduled', 'collective']).default('instant'),
  problemType: z.string().min(2, 'Please enter problem category or title'),
  problemDescription: z.string().min(5, 'Please provide details (minimum 5 characters)'),
  address: z.string().min(5, 'Please provide complete delivery address'),
  city: z.string().min(2).default('Ahmedabad'),
  state: z.string().min(2).default('Gujarat'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit Indian pincode'),
  scheduledTime: z.string().datetime().nullable().optional(),
  requiredWorkerCount: z.number().int().min(1).max(10).default(1),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  arrivalRadiusMeters: z.number().int().min(50).max(2000).default(300),
  idempotencyKey: z.string().max(100).optional(),
}).refine(data => {
  if (data.bookingType === 'scheduled') {
    if (!data.scheduledTime) return false;
    const time = new Date(data.scheduledTime).getTime();
    const now = Date.now();
    const thirtyDaysFromNow = now + 30 * 24 * 60 * 60 * 1000;
    return time > now && time <= thirtyDaysFromNow;
  }
  return true;
}, {
  message: 'Scheduled date must be within the next 30 days and not in the past',
  path: ['scheduledTime']
});

export const GeofenceVerificationSchema = z.object({
  latitude: z.number({ message: 'Latitude required' }),
  longitude: z.number({ message: 'Longitude required' }),
  accuracy: z.number().nonnegative().optional().default(0),
});

export const CancellationRequestSchema = z.object({
  bookingId: z.number().int().positive(),
  reason: z.string().min(5, 'Please state cancellation reason (min 5 characters)'),
});

export const DisputeRequestSchema = z.object({
  bookingId: z.number().int().positive(),
  reason: z.string().min(10, 'Please describe dispute reason in detail (min 10 characters)'),
});

export const DirectPaymentInitiateSchema = z.object({
  bookingId: z.number().int().positive(),
  adapterType: z.enum(['DIRECT_UPI', 'DIRECT_CASH', 'MOCK_PROVIDER']),
  idempotencyKey: z.string().min(8, 'Idempotency key required (min 8 chars)').max(100),
});

export const DirectPaymentVerifySchema = z.object({
  bookingId: z.number().int().positive(),
  transactionId: z.string().optional(),
  utrNumber: z.string().optional(),
  confirmedByWorker: z.boolean().optional(),
  isMockConfirmation: z.boolean().optional(),
});

export const DirectRefundRequestSchema = z.object({
  bookingId: z.number().int().positive(),
  reason: z.string().min(5, 'Please state refund reason (min 5 characters)'),
  idempotencyKey: z.string().min(8).max(100).optional(),
});

export const ProposalCreateSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['POLICY', 'WELFARE', 'BUDGET', 'DIVIDEND', 'SAFETY']),
  durationDays: z.number().int().min(3).max(30).default(7),
  quorumNeeded: z.number().int().min(3).max(100).default(5),
});

export const ElectionVoteSchema = z.object({
  candidateId: z.string().min(1, 'Candidate selection is required'),
  electionId: z.string().min(1, 'Election ID required'),
  idempotencyKey: z.string().min(8).optional(),
});

export const OperationalActionSchema = z.object({
  bookingId: z.number().int().positive(),
  operation: z.enum(['REASSIGN', 'RESOLVE_DELAY', 'FLAG_DISPUTE', 'CANCEL_FORCE']),
  newWorkerId: z.number().int().positive().optional(),
  notes: z.string().max(500).optional(),
  confirmed: z.boolean().default(false),
});

export type CooperativeMembershipFormData = z.infer<typeof CooperativeMembershipSchema>;
export type GovernanceVoteFormData = z.infer<typeof GovernanceVoteSchema>;
export type WelfareClaimFormData = z.infer<typeof WelfareClaimSchema>;
export type AccessibilitySettingsData = z.infer<typeof AccessibilitySettingsSchema>;
export type UnnatiBookingCreateFormData = z.infer<typeof UnnatiBookingCreateSchema>;
export type GeofenceVerificationFormData = z.infer<typeof GeofenceVerificationSchema>;
export type CancellationRequestFormData = z.infer<typeof CancellationRequestSchema>;
export type DisputeRequestFormData = z.infer<typeof DisputeRequestSchema>;
export type DirectPaymentInitiateFormData = z.infer<typeof DirectPaymentInitiateSchema>;
export type DirectPaymentVerifyFormData = z.infer<typeof DirectPaymentVerifySchema>;
export type DirectRefundRequestFormData = z.infer<typeof DirectRefundRequestSchema>;
export type ProposalCreateFormData = z.infer<typeof ProposalCreateSchema>;
export type ElectionVoteFormData = z.infer<typeof ElectionVoteSchema>;
export type OperationalActionFormData = z.infer<typeof OperationalActionSchema>;



