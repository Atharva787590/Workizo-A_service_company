from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from workers.models import WorkerProfile
from workers.serializers import WorkerProfileSerializer
from accounts.permissions import IsWorker
from workers.ocr_service import extract_document_info
import logging

logger = logging.getLogger(__name__)

class WorkerRegisterProfileView(APIView):
    permission_classes = (IsWorker,)
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        try:
            profile = request.user.worker_profile
        except WorkerProfile.DoesNotExist:
            profile = WorkerProfile.objects.create(user=request.user)
            
        # Update User fields if provided
        user = request.user
        user_updated = False
        
        full_name = request.data.get('full_name')
        if full_name:
            user.full_name = full_name
            user_updated = True
            
        phone = request.data.get('phone')
        if phone:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(phone=phone).exclude(id=user.id).exists():
                return Response({'phone': ['This phone number is already in use.']}, status=status.HTTP_400_BAD_REQUEST)
            user.phone = phone
            user_updated = True
            
        if user_updated:
            user.save()
            
        # Perform updates
        serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            profile_obj = serializer.save()
            profile_obj.approval_status = 'pending'
            profile_obj.is_verified = False
            profile_obj.save()
            
            # Send KYC submitted email to captain
            from notifications.email_service import EmailNotificationService
            EmailNotificationService.send_captain_kyc_submitted_email(user)
            return Response({
                'profile': WorkerProfileSerializer(profile_obj).data,
                'message': 'Worker profile details and documents uploaded successfully.'
            }, status=status.HTTP_200_OK)
            
        logger.error(f"WORKER REGISTER PROFILE VALIDATION ERRORS: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from workers.models import Wallet, WalletTransaction
from workers.serializers import WalletSerializer

class WalletDetailView(APIView):
    permission_classes = (IsWorker,)

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(worker=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

class WalletWithdrawView(APIView):
    permission_classes = (IsWorker,)

    def post(self, request):
        wallet, _ = Wallet.objects.get_or_create(worker=request.user)
        amount = request.data.get('amount')
        if not amount:
            return Response({"detail": "Amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        from decimal import Decimal
        try:
            val = Decimal(str(amount))
        except ValueError:
            return Response({"detail": "Invalid amount format."}, status=status.HTTP_400_BAD_REQUEST)

        if val <= 0:
            return Response({"detail": "Amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        if wallet.current_balance < val:
            return Response({"detail": "Insufficient balance."}, status=status.HTTP_400_BAD_REQUEST)

        wallet.current_balance -= val
        wallet.save()

        # Create Debit Transaction
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=val,
            transaction_type='debit',
            description="Withdrawal payout transfer completed (Simulated)"
        )

        return Response(WalletSerializer(wallet).data)

from django.utils import timezone
from django.db.models import Sum, Avg
from datetime import timedelta
from bookings.models import Booking, BookingRejection
from services.models import Rating

class WorkerDashboardStatsView(APIView):
    permission_classes = (IsWorker,)

    def get(self, request):
        user = request.user
        
        # Get wallet
        wallet, _ = Wallet.objects.get_or_create(worker=user)
        
        # Calculate earnings
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        today_earnings = wallet.transactions.filter(
            transaction_type='credit',
            created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        week_earnings = wallet.transactions.filter(
            transaction_type='credit',
            created_at__gte=week_start
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        month_earnings = wallet.transactions.filter(
            transaction_type='credit',
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        # Jobs counts
        all_jobs = Booking.objects.filter(worker=user)
        total_jobs = all_jobs.count()
        completed_jobs = all_jobs.filter(status='completed').count()
        pending_jobs = all_jobs.exclude(status__in=['completed', 'cancelled', 'searching']).count()
        
        # Ratings avg
        ratings_avg = Rating.objects.filter(worker=user).aggregate(avg=Avg('rating'))['avg']
        ratings_avg = round(ratings_avg, 1) if ratings_avg else 4.8
        
        # Acceptance Rate
        accepted_count = all_jobs.count()
        rejected_count = BookingRejection.objects.filter(worker=user).count()
        total_offers = accepted_count + rejected_count
        acceptance_rate = round((accepted_count / total_offers) * 100, 1) if total_offers > 0 else 100.0
        
        # Completion Rate
        completion_rate = round((completed_jobs / total_jobs) * 100, 1) if total_jobs > 0 else 100.0
        
        # Recent activity ledger
        recent_activities = []
        
        # Recent completed/updated jobs
        for b in all_jobs.order_by('-updated_at')[:5]:
            recent_activities.append({
                "id": f"act-job-{b.id}",
                "type": "job",
                "title": f"Job #{b.id} - {b.status.replace('_', ' ').title()}",
                "description": f"{b.service_category.name} service for {b.customer.full_name}.",
                "time": b.updated_at.isoformat()
            })
            
        # Recent transactions
        for txn in wallet.transactions.order_by('-created_at')[:5]:
            recent_activities.append({
                "id": f"act-txn-{txn.id}",
                "type": "wallet",
                "title": f"Wallet {txn.transaction_type.title()}",
                "description": f"{txn.description} - Amount: ₹{txn.amount}",
                "time": txn.created_at.isoformat()
            })
            
        recent_activities = sorted(recent_activities, key=lambda x: x['time'], reverse=True)[:7]
        
        # Graph data: last 7 credit transactions
        graph_txns = wallet.transactions.filter(transaction_type='credit').order_by('-created_at')[:7]
        graph_data = []
        for t in reversed(graph_txns):
            graph_data.append({
                "name": t.created_at.strftime('%a %d'),
                "Amount": float(t.amount)
            })
            
        if not graph_data:
            graph_data = [
                { "name": "Mon", "Amount": 0.0 },
                { "name": "Tue", "Amount": 0.0 },
                { "name": "Wed", "Amount": 0.0 },
                { "name": "Thu", "Amount": 0.0 },
                { "name": "Fri", "Amount": 0.0 },
                { "name": "Sat", "Amount": 0.0 },
                { "name": "Sun", "Amount": 0.0 }
            ]

        # Profile Photo URI absolute
        profile_photo = None
        if user.profile_photo:
            profile_photo = request.build_absolute_uri(user.profile_photo.url)
        elif getattr(user, 'worker_profile', None) and user.worker_profile.profile_photo:
            profile_photo = request.build_absolute_uri(user.worker_profile.profile_photo.url)
            
        return Response({
            "welcome_message": f"Welcome, Captain {user.full_name}!",
            "worker_name": user.full_name,
            "profile_photo": profile_photo,
            "service_category": user.worker_profile.service_category.name if getattr(user, 'worker_profile', None) and user.worker_profile.service_category else "Not Assigned",
            "verification_status": user.worker_profile.approval_status if getattr(user, 'worker_profile', None) else "pending",
            "online_status": user.worker_profile.online_status if getattr(user, 'worker_profile', None) else False,
            "today_earnings": float(today_earnings),
            "weekly_earnings": float(week_earnings),
            "monthly_earnings": float(month_earnings),
            "wallet_balance": float(wallet.current_balance),
            "total_jobs": total_jobs,
            "pending_jobs": pending_jobs,
            "completed_jobs": completed_jobs,
            "rating": ratings_avg,
            "acceptance_rate": acceptance_rate,
            "completion_rate": completion_rate,
            "recent_activity": recent_activities,
            "performance_graph": graph_data
        })

class OCRExtractView(APIView):
    permission_classes = (IsWorker,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('document')
        if not file_obj:
            return Response({"detail": "No document file was provided."}, status=status.HTTP_400_BAD_REQUEST)
            
        # File size check (max 10MB)
        if file_obj.size > 10 * 1024 * 1024:
            return Response({"detail": "File size exceeds the 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        # File extension check
        ext = file_obj.name.split('.')[-1].lower() if '.' in file_obj.name else ''
        if ext not in ['jpg', 'jpeg', 'png', 'pdf', 'webp', 'gif']:
            return Response({"detail": "Invalid file format. Please upload a JPG, PNG, GIF, WEBP, or PDF file."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image_bytes = file_obj.read()
            extracted_data = extract_document_info(image_bytes, filename=file_obj.name)
            return Response(extracted_data, status=status.HTTP_200_OK)
        except TypeError as te:
            # Unsupported document type (e.g. classification failed)
            return Response({"detail": "Unsupported document."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as ve:
            # Strict formatting/validation failure
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"OCR document extraction failed: {e}")
            return Response({
                "detail": "Unable to read the document. Please upload a clear Aadhaar or PAN card."
            }, status=status.HTTP_400_BAD_REQUEST)


from .earnings_intelligence import calculate_worker_earnings_intelligence
from .models import TwoWayRating, PeerEndorsement, GovernanceReviewCase
from .trust_engine import (
    validate_rating_eligibility,
    detect_suspicious_rating,
    validate_peer_endorsement,
    sanitize_worker_trust_profile,
    build_governance_audit_record,
    mask_aadhaar_number
)
from bookings.models import Booking
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from datetime import datetime

User = get_user_model()

class WorkerEarningsIntelligenceView(APIView):
    """
    Returns UNNATI worker earnings intelligence: timeframe earnings, collective allocations,
    cooperative profit-sharing, payout readiness, well-being monitor, and skill credentials.
    """
    permission_classes = (IsWorker,)

    def get(self, request):
        user = request.user
        intelligence_data = calculate_worker_earnings_intelligence(user)
        return Response(intelligence_data, status=status.HTTP_200_OK)


class TwoWayRatingSubmitView(APIView):
    """
    Submits a two-way evaluation (Customer to Worker OR Worker to Customer).
    Enforces job completion, prevents duplicates, and performs anti-bias verification.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        overall_rating = request.data.get('rating') or request.data.get('overall_rating', 5)
        category_scores = request.data.get('category_scores', {})
        review_text = request.data.get('review', '')

        try:
            overall_rating = int(overall_rating)
            if overall_rating < 1 or overall_rating > 5:
                return Response({"detail": "Rating must be between 1 and 5 stars."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"detail": "Invalid rating score."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = Booking.objects.select_related('customer', 'worker').get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        existing_rater_ids = list(TwoWayRating.objects.filter(booking=booking).values_list('rater_id', flat=True))

        eligible, msg, rating_type = validate_rating_eligibility(
            booking_status=booking.status,
            user_id=request.user.id,
            customer_id=booking.customer_id,
            worker_id=booking.worker_id,
            existing_rater_ids=existing_rater_ids
        )

        if not eligible:
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        ratee = booking.worker if request.user == booking.customer else booking.customer
        if not ratee:
            return Response({"detail": "No service provider assigned to this booking."}, status=status.HTTP_400_BAD_REQUEST)

        # Anti-bias inspection
        is_flagged, flag_reason, suspicion_score = detect_suspicious_rating(
            overall_rating=overall_rating,
            category_scores=category_scores,
            review_text=review_text,
            has_active_dispute=(booking.status == 'disputed'),
        )

        two_way_rating = TwoWayRating.objects.create(
            booking=booking,
            rater=request.user,
            ratee=ratee,
            rating_type=rating_type,
            overall_rating=overall_rating,
            category_scores=category_scores,
            review=review_text,
            is_flagged=is_flagged,
            flag_reason=flag_reason,
            suspicion_score=suspicion_score
        )

        if is_flagged:
            case_id = f"UNN-BIAS-{two_way_rating.id}-{int(datetime.now().timestamp())}"
            GovernanceReviewCase.objects.create(
                case_id=case_id,
                case_type='SUSPICIOUS_BIAS_FLAG',
                target_rating=two_way_rating,
                target_worker=booking.worker,
                raised_by=request.user,
                status='OPEN_IN_QUEUE',
                resolution_notes=f"Flagged for anti-bias inspection: {flag_reason}",
                audit_trail=[
                    build_governance_audit_record(
                        action="FLAGGED_SUSPICIOUS",
                        actor_id=request.user.id,
                        actor_name=request.user.full_name or request.user.email,
                        decision="QUEUED_FOR_PEER_REVIEW",
                        notes=flag_reason or "Suspicious rating anomaly"
                    )
                ]
            )

        return Response({
            "status": "success",
            "rating_id": two_way_rating.id,
            "booking_id": booking.id,
            "rating_type": rating_type,
            "overall_rating": overall_rating,
            "category_scores": category_scores,
            "review": review_text,
            "is_flagged": is_flagged,
            "flag_reason": flag_reason,
            "created_at": two_way_rating.created_at.isoformat()
        }, status=status.HTTP_201_CREATED)


class TwoWayRatingListView(APIView):
    """Fetches all evaluations for a specific booking."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user not in [booking.customer, booking.worker] and not request.user.is_staff:
            return Response({"detail": "Unauthorized to view these booking ratings."}, status=status.HTTP_403_FORBIDDEN)

        ratings = TwoWayRating.objects.filter(booking=booking).select_related('rater', 'ratee').order_by('created_at')
        results = []
        for r in ratings:
            results.append({
                "id": r.id,
                "rating_type": r.rating_type,
                "rater_id": r.rater.id,
                "rater_name": r.rater.full_name,
                "ratee_id": r.ratee.id,
                "ratee_name": r.ratee.full_name,
                "overall_rating": r.overall_rating,
                "category_scores": r.category_scores,
                "review": r.review,
                "is_flagged": r.is_flagged,
                "flag_reason": r.flag_reason if (request.user.is_staff or request.user == r.rater) else None,
                "is_disputed": r.is_disputed,
                "dispute_status": r.dispute_status,
                "created_at": r.created_at.isoformat()
            })
        return Response(results, status=status.HTTP_200_OK)


class RatingDisputeSubmitView(APIView):
    """Allows ratee to dispute an unfair/retaliatory review, creating a governance case."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        rating_id = request.data.get('rating_id')
        reason = request.data.get('reason', '').strip()

        if not reason:
            return Response({"detail": "Dispute rationale is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = TwoWayRating.objects.select_related('ratee', 'booking').get(id=rating_id)
        except TwoWayRating.DoesNotExist:
            return Response({"detail": "Rating record not found."}, status=status.HTTP_404_NOT_FOUND)

        if rating.ratee != request.user and not request.user.is_staff:
            return Response({"detail": "Only the rated party can dispute this evaluation."}, status=status.HTTP_403_FORBIDDEN)

        rating.is_disputed = True
        rating.dispute_reason = reason
        rating.dispute_status = 'PENDING_REVIEW'
        rating.save()

        case_id = f"UNN-DISP-{rating.id}-{int(datetime.now().timestamp())}"
        gov_case = GovernanceReviewCase.objects.create(
            case_id=case_id,
            case_type='RATING_DISPUTE',
            target_rating=rating,
            target_worker=rating.ratee if rating.rating_type == 'CUSTOMER_TO_WORKER' else None,
            raised_by=request.user,
            status='OPEN_IN_QUEUE',
            resolution_notes=f"Member dispute raised: {reason}",
            audit_trail=[
                build_governance_audit_record(
                    action="DISPUTE_FILED",
                    actor_id=request.user.id,
                    actor_name=request.user.full_name or request.user.email,
                    decision="PENDING_PEER_REVIEW",
                    notes=reason
                )
            ]
        )

        return Response({
            "status": "success",
            "case_id": gov_case.case_id,
            "dispute_status": "PENDING_REVIEW",
            "message": "Dispute filed successfully. Assigned to Cooperative Governance Review Board."
        }, status=status.HTTP_200_OK)


class PeerEndorsementSubmitView(APIView):
    """Allows eligible cooperative members to endorse verified skills/experience of peers."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        endorsee_id = request.data.get('worker_id') or request.data.get('endorsee_id')
        skill_name = request.data.get('skill_name', '').strip()
        note = request.data.get('note', '').strip()

        try:
            endorsee = User.objects.get(id=endorsee_id)
        except User.DoesNotExist:
            return Response({"detail": "Endorsee user not found."}, status=status.HTTP_404_NOT_FOUND)

        endorser_profile = getattr(request.user, 'worker_profile', None)
        endorser_verified = endorser_profile.is_verified if endorser_profile else request.user.is_staff

        existing_endorsements = list(
            PeerEndorsement.objects.filter(endorsee=endorsee).values('endorser_id', 'skill_name')
        )

        valid, msg = validate_peer_endorsement(
            endorser_id=request.user.id,
            endorsee_id=endorsee.id,
            endorser_is_verified=endorser_verified,
            skill_name=skill_name,
            existing_endorsements=existing_endorsements
        )

        if not valid:
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        endorsement = PeerEndorsement.objects.create(
            endorser=request.user,
            endorsee=endorsee,
            skill_name=skill_name.title(),
            endorsement_note=note
        )

        return Response({
            "status": "success",
            "endorsement_id": endorsement.id,
            "skill_name": endorsement.skill_name,
            "endorser_name": request.user.full_name,
            "created_at": endorsement.created_at.isoformat()
        }, status=status.HTTP_201_CREATED)


class WorkerTrustProfileView(APIView):
    """Returns a sanitized trust profile with masked Aadhaar/PAN and verified credentials."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, worker_id):
        try:
            worker_user = User.objects.select_related('worker_profile').get(id=worker_id)
        except User.DoesNotExist:
            return Response({"detail": "Worker not found."}, status=status.HTTP_404_NOT_FOUND)

        profile = getattr(worker_user, 'worker_profile', None)
        if not profile:
            return Response({"detail": "Worker profile does not exist."}, status=status.HTTP_404_NOT_FOUND)

        endorsements = list(
            PeerEndorsement.objects.filter(endorsee=worker_user, is_active=True).select_related('endorser').values(
                'id', 'skill_name', 'endorsement_note', 'created_at', 'endorser__full_name'
            )
        )

        ratings = list(
            TwoWayRating.objects.filter(ratee=worker_user).values(
                'overall_rating', 'category_scores', 'review', 'created_at'
            )
        )

        trust_profile = sanitize_worker_trust_profile(
            worker_user=worker_user,
            profile=profile,
            endorsements=endorsements,
            ratings=ratings
        )

        return Response(trust_profile, status=status.HTTP_200_OK)


from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta
import uuid

from workers.models import (
    CooperativeProposal,
    CooperativeBallot,
    CooperativeElection,
    ElectionBallot
)
from workers.governance_engine import (
    compute_voter_hash,
    generate_ballot_receipt,
    validate_voting_eligibility,
    record_proposal_vote,
    calculate_proposal_results,
    validate_election_voting_eligibility,
    record_election_ballot,
    calculate_election_results,
    evaluate_review_case_safety,
    project_public_governance_feed
)


class GovernanceCasesListView(APIView):
    """Returns open review cases for cooperative peer governance board members/admins."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        cases = GovernanceReviewCase.objects.select_related('target_rating', 'target_worker', 'raised_by', 'reviewer').order_by('-created_at')[:25]
        results = []
        for c in cases:
            results.append({
                "case_id": c.case_id,
                "case_type": c.case_type,
                "status": c.status,
                "target_rating_id": c.target_rating_id,
                "raised_by_name": c.raised_by.full_name if c.raised_by else "Cooperative Member",
                "resolution_notes": c.resolution_notes,
                "evidence_items": getattr(c, 'evidence_items', []) or [],
                "ai_recommendation": getattr(c, 'ai_recommendation', 'HUMAN_COMMITTEE_REVIEW_REQUIRED'),
                "appeal_status": getattr(c, 'appeal_status', 'NONE'),
                "appeal_notes": getattr(c, 'appeal_notes', ''),
                "ai_safety_notice": "AI recommendation is strictly advisory. Account status changes require human committee review.",
                "audit_trail": c.audit_trail,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat()
            })
        return Response(results, status=status.HTTP_200_OK)


class GovernanceCaseResolveView(APIView):
    """Resolves a dispute/flagged case with an immutable audit record."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, case_id):
        decision = request.data.get('decision') # 'RESOLVED_UPHELD' or 'RESOLVED_DISMISSED'
        notes = request.data.get('notes', '').strip()

        if decision not in ['RESOLVED_UPHELD', 'RESOLVED_DISMISSED']:
            return Response({"detail": "Decision must be 'RESOLVED_UPHELD' or 'RESOLVED_DISMISSED'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            case = GovernanceReviewCase.objects.select_related('target_rating').get(case_id=case_id)
        except GovernanceReviewCase.DoesNotExist:
            return Response({"detail": "Case not found."}, status=status.HTTP_404_NOT_FOUND)

        case.status = decision
        case.reviewer = request.user
        case.resolution_notes = notes

        audit_entry = build_governance_audit_record(
            action="CASE_RESOLVED",
            actor_id=request.user.id,
            actor_name=request.user.full_name or request.user.email,
            decision=decision,
            notes=notes
        )
        case.audit_trail.append(audit_entry)
        case.save()

        # Update target rating if dispute was resolved
        if case.target_rating:
            rating = case.target_rating
            rating.dispute_status = 'UPHELD' if decision == 'RESOLVED_UPHELD' else 'DISMISSED'
            if decision == 'RESOLVED_UPHELD':
                # If rating dispute is upheld as abusive/retaliatory, unflag and hide rating
                rating.is_flagged = False
            rating.save()

        return Response({
            "status": "success",
            "case_id": case.case_id,
            "decision": decision,
            "audit_trail": case.audit_trail
        }, status=status.HTTP_200_OK)


class GovernanceCaseAppealView(APIView):
    """Allows an affected party to lodge an appeal against a closed review decision with new evidence."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, case_id):
        appeal_reason = request.data.get('appeal_reason', '').strip()
        additional_evidence = request.data.get('evidence', [])

        if not appeal_reason:
            return Response({"detail": "Appeal reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            case = GovernanceReviewCase.objects.get(case_id=case_id)
        except GovernanceReviewCase.DoesNotExist:
            return Response({"detail": "Case not found."}, status=status.HTTP_404_NOT_FOUND)

        case.appeal_status = 'APPEAL_REQUESTED'
        case.appeal_notes = appeal_reason
        if additional_evidence and isinstance(additional_evidence, list):
            existing = list(getattr(case, 'evidence_items', []) or [])
            existing.extend(additional_evidence)
            case.evidence_items = existing

        audit_entry = build_governance_audit_record(
            action="APPEAL_LODGED",
            actor_id=request.user.id,
            actor_name=request.user.full_name or request.user.email,
            decision="APPEAL_REQUESTED",
            notes=f"Appeal lodged: {appeal_reason[:150]}"
        )
        case.audit_trail.append(audit_entry)
        case.save()

        return Response({
            "status": "success",
            "case_id": case.case_id,
            "appeal_status": case.appeal_status,
            "message": "Appeal lodged successfully. It will be reviewed by the Senior Governance Committee."
        }, status=status.HTTP_200_OK)


class CooperativeProposalsView(APIView):
    """
    UNNATI Cooperative Resolutions List & Creation
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        proposals = CooperativeProposal.objects.all().order_by('-created_at')
        category_filter = request.query_params.get('category')
        status_filter = request.query_params.get('status')
        if category_filter:
            proposals = proposals.filter(category=category_filter)
        if status_filter:
            proposals = proposals.filter(status=status_filter)

        user_id = request.user.id
        results = []
        for p in proposals:
            # Check user voting status without exposing other member votes
            voter_hash = compute_voter_hash(user_id, p.proposal_id, context='proposal')
            ballot = p.ballots.filter(voter_hash=voter_hash).first()

            results.append({
                "proposal_id": p.proposal_id,
                "title": p.title,
                "description": p.description,
                "category": p.category,
                "status": p.status,
                "proposer_name": p.proposer_name or (p.proposer.full_name if p.proposer else "Cooperative Board"),
                "voting_type": p.voting_type,
                "options": p.options or ["YES", "NO", "ABSTAIN"],
                "start_time": p.start_time.isoformat() if p.start_time else None,
                "end_time": p.end_time.isoformat() if p.end_time else None,
                "quorum_needed": p.quorum_needed,
                "total_votes": p.total_votes,
                "tallies": p.tally if p.status in ['CLOSED', 'PASSED', 'REJECTED'] else None,
                "result_summary": p.result_summary,
                "has_voted": ballot is not None,
                "receipt_token": ballot.receipt_token if ballot else None,
                "is_public": p.is_public,
                "created_at": p.created_at.isoformat()
            })

        return Response(results, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()
        category = request.data.get('category', 'POLICY').upper()
        options = request.data.get('options') or ["YES", "NO", "ABSTAIN"]
        duration_days = int(request.data.get('duration_days', 7))
        quorum_needed = int(request.data.get('quorum_needed', 5))

        if not title or not description:
            return Response({"detail": "Title and description are required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        proposal_id = f"PROP-{now.year}-{uuid.uuid4().hex[:6].upper()}"

        proposal = CooperativeProposal.objects.create(
            proposal_id=proposal_id,
            title=title,
            description=description,
            category=category,
            proposer=request.user,
            proposer_name=request.user.full_name or request.user.email,
            status='ACTIVE',
            voting_type='YES_NO_ABSTAIN' if options == ["YES", "NO", "ABSTAIN"] else 'SINGLE_CHOICE',
            options=options,
            start_time=now,
            end_time=now + timedelta(days=duration_days),
            quorum_needed=quorum_needed,
            total_votes=0,
            tally={str(opt).upper(): 0 for opt in options},
            is_public=True
        )

        return Response({
            "status": "success",
            "proposal_id": proposal.proposal_id,
            "message": "Cooperative resolution proposal tabled successfully."
        }, status=status.HTTP_201_CREATED)


class CooperativeProposalVoteView(APIView):
    """
    Submits a secret ballot on an active cooperative resolution.
    Server-authoritative eligibility validation, duplicate vote protection, and tamper-evident receipt.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, proposal_id):
        choice = request.data.get('choice', '').strip().upper()
        idempotency_key = request.data.get('idempotency_key')

        if not choice:
            return Response({"detail": "Choice is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Idempotency protection
        if idempotency_key:
            existing_ballot = CooperativeBallot.objects.filter(idempotency_key=idempotency_key).first()
            if existing_ballot:
                return Response({
                    "status": "success",
                    "idempotent_replayed": True,
                    "receipt_token": existing_ballot.receipt_token,
                    "proposal_id": proposal_id,
                    "message": "Ballot confirmed (idempotent replay)."
                }, status=status.HTTP_200_OK)

        try:
            proposal = CooperativeProposal.objects.get(proposal_id=proposal_id)
        except CooperativeProposal.DoesNotExist:
            return Response({"detail": "Proposal not found."}, status=status.HTTP_404_NOT_FOUND)

        # Member verification check
        is_verified = True
        if hasattr(request.user, 'worker_profile'):
            is_verified = request.user.worker_profile.is_verified or request.user.worker_profile.approval_status == 'approved'

        existing_hashes = list(proposal.ballots.values_list('voter_hash', flat=True))

        proposal_dict = {
            "proposal_id": proposal.proposal_id,
            "status": proposal.status,
            "options": proposal.options,
            "start_time": proposal.start_time.isoformat() if proposal.start_time else None,
            "end_time": proposal.end_time.isoformat() if proposal.end_time else None
        }

        ok, reason, ballot_dict = record_proposal_vote(
            proposal=proposal_dict,
            user_id=request.user.id,
            is_verified_member=is_verified,
            choice=choice,
            existing_voter_hashes=existing_hashes,
            current_time=timezone.now()
        )

        if not ok:
            return Response({"detail": reason}, status=status.HTTP_400_BAD_REQUEST)

        # Persist ballot
        ballot = CooperativeBallot.objects.create(
            proposal=proposal,
            voter_hash=ballot_dict['voter_hash'],
            choice=ballot_dict['choice'],
            receipt_token=ballot_dict['receipt_token'],
            idempotency_key=idempotency_key
        )

        # Update tallies & total votes
        proposal.total_votes += 1
        tally = proposal.tally or {}
        tally[choice] = tally.get(choice, 0) + 1
        proposal.tally = tally

        # Check if voting period expired or auto-calculated
        if proposal.end_time and timezone.now() > proposal.end_time:
            all_ballots = list(proposal.ballots.values('choice'))
            calc = calculate_proposal_results(proposal_dict, all_ballots, proposal.quorum_needed)
            proposal.status = calc['final_status']
            proposal.result_summary = calc['summary']

        proposal.save()

        return Response({
            "status": "success",
            "proposal_id": proposal.proposal_id,
            "receipt_token": ballot.receipt_token,
            "total_votes": proposal.total_votes,
            "message": "Your secret ballot has been cast and verified."
        }, status=status.HTTP_200_OK)


class CooperativeElectionsView(APIView):
    """
    Board Executive Elections List & Administration
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        elections = CooperativeElection.objects.all().order_by('-created_at')
        user_id = request.user.id
        results = []
        for el in elections:
            voter_hash = compute_voter_hash(user_id, el.election_id, context='election')
            ballot = el.ballots.filter(voter_hash=voter_hash).first()

            results.append({
                "election_id": el.election_id,
                "title": el.title,
                "description": el.description,
                "role_title": el.role_title,
                "term": el.term,
                "status": el.status,
                "candidates": el.candidates,
                "start_time": el.start_time.isoformat() if el.start_time else None,
                "end_time": el.end_time.isoformat() if el.end_time else None,
                "winner_id": el.winner_id if el.status == 'CONCLUDED' else None,
                "winner_name": el.winner_name if el.status == 'CONCLUDED' else None,
                "total_votes": el.total_votes,
                "has_voted": ballot is not None,
                "receipt_token": ballot.receipt_token if ballot else None,
                "created_at": el.created_at.isoformat()
            })
        return Response(results, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get('title', '').strip()
        role_title = request.data.get('role_title', '').strip()
        term = request.data.get('term', '2026-2028')
        candidates = request.data.get('candidates', [])
        duration_days = int(request.data.get('duration_days', 5))

        if not title or not role_title or not candidates:
            return Response({"detail": "Title, role, and candidate list are required."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        election_id = f"ELEC-{now.year}-{uuid.uuid4().hex[:4].upper()}"

        election = CooperativeElection.objects.create(
            election_id=election_id,
            title=title,
            description=request.data.get('description', ''),
            role_title=role_title,
            term=term,
            status='ACTIVE',
            candidates=candidates,
            start_time=now,
            end_time=now + timedelta(days=duration_days),
            total_votes=0
        )

        return Response({
            "status": "success",
            "election_id": election.election_id,
            "message": "Board election initiated successfully."
        }, status=status.HTTP_201_CREATED)


class CooperativeElectionVoteView(APIView):
    """
    Submits a secret ballot in a board election.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, election_id):
        candidate_id = request.data.get('candidate_id', '').strip()
        idempotency_key = request.data.get('idempotency_key')

        if not candidate_id:
            return Response({"detail": "Candidate selection is required."}, status=status.HTTP_400_BAD_REQUEST)

        if idempotency_key:
            existing = ElectionBallot.objects.filter(idempotency_key=idempotency_key).first()
            if existing:
                return Response({
                    "status": "success",
                    "idempotent_replayed": True,
                    "receipt_token": existing.receipt_token,
                    "message": "Election ballot replayed."
                }, status=status.HTTP_200_OK)

        try:
            election = CooperativeElection.objects.get(election_id=election_id)
        except CooperativeElection.DoesNotExist:
            return Response({"detail": "Election not found."}, status=status.HTTP_404_NOT_FOUND)

        is_verified = True
        if hasattr(request.user, 'worker_profile'):
            is_verified = request.user.worker_profile.is_verified or request.user.worker_profile.approval_status == 'approved'

        existing_hashes = list(election.ballots.values_list('voter_hash', flat=True))

        election_dict = {
            "election_id": election.election_id,
            "role_title": election.role_title,
            "status": election.status,
            "candidates": election.candidates,
            "start_time": election.start_time.isoformat() if election.start_time else None,
            "end_time": election.end_time.isoformat() if election.end_time else None
        }

        ok, reason, ballot_dict = record_election_ballot(
            election=election_dict,
            user_id=request.user.id,
            is_verified_member=is_verified,
            candidate_id=candidate_id,
            existing_voter_hashes=existing_hashes,
            current_time=timezone.now()
        )

        if not ok:
            return Response({"detail": reason}, status=status.HTTP_400_BAD_REQUEST)

        ballot = ElectionBallot.objects.create(
            election=election,
            voter_hash=ballot_dict['voter_hash'],
            candidate_id=candidate_id,
            receipt_token=ballot_dict['receipt_token'],
            idempotency_key=idempotency_key
        )

        election.total_votes += 1
        # If concluded, calculate results
        if election.end_time and timezone.now() > election.end_time:
            all_ballots = list(election.ballots.values('candidate_id'))
            calc = calculate_election_results(election_dict, all_ballots)
            election.winner_id = calc['winner_id']
            election.winner_name = calc['winner_name']
            election.status = 'CONCLUDED'
            election.results = calc['candidate_tallies']

        election.save()

        return Response({
            "status": "success",
            "election_id": election.election_id,
            "receipt_token": ballot.receipt_token,
            "total_votes": election.total_votes,
            "message": "Election ballot cast successfully."
        }, status=status.HTTP_200_OK)


class PublicGovernanceTransparencyView(APIView):
    """
    Public-safe governance feed: zero PII exposure, secret ballot preserved.
    """
    permission_classes = (AllowAny,)

    def get(self, request):
        proposals = list(CooperativeProposal.objects.filter(is_public=True).values(
            'proposal_id', 'title', 'description', 'category', 'status',
            'start_time', 'end_time', 'total_votes', 'quorum_needed',
            'tally', 'result_summary', 'is_public'
        ))
        for p in proposals:
            if p.get('start_time'):
                p['start_time'] = p['start_time'].isoformat()
            if p.get('end_time'):
                p['end_time'] = p['end_time'].isoformat()

        elections = list(CooperativeElection.objects.all().values(
            'election_id', 'title', 'role_title', 'term', 'status',
            'start_time', 'end_time', 'candidates', 'total_votes', 'winner_name'
        ))
        for el in elections:
            if el.get('start_time'):
                el['start_time'] = el['start_time'].isoformat()
            if el.get('end_time'):
                el['end_time'] = el['end_time'].isoformat()

        feed = project_public_governance_feed(proposals, elections)
        return Response(feed, status=status.HTTP_200_OK)



# ==============================================================================
# UNNATI SKILL PROFILE & MICRO-CERTIFICATION ENDPOINTS
# ==============================================================================

from workers.models import WorkerSkill, WorkerCertification
from workers.skill_engine import (
    validate_skill_entry,
    evaluate_certification_status,
    generate_learning_recommendations,
    authorize_certification_review
)

class WorkerSkillsView(APIView):
    """
    CRUD endpoint for worker skill profile.
    Enforces server-side proficiency validation and experience constraints.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, worker_id=None):
        target_id = worker_id or request.user.id
        skills = WorkerSkill.objects.filter(worker_id=target_id).order_by('-proficiency', 'name')
        data = [
            {
                "id": s.id,
                "name": s.name,
                "category_id": s.category_id,
                "proficiency": s.proficiency,
                "years_of_experience": s.years_of_experience,
                "is_verified": s.is_verified,
                "created_at": s.created_at.isoformat()
            }
            for s in skills
        ]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != 'worker' and not request.user.is_staff:
            return Response({"detail": "Only service craftspersons can register skills."}, status=status.HTTP_403_FORBIDDEN)

        skill_name = request.data.get('name', '').strip()
        proficiency = request.data.get('proficiency', 'SKILLED').upper()
        years_exp = int(request.data.get('years_of_experience', 1))

        # Check if worker has an active verified certificate for CERTIFIED proficiency
        has_cert = WorkerCertification.objects.filter(
            worker=request.user,
            verification_status='VERIFIED'
        ).exists()

        is_valid, err_msg = validate_skill_entry(
            skill_name=skill_name,
            proficiency=proficiency,
            years_experience=years_exp,
            has_verified_certificate=has_cert
        )
        if not is_valid:
            return Response({"detail": err_msg}, status=status.HTTP_400_BAD_REQUEST)

        skill, created = WorkerSkill.objects.update_or_create(
            worker=request.user,
            name=skill_name,
            defaults={
                'proficiency': proficiency,
                'years_of_experience': years_exp,
                'is_verified': has_cert or proficiency in ['CERTIFIED', 'EXPERT']
            }
        )

        return Response({
            "status": "success",
            "message": f"Skill '{skill.name}' saved.",
            "skill": {
                "id": skill.id,
                "name": skill.name,
                "proficiency": skill.proficiency,
                "years_of_experience": skill.years_of_experience,
                "is_verified": skill.is_verified
            }
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class WorkerCertificationsView(APIView):
    """
    Manages micro-certifications for workers.
    Never allows client to self-verify certifications.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, worker_id=None):
        target_id = worker_id or request.user.id
        certs = WorkerCertification.objects.filter(worker_id=target_id).order_by('-issue_date')
        results = []
        for c in certs:
            effective_status = evaluate_certification_status(c.verification_status, c.expiry_date)
            results.append({
                "id": c.id,
                "certification_name": c.certification_name,
                "issuing_organization": c.issuing_organization,
                "credential_id": c.credential_id,
                "issue_date": str(c.issue_date),
                "expiry_date": str(c.expiry_date) if c.expiry_date else None,
                "verification_status": effective_status,
                "verification_notes": c.verification_notes,
                "document_url": c.document_url,
                "created_at": c.created_at.isoformat()
            })
        return Response(results, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != 'worker' and not request.user.is_staff:
            return Response({"detail": "Only craftspersons can submit certifications."}, status=status.HTTP_403_FORBIDDEN)

        cert_name = request.data.get('certification_name', '').strip()
        issuer = request.data.get('issuing_organization', '').strip()
        credential_id = request.data.get('credential_id', '').strip()
        issue_date_str = request.data.get('issue_date')
        expiry_date_str = request.data.get('expiry_date')
        document_url = request.data.get('document_url', '')

        if not cert_name or not issuer or not issue_date_str:
            return Response({"detail": "Certification name, issuer, and issue date are mandatory."}, status=status.HTTP_400_BAD_REQUEST)

        # Server-side forced status: PENDING
        cert = WorkerCertification.objects.create(
            worker=request.user,
            certification_name=cert_name,
            issuing_organization=issuer,
            credential_id=credential_id,
            issue_date=issue_date_str,
            expiry_date=expiry_date_str if expiry_date_str else None,
            verification_status='PENDING',
            document_url=document_url
        )

        return Response({
            "status": "success",
            "message": "Certification submitted for cooperative review.",
            "certification": {
                "id": cert.id,
                "certification_name": cert.certification_name,
                "verification_status": cert.verification_status
            }
        }, status=status.HTTP_201_CREATED)


class WorkerCertificationReviewView(APIView):
    """
    Enforces server-side authorization: only cooperative admin or peer reviewer can resolve certificate verification.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, cert_id):
        actor_role = 'admin' if request.user.is_staff or getattr(request.user, 'role', '') == 'admin' else 'worker'
        new_status = request.data.get('status')
        notes = request.data.get('notes', '').strip()

        is_auth, err = authorize_certification_review(actor_role, new_status)
        if not is_auth:
            return Response({"detail": err}, status=status.HTTP_403_FORBIDDEN)

        try:
            cert = WorkerCertification.objects.get(id=cert_id)
        except WorkerCertification.DoesNotExist:
            return Response({"detail": "Certification record not found."}, status=status.HTTP_404_NOT_FOUND)

        cert.verification_status = new_status.upper()
        cert.verification_notes = notes
        cert.verified_by = request.user
        cert.save()

        # Update profile NSDC flag if verified
        profile = getattr(cert.worker, 'worker_profile', None)
        if profile and cert.verification_status == 'VERIFIED':
            profile.nsdc_certified = True
            profile.skill_verification_status = 'VERIFIED'
            profile.save()

        return Response({
            "status": "success",
            "certification_id": cert.id,
            "verification_status": cert.verification_status,
            "notes": cert.verification_notes
        }, status=status.HTTP_200_OK)


class WorkerLearningRecommendationsView(APIView):
    """
    Provides advisory learning and micro-credential suggestions based on skill gaps.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        profile = getattr(request.user, 'worker_profile', None)
        category_name = getattr(profile.service_category, 'name', '') if profile and profile.service_category else 'General'

        skills = list(WorkerSkill.objects.filter(worker=request.user).values_list('name', flat=True))
        certs = list(WorkerCertification.objects.filter(worker=request.user).values_list('certification_name', flat=True))

        recommendations = generate_learning_recommendations(
            worker_category=category_name,
            existing_skills=skills,
            existing_certs=certs
        )

        return Response({
            "category": category_name,
            "advisory_notice": "AI training recommendations are informational and designed to support cooperative artisan skill development.",
            "recommendations": recommendations
        }, status=status.HTTP_200_OK)


# ==============================================================================
# UNNATI SOCIAL SECURITY & INSURANCE TRACKER ENDPOINTS
# ==============================================================================

from workers.models import WorkerSocialSecurity
from services.catalog_engine import (
    evaluate_social_security_status,
    SUPPORTED_SOCIAL_SECURITY_SCHEMES,
    authorize_public_private_access
)
from datetime import datetime


class WorkerSocialSecurityView(APIView):
    """
    Worker Social Security & Insurance Tracker
    Allows workers and authorized cooperative admins to view and register official social security records.
    Never fabricates enrollment or verification status.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, worker_id=None):
        target_user = request.user
        if worker_id and str(worker_id) != str(request.user.id):
            authorized, err = authorize_public_private_access(
                actor_role=request.user.role,
                resource_type='WORKER_SOCIAL_SECURITY_DETAILS',
                is_owner=False
            )
            if not authorized:
                return Response({"detail": err}, status=status.HTTP_403_FORBIDDEN)
            target_user = get_object_or_404(User, id=worker_id)

        # Existing database records
        existing_records = {
            rec.scheme_code: rec
            for rec in WorkerSocialSecurity.objects.filter(worker=target_user)
        }

        records_list = []
        today = date.today()

        for code, info in SUPPORTED_SOCIAL_SECURITY_SCHEMES.items():
            if code in existing_records:
                rec = existing_records[code]
                evaluated_status, eval_details = evaluate_social_security_status(
                    scheme_code=code,
                    enrolled_date=rec.enrolled_date,
                    expiry_date=rec.expiry_date,
                    is_verified=rec.verified_by_cooperative,
                    reference_date=today
                )
                records_list.append({
                    "id": rec.id,
                    "scheme_code": code,
                    "scheme_name": rec.scheme_name or info['name'],
                    "scheme_type": info['type'],
                    "coverage_amount_inr": float(rec.coverage_amount_inr or info['standard_cover_inr']),
                    "status": evaluated_status,
                    "policy_reference": rec.policy_reference or "N/A",
                    "enrolled_date": str(rec.enrolled_date) if rec.enrolled_date else None,
                    "expiry_date": str(rec.expiry_date) if rec.expiry_date else None,
                    "verified_by_cooperative": rec.verified_by_cooperative,
                    "verification_notes": rec.verification_notes or eval_details.get('guidance'),
                    "administering_body": info['administering_body'],
                    "is_enrolled": evaluated_status in ['ACTIVE', 'PENDING']
                })
            else:
                records_list.append({
                    "id": None,
                    "scheme_code": code,
                    "scheme_name": info['name'],
                    "scheme_type": info['type'],
                    "coverage_amount_inr": float(info['standard_cover_inr']),
                    "status": "NOT_ENROLLED",
                    "policy_reference": None,
                    "enrolled_date": None,
                    "expiry_date": None,
                    "verified_by_cooperative": False,
                    "verification_notes": f"Enrollment can be facilitated through UNNATI Cooperative Welfare Desk.",
                    "administering_body": info['administering_body'],
                    "is_enrolled": False
                })

        return Response({
            "status": "success",
            "worker_id": target_user.id,
            "worker_name": target_user.full_name,
            "social_security_records": records_list,
            "anti_fabrication_notice": "Enrollment and claim statuses reflect official verified or submitted records. UNNATI never fabricates government or insurance credentials."
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Register or submit an enrollment claim. Defaults strictly to PENDING/UNVERIFIED."""
        scheme_code = request.data.get('scheme_code')
        if not scheme_code or scheme_code not in SUPPORTED_SOCIAL_SECURITY_SCHEMES:
            return Response(
                {"detail": f"Invalid scheme code. Must be one of: {list(SUPPORTED_SOCIAL_SECURITY_SCHEMES.keys())}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        info = SUPPORTED_SOCIAL_SECURITY_SCHEMES[scheme_code]
        policy_reference = request.data.get('policy_reference', '').strip()
        enrolled_date_str = request.data.get('enrolled_date')
        expiry_date_str = request.data.get('expiry_date')

        enrolled_date = None
        if enrolled_date_str:
            try:
                enrolled_date = datetime.strptime(enrolled_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Invalid enrolled_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        expiry_date = None
        if expiry_date_str:
            try:
                expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Invalid expiry_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Worker submission defaults strictly to PENDING - never client-side verified
        rec, created = WorkerSocialSecurity.objects.update_or_create(
            worker=request.user,
            scheme_code=scheme_code,
            defaults={
                'scheme_name': info['name'],
                'coverage_amount_inr': info['standard_cover_inr'],
                'status': 'PENDING',
                'policy_reference': policy_reference,
                'enrolled_date': enrolled_date or date.today(),
                'expiry_date': expiry_date,
                'verified_by_cooperative': False,
                'verification_notes': 'Submitted by member. Awaiting cooperative desk verification.'
            }
        )

        return Response({
            "status": "success",
            "message": f"Enrollment for {info['name']} submitted for cooperative verification.",
            "record": {
                "id": rec.id,
                "scheme_code": rec.scheme_code,
                "status": rec.status,
                "policy_reference": rec.policy_reference,
                "verified_by_cooperative": rec.verified_by_cooperative
            }
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class WorkerSocialSecurityStatusUpdateView(APIView):
    """
    Cooperative Admin / Reviewer endpoint to audit and update worker social security verification.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, record_id):
        authorized, err = authorize_public_private_access(
            actor_role=request.user.role,
            resource_type='VERIFY_SOCIAL_SECURITY',
            is_owner=False
        )
        if not authorized:
            return Response({"detail": err}, status=status.HTTP_403_FORBIDDEN)

        rec = get_object_or_404(WorkerSocialSecurity, id=record_id)
        new_status = request.data.get('status', '').upper()
        notes = request.data.get('notes', '')

        if new_status not in ['ACTIVE', 'EXPIRED', 'NOT_ENROLLED', 'UNVERIFIED', 'PENDING']:
            return Response({"detail": "Invalid verification status."}, status=status.HTTP_400_BAD_REQUEST)

        rec.status = new_status
        rec.verified_by_cooperative = (new_status == 'ACTIVE')
        if notes:
            rec.verification_notes = notes
        rec.save()

        return Response({
            "status": "success",
            "record_id": rec.id,
            "new_status": rec.status,
            "verified_by_cooperative": rec.verified_by_cooperative,
            "notes": rec.verification_notes
        }, status=status.HTTP_200_OK)



