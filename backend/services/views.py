from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from services.models import ServiceCategory, Rating
from services.serializers import ServiceCategorySerializer
from bookings.models import Booking

class ListServiceCategoriesView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        categories = ServiceCategory.objects.all().order_by('name')
        serializer = ServiceCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SubmitRatingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        rating_value = request.data.get('rating')
        review_text = request.data.get('review', '')

        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "You cannot rate this booking."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'completed':
            return Response({"detail": "You can only rate completed services."}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(booking, 'rating'):
            return Response({"detail": "This service has already been rated."}, status=status.HTTP_400_BAD_REQUEST)

        rating = Rating.objects.create(
            booking=booking,
            customer=request.user,
            worker=booking.worker,
            rating=rating_value,
            review=review_text
        )

        try:
            from workers.models import TwoWayRating
            TwoWayRating.objects.get_or_create(
                booking=booking,
                rater=request.user,
                defaults={
                    "ratee": booking.worker,
                    "rating_type": "CUSTOMER_TO_WORKER",
                    "overall_rating": int(rating_value),
                    "review": review_text
                }
            )
        except Exception:
            pass

        return Response({
            "status": "success",
            "rating": rating_value,
            "review": review_text
        }, status=status.HTTP_201_CREATED)


from services.catalog_engine import (
    search_and_filter_catalog,
    sanitize_public_provider_profile,
    filter_eligible_providers,
    calculate_transparency_metrics,
    DEFAULT_CATALOG_ITEMS,
    ESTIMATED_PRICING_DISCLAIMER
)
from workers.models import WorkerProfile
from billing.models import Payment


class ServiceCatalogListView(APIView):
    """
    Public Service Catalog Listing
    Supports search query (?q=), category (?category=), duration, and restricted filtering.
    Always includes transparent pricing guidance and disclaimers. Usable without authentication.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        query = request.query_params.get('q', '')
        category = request.query_params.get('category', '')
        max_duration = request.query_params.get('max_duration')
        is_restricted = request.query_params.get('is_restricted')

        max_dur_int = None
        if max_duration:
            try:
                max_dur_int = int(max_duration)
            except ValueError:
                pass

        is_restr_bool = None
        if is_restricted is not None:
            is_restr_bool = is_restricted.lower() in ('true', '1')

        results = search_and_filter_catalog(
            query=query,
            category_name=category,
            max_duration=max_dur_int,
            is_restricted=is_restr_bool
        )

        return Response({
            'status': 'success',
            'count': len(results),
            'pricing_disclaimer': ESTIMATED_PRICING_DISCLAIMER,
            'results': results
        }, status=status.HTTP_200_OK)


class ServiceCatalogDetailView(APIView):
    """
    Public Service Catalog Detail
    Provides detailed trade scope, typical duration, transparent pricing breakdown, and nearby providers.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request, pk):
        items = [item for item in DEFAULT_CATALOG_ITEMS if str(item['id']) == str(pk) or item.get('slug') == str(pk)]
        if not items:
            return Response({'error': 'Service item not found in catalog.'}, status=status.HTTP_404_NOT_FOUND)

        item = dict(items[0])
        item['pricing_disclaimer'] = ESTIMATED_PRICING_DISCLAIMER
        item['is_estimated_pricing'] = True

        # Provide a sanitized list of eligible nearby providers
        raw_workers = []
        try:
            category_name = item['category']
            matching_workers = WorkerProfile.objects.filter(
                service_category__name__iexact=category_name,
                approval_status='approved'
            ).select_related('user', 'service_category')[:10]

            from django.db.models import Avg
            for w in matching_workers:
                ratings_qs = w.user.received_ratings.filter(is_hidden=False)
                r_count = ratings_qs.count()
                avg_val = ratings_qs.aggregate(Avg('rating'))['rating__avg']
                real_rating = round(float(avg_val), 2) if avg_val else None

                raw_workers.append({
                    'id': w.user_id,
                    'full_name': w.user.full_name or 'Verified Craftsman',
                    'service_category': category_name,
                    'city': w.city or 'Ahmedabad',
                    'state': w.state or 'Gujarat',
                    'experience': w.experience,
                    'is_verified': w.is_verified,
                    'guild_tier': 'Master Craftsman' if w.experience >= 5 else 'Skilled Member',
                    'verified_skills': [s.name for s in w.user.worker_skills.filter(is_verified=True)],
                    'verified_certifications_count': w.user.certifications.filter(verification_status='VERIFIED').count(),
                    'rating': real_rating,
                    'review_count': r_count,
                    'online_status': w.online_status
                })
        except Exception:
            pass

        eligible, _ = filter_eligible_providers(raw_workers, item) if raw_workers else ([], None)
        item['eligible_providers_preview'] = eligible

        return Response({
            'status': 'success',
            'service': item
        }, status=status.HTTP_200_OK)


