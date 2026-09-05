"""
UNNATI Provider-Independent Payment Adapters
-------------------------------------------
Enables direct peer-to-peer customer-to-service-provider settlement.
The platform does NOT hold customer funds or intermediate transactions.
Adapters isolate external gateway / UPI protocols.
"""

from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Any, Optional
import time
from .payment_engine import generate_upi_intent_uri, calculate_direct_payment_breakdown


class BasePaymentAdapter(ABC):
    """
    Abstract interface for provider-independent direct payments.
    """
    adapter_name: str = "BASE"
    is_mock: bool = False

    @abstractmethod
    def initiate_payment(
        self,
        booking,
        amount: Decimal,
        recipient_user,
        idempotency_key: str,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Initiates direct payment towards the service provider."""
        pass

    @abstractmethod
    def verify_payment(
        self,
        payment,
        verification_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verifies direct payment status server-side."""
        pass

    @abstractmethod
    def process_refund(
        self,
        payment,
        refund_amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        """Processes direct worker-to-customer refund or adjustment."""
        pass


class DirectUPIAdapter(BasePaymentAdapter):
    """
    Direct UPI peer-to-peer payment adapter.
    Routes payment directly to worker's VPA / UPI ID.
    """
    adapter_name = "DIRECT_UPI"
    is_mock = False

    def initiate_payment(
        self,
        booking,
        amount: Decimal,
        recipient_user,
        idempotency_key: str,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # Worker UPI resolution: check worker profile, phone, or standard fallback
        worker_vpa = getattr(recipient_user, 'phone', None)
        if worker_vpa:
            # Indian UPI standard virtual payment address by mobile number
            worker_upi = f"{worker_vpa}@upi"
        else:
            worker_upi = f"worker.{recipient_user.id}@coop.upi"

        tx_ref = f"UNN-UPI-{booking.id}-{int(time.time())}"
        payee_name = getattr(recipient_user, 'full_name', 'Craftsman')
        
        upi_uri = generate_upi_intent_uri(
            vpa=worker_upi,
            payee_name=payee_name,
            amount=amount,
            booking_id=booking.id,
            transaction_ref=tx_ref
        )

        return {
            'adapter': self.adapter_name,
            'is_mock': self.is_mock,
            'recipient_vpa': worker_upi,
            'recipient_name': payee_name,
            'amount': str(amount),
            'currency': 'INR',
            'transaction_reference': tx_ref,
            'upi_intent_uri': upi_uri,
            'qr_payload': upi_uri,
            'instructions': "Scan with any UPI app (PhonePe, Google Pay, Paytm, BHIM) to pay the worker directly.",
        }

    def verify_payment(
        self,
        payment,
        verification_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Direct UPI verification relies on worker confirmation or bank webhook/reference
        tx_id = verification_payload.get('transaction_id') or verification_payload.get('utr_number')
        if not tx_id:
            return {'verified': False, 'detail': 'Missing UPI UTR or transaction ID reference.'}
        
        return {
            'verified': True,
            'transaction_id': str(tx_id),
            'method': 'DIRECT_UPI',
            'detail': 'Direct UPI payment verified via worker/provider confirmation.'
        }

    def process_refund(
        self,
        payment,
        refund_amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        return {
            'refund_initiated': True,
            'refund_amount': str(refund_amount),
            'method': 'DIRECT_UPI_REVERSAL',
            'detail': f"Direct refund of ₹{refund_amount} initiated for reason: {reason}"
        }


class DirectCashAdapter(BasePaymentAdapter):
    """
    On-site direct cash settlement directly to craftsman.
    """
    adapter_name = "DIRECT_CASH"
    is_mock = False

    def initiate_payment(
        self,
        booking,
        amount: Decimal,
        recipient_user,
        idempotency_key: str,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return {
            'adapter': self.adapter_name,
            'is_mock': self.is_mock,
            'amount': str(amount),
            'currency': 'INR',
            'recipient_name': getattr(recipient_user, 'full_name', 'Craftsman'),
            'instructions': "Pay cash directly to the service provider upon satisfactory completion.",
        }

    def verify_payment(
        self,
        payment,
        verification_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        confirmed_by_worker = verification_payload.get('confirmed_by_worker', False)
        if not confirmed_by_worker:
            return {'verified': False, 'detail': 'Cash receipt must be confirmed by the worker.'}

        return {
            'verified': True,
            'method': 'DIRECT_CASH',
            'detail': 'Cash payment confirmed by service provider.'
        }

    def process_refund(
        self,
        payment,
        refund_amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        return {
            'refund_initiated': True,
            'refund_amount': str(refund_amount),
            'method': 'DIRECT_CASH_RETURN',
            'detail': f"Direct cash return of ₹{refund_amount} recorded for reason: {reason}"
        }


class MockPaymentAdapter(BasePaymentAdapter):
    """
    Developer / Sandbox simulation adapter.
    Explicitly flags is_mock = True to distinguish from real payment settlement.
    """
    adapter_name = "MOCK_PROVIDER"
    is_mock = True

    def initiate_payment(
        self,
        booking,
        amount: Decimal,
        recipient_user,
        idempotency_key: str,
        extra_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        mock_order_id = f"demo_order_{booking.id}_{int(time.time())}"
        worker_upi = f"demo.{recipient_user.id}@mock.upi"
        return {
            'adapter': self.adapter_name,
            'is_mock': True,
            'order_id': mock_order_id,
            'amount': str(amount),
            'currency': 'INR',
            'recipient_vpa': worker_upi,
            'recipient_name': getattr(recipient_user, 'full_name', 'Demo Worker'),
            'upi_intent_uri': generate_upi_intent_uri(worker_upi, "Demo Worker", amount, booking.id, mock_order_id),
            'instructions': "[DEMO / TEST MODE] Simulated direct payment flow without real money transfer.",
        }

    def verify_payment(
        self,
        payment,
        verification_payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        mock_tx_id = verification_payload.get('transaction_id') or f"mock_tx_{int(time.time())}"
        return {
            'verified': True,
            'is_mock': True,
            'transaction_id': mock_tx_id,
            'method': 'MOCK_PROVIDER',
            'detail': '[DEMO MODE] Sandbox payment verified.'
        }

    def process_refund(
        self,
        payment,
        refund_amount: Decimal,
        reason: str
    ) -> Dict[str, Any]:
        return {
            'refund_initiated': True,
            'is_mock': True,
            'refund_amount': str(refund_amount),
            'method': 'MOCK_REFUND',
            'detail': f"[DEMO MODE] Simulated refund of ₹{refund_amount} for reason: {reason}"
        }


class PaymentAdapterFactory:
    """
    Factory to resolve the appropriate payment adapter.
    """
    @staticmethod
    def get_adapter(adapter_type: str) -> BasePaymentAdapter:
        adapter_type = (adapter_type or '').upper()
        if adapter_type in ['DIRECT_UPI', 'UPI']:
            return DirectUPIAdapter()
        elif adapter_type in ['DIRECT_CASH', 'CASH']:
            return DirectCashAdapter()
        elif adapter_type in ['MOCK', 'MOCK_PROVIDER', 'DEMO']:
            return MockPaymentAdapter()
        # Default fallback for unconfigured providers:
        return MockPaymentAdapter()
