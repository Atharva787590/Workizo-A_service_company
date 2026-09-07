"""
UNNATI Demand Intelligence Aggregation Service
-----------------------------------------------
Aggregates REAL booking records from the PostgreSQL database across:
  - Service Category
  - Geographic Area (City, Pincode)
  - Time window (7 days, 30 days)

Rules:
  - Uses ONLY real booking records.
  - Strictly NEVER synthesizes or manufactures fake demand numbers or heatmaps.
  - If fewer than 3 bookings exist for the requested partition, returns an explicit
    and honest INSUFFICIENT_DATA status without pretending high demand.
"""

from datetime import timedelta
from typing import Dict, Any, Optional
from django.utils import timezone
from django.db.models import Count, Q
from bookings.models import Booking
from services.models import ServiceCategory


MIN_SAMPLE_THRESHOLD = 3


def aggregate_demand_intelligence(
    city: Optional[str] = None,
    category_id: Optional[int] = None,
    days: int = 30
) -> Dict[str, Any]:
    """
    Computes real-data demand metrics aggregated by service category and locality.
    If real booking volume is below threshold, returns an honest empty/insufficient state.
    """
    days = max(1, min(90, int(days or 30)))
    since = timezone.now() - timedelta(days=days)

    qs = Booking.objects.filter(created_at__gte=since)
    if city and city.strip():
        qs = qs.filter(city__iexact=city.strip())
    if category_id:
        qs = qs.filter(service_category_id=category_id)

    total_bookings = qs.count()

    # Honest Insufficient Data Handling
    if total_bookings < MIN_SAMPLE_THRESHOLD:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": (
                f"Insufficient real booking activity ({total_bookings} record(s)) "
                f"in this selection over the last {days} days to compute reliable demand trends."
            ),
            "sample_count": total_bookings,
            "min_required_samples": MIN_SAMPLE_THRESHOLD,
            "filter_city": city or "ALL",
            "filter_days": days,
            "categories": [],
            "hotspots": [],
            "overall_summary": {
                "total_requested": total_bookings,
                "total_completed": qs.filter(status='completed').count(),
                "total_cancelled": qs.filter(status='cancelled').count(),
            }
        }

    # Category-level Real Aggregation
    category_aggregates = qs.values(
        'service_category__id',
        'service_category__name'
    ).annotate(
        total_requests=Count('id'),
        completed_count=Count('id', filter=Q(status='completed')),
        active_count=Count('id', filter=~Q(status__in=['completed', 'cancelled'])),
        cancelled_count=Count('id', filter=Q(status='cancelled'))
    ).order_by('-total_requests')

    category_results = []
    for cat in category_aggregates:
        cid = cat['service_category__id']
        cname = cat['service_category__name'] or 'General'
        treq = cat['total_requests']
        tcomp = cat['completed_count']
        tact = cat['active_count']
        completion_rate = round((tcomp / treq) * 100, 1) if treq > 0 else 0.0

        category_results.append({
            "category_id": cid,
            "category_name": cname,
            "total_requests": treq,
            "completed_count": tcomp,
            "active_count": tact,
            "cancelled_count": cat['cancelled_count'],
            "completion_rate_percent": completion_rate,
            "share_of_demand_percent": round((treq / total_bookings) * 100, 1)
        })

    # Pincode / Locality Hotspots (Real bookings only)
    pincode_aggregates = qs.exclude(pincode__isnull=True).exclude(pincode='').values(
        'pincode',
        'city'
    ).annotate(
        volume=Count('id')
    ).order_by('-volume')[:10]

    hotspots = []
    for p in pincode_aggregates:
        hotspots.append({
            "pincode": p['pincode'],
            "city": p['city'],
            "volume": p['volume']
        })

    return {
        "status": "SUFFICIENT_DATA",
        "message": f"Real-data demand metrics based on {total_bookings} actual bookings over {days} days.",
        "sample_count": total_bookings,
        "filter_city": city or "ALL",
        "filter_days": days,
        "categories": category_results,
        "hotspots": hotspots,
        "overall_summary": {
            "total_requested": total_bookings,
            "total_completed": qs.filter(status='completed').count(),
            "total_cancelled": qs.filter(status='cancelled').count(),
            "total_active": qs.exclude(status__in=['completed', 'cancelled']).count()
        }
    }
