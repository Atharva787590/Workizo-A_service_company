import io
from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.core.files.base import ContentFile
from rest_framework import views, permissions, status
from rest_framework.response import Response

from .models import Bill, BillItem, Payment
from .serializers import BillSerializer, PaymentSerializer
from bookings.models import Booking
from bookings.serializers import BookingSerializer
from bookings.views import send_booking_update, create_and_send_notification

# ReportLab Invoice Imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def compile_bill_pdf(bill):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F0F14'),
        spaceAfter=12
    )
    normal_style = styles['Normal']
    
    story = []
    story.append(Paragraph("UNNATI OFFICIAL INVOICE (उन्नति चालान)", title_style))
    story.append(Spacer(1, 10))

    
    # Metadata
    story.append(Paragraph(f"<b>Invoice No:</b> WRK-INV-{bill.id}", normal_style))
    story.append(Paragraph(f"<b>Booking Ref:</b> #{bill.booking.id}", normal_style))
    story.append(Paragraph(f"<b>Customer:</b> {bill.booking.customer.full_name} ({bill.booking.customer.phone})", normal_style))
    worker_name = bill.booking.worker.full_name if bill.booking.worker else "Unassigned"
    story.append(Paragraph(f"<b>Captain:</b> {worker_name}", normal_style))
    story.append(Paragraph(f"<b>Service Category:</b> {bill.booking.service_category.name}", normal_style))
    story.append(Paragraph(f"<b>Date:</b> {bill.created_at.strftime('%Y-%m-%d %H:%M')}", normal_style))
    story.append(Spacer(1, 20))
    
    # Table columns: Description, Qty, Rate, Total
    table_data = [
        [
            Paragraph("<b>Item Description</b>", normal_style), 
            Paragraph("<b>Quantity</b>", normal_style), 
            Paragraph("<b>Price</b>", normal_style), 
            Paragraph("<b>Amount</b>", normal_style)
        ]
    ]
    
    # Labour charges
    table_data.append([
        Paragraph("Labour / Service Fee", normal_style), 
        "1", 
        f"INR {bill.labour_charges}", 
        f"INR {bill.labour_charges}"
    ])
    
    # Spare parts items
    for item in bill.items.all():
        item_total = item.price * item.quantity
        table_data.append([
            Paragraph(item.part_name, normal_style), 
            str(item.quantity), 
            f"INR {item.price}", 
            f"INR {item_total}"
        ])
        
    # Divider blank line
    table_data.append(["", "", "", ""])
    
    # Totals breakdown
    parts_sub = bill.parts_charges
    subtotal = bill.labour_charges + parts_sub
    table_data.append(["", "", Paragraph("<b>Subtotal:</b>", normal_style), f"INR {subtotal}"])
    table_data.append(["", "", Paragraph("<b>GST (18%):</b>", normal_style), f"INR {bill.gst}"])
    table_data.append(["", "", Paragraph("<b>Discount:</b>", normal_style), f"-INR {bill.discount}"])
    table_data.append(["", "", Paragraph("<b>Grand Total:</b>", normal_style), f"INR {bill.grand_total}"])
    
    t = Table(table_data, colWidths=[240, 60, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FAFAFB')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#E5E7EB')),
        ('LINEBELOW', (2,-4), (-1,-1), 1, colors.HexColor('#0F0F14')),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 30))
    story.append(Paragraph("Thank you for choosing UNNATI Cooperative. For queries, contact support@unnati.coop", normal_style))
    
    doc.build(story)
    
    buffer.seek(0)
    pdf_file = ContentFile(buffer.read())
    bill.invoice_pdf.save(f"invoice_{bill.booking.id}.pdf", pdf_file)
    bill.save()

class GenerateBillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if request.user.role != 'worker' or booking.worker != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status in ['searching', 'cancelled', 'completed']:
            return Response({"detail": f"Cannot generate bill for booking in '{booking.status}' status."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if bill already exists
        if hasattr(booking, 'bill'):
            return Response({"detail": "Bill already generated for this booking."}, status=status.HTTP_400_BAD_REQUEST)

        import json
        raw_data = request.data.get('data')
        parsed_data = {}
        if raw_data:
            if isinstance(raw_data, str):
                try:
                    parsed_data = json.loads(raw_data)
                except Exception:
                    pass
            else:
                parsed_data = raw_data
        else:
            parsed_data = request.data

        labour_charges = Decimal(str(parsed_data.get('labour_charges', 0) or 0))
        discount = Decimal(str(parsed_data.get('discount', 0) or 0))
        
        if labour_charges < 0:
            return Response({"detail": "Labour charges cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)
        if discount < 0:
            return Response({"detail": "Discount cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        items_data = parsed_data.get('parts_used') or parsed_data.get('items') or []
        if isinstance(items_data, str):
            try:
                items_data = json.loads(items_data)
            except Exception:
                items_data = []

        # Validate spare parts before creating the bill database row
        for item in items_data:
            name = item.get('part_name')
            if name:
                try:
                    qty = int(item.get('quantity', 1))
                except (ValueError, TypeError):
                    return Response({"detail": "Quantity must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    price = Decimal(str(item.get('price', 0)))
                except Exception:
                    return Response({"detail": "Price must be a valid decimal number."}, status=status.HTTP_400_BAD_REQUEST)

                if qty <= 0:
                    return Response({"detail": "Spare part quantity must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)
                if price < 0:
                    return Response({"detail": "Spare part price cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        supplier_invoice = request.FILES.get('supplier_invoice')

        # Create Bill (charges calculated below)
        bill = Bill.objects.create(
            booking=booking,
            labour_charges=labour_charges,
            discount=discount,
            supplier_invoice=supplier_invoice
        )

        parts_charges = Decimal('0.00')
        for item in items_data:
            name = item.get('part_name')
            qty = int(item.get('quantity', 1))
            price = Decimal(str(item.get('price', 0)))
            
            if name:
                BillItem.objects.create(
                    bill=bill,
                    part_name=name,
                    quantity=qty,
                    price=price
                )
                parts_charges += (price * qty)

        # Set final aggregates
        subtotal = labour_charges + parts_charges
        gst = (subtotal * Decimal('0.18')).quantize(Decimal('0.01'))
        grand_total = (subtotal + gst - discount).quantize(Decimal('0.01'))
        if grand_total < 0:
            grand_total = Decimal('0.00')

        bill.parts_charges = parts_charges
        bill.gst = gst
        bill.grand_total = grand_total
        bill.save()

        # Compile PDF invoice automatically
        compile_bill_pdf(bill)

        # Update booking status & broadcast
        if bill.grand_total == 0:
            from django.utils import timezone
            import time
            payment = Payment.objects.create(
                booking=booking,
                customer=booking.customer,
                captain=booking.worker,
                amount=Decimal('0.00'),
                currency='INR',
                receipt_number=f"REC-{booking.id}-{int(time.time())}",
                method='CASH',
                status='PAID',
                payment_time=timezone.now()
            )
            compile_receipt_pdf(payment)
            booking.status = 'ready_to_complete'
        else:
            booking.status = 'waiting_approval'
        booking.save()

        booking_data = BookingSerializer(booking).data
        event_type = 'payment_completed' if bill.grand_total == 0 else 'payment_pending'
        send_booking_update(booking.id, booking_data, event_type)

        # Alert customer
        create_and_send_notification(
            user=booking.customer,
            title="Invoice Generated",
            message=f"Captain has generated an invoice for ₹{grand_total}. Please review and pay.",
            notification_type="bill"
        )

        # Send Work Completed Email to Customer
        from notifications.email_service import EmailNotificationService
        EmailNotificationService.send_work_completed_email(booking, bill)

        # Send Service Completed Email to Captain if free job (grand total 0 completes instantly)
        if bill.grand_total == 0:
            EmailNotificationService.send_captain_service_completed_email(booking)

        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)

class GetBillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        bill = get_object_or_404(Bill, booking=booking)
        
        if request.user != booking.customer and request.user != booking.worker:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
            
        return Response(BillSerializer(bill).data)

class ApproveBillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        bill = get_object_or_404(Bill, booking=booking)
        if bill.is_approved:
            return Response({"detail": "This bill is already approved."}, status=status.HTTP_400_BAD_REQUEST)
        bill.is_approved = True
        bill.save()

        # Broadcast update
        send_booking_update(booking.id, BookingSerializer(booking).data)

        create_and_send_notification(
            user=booking.worker,
            title="Invoice Approved",
            message=f"Customer approved invoice for booking #{booking.id}. Awaiting payment.",
            notification_type="bill"
        )

        return Response(BillSerializer(bill).data)

import time
import hmac
import hashlib
import requests
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from rest_framework.exceptions import ValidationError
from channels.layers import get_channel_layer


def compile_receipt_pdf(payment):
    booking = payment.booking
    bill = booking.bill
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F0F14'),
        spaceAfter=12
    )
    normal_style = styles['Normal']
    
    story = []
    story.append(Paragraph("UNNATI COOPERATIVE OFFICIAL RECEIPT", title_style))
    story.append(Spacer(1, 10))
    
    # Metadata
    receipt_no = payment.receipt_number if payment.receipt_number else f"REC-{booking.id}"
    story.append(Paragraph(f"<b>Receipt No:</b> {receipt_no}", normal_style))
    story.append(Paragraph(f"<b>Booking Ref:</b> #{booking.id}", normal_style))
    story.append(Paragraph(f"<b>Tracking ID:</b> {booking.tracking_id or 'N/A'}", normal_style))
    story.append(Paragraph(f"<b>Customer Name:</b> {booking.customer.full_name}", normal_style))
    story.append(Paragraph(f"<b>Captain Name:</b> {booking.worker.full_name if booking.worker else 'N/A'}", normal_style))
    story.append(Paragraph(f"<b>Service Category:</b> {booking.service_category.name}", normal_style))
    story.append(Paragraph(f"<b>Payment Method:</b> {payment.get_method_display()}", normal_style))
    story.append(Paragraph(f"<b>Payment Status:</b> {payment.get_status_display()}", normal_style))
    
    if payment.method == 'ONLINE' and payment.transaction_id:
        story.append(Paragraph(f"<b>Transaction ID:</b> {payment.transaction_id}", normal_style))
    elif payment.method == 'CASH' and payment.cash_confirmation_timestamp:
        story.append(Paragraph(f"<b>Cash Confirmation Time:</b> {payment.cash_confirmation_timestamp.strftime('%Y-%m-%d %H:%M')}", normal_style))
        
    story.append(Paragraph(f"<b>Payment Date & Time:</b> {payment.payment_time.strftime('%Y-%m-%d %H:%M') if payment.payment_time else 'N/A'}", normal_style))
    story.append(Spacer(1, 20))
    
    # Charges table
    table_data = [
        [
            Paragraph("<b>Item Description</b>", normal_style), 
            Paragraph("<b>Amount</b>", normal_style)
        ]
    ]
    
    # Labour charges
    table_data.append([
        Paragraph("Labour / Service Fee", normal_style), 
        f"INR {bill.labour_charges}"
    ])
    
    # Spare parts charges
    table_data.append([
        Paragraph("Spare Parts & Materials Fee", normal_style), 
        f"INR {bill.parts_charges}"
    ])
    
    # GST
    table_data.append([
        Paragraph("GST (18% inclusive)", normal_style), 
        f"INR {bill.gst}"
    ])
    
    if bill.discount > 0:
        table_data.append([
            Paragraph("Promo Discount", normal_style), 
            f"-INR {bill.discount}"
        ])
        
    table_data.append([
        Paragraph("<b>Grand Total Paid:</b>", normal_style), 
        f"INR {payment.amount}"
    ])
    
    t = Table(table_data, colWidths=[350, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FAFAFB')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('LINEBELOW', (0,-2), (-1,-1), 1.5, colors.HexColor('#0F0F14')),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 30))
    story.append(Paragraph("Thank you for choosing UNNATI Cooperative. For queries, contact support@unnati.coop", normal_style))
    
    doc.build(story)
    buffer.seek(0)
    
    pdf_file = ContentFile(buffer.read())
    payment.receipt_pdf.save(f"receipt_{booking.id}.pdf", pdf_file)
    payment.save()

class InitiateOnlinePaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "This booking is already completed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        bill = get_object_or_404(Bill, booking=booking)
        if bill.grand_total > 0 and not bill.is_approved:
            return Response({"detail": "Bill invoice must be approved by customer before initiating payment."}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicate paid online transactions
        existing_payment = Payment.objects.filter(booking=booking).first()
        if existing_payment and existing_payment.status in ['PAID', 'COMPLETED', 'success']:
            return Response({"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_number = f"REC-{booking.id}-{int(time.time())}"
        amount_in_paise = int(bill.grand_total * 100)

        # Call Razorpay API to create order
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_number
        }
        
        rzp_order_id = None
        try:
            # Only hit Razorpay if not in dummy mode or if secrets look real
            if settings.RAZORPAY_KEY_ID != 'rzp_test_51O2p3D4R5S6T7U' and settings.RAZORPAY_KEY_SECRET != 'dummy_secret_value':
                response = requests.post(
                    "https://api.razorpay.com/v1/orders",
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                    json=order_data,
                    timeout=10
                )
                if response.status_code == 200:
                    rzp_order_id = response.json().get("id")
        except Exception:
            pass

        # Fallback order ID for testing mode
        if not rzp_order_id:
            rzp_order_id = f"order_mock_{booking.id}_{int(time.time())}"

        # Update or create Payment in database
        payment, created = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                'customer': booking.customer,
                'captain': booking.worker,
                'amount': bill.grand_total,
                'currency': 'INR',
                'receipt_number': receipt_number,
                'method': 'ONLINE',
                'status': 'PENDING',
                'razorpay_order_id': rzp_order_id,
            }
        )

        return Response({
            "order_id": rzp_order_id,
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_number,
            "key_id": settings.RAZORPAY_KEY_ID
        })

class VerifyOnlinePaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        payment_status = request.data.get('status') # optional override for failure simulation

        if payment_status == 'FAILED':
            payment = Payment.objects.filter(booking=booking, razorpay_order_id=razorpay_order_id).first()
            if payment:
                payment.status = 'FAILED'
                payment.save()
            send_booking_update(booking.id, BookingSerializer(booking).data, 'payment_failed')
            return Response({"detail": "Payment recorded as failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Signature verification
        is_verified = False
        if not razorpay_signature or (razorpay_order_id and razorpay_order_id.startswith("order_mock_")) or (razorpay_payment_id and str(razorpay_payment_id).startswith("pay_mock_")):
            # Mock validation succeeds automatically for testing/mock order ID
            is_verified = True
        elif razorpay_order_id and razorpay_payment_id and razorpay_signature:
            msg = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            is_verified = hmac.compare_digest(generated, razorpay_signature)
        elif settings.DEBUG or getattr(settings, 'RAZORPAY_KEY_ID', '').startswith('rzp_test_'):
            is_verified = True

        if not is_verified:
            # Record failed payment
            payment = Payment.objects.filter(booking=booking).last()
            if payment:
                payment.status = 'FAILED'
                payment.save()
            send_booking_update(booking.id, BookingSerializer(booking).data, 'payment_failed')
            return Response({"detail": "Invalid Razorpay payment signature."}, status=status.HTTP_400_BAD_REQUEST)

        # Process successful payment
        with transaction.atomic():
            payment = Payment.objects.filter(booking=booking).order_by('-created_at').first()
            if not payment:
                bill = getattr(booking, 'bill', None)
                amount = bill.grand_total if bill else Decimal('0.00')
                payment = Payment.objects.create(
                    booking=booking,
                    customer=booking.customer,
                    captain=booking.worker,
                    amount=amount,
                    currency='INR',
                    receipt_number=f"REC-{booking.id}-{int(time.time())}",
                    method='ONLINE',
                    status='PENDING'
                )

            # Update Payment info
            payment.status = 'PAID'
            if razorpay_payment_id:
                payment.razorpay_payment_id = razorpay_payment_id
                payment.transaction_id = razorpay_payment_id
            if razorpay_signature:
                payment.razorpay_signature = razorpay_signature
            if razorpay_order_id:
                payment.razorpay_order_id = razorpay_order_id
            payment.payment_time = timezone.now()
            payment.save()

            # Update Booking status
            booking.status = 'ready_to_complete'
            booking.save()

        # Dispatch real-time WebSocket signals
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'payment_completed')

        # Push Notification
        create_and_send_notification(
            user=booking.customer,
            title="Payment Successful",
            message=f"Online payment of ₹{payment.amount} verified successfully.",
            notification_type="payment"
        )
        create_and_send_notification(
            user=booking.worker,
            title="Payment Received",
            message=f"Payment of ₹{payment.amount} received. You can now mark the job as completed.",
            notification_type="payment"
        )

        # Notify admin of payment event
        channel_layer = get_channel_layer()
        if channel_layer:
            from asgiref.sync import async_to_sync
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

        # Send emails via existing SMTP system
        from notifications.email_service import EmailNotificationService
        EmailNotificationService.send_payment_receipt_email(booking, payment)
        EmailNotificationService.send_captain_payment_confirmation_email(booking, payment)

        return Response(PaymentSerializer(payment).data)

class SelectCashPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "This booking is already completed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        bill = get_object_or_404(Bill, booking=booking)
        if bill.grand_total > 0 and not bill.is_approved:
            return Response({"detail": "Bill invoice must be approved by customer before selecting payment method."}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent selecting cash if payment is already complete
        existing_payment = Payment.objects.filter(booking=booking).first()
        if existing_payment and existing_payment.status in ['PAID', 'COMPLETED', 'success']:
            return Response({"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_number = f"REC-{booking.id}-{int(time.time())}"

        # Create or update Payment
        payment, created = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                'customer': booking.customer,
                'captain': booking.worker,
                'amount': bill.grand_total,
                'currency': 'INR',
                'receipt_number': receipt_number,
                'method': 'CASH',
                'status': 'WAITING_FOR_CASH_CONFIRMATION'
            }
        )

        # Set booking status
        booking.status = 'WAITING_FOR_CASH_CONFIRMATION'
        booking.save()

        # Broadcast update
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'cash_selected')

        # Alert Captain that cash confirmation is pending
        create_and_send_notification(
            user=booking.worker,
            title="Cash Payment Pending",
            message=f"Customer selected Cash Payment. Please confirm receipt of ₹{bill.grand_total} after work completion.",
            notification_type="payment"
        )

        return Response(PaymentSerializer(payment).data)

class ConfirmCashPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(id=booking_id)
            if request.user.role != 'worker' or booking.worker != request.user:
                return Response({"detail": "Access denied. Only the assigned captain can confirm cash payment."}, status=status.HTTP_403_FORBIDDEN)

            if booking.status == 'completed':
                return Response({"detail": "This booking is already completed."}, status=status.HTTP_400_BAD_REQUEST)

            payment = get_object_or_404(Payment.objects.select_for_update(), booking=booking)
            
            # Prevent duplicate cash confirmation
            if payment.status in ['PAID', 'COMPLETED', 'success']:
                return Response(PaymentSerializer(payment).data)

            # Update Payment info
            payment.status = 'PAID'
            payment.payment_time = timezone.now()
            payment.cash_confirmation_timestamp = timezone.now()
            payment.save()

            # Update Booking status
            booking.status = 'ready_to_complete'
            booking.save()

        # Broadcast update
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'payment_completed')

        # Push Notification
        create_and_send_notification(
            user=booking.customer,
            title="Cash Confirmed",
            message=f"Captain confirmed cash payment of ₹{payment.amount}. Awaiting job completion.",
            notification_type="payment"
        )
        create_and_send_notification(
            user=booking.worker,
            title="Cash Confirmed",
            message=f"You confirmed cash payment of ₹{payment.amount}. You can now complete the job.",
            notification_type="payment"
        )

        # Notify admin
        channel_layer = get_channel_layer()
        if channel_layer:
            from asgiref.sync import async_to_sync
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

        return Response(PaymentSerializer(payment).data)

class DownloadReceiptView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        payment = get_object_or_404(Payment, booking=booking)

        if request.user != booking.customer and request.user != booking.worker and not (request.user.role == 'admin' or request.user.is_staff):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if not payment.receipt_pdf:
            if payment.status in ['PAID', 'COMPLETED', 'success']:
                compile_receipt_pdf(payment)
            else:
                raise Http404("Receipt PDF not found.")

        return FileResponse(payment.receipt_pdf.open(), content_type='application/pdf')

class DownloadInvoiceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        bill = get_object_or_404(Bill, booking=booking)
        
        if request.user != booking.customer and request.user != booking.worker:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if not bill.invoice_pdf:
            raise Http404("Invoice PDF file not found.")

        return FileResponse(bill.invoice_pdf.open(), content_type='application/pdf')

class ProcessPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "This booking is already completed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        bill = get_object_or_404(Bill, booking=booking)
        method = request.data.get('method', 'cash')
        
        if method == 'cash':
            # route to cash selection flow
            view = SelectCashPaymentView()
            return view.post(request, booking_id)
        else:
            # mock payment receipt
            receipt_number = f"REC-{booking.id}-{int(time.time())}"
            with transaction.atomic():
                payment, created = Payment.objects.update_or_create(
                    booking=booking,
                    defaults={
                        'customer': booking.customer,
                        'captain': booking.worker,
                        'amount': bill.grand_total,
                        'currency': 'INR',
                        'receipt_number': receipt_number,
                        'method': 'ONLINE',
                        'status': 'PAID',
                        'payment_time': timezone.now()
                    }
                )
                booking.status = 'ready_to_complete'
                booking.save()
                compile_receipt_pdf(payment)

            # Broadcast and emails
            booking_data = BookingSerializer(booking).data
            send_booking_update(booking.id, booking_data, 'payment_completed')

            create_and_send_notification(
                user=booking.customer,
                title="Payment Successful",
                message=f"Mock payment of ₹{payment.amount} completed successfully.",
                notification_type="payment"
            )
            create_and_send_notification(
                user=booking.worker,
                title="Payment Received",
                message=f"Payment of ₹{payment.amount} received. You can now mark the job as completed.",
                notification_type="payment"
            )

            from notifications.email_service import EmailNotificationService
            EmailNotificationService.send_payment_receipt_email(booking, payment)
            EmailNotificationService.send_captain_payment_confirmation_email(booking, payment)

            return Response(PaymentSerializer(payment).data)


# =============================================================================
# UNNATI DIRECT PEER-TO-PEER PAYMENT & COOPERATIVE ECONOMICS ENDPOINTS
# =============================================================================
from .payment_engine import (
    calculate_direct_payment_breakdown,
    validate_payment_state_transition,
    calculate_cancellation_refund,
    ensure_no_platform_escrow,
    COOPERATIVE_RATE_DEFAULT
)
from .payment_adapters import PaymentAdapterFactory
from .serializers import DirectPaymentTransactionSerializer


class DirectPaymentSummaryView(views.APIView):
    """
    Returns transparent server-side pricing breakdown for direct service-provider payment.
    Ensures 100% transparency with zero platform escrow / zero middleman deduction.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Access control
        is_participant = (
            request.user == booking.customer or
            request.user == booking.worker or
            request.user.role == 'admin' or
            request.user.is_staff or
            booking.assigned_workers.filter(id=request.user.id).exists()
        )
        if not is_participant:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        # Resolve total payable amount
        bill = getattr(booking, 'bill', None)
        if bill and bill.grand_total > 0:
            total_amount = bill.grand_total
        elif booking.total_contract_value and booking.total_contract_value > 0:
            total_amount = booking.total_contract_value
        else:
            base_labour = getattr(booking.service_category, 'base_price', Decimal('250.00')) if booking.service_category else Decimal('250.00')
            total_amount = base_labour * Decimal(booking.required_worker_count or 1)

        worker_count = max(1, booking.required_worker_count or 1)
        breakdown = calculate_direct_payment_breakdown(
            amount=total_amount,
            worker_count=worker_count,
            cooperative_rate=COOPERATIVE_RATE_DEFAULT
        )

        # Worker UPI & details
        primary_worker = booking.worker or booking.assigned_workers.first()
        worker_name = primary_worker.full_name if primary_worker else "Assigned Craftsman"
        worker_vpa = f"{primary_worker.phone}@upi" if (primary_worker and primary_worker.phone) else f"worker.{primary_worker.id if primary_worker else '0'}@coop.upi"

        # Worker allocation shares for collective bookings
        worker_shares = []
        allocations = booking.worker_allocations.all()
        if allocations.exists():
            for alloc in allocations:
                worker_shares.append({
                    'worker_id': alloc.worker.id,
                    'worker_name': alloc.worker.full_name,
                    'allocated_payout': str(alloc.allocated_payout),
                    'cooperative_dividend_share': str(alloc.cooperative_dividend_share),
                    'status': alloc.status
                })
        else:
            worker_shares.append({
                'worker_id': primary_worker.id if primary_worker else None,
                'worker_name': worker_name,
                'allocated_payout': str(breakdown['worker_direct_payout']),
                'cooperative_dividend_share': str(breakdown['cooperative_allocation']),
                'status': 'assigned'
            })

        existing_payment = Payment.objects.filter(booking=booking).first()

        return Response({
            'booking_id': booking.id,
            'booking_type': getattr(booking, 'booking_type', 'instant'),
            'required_worker_count': worker_count,
            'total_customer_paid': str(breakdown['total_customer_paid']),
            'worker_direct_payout': str(breakdown['worker_direct_payout']),
            'cooperative_allocation': str(breakdown['cooperative_allocation']),
            'cooperative_rate_percentage': breakdown['cooperative_rate_percentage'],
            'platform_fee': str(breakdown['platform_fee']),
            'platform_escrow_balance': str(breakdown['platform_escrow_balance']),
            'platform_holds_escrow': False,
            'worker_name': worker_name,
            'worker_vpa': worker_vpa,
            'worker_shares': worker_shares,
            'current_payment_status': existing_payment.lifecycle_status if existing_payment else 'PAYMENT_PENDING',
            'is_paid': existing_payment.status in ['PAID', 'COMPLETED'] if existing_payment else False
        })


class InitiateDirectPaymentView(views.APIView):
    """
    Initiates direct customer-to-worker payment using provider-independent adapters.
    Validates idempotency, verifies amounts server-side, and records immutable transaction.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user and request.user.role != 'admin':
            return Response({"detail": "Access denied. Only the customer can initiate payment."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "Booking is already completed and settled."}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency check
        idempotency_key = request.data.get('idempotency_key')
        if idempotency_key:
            existing_payment = Payment.objects.filter(idempotency_key=idempotency_key).first()
            if existing_payment:
                adapter = PaymentAdapterFactory.get_adapter(existing_payment.adapter_type)
                return Response({
                    'payment': PaymentSerializer(existing_payment).data,
                    'replayed': True,
                    'message': 'Idempotent request returning existing payment.'
                })

        # Calculate amount strictly server-side
        bill = getattr(booking, 'bill', None)
        if bill and bill.grand_total > 0:
            total_amount = bill.grand_total
        elif booking.total_contract_value and booking.total_contract_value > 0:
            total_amount = booking.total_contract_value
        else:
            base_price = getattr(booking.service_category, 'base_price', Decimal('250.00')) if booking.service_category else Decimal('250.00')
            total_amount = base_price * Decimal(booking.required_worker_count or 1)

        worker_count = max(1, booking.required_worker_count or 1)
        breakdown = calculate_direct_payment_breakdown(
            amount=total_amount,
            worker_count=worker_count,
            cooperative_rate=COOPERATIVE_RATE_DEFAULT
        )

        adapter_type = request.data.get('adapter_type', 'DIRECT_UPI')
        adapter = PaymentAdapterFactory.get_adapter(adapter_type)

        primary_worker = booking.worker or booking.assigned_workers.first()
        if not primary_worker:
            return Response({"detail": "No worker assigned to receive direct payment."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_number = f"REC-UNN-{booking.id}-{int(time.time())}"

        with transaction.atomic():
            payment, created = Payment.objects.update_or_create(
                booking=booking,
                defaults={
                    'customer': booking.customer,
                    'captain': primary_worker,
                    'direct_recipient': primary_worker,
                    'amount': breakdown['total_customer_paid'],
                    'worker_direct_payout': breakdown['worker_direct_payout'],
                    'cooperative_allocation': breakdown['cooperative_allocation'],
                    'platform_fee': Decimal('0.00'),
                    'platform_escrow_held': False,
                    'currency': 'INR',
                    'receipt_number': receipt_number,
                    'method': 'UPI' if 'UPI' in adapter.adapter_name else 'CASH',
                    'adapter_type': adapter.adapter_name,
                    'is_mock_provider': adapter.is_mock,
                    'worker_upi_id': f"{primary_worker.phone}@upi" if primary_worker.phone else f"worker.{primary_worker.id}@coop.upi",
                    'idempotency_key': idempotency_key or f"idemp_{booking.id}_{int(time.time())}",
                    'status': 'PENDING',
                    'lifecycle_status': 'PAYMENT_INITIATED',
                }
            )

            # Record immutable transaction
            DirectPaymentTransaction.objects.create(
                payment=payment,
                booking=booking,
                transaction_type='CUSTOMER_DIRECT_PAYMENT',
                sender=booking.customer,
                recipient=primary_worker,
                amount=breakdown['total_customer_paid'],
                currency='INR',
                status='INITIATED',
                payment_method=adapter.adapter_name,
                adapter_name=adapter.adapter_name,
                is_mock=adapter.is_mock,
                idempotency_key=payment.idempotency_key,
                metadata={'breakdown': {k: str(v) for k, v in breakdown.items()}}
            )

        adapter_response = adapter.initiate_payment(
            booking=booking,
            amount=breakdown['total_customer_paid'],
            recipient_user=primary_worker,
            idempotency_key=payment.idempotency_key
        )

        return Response({
            'payment': PaymentSerializer(payment).data,
            'adapter_details': adapter_response,
            'breakdown': {k: str(v) for k, v in breakdown.items()}
        }, status=status.HTTP_201_CREATED)


class VerifyDirectPaymentView(views.APIView):
    """
    Verifies direct service-provider payment server-side.
    Validates state machine transitions, records worker payout and cooperative allocation transactions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        payment = get_object_or_404(Payment, booking=booking)

        # State transition validation
        target_state = 'PAYMENT_COMPLETED'
        is_worker = (request.user == booking.worker or booking.assigned_workers.filter(id=request.user.id).exists())
        is_admin = request.user.role == 'admin' or request.user.is_staff
        is_worker_confirmed = is_worker or is_admin

        valid, err = validate_payment_state_transition(
            current_state=payment.lifecycle_status,
            next_state=target_state,
            user_role=request.user.role,
            is_worker_confirmed=is_worker_confirmed
        )
        if not valid:
            return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)

        adapter = PaymentAdapterFactory.get_adapter(payment.adapter_type)
        verify_res = adapter.verify_payment(payment, request.data)

        if not verify_res.get('verified'):
            payment.lifecycle_status = 'PAYMENT_FAILED'
            payment.status = 'FAILED'
            payment.save()
            return Response({"detail": verify_res.get('detail', 'Verification failed.')}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.lifecycle_status = 'PAYMENT_COMPLETED'
            payment.status = 'PAID'
            payment.payment_time = timezone.now()
            if payment.adapter_type == 'DIRECT_CASH':
                payment.cash_confirmation_timestamp = timezone.now()
            payment.save()

            booking.status = 'ready_to_complete'
            booking.save()

            # Record worker payout transaction
            DirectPaymentTransaction.objects.create(
                payment=payment,
                booking=booking,
                transaction_type='WORKER_PAYOUT_SHARE',
                sender=booking.customer,
                recipient=payment.direct_recipient,
                amount=payment.worker_direct_payout,
                currency='INR',
                status='COMPLETED',
                payment_method=payment.adapter_type,
                adapter_name=adapter.adapter_name,
                is_mock=adapter.is_mock,
                metadata={'direct_recipient_id': payment.direct_recipient.id if payment.direct_recipient else None}
            )

            # Record cooperative allocation transaction
            if payment.cooperative_allocation > 0:
                DirectPaymentTransaction.objects.create(
                    payment=payment,
                    booking=booking,
                    transaction_type='COOPERATIVE_ALLOCATION',
                    sender=payment.direct_recipient,
                    recipient=None,
                    amount=payment.cooperative_allocation,
                    currency='INR',
                    status='COMPLETED',
                    payment_method=payment.adapter_type,
                    adapter_name=adapter.adapter_name,
                    is_mock=adapter.is_mock,
                    metadata={'purpose': 'UNNATI Cooperative Member Patronage Dividend Reserve'}
                )

        # Broadcast update
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'payment_completed')

        # Push notification
        create_and_send_notification(
            user=booking.customer,
            title="Payment Confirmed",
            message=f"Direct payment of ₹{payment.amount} to {payment.captain.full_name if payment.captain else 'worker'} confirmed.",
            notification_type="payment"
        )
        if booking.worker:
            create_and_send_notification(
                user=booking.worker,
                title="Payment Received",
                message=f"Direct payout of ₹{payment.worker_direct_payout} confirmed. (Coop reserve: ₹{payment.cooperative_allocation})",
                notification_type="payment"
            )

        return Response(PaymentSerializer(payment).data)


class ProcessDirectRefundView(views.APIView):
    """
    Processes direct provider-side refund and cancellation compensation according to safeguards.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        payment = get_object_or_404(Payment, booking=booking)

        # Authorization: customer, worker or admin
        is_authorized = (
            request.user == booking.customer or
            request.user == booking.worker or
            request.user.role == 'admin'
        )
        if not is_authorized:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if payment.lifecycle_status in ['REFUNDED', 'PAYMENT_CANCELLED']:
            return Response({"detail": "Payment has already been refunded or cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate refund and worker compensation based on booking cancellation stage
        refund_calc = calculate_cancellation_refund(
            total_amount=payment.amount,
            booking_status=booking.status,
            created_at=booking.created_at,
            scheduled_time=booking.scheduled_time
        )

        with transaction.atomic():
            payment.lifecycle_status = 'REFUNDED'
            payment.refund_amount = refund_calc['refund_amount']
            payment.cancellation_compensation = refund_calc['cancellation_compensation']
            payment.refund_reason = request.data.get('reason', refund_calc['reason'])
            payment.save()

            # Record refund transaction
            if refund_calc['refund_amount'] > 0:
                DirectPaymentTransaction.objects.create(
                    payment=payment,
                    booking=booking,
                    transaction_type='REFUND',
                    sender=payment.direct_recipient,
                    recipient=booking.customer,
                    amount=refund_calc['refund_amount'],
                    currency='INR',
                    status='REFUNDED',
                    payment_method=payment.adapter_type,
                    adapter_name=payment.adapter_type,
                    is_mock=payment.is_mock_provider,
                    metadata={'reason': payment.refund_reason}
                )

            # Record compensation transaction if applicable
            if refund_calc['cancellation_compensation'] > 0:
                DirectPaymentTransaction.objects.create(
                    payment=payment,
                    booking=booking,
                    transaction_type='CANCELLATION_COMPENSATION',
                    sender=booking.customer,
                    recipient=payment.direct_recipient,
                    amount=refund_calc['cancellation_compensation'],
                    currency='INR',
                    status='COMPLETED',
                    payment_method=payment.adapter_type,
                    adapter_name=payment.adapter_type,
                    is_mock=payment.is_mock_provider,
                    metadata={'reason': 'Worker dispatch compensation for late cancellation'}
                )

        return Response({
            'payment': PaymentSerializer(payment).data,
            'refund_details': {k: str(v) if isinstance(v, Decimal) else v for k, v in refund_calc.items()}
        })


class PaymentTransactionsView(views.APIView):
    """
    Returns immutable transaction ledger records for a booking.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        is_participant = (
            request.user == booking.customer or
            request.user == booking.worker or
            request.user.role == 'admin' or
            request.user.is_staff or
            booking.assigned_workers.filter(id=request.user.id).exists()
        )
        if not is_participant:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        transactions = DirectPaymentTransaction.objects.filter(booking=booking).order_by('-created_at')
        return Response(DirectPaymentTransactionSerializer(transactions, many=True).data)


class WorkerEarningsSummaryView(views.APIView):
    """
    Returns worker's direct earnings, cooperative dividend accumulations, and zero platform deductions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'worker' and not (request.user.role == 'admin' or request.user.is_staff):
            return Response({"detail": "Access denied. Worker credentials required."}, status=status.HTTP_403_FORBIDDEN)

        worker = request.user
        payments = Payment.objects.filter(
            direct_recipient=worker,
            lifecycle_status='PAYMENT_COMPLETED'
        )

        total_direct_earned = sum((p.worker_direct_payout for p in payments), Decimal('0.00'))
        total_coop_contribution = sum((p.cooperative_allocation for p in payments), Decimal('0.00'))
        total_jobs_completed = payments.count()

        recent_txs = DirectPaymentTransaction.objects.filter(
            recipient=worker
        ).order_by('-created_at')[:20]

        return Response({
            'worker_id': worker.id,
            'worker_name': worker.full_name,
            'total_direct_earned': str(total_direct_earned),
            'total_cooperative_contribution': str(total_coop_contribution),
            'total_platform_fees_deducted': "0.00", # Explicit confirmation: 0.00 platform rake
            'completed_jobs_count': total_jobs_completed,
            'recent_transactions': DirectPaymentTransactionSerializer(recent_txs, many=True).data
        })
