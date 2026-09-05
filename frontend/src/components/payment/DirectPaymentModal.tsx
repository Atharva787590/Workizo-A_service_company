import React, { useState } from 'react';
import {
  X,
  QrCode,
  Banknote,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DirectPaymentBreakdown, PaymentAdapterType } from '@/types/unnati';
import { generateUpiIntentUrl } from '@/lib/paymentEngine';
import { PaymentSummaryCard } from './PaymentSummaryCard';

export interface DirectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  breakdown: DirectPaymentBreakdown;
  onInitiatePayment: (adapterType: PaymentAdapterType, idempotencyKey: string) => Promise<{
    adapter_details?: {
      upi_intent_uri?: string;
      recipient_vpa?: string;
      is_mock?: boolean;
      instructions?: string;
    };
  }>;
  onVerifyPayment: (payload: {
    transactionId?: string;
    utrNumber?: string;
    confirmedByWorker?: boolean;
    isMockConfirmation?: boolean;
  }) => Promise<void>;
  className?: string;
}

export const DirectPaymentModal: React.FC<DirectPaymentModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  breakdown,
  onInitiatePayment,
  onVerifyPayment,
  className
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentAdapterType>('DIRECT_UPI');
  const [step, setStep] = useState<'SELECT' | 'PAYING' | 'CONFIRMING' | 'SUCCESS' | 'ERROR'>('SELECT');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [upiIntentUri, setUpiIntentUri] = useState<string | null>(null);
  const [workerVpa, setWorkerVpa] = useState<string | null>(null);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [utrInput, setUtrInput] = useState('');

  if (!isOpen) return null;

  const handleStartPayment = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const idempKey = `idemp_${bookingId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const res = await onInitiatePayment(selectedMethod, idempKey);
      
      const vpa = res.adapter_details?.recipient_vpa || breakdown.workerVpa || 'worker@upi';
      setWorkerVpa(vpa);

      if (selectedMethod === 'DIRECT_UPI') {
        const uri = res.adapter_details?.upi_intent_uri || generateUpiIntentUrl({
          vpa,
          payeeName: breakdown.workerName,
          amount: breakdown.totalCustomerPaid,
          bookingId
        });
        setUpiIntentUri(uri);
        setStep('PAYING');
      } else if (selectedMethod === 'DIRECT_CASH') {
        setStep('CONFIRMING');
      } else if (selectedMethod === 'MOCK_PROVIDER') {
        setStep('PAYING');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate direct payment.';
      setErrorMessage(msg);
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (isMock = false) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      if (selectedMethod === 'DIRECT_CASH') {
        await onVerifyPayment({ confirmedByWorker: true });
      } else if (selectedMethod === 'MOCK_PROVIDER' || isMock) {
        await onVerifyPayment({
          isMockConfirmation: true,
          transactionId: `mock_tx_${Date.now()}`
        });
      } else {
        await onVerifyPayment({
          utrNumber: utrInput || `UTR${Date.now().toString().slice(-8)}`,
          transactionId: `UPI_TX_${Date.now()}`
        });
      }
      setStep('SUCCESS');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed.';
      setErrorMessage(msg);
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="direct-payment-title"
    >
      <div
        className={cn(
          'relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="direct-payment-title" className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Direct Service-Provider Payment
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero Platform Escrow • सीधा कारीगर भुगतान
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
            aria-label="Close payment modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Selection & Summary */}
          {step === 'SELECT' && (
            <div className="space-y-4">
              <PaymentSummaryCard breakdown={breakdown} />

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Select Direct Settlement Mode (भुगतान माध्यम चुनें)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Direct UPI */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('DIRECT_UPI')}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                      selectedMethod === 'DIRECT_UPI'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      {selectedMethod === 'DIRECT_UPI' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-sm font-bold">Direct UPI</span>
                    <span className="text-[11px] opacity-75">GPay, PhonePe, Paytm, BHIM</span>
                  </button>

                  {/* Direct Cash */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('DIRECT_CASH')}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500',
                      selectedMethod === 'DIRECT_CASH'
                        ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Banknote className="w-5 h-5 text-amber-600" />
                      {selectedMethod === 'DIRECT_CASH' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <span className="text-sm font-bold">Direct Cash</span>
                    <span className="text-[11px] opacity-75">Pay on site directly</span>
                  </button>

                  {/* Sandbox Demo */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('MOCK_PROVIDER')}
                    className={cn(
                      'p-3.5 rounded-2xl border text-left transition flex flex-col gap-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500',
                      selectedMethod === 'MOCK_PROVIDER'
                        ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      {selectedMethod === 'MOCK_PROVIDER' && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                    </div>
                    <span className="text-sm font-bold">Demo Mode</span>
                    <span className="text-[11px] opacity-75">Simulated test adapter</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartPayment}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Proceed to Pay ₹{breakdown.totalCustomerPaid.toFixed(2)} Directly
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Paying via UPI / Intent */}
          {step === 'PAYING' && selectedMethod === 'DIRECT_UPI' && (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 text-left">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block mb-1">
                  Recipient Craftsman UPI ID:
                </span>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-emerald-300">
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {workerVpa}
                  </span>
                  <button
                    onClick={() => copyToClipboard(workerVpa || '')}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                  >
                    {copiedVpa ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedVpa ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {upiIntentUri && (
                <a
                  href={upiIntentUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition"
                >
                  <QrCode className="w-4 h-4" />
                  Open UPI App (GPay / PhonePe / Paytm)
                </a>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 text-left space-y-1">
                <span className="font-semibold block text-slate-800 dark:text-slate-200">
                  After completing payment in your UPI app:
                </span>
                <p>Enter the 12-digit UPI reference number (UTR) below or click Confirm:</p>
                <input
                  type="text"
                  placeholder="e.g. 329847192831"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirm UPI Payment
                </button>
              </div>
            </div>
          )}

          {/* Demo Sandbox Mode View */}
          {step === 'PAYING' && selectedMethod === 'MOCK_PROVIDER' && (
            <div className="space-y-4 text-center p-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Developer Sandbox Simulation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This mock adapter tests the direct payment lifecycle without touching live payment gateways.
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 text-xs text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Amount to settle: <b>₹{breakdown.totalCustomerPaid.toFixed(2)}</b> directly to <b>{breakdown.workerName}</b>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(true)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Simulate Direct Settlement
                </button>
              </div>
            </div>
          )}

          {/* Cash Confirmation View */}
          {step === 'CONFIRMING' && selectedMethod === 'DIRECT_CASH' && (
            <div className="space-y-4 text-center p-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Direct Cash Settlement
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Please hand over ₹{breakdown.totalCustomerPaid.toFixed(2)} directly in cash to craftsman {breakdown.workerName}.
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-left">
                <span className="font-semibold block">Craftsman Confirmation:</span>
                The service provider will acknowledge cash receipt in their UNNATI app upon receiving the cash.
              </div>
              <button
                type="button"
                onClick={() => handleVerify(false)}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Cash Handed Over
              </button>
            </div>
          )}

          {/* Success Screen */}
          {step === 'SUCCESS' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Direct Payment Confirmed!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                Payment of ₹{breakdown.totalCustomerPaid.toFixed(2)} has been directly settled with {breakdown.workerName}. ₹{breakdown.cooperativeAllocation.toFixed(2)} has been recorded towards the cooperative patronage dividend.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow transition"
              >
                Done / पूरा हुआ
              </button>
            </div>
          )}

          {/* Error Screen */}
          {step === 'ERROR' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-rose-700 dark:text-rose-400">
                Payment Verification Issue
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                {errorMessage || 'Unable to confirm transaction with provider.'}
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SELECT')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Try Different Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(selectedMethod === 'MOCK_PROVIDER')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                >
                  Retry Verification
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