class ServiceProviderDiscoveryView(APIView):
    """
    Public Service Provider Discovery
    Lists verified, eligible providers for a trade or service without exposing any sensitive PII.
    Never synthesizes fake or fabricated worker profiles.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        service_id = request.query_params.get('service_id')
        category = request.query_params.get('category', '')
        city = request.query_params.get('city', '')

        target_service = None
        if service_id:
            matched = [it for it in DEFAULT_CATALOG_ITEMS if str(it['id']) == str(service_id)]
            if matched:
                target_service = matched[0]
                category = target_service['category']

        raw_workers = []
        try:
            from django.db.models import Avg
            qs = WorkerProfile.objects.filter(approval_status='approved')
            if category and category.lower() != 'all':
                qs = qs.filter(service_category__name__iexact=category)
            if city:
                qs = qs.filter(city__icontains=city)

            for w in qs.select_related('user', 'service_category')[:25]:
                ratings_qs = w.user.received_ratings.filter(is_hidden=False)
                r_count = ratings_qs.count()
                avg_val = ratings_qs.aggregate(Avg('rating'))['rating__avg']
                real_rating = round(float(avg_val), 2) if avg_val else None

                raw_workers.append({
                    'id': w.user_id,
                    'full_name': w.user.full_name or 'Verified Craftsman',
                    'service_category': w.service_category.name if w.service_category else 'General',
                    'city': w.city or 'Ahmedabad',
                    'state': w.state or 'Gujarat',
                    'experience': w.experience,
                    'is_verified': w.is_verified,
                    'guild_tier': 'Master Craftsman' if w.experience >= 5 else 'Skilled Member',
                    'verified_skills': [s.name for s in w.user.worker_skills.filter(is_verified=True)],
                    'verified_certifications_count': w.user.certifications.filter(verification_status='VERIFIED').count(),
                    'rating': real_rating,
                    'review_count': r_count,
                    'online_status': w.online_status
                })
        except Exception:
            pass

        if not raw_workers:
            return Response({
                'status': 'success',
                'count': 0,
                'providers': [],
                'message': 'No verified cooperative service providers found matching criteria.'
            }, status=status.HTTP_200_OK)

        if target_service:
            eligible, _ = filter_eligible_providers(raw_workers, target_service)
        else:
            eligible = [sanitize_public_provider_profile(w) for w in raw_workers]

        return Response({
            'status': 'success',
            'count': len(eligible),
            'providers': eligible
        }, status=status.HTTP_200_OK)


class TransparencyMetricsView(APIView):
    """
    Public Cooperative Transparency Metrics
    Provides aggregate community statistics with zero individual financial record leakage.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        metrics = calculate_transparency_metrics()
        return Response({
            'status': 'success',
            'metrics': metrics
        }, status=status.HTTP_200_OK)


class TransparencyPoliciesView(APIView):
    """
    Public Cooperative Transparency Policies
    Discloses structural architecture, fair pricing formula, 0% platform commission, and governance rules.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        policies = {
            'cooperative_structure': {
                'title': '100% Worker-Owned Cooperative Guild',
                'description': 'UNNATI operates as a cooperative society under the Multi-State Co-operative Societies Act. Every verified service provider is a share-holding member with democratic voting rights in platform decisions.',
            },
            'direct_payment_model': {
                'title': 'Direct Customer-to-Worker Settlement (Zero Middleman)',
                'description': 'Customer payments are made directly to the service provider via UPI or cash upon completion. UNNATI holds strictly 0.00 platform escrow and never intercepts worker funds.',
            },
            'fair_wage_formula': {
                'title': 'Transparent Algorithmic Fair-Wage Pricing',
                'formula': 'Final Price = Base Labor Rate + (Duration * Time Rate) + Skill Tier Allowance + Travel Distance Coefficient',
                'description': 'No surge pricing. No predatory discounts. Every rupee in the breakdown is visible to both customer and provider.',
            },
            'cooperative_dividend': {
                'title': 'Cooperative Welfare & Patronage Reserve',
                'description': 'A democratic 6.5% cooperative contribution is allocated from completed service contracts. 100% of this fund is retained for emergency medical relief, accident insurance, and member patronage dividends.',
            },
            'booking_cancellation_rules': {
                'title': 'Cancellation & Travel Compensation Safeguards',
                'description': 'Free cancellation within the initial grace period or prior to worker dispatch. If cancelled after technician arrival, fair travel compensation is paid to respect the worker\'s transit time.',
            },
            'verification_methodology': {
                'title': 'Multi-Tier Trust & Verification',
                'tiers': [
                    'Identity & Contact Verification',
                    'Background & Trade History Review',
                    'Vocational Skill & Certification Assessment',
                    'Peer Guild Endorsements by Senior Cooperative Craftsmen'
                ]
            }
        }
        return Response({
            'status': 'success',
            'policies': policies
        }, status=status.HTTP_200_OK)
