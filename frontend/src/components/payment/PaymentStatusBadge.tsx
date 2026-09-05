import React from 'react';
import { cn } from '@/lib/utils';
import { PaymentLifecycleStatus } from '@/types/unnati';
import { getPaymentLifecycleProgress } from '@/lib/paymentEngine';

export interface PaymentStatusBadgeProps {
  status: PaymentLifecycleStatus | string;
  showHindi?: boolean;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  showHindi = true,
  className
}) => {
  const normStatus = (status || 'PAYMENT_PENDING').toUpperCase() as PaymentLifecycleStatus;
  const meta = getPaymentLifecycleProgress(normStatus);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-200',
        meta.colorClass,
        className
      )}
      role="status"
      aria-label={`Payment status: ${meta.label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
      <span>{meta.label}</span>
      {showHindi && meta.labelHi && (
        <span className="text-[10px] opacity-75 font-normal">({meta.labelHi})</span>
      )}
    </span>
  );
};
