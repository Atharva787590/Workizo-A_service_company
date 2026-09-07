from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import (
    Booking, RepairToken, MajorRepairApproval, BookingRejection, ChatMessage,
    BookingAuditLog, BookingWorkerAllocation, BookingDispute
)
from .serializers import (
    BookingSerializer, RepairTokenSerializer, MajorRepairApprovalSerializer,
    PublicBookingSerializer, ChatMessageSerializer, BookingAuditLogSerializer,
    BookingDisputeSerializer
)
from .state_machine import (
    calculate_haversine_distance, validate_state_transition,
    calculate_cancellation_compensation, record_booking_audit
)
from .fair_wage_engine import calculate_fair_wage
from .evidence_assessor import assess_booking_dispute_evidence
from .demand_engine import aggregate_demand_intelligence
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from validations import validate_accept_booking
from django.utils import timezone
from decimal import Decimal
import datetime

User = get_user_model()

def send_booking_update(booking_id, booking_data, event_type='booking_status'):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"booking_{booking_id}",
            {
                "type": "booking_update",
                "data": {
                    "type": event_type,
                    "booking": booking_data
                }
            }
        )

def create_and_send_notification(user, title, message, notification_type='general'):
    noti = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "notification",
                    "notification": NotificationSerializer(noti).data
                }
            }
        )
    return noti

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Direct modification via PUT is disabled. Use dedicated booking action endpoints."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def partial_update(self, request, *args, **kwargs):
        return Response(
            {"detail": "Direct modification via PATCH is disabled. Use dedicated booking action endpoints."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):
        return Response(
            {"detail": "Direct deletion of bookings is disabled. Use booking cancellation endpoints."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()
        
        base_qs = Booking.objects.select_related('customer', 'worker', 'service_category', 'repair_token', 'payment').prefetch_related('major_repairs')
        
        if user.is_staff or user.role == 'admin':
            return base_qs.all().order_by('-created_at')
        elif user.role == 'worker':
            profile = getattr(user, 'worker_profile', None)
            category = profile.service_category if profile else None
            from django.db.models import Q
            if category:
                return base_qs.filter(
                    Q(worker=user) | Q(status='searching', service_category=category)
                ).order_by('-created_at')
            else:
                return base_qs.filter(worker=user).order_by('-created_at')
        else:
            return base_qs.filter(customer=user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        # 1. Idempotency Check
        idempotency_key = request.data.get('idempotency_key')
        if idempotency_key:
            since = timezone.now() - datetime.timedelta(hours=24)
            existing = Booking.objects.filter(customer=request.user, idempotency_key=idempotency_key, created_at__gte=since).first()
            if existing:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        # 2. Scheduling Limits Validation (max 30 days ahead, not in the past)
        booking_type = request.data.get('booking_type', 'instant')
        scheduled_time_val = request.data.get('scheduled_time')
        if booking_type == 'scheduled':
            if not scheduled_time_val:
                return Response({"detail": "Scheduled bookings require a valid scheduled_time."}, status=status.HTTP_400_BAD_REQUEST)
            from django.utils.dateparse import parse_datetime
            parsed_time = parse_datetime(str(scheduled_time_val))
            if parsed_time is None:
                return Response({"detail": "Invalid date/time format for scheduled_time."}, status=status.HTTP_400_BAD_REQUEST)
            if timezone.is_naive(parsed_time):
                parsed_time = timezone.make_aware(parsed_time)
            now = timezone.now()
            if parsed_time < now:
                return Response({"detail": "Scheduled time cannot be in the past."}, status=status.HTTP_400_BAD_REQUEST)
            if parsed_time > now + datetime.timedelta(days=30):
                return Response({"detail": "Bookings can only be scheduled up to 30 days in advance."}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Collective / Multi-worker limits
        required_workers = int(request.data.get('required_worker_count', 1))
        if required_workers < 1 or required_workers > 10:
            return Response({"detail": "Required worker count must be between 1 and 10."}, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        # Calculate contract value & cooperative reserve via deterministic fair-wage engine
        category = serializer.validated_data.get('service_category')
        base_charge = getattr(category, 'base_labour_charge', Decimal('250.00')) if category else Decimal('250.00')
        required_workers = int(self.request.data.get('required_worker_count', 1))
        
        quote = calculate_fair_wage(
            base_charge=base_charge,
            duration_minutes=60,
            required_worker_count=required_workers,
            category_name=category.name if category else "General Maintenance"
        )
        total_value = Decimal(quote['customer_total'])
        coop_allocation = Decimal(quote['cooperative_reserve'])
        
        booking_type = self.request.data.get('booking_type', 'instant')
        initial_status = 'SCHEDULED' if booking_type == 'scheduled' else 'searching'

        booking = serializer.save(
            customer=self.request.user,
            status=initial_status,
            total_contract_value=total_value,
            cooperative_allocation=coop_allocation
        )

        # Record Initial Audit Log
        record_booking_audit(
            booking=booking,
            from_status='NONE',
            to_status=booking.status,
            user=self.request.user,
            reason='Initial booking creation',
            metadata={'booking_type': booking.booking_type, 'required_workers': required_workers}
        )
        
        # Find and notify online approved workers in the service category
        from workers.models import WorkerProfile
        workers = WorkerProfile.objects.filter(
            online_status=True,
            approval_status='approved',
            service_category=booking.service_category
        )
        
        channel_layer = get_channel_layer()
        for wp in workers:
            noti = Notification.objects.create(
                user=wp.user,
                title="New Service Request",
                message=f"New {booking.booking_type.capitalize()} request for {booking.service_category.name}. Problem: {booking.problem_type}.",
                notification_type="incoming_booking_request"
            )
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"user_{wp.user.id}",
                    {
                        "type": "send_notification",
                        "data": {
                            "type": "notification",
                            "notification": NotificationSerializer(noti).data,
                            "booking": BookingSerializer(booking).data
                        }
                    }
                )

        # Broadcast the new available booking request to all workers in this category
        channel_layer = get_channel_layer()
        if channel_layer:
            category_id_group = f"category_{booking.service_category.id}"
            category_slug_group = booking.service_category.name.lower().replace(' ', '_')
            for group in [category_id_group, category_slug_group]:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": "send_notification",
                        "data": {
                            "type": "booking_available",
                            "booking": BookingSerializer(booking).data
                        }
                    }
                )

        # Create notification for self
        create_and_send_notification(
            user=self.request.user,
            title="Booking Placed",
            message=f"Your {booking.booking_type} request for {booking.service_category.name} is placed successfully.",
            notification_type="booking_update"
        )

        # Send booking confirmation email to customer
        try:
            from notifications.email_service import EmailNotificationService
            EmailNotificationService.send_booking_confirmation_email(booking)
        except Exception as e:
            print(f"Error sending booking confirmation email: {e}")

        # Broadcast booking_created to the booking group
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'booking_created')

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='track')
    def track(self, request):
        tracking_id = request.query_params.get('tracking_id')
        if not tracking_id:
            return Response({"detail": "tracking_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking = Booking.objects.get(tracking_id=tracking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "No booking found with this Tracking ID."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = PublicBookingSerializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-bookings')
    def my_bookings(self, request):
        user = request.user
        if user.role == 'worker':
            bookings = Booking.objects.filter(worker=user).order_by('-created_at')
        else:
            bookings = Booking.objects.filter(customer=user).order_by('-created_at')
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='available-requests')
    def available_requests(self, request):
        user = request.user
        if user.role != 'worker':
            return Response({"detail": "Only workers can access this list."}, status=status.HTTP_403_FORBIDDEN)
        
        # Filter matching worker category
        profile = getattr(user, 'worker_profile', None)
        if not profile or not profile.online_status or profile.approval_status != 'approved':
            return Response([])

        category = profile.service_category
        if not category:
            return Response([])

        # Exclude rejected bookings
        rejected_booking_ids = BookingRejection.objects.filter(worker=user).values_list('booking_id', flat=True)

        bookings = Booking.objects.select_related('customer', 'worker', 'service_category', 'repair_token', 'payment').prefetch_related('major_repairs').filter(
            service_category=category,
            status__in=['searching', 'requested', 'SCHEDULED', 'scheduled', 'MATCHING']
        ).exclude(id__in=rejected_booking_ids).order_by('-created_at')
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        user = request.user
        if user.role != 'worker':
            return Response({"detail": "Only workers can accept jobs."}, status=status.HTTP_403_FORBIDDEN)
        
        profile = getattr(user, 'worker_profile', None)
        if not profile or not profile.online_status or profile.approval_status != 'approved':
            return Response({"detail": "You must be approved and online to accept jobs."}, status=status.HTTP_400_BAD_REQUEST)
        
        from django.db import transaction
        with transaction.atomic():
            try:
                booking = Booking.objects.select_for_update().get(pk=pk)
            except Booking.DoesNotExist:
                return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

            try:
                validate_accept_booking(user, booking)
            except Exception:
                pass

            valid_accept_statuses = ['searching', 'requested', 'SCHEDULED', 'scheduled', 'MATCHING']
            if booking.status not in valid_accept_statuses:
                return Response({"detail": "This booking has already been assigned or cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Support collective / multi-worker assignments
            if booking.booking_type == 'collective' and booking.required_worker_count > 1:
                booking.assigned_workers.add(user)
                BookingWorkerAllocation.objects.get_or_create(
                    booking=booking, worker=user,
                    defaults={'status': 'assigned'}
                )
                if not booking.worker:
                    booking.worker = user

                assigned_count = booking.assigned_workers.count()
                if assigned_count >= booking.required_worker_count:
                    booking.status = 'scheduled' if booking.booking_type == 'scheduled' else 'accepted'
                else:
                    booking.status = 'MATCHING'
            else:
                booking.worker = user
                booking.assigned_workers.add(user)
                BookingWorkerAllocation.objects.get_or_create(
                    booking=booking, worker=user,
                    defaults={'status': 'assigned'}
                )
                booking.status = 'scheduled' if booking.booking_type == 'scheduled' else 'accepted'
            
            booking.save()

        # Send captain assigned email to customer
        from notifications.email_service import EmailNotificationService
        EmailNotificationService.send_captain_assigned_email(booking)
        # Send new booking assigned email to captain
        EmailNotificationService.send_captain_booking_assigned_email(booking)

        # Serialized data
        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data, 'booking_accepted')

        # Broadcast to all workers in this category if fully taken
        if booking.status in ['accepted', 'scheduled']:
            channel_layer = get_channel_layer()
            if channel_layer:
                category_id_group = f"category_{booking.service_category.id}"
                category_slug_group = booking.service_category.name.lower().replace(' ', '_')
                for group in [category_id_group, category_slug_group]:
                    async_to_sync(channel_layer.group_send)(
                        group,
                        {
                            "type": "send_notification",
                            "data": {
                                "type": "booking_taken",
                                "booking_id": booking.id
                            }
                        }
                    )

        # Notify Customer
        create_and_send_notification(
            user=booking.customer,
            title="Captain Assigned",
            message=f"Captain {user.full_name} has accepted your {booking.service_category.name.lower()} service request.",
            notification_type="booking_update"
        )
        # Notify Worker
        create_and_send_notification(
            user=user,
            title="Job Accepted",
            message=f"You successfully accepted booking #{booking.id} for {booking.customer.full_name}.",
            notification_type="booking_update"
        )

        return Response(booking_data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if user.role != 'worker':
            return Response({"detail": "Only workers can reject jobs."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason', '')
        rejection, _ = BookingRejection.objects.get_or_create(worker=user, booking=booking)
        if reason:
            rejection.reason = reason
            rejection.save(update_fields=['reason'])

        # If worker was assigned to this booking, remove assignment
        if booking.worker == user or booking.assigned_workers.filter(id=user.id).exists():
            booking.assigned_workers.remove(user)
            BookingWorkerAllocation.objects.filter(booking=booking, worker=user).delete()
            if booking.worker == user:
                remaining_worker = booking.assigned_workers.first()
                booking.worker = remaining_worker
            if not booking.worker:
                booking.status = 'scheduled' if booking.booking_type == 'scheduled' else 'searching'
            booking.save()

        return Response({"detail": "Booking request rejected/declined.", "reason": reason})


    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        from django.db import transaction
        with transaction.atomic():
            try:
                booking = Booking.objects.select_for_update().get(pk=pk)
            except Booking.DoesNotExist:
                return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
            
            user = request.user
            new_status = request.data.get('status')

            valid_statuses = [c[0] for c in Booking.STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response({"detail": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)

            # Define allowed transitions for each status
            allowed_transitions = {
                'searching': ['accepted', 'cancelled', 'scheduled'],
                'requested': ['accepted', 'cancelled', 'scheduled'],
                'MATCHING': ['accepted', 'cancelled', 'scheduled'],
                'SCHEDULED': ['on_the_way', 'cancelled'],
                'scheduled': ['on_the_way', 'cancelled'],
                'accepted': ['on_the_way', 'cancelled', 'SCHEDULED', 'scheduled'],
                'on_the_way': ['arrived', 'cancelled'],
                'arrived': ['verified', 'inspection', 'repair_started', 'in_progress', 'cancelled'],
                'verified': ['inspection', 'repair_started', 'in_progress'],
                'inspection': ['repair_started', 'in_progress'],
                'repair_started': ['repair_completed', 'completed'],
                'in_progress': ['repair_completed', 'completed'],
                'repair_completed': ['waiting_approval', 'ready_to_complete', 'completed'],
                'waiting_approval': ['ready_to_complete', 'completed'],
                'WAITING_FOR_CASH_CONFIRMATION': ['ready_to_complete', 'completed'],
                'ready_to_complete': ['completed'],
                'completed': [],
                'cancelled': []
            }

            current_status = booking.status

            # Strict role-based & state machine validation
            if user.role == 'customer':
                if booking.customer != user:
                    return Response({"detail": "You do not own this booking."}, status=status.HTTP_403_FORBIDDEN)
                if new_status == 'cancelled':
                    if current_status in ['repair_started', 'in_progress', 'IN_PROGRESS', 'repair_completed', 'completed']:
                        return Response({"detail": "Cannot cancel job once work is in progress. Please raise a dispute."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"detail": "Customers can only cancel bookings before work begins. Job completion must be verified by the captain."}, status=status.HTTP_400_BAD_REQUEST)
                    
            elif user.role == 'worker':
                if booking.worker != user and not booking.assigned_workers.filter(id=user.id).exists():
                    return Response({"detail": "You are not assigned to this job."}, status=status.HTTP_403_FORBIDDEN)
                
                # Workers cannot manually force verified status (must happen via verify-qr or verify-pin)
                if new_status == 'verified':
                    return Response({"detail": "Status 'verified' cannot be set manually. Use Arrival PIN verification."}, status=status.HTTP_400_BAD_REQUEST)
                    
                allowed = allowed_transitions.get(current_status, [])
                if new_status not in allowed:
                    return Response({"detail": f"Invalid status transition from {current_status} to {new_status}."}, status=status.HTTP_400_BAD_REQUEST)
                    
            elif user.role == 'admin' or user.is_staff:
                pass
            else:
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            # Start-of-service verification guard: cannot enter in_progress / repair_started without verification
            if new_status in ['repair_started', 'in_progress', 'IN_PROGRESS']:
                if not booking.arrival_pin_verified and booking.status != 'verified':
                    return Response({"detail": "Start-of-service verification (Arrival PIN) is required before entering work in progress."}, status=status.HTTP_400_BAD_REQUEST)

            # Enforce that no booking can reach COMPLETED status until payment is PAID
            if new_status == 'completed':
                payment = getattr(booking, 'payment', None)
                if not payment or payment.status != 'PAID':
                    return Response({"detail": "Cannot complete job before payment has been verified."}, status=status.HTTP_400_BAD_REQUEST)

                from decimal import Decimal
                from workers.models import Wallet, WalletTransaction
                from billing.views import compile_receipt_pdf
                from notifications.email_service import EmailNotificationService

                # Payout Wallet Credit (90% payout)
                worker_payout = (payment.amount * Decimal('0.90')).quantize(Decimal('0.01'))
                wallet, _ = Wallet.objects.get_or_create(worker=booking.worker)
                wallet.current_balance += worker_payout
                wallet.save()

                # Payout transaction logging
                WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=worker_payout,
                    transaction_type='credit',
                    description=f"Earnings for Booking #{booking.id} ({booking.service_category.name})"
                )

                # Compile Receipt PDF
                compile_receipt_pdf(payment)

                # Send completion emails
                try:
                    EmailNotificationService.send_payment_receipt_email(booking, payment)
                    EmailNotificationService.send_captain_payment_confirmation_email(booking, payment)
                except Exception as e:
                    print(f"Error sending emails on completion: {e}")

                # Notify worker of payment deposit
                create_and_send_notification(
                    user=booking.worker,
                    title="Earnings Deposited",
                    message=f"₹{worker_payout} deposited to wallet for booking #{booking.id}.",
                    notification_type="payment"
                )

                # Notify admin
                channel_layer = get_channel_layer()
                if channel_layer:
                    from billing.serializers import PaymentSerializer
                    async_to_sync(channel_layer.group_send)(
                        "admin_updates",
                        {
                            "type": "send_notification",
                            "data": {
                                "type": "payment_update",
                                "payment": PaymentSerializer(payment).data
                            }
                        }
                    )

            booking.status = new_status
            
            # Handle uploaded images if any
            if 'before_photo' in request.FILES:
                booking.before_photo = request.FILES['before_photo']
            if 'after_photo' in request.FILES:
                booking.after_photo = request.FILES['after_photo']
            if 'spare_part_photo' in request.FILES:
                booking.spare_part_photo = request.FILES['spare_part_photo']
            if 'invoice_photo' in request.FILES:
                booking.invoice_photo = request.FILES['invoice_photo']
            if 'optional_video' in request.FILES:
                booking.optional_video = request.FILES['optional_video']

            booking.save()

        # Send status-specific emails
        from notifications.email_service import EmailNotificationService
        if new_status == 'arrived':
            EmailNotificationService.send_captain_arrived_email(booking)
        elif new_status == 'repair_started':
            EmailNotificationService.send_work_started_email(booking)
        elif new_status == 'cancelled':
            reason = request.data.get('cancellation_reason') or request.data.get('reason')
            EmailNotificationService.send_booking_cancelled_email(booking, reason)
            if booking.worker:
                EmailNotificationService.send_captain_booking_cancelled_email(booking, reason)

        # Notify both parties
        status_messages = {
            'on_the_way': f"Captain {booking.worker.full_name} is on the way.",
            'arrived': f"Captain {booking.worker.full_name} has arrived at your location.",
            'inspection': "Captain is performing an initial inspection of the issue.",
            'repair_started': "Captain has started the repair work.",
            'repair_completed': "Captain completed the repair. Preparing service bill invoice.",
            'waiting_approval': "Service bill generated. Awaiting your approval.",
            'completed': "Service job completed. Invoice payment confirmed.",
            'cancelled': f"Booking #{booking.id} has been cancelled."
        }

        msg = status_messages.get(new_status)
        if msg:
            create_and_send_notification(booking.customer, "Booking Status Update", msg, "booking_update")
            if booking.worker:
                create_and_send_notification(booking.worker, "Job Status Update", f"Job status updated to {new_status.replace('_', ' ').title()}.", "booking_update")

        booking_data = self.get_serializer(booking).data
        
        # Determine the event type for status updates
        event_type = 'booking_status'
        if new_status == 'on_the_way':
            event_type = 'captain_arriving'
        elif new_status == 'repair_started':
            event_type = 'work_started'
        elif new_status == 'repair_completed':
            event_type = 'work_completed'
            
        send_booking_update(booking.id, booking_data, event_type)

        return Response(booking_data)

    @action(detail=True, methods=['post'], url_path='verify-qr')
    def verify_qr(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' or booking.worker != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status != 'arrived':
            return Response({"verified": False, "detail": f"Cannot verify QR code when booking status is '{booking.status}'. Must be 'arrived'."}, status=status.HTTP_400_BAD_REQUEST)
        
        qr_value = request.data.get('qr_code_value') or request.data.get('qr_code')
        if not qr_value:
            return Response({"verified": False, "detail": "Missing QR code value."}, status=status.HTTP_400_BAD_REQUEST)
            
        expected_token = str(booking.qr_code_value)[:8].strip().upper()
        provided_token = str(qr_value).strip().upper()
        
        if expected_token == provided_token:
            booking.status = 'verified'
            booking.arrival_pin_verified = True
            booking.arrival_pin_verified_at = timezone.now()
            booking.save(update_fields=['status', 'arrival_pin_verified', 'arrival_pin_verified_at'])

            booking_data = self.get_serializer(booking).data
            send_booking_update(booking.id, booking_data)

            create_and_send_notification(
                user=booking.customer,
                title="QR Verified Successfully",
                message="Captain QR verification verified. Work is beginning.",
                notification_type="booking_update"
            )

            return Response({"verified": True, "booking": booking_data})
        else:
            return Response({"verified": False, "detail": "Invalid QR code value. Please ask customer to reload."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='verify-pin')
    def verify_pin(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' and not user.is_staff:
            return Response({"detail": "Only workers can verify arrival PIN."}, status=status.HTTP_403_FORBIDDEN)

        if booking.worker != user and not booking.assigned_workers.filter(id=user.id).exists() and not user.is_staff:
            return Response({"detail": "You are not assigned to this booking."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in ['arrived', 'verified']:
            return Response({
                "verified": False,
                "detail": f"Cannot verify PIN when status is '{booking.status}'. Worker must mark arrival first."
            }, status=status.HTTP_400_BAD_REQUEST)

        pin = request.data.get('pin') or request.data.get('arrival_pin')
        if not pin:
            return Response({"verified": False, "detail": "PIN code is required."}, status=status.HTTP_400_BAD_REQUEST)

        expected_pin = str(booking.arrival_pin or '').strip()
        provided_pin = str(pin).strip()

        if expected_pin and expected_pin == provided_pin:
            booking.arrival_pin_verified = True
            booking.arrival_pin_verified_at = timezone.now()
            booking.status = 'verified'
            booking.save(update_fields=['arrival_pin_verified', 'arrival_pin_verified_at', 'status'])

            record_booking_audit(booking, 'arrived', 'verified', user, 'Arrival PIN verified by customer')

            booking_data = self.get_serializer(booking).data
            send_booking_update(booking.id, booking_data, 'service_verified')

            create_and_send_notification(
                user=booking.customer,
                title="Start-of-Service Verified",
                message="Your arrival PIN was successfully verified. The captain is starting work.",
                notification_type="booking_update"
            )

            return Response({"verified": True, "booking": booking_data})
        else:
            return Response({
                "verified": False,
                "detail": "Invalid Arrival PIN. Please ask the customer for the correct 4-digit code."
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='request-major-repair')
    def request_major_repair(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' or booking.worker != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason')
        estimated_cost = request.data.get('estimated_cost')

        if not reason or not estimated_cost:
            return Response({"detail": "Reason and estimated_cost required."}, status=status.HTTP_400_BAD_REQUEST)

        approval = MajorRepairApproval.objects.create(
            booking=booking,
            reason=reason,
            estimated_cost=estimated_cost,
            status='pending'
        )

        create_and_send_notification(
            user=booking.customer,
            title="Major Repair Approval Needed",
            message=f"Captain requested approval for {reason}. Estimate: ₹{estimated_cost}.",
            notification_type="booking_update"
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data)

        return Response(MajorRepairApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'], url_path='respond-major-repair')
    def respond_major_repair(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if booking.customer != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        approval_id = request.data.get('approval_id')
        response_status = request.data.get('status') # approved / rejected

        if response_status not in ['approved', 'rejected']:
            return Response({"detail": "Invalid response status."}, status=status.HTTP_400_BAD_REQUEST)

        approval = get_object_or_404(MajorRepairApproval, id=approval_id, booking=booking)
        approval.status = response_status
        approval.save()

        # Notify Captain
        create_and_send_notification(
            user=booking.worker,
            title=f"Repair Estimate {response_status.title()}",
            message=f"Customer has {response_status} the major repair estimate of ₹{approval.estimated_cost}.",
            notification_type="booking_update"
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data)

        return Response(MajorRepairApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'], url_path='update-repair-token')
    def update_repair_token(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' or booking.worker != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        token_status = request.data.get('status')
        valid_token_statuses = [c[0] for c in RepairToken.STATUS_CHOICES]

        if token_status not in valid_token_statuses:
            return Response({"detail": "Invalid token status."}, status=status.HTTP_400_BAD_REQUEST)

        token_number = request.data.get('token_number')
        if not token_number:
            # Generate a new unique token
            token_number = f"WRK-{1000 + booking.id}"

        token, created = RepairToken.objects.get_or_create(
            booking=booking,
            defaults={'token_number': token_number, 'status': token_status}
        )

        if not created:
            token.status = token_status
            token.save()

        create_and_send_notification(
            user=booking.customer,
            title="Workshop Repair Update",
            message=f"Workshop status updated to: {token.get_status_display()}.",
            notification_type="booking_update"
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data)

        return Response(RepairTokenSerializer(token).data)

    @action(detail=True, methods=['post'], url_path='verify-geofence')
    def verify_geofence(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if user.role != 'worker' and not user.is_staff:
            return Response({"detail": "Only service workers can verify arrival via geo-fence."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.worker != user and not booking.assigned_workers.filter(id=user.id).exists():
            return Response({"detail": "You are not assigned to this booking."}, status=status.HTTP_403_FORBIDDEN)

        worker_lat = request.data.get('latitude')
        worker_lon = request.data.get('longitude')
        gps_accuracy = request.data.get('accuracy', 0)

        if worker_lat is None or worker_lon is None:
            return Response({"detail": "Latitude and longitude are required for geo-fencing."}, status=status.HTTP_400_BAD_REQUEST)

        job_lat = booking.latitude
        job_lon = booking.longitude
        radius = booking.arrival_radius_meters or 300

        # Fallback if booking coordinates were not set
        if job_lat is None or job_lon is None:
            booking.geofence_verified = True
            booking.geofence_verified_at = timezone.now()
            booking.status = 'arrived'
            booking.save(update_fields=['geofence_verified', 'geofence_verified_at', 'status'])
            record_booking_audit(booking, booking.status, 'arrived', user, 'Arrival verified via manual fallback (no job coords)')
            send_booking_update(booking.id, self.get_serializer(booking).data, 'worker_arrived')
            return Response({
                "verified": True,
                "fallback": True,
                "message": "Arrival confirmed via manual override.",
                "booking": self.get_serializer(booking).data
            })

        distance = calculate_haversine_distance(job_lat, job_lon, worker_lat, worker_lon)
        if distance is not None and distance <= radius:
            booking.geofence_verified = True
            booking.geofence_verified_at = timezone.now()
            booking.status = 'arrived'
            booking.save(update_fields=['geofence_verified', 'geofence_verified_at', 'status'])
            record_booking_audit(
                booking, booking.status, 'arrived', user,
                f"Geo-fence arrival verified ({int(distance)}m distance, radius {radius}m)",
                {'distance_meters': int(distance), 'accuracy': gps_accuracy}
            )
            send_booking_update(booking.id, self.get_serializer(booking).data, 'worker_arrived')
            return Response({
                "verified": True,
                "distance_meters": int(distance),
                "arrival_radius": radius,
                "message": f"Geo-fence arrival verified! You are {int(distance)}m from the job site.",
                "booking": self.get_serializer(booking).data
            })
        else:
            int_dist = int(distance) if distance is not None else -1
            return Response({
                "verified": False,
                "distance_meters": int_dist,
                "arrival_radius": radius,
                "detail": f"Worker is {int_dist}m away from the job site. Must be within {radius}m to verify arrival."
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        if user.role == 'customer' and booking.customer != user:
            return Response({"detail": "You do not own this booking."}, status=status.HTTP_403_FORBIDDEN)
        elif user.role not in ['customer', 'admin'] and not user.is_staff:
            return Response({"detail": "Only customers can reschedule bookings."}, status=status.HTTP_403_FORBIDDEN)

        # Rescheduling is only allowed before service starts
        non_reschedulable = ['arrived', 'verified', 'inspection', 'repair_started', 'in_progress', 'IN_PROGRESS', 'repair_completed', 'completed', 'cancelled', 'disputed']
        if booking.status in non_reschedulable:
            return Response({
                "detail": f"Cannot reschedule booking once service has started or reached status '{booking.status}'."
            }, status=status.HTTP_400_BAD_REQUEST)

        scheduled_time_val = request.data.get('scheduled_time')
        if not scheduled_time_val:
            return Response({"detail": "New scheduled_time is required."}, status=status.HTTP_400_BAD_REQUEST)

        from django.utils.dateparse import parse_datetime
        parsed_time = parse_datetime(str(scheduled_time_val))
        if parsed_time is None:
            return Response({"detail": "Invalid date/time format for scheduled_time."}, status=status.HTTP_400_BAD_REQUEST)
        if timezone.is_naive(parsed_time):
            parsed_time = timezone.make_aware(parsed_time)
        now = timezone.now()
        if parsed_time < now:
            return Response({"detail": "Scheduled time cannot be in the past."}, status=status.HTTP_400_BAD_REQUEST)
        if parsed_time > now + datetime.timedelta(days=30):
            return Response({"detail": "Bookings can only be scheduled up to 30 days in advance."}, status=status.HTTP_400_BAD_REQUEST)

        old_time = booking.scheduled_time
        from_status = booking.status
        booking.scheduled_time = parsed_time
        booking.booking_type = 'scheduled'
        if booking.status in ['searching', 'requested']:
            booking.status = 'scheduled'
        booking.save(update_fields=['scheduled_time', 'booking_type', 'status'])

        record_booking_audit(
            booking, from_status, booking.status, user,
            f"Customer rescheduled booking to {parsed_time.isoformat()}",
            {'old_time': str(old_time), 'new_time': parsed_time.isoformat()}
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data, 'booking_rescheduled')

        if booking.worker:
            create_and_send_notification(
                user=booking.worker,
                title="Job Rescheduled",
                message=f"Booking #{booking.id} was rescheduled by the customer to {parsed_time.strftime('%d %b %Y, %I:%M %p')}.",
                notification_type="booking_update"
            )

        return Response({
            "message": "Booking rescheduled successfully.",
            "scheduled_time": parsed_time.isoformat(),
            "booking": booking_data
        })

    @action(detail=True, methods=['post'], url_path='cancel-booking')
    def cancel_booking(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        reason = request.data.get('reason', 'Customer requested cancellation')

        is_allowed, msg = validate_state_transition(booking, 'cancelled', user)
        if not is_allowed:
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        fee, fee_desc = calculate_cancellation_compensation(booking, user)
        
        from_status = booking.status
        booking.status = 'cancelled'
        booking.cancellation_fee = fee
        booking.cancellation_reason = reason
        booking.save(update_fields=['status', 'cancellation_fee', 'cancellation_reason'])

        # Credit compensation fee to worker if applicable
        if fee > Decimal('0.00') and booking.worker:
            from workers.models import Wallet, WalletTransaction
            wallet, _ = Wallet.objects.get_or_create(worker=booking.worker)
            wallet.current_balance += fee
            wallet.save(update_fields=['current_balance'])
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=fee,
                transaction_type='credit',
                description=f"Late cancellation compensation for Booking #{booking.id}"
            )

        record_booking_audit(
            booking, from_status, 'cancelled', user,
            reason, {'fee': str(fee), 'fee_note': fee_desc}
        )

        create_and_send_notification(
            user=booking.customer if user != booking.customer else (booking.worker or user),
            title="Booking Cancelled",
            message=f"Booking #{booking.id} has been cancelled. {fee_desc}",
            notification_type="booking_update"
        )
        send_booking_update(booking.id, self.get_serializer(booking).data, 'booking_cancelled')

        return Response({
            "status": "cancelled",
            "cancellation_fee": str(fee),
            "fee_explanation": fee_desc,
            "booking": self.get_serializer(booking).data
        })

    @action(detail=False, methods=['get', 'post'], url_path='fair-wage-quote')
    def fair_wage_quote(self, request):
        cat_id = request.data.get('category_id') or request.query_params.get('category_id')
        duration = request.data.get('duration_minutes') or request.query_params.get('duration_minutes')
        skill = request.data.get('skill_tier') or request.query_params.get('skill_tier')
        distance = request.data.get('travel_distance_km') or request.query_params.get('travel_distance_km')
        hazard = request.data.get('hazard_level') or request.query_params.get('hazard_level')
        worker_count = request.data.get('required_worker_count') or request.query_params.get('required_worker_count')

        base_charge = None
        cat_name = None
        if cat_id:
            try:
                from services.models import ServiceCategory
                cat = ServiceCategory.objects.get(id=cat_id)
                base_charge = cat.base_labour_charge
                cat_name = cat.name
            except Exception:
                pass

        quote = calculate_fair_wage(
            base_charge=base_charge,
            duration_minutes=int(duration) if duration else None,
            skill_tier=str(skill) if skill else None,
            travel_distance_km=float(distance) if distance else None,
            hazard_level=str(hazard) if hazard else None,
            required_worker_count=int(worker_count) if worker_count else 1,
            category_name=cat_name
        )
        return Response(quote, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='demand-intelligence')
    def demand_intelligence(self, request):
        city = request.query_params.get('city')
        category_id = request.query_params.get('category_id')
        days = request.query_params.get('days', 30)
        try:
            days = int(days)
        except (ValueError, TypeError):
            days = 30

        cat_id_int = None
        if category_id:
            try:
                cat_id_int = int(category_id)
            except (ValueError, TypeError):
                cat_id_int = None

        data = aggregate_demand_intelligence(city=city, category_id=cat_id_int, days=days)
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='raise-dispute')
    def raise_dispute(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        reason = request.data.get('reason')
        if not reason or len(reason.strip()) < 5:
            return Response({"detail": "Please provide a detailed reason for the dispute (min 5 characters)."}, status=status.HTTP_400_BAD_REQUEST)

        # RBAC: only customer can raise dispute on their booking
        if booking.customer != user and not user.is_staff:
            return Response({"detail": "Only the booking customer can raise a dispute."}, status=status.HTTP_403_FORBIDDEN)

        is_allowed, msg = validate_state_transition(booking, 'disputed', user)
        if not is_allowed:
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        from_status = booking.status
        booking.status = 'disputed'
        booking.dispute_reason = reason
        booking.save(update_fields=['status', 'dispute_reason'])

        record_booking_audit(booking, from_status, 'disputed', user, reason)

        # Assemble factual evidence record deterministically
        audit_trail = [
            {
                "from_status": a.from_status,
                "to_status": a.to_status,
                "changed_by": a.changed_by.email if a.changed_by else None,
                "reason": a.reason,
                "timestamp": a.created_at.isoformat()
            }
            for a in booking.audit_logs.all().order_by('created_at')
        ]

        payment_data = None
        if hasattr(booking, 'payment') and booking.payment:
            payment_data = {
                "amount": str(booking.payment.amount),
                "status": booking.payment.status,
                "method": booking.payment.method,
                "receipt_number": booking.payment.receipt_number
            }

        booking_summary = {
            "id": booking.id,
            "tracking_id": booking.tracking_id,
            "status": booking.status,
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
            "scheduled_time": booking.scheduled_time.isoformat() if booking.scheduled_time else None,
            "arrival_pin_verified": booking.arrival_pin_verified,
            "arrival_pin_verified_at": booking.arrival_pin_verified_at.isoformat() if booking.arrival_pin_verified_at else None,
            "geofence_verified": booking.geofence_verified,
            "before_photo": bool(booking.before_photo),
            "after_photo": bool(booking.after_photo),
            "customer_email": booking.customer.email,
            "worker_email": booking.worker.email if booking.worker else None,
        }

        # Deterministic rule-based assessment
        assessment = assess_booking_dispute_evidence(
            booking_data=booking_summary,
            dispute_data={"reason": reason},
            payment_data=payment_data,
            audit_trail=audit_trail
        )

        dispute_id = f"UNN-DISP-{booking.id}-{int(timezone.now().timestamp())}"
        dispute, _ = BookingDispute.objects.update_or_create(
            booking=booking,
            defaults={
                "dispute_id": dispute_id,
                "raised_by": user,
                "reason": reason,
                "status": "OPEN",
                "evidence_record": {
                    "booking": booking_summary,
                    "payment": payment_data,
                    "audit_trail": audit_trail
                },
                "assessment_report": assessment
            }
        )

        # Notify parties and admin
        create_and_send_notification(
            user=booking.customer,
            title="Dispute Logged",
            message=f"A dispute has been raised on booking #{booking.id}. Our cooperative arbitration committee will review it.",
            notification_type="dispute"
        )
        if booking.worker:
            create_and_send_notification(
                user=booking.worker,
                title="Dispute Raised on Booking",
                message=f"Booking #{booking.id} is now under dispute review.",
                notification_type="dispute"
            )

        send_booking_update(booking.id, self.get_serializer(booking).data, 'booking_disputed')
        return Response({
            "status": "disputed",
            "message": "Dispute registered. Our cooperative resolution desk has been notified.",
            "dispute": BookingDisputeSerializer(dispute).data,
            "booking": self.get_serializer(booking).data
        })

    @action(detail=True, methods=['post'], url_path='respond-dispute')
    def respond_dispute(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        # RBAC: Only assigned worker or staff can respond
        is_assigned_worker = (booking.worker == user) or booking.assigned_workers.filter(id=user.id).exists()
        if not is_assigned_worker and not user.is_staff:
            return Response({"detail": "Only the assigned service technician can respond to this dispute."}, status=status.HTTP_403_FORBIDDEN)

        dispute = booking.disputes.first()
        if not dispute:
            return Response({"detail": "No active dispute found on this booking."}, status=status.HTTP_404_NOT_FOUND)

        response_text = request.data.get('response', '').strip()
        if not response_text or len(response_text) < 5:
            return Response({"detail": "Please provide a detailed response (min 5 characters)."}, status=status.HTTP_400_BAD_REQUEST)

        dispute.worker_response = response_text
        dispute.worker_responded_at = timezone.now()
        dispute.status = 'UNDER_REVIEW'
        dispute.save(update_fields=['worker_response', 'worker_responded_at', 'status', 'updated_at'])

        record_booking_audit(booking, 'disputed', 'disputed', user, f"Worker responded to dispute: {response_text[:40]}...")

        create_and_send_notification(
            user=booking.customer,
            title="Worker Responded to Dispute",
            message=f"The technician has submitted a response regarding booking #{booking.id} dispute.",
            notification_type="dispute"
        )

        return Response({
            "status": "success",
            "message": "Response submitted. Dispute transitioned to UNDER_REVIEW.",
            "dispute": BookingDisputeSerializer(dispute).data
        })

    @action(detail=True, methods=['get'], url_path='dispute-details')
    def dispute_details(self, request, pk=None):
        booking = self.get_object()
        user = request.user

        is_assigned = (booking.worker == user) or booking.assigned_workers.filter(id=user.id).exists()
        if user != booking.customer and not is_assigned and not user.is_staff:
            return Response({"detail": "Unauthorized to view dispute details for this booking."}, status=status.HTTP_403_FORBIDDEN)

        dispute = booking.disputes.first()
        if not dispute:
            return Response({"detail": "No dispute found for this booking."}, status=status.HTTP_404_NOT_FOUND)

        return Response(BookingDisputeSerializer(dispute).data)

    @action(detail=True, methods=['get'], url_path='audit-logs')
    def audit_logs(self, request, pk=None):
        booking = self.get_object()
        if request.user != booking.customer and request.user != booking.worker and not request.user.is_staff:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        logs = booking.audit_logs.all().order_by('-created_at')
        serializer = BookingAuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class ChatMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        # Verify user is customer or worker
        if request.user.role != 'admin' and not request.user.is_staff:
            if booking.customer_id != request.user.id and booking.worker_id != request.user.id:
                return Response({"detail": "You are not authorized to view this chat."}, status=status.HTTP_403_FORBIDDEN)

        # Mark received unread messages as read
        unread_messages = ChatMessage.objects.filter(booking=booking, receiver=request.user, is_read=False)
        unread_messages.update(is_read=True)

        messages = ChatMessage.objects.filter(booking=booking).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



