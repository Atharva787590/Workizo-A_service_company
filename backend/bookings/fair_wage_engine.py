"""
UNNATI Dynamic Fair-Wage Engine
--------------------------------
Deterministic, server-side fair-wage and pricing calculations.
Uses only available, explainable inputs:
  - Service category / skill level
  - Estimated service duration
  - Travel distance (where available)
  - Hazard / complexity modifier (where supported)
  - Cooperative platform reserve rules (transparent 6.5% welfare pool)
  - Collective multi-worker allocations

Rules:
  - Never invents market prices.
  - Never claims live market intelligence unless backed by actual data.
  - Returns an explainable itemized breakdown to the customer and worker.
  - If a required input is missing, uses a documented neutral default value.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any, Optional, List


# Standard Skill Tier Multipliers based on vocational credential / guild level
SKILL_TIER_MULTIPLIERS = {
    'BEGINNER': Decimal('1.00'),
    'SKILLED': Decimal('1.10'),
    'CERTIFIED': Decimal('1.20'),
    'EXPERT': Decimal('1.35'),
}

# Standard Hazard / Technical Complexity Allowances in INR
HAZARD_COMPLEXITY_ALLOWANCES = {
    'STANDARD': Decimal('0.00'),
    'MODERATE': Decimal('50.00'),   # E.g. Working at moderate height or wet plumbing lines
    'HIGH': Decimal('100.00'),      # E.g. High-voltage distribution, exterior roof lines, heavy machinery
}

# Documented neutral defaults
DEFAULT_BASE_LABOUR_CHARGE = Decimal('250.00')
DEFAULT_ESTIMATED_DURATION_MINUTES = 60
DEFAULT_SKILL_TIER = 'SKILLED'
DEFAULT_HAZARD_LEVEL = 'STANDARD'
COOPERATIVE_RESERVE_RATE = Decimal('0.065') # 6.5% transparent cooperative welfare & dividend reserve
TRAVEL_BASE_RADIUS_KM = Decimal('5.0')
TRAVEL_RATE_PER_KM_BEYOND_BASE = Decimal('15.00')
DISCLAIMER_TEXT = (
    "Advisory fair-wage estimate calculated according to UNNATI cooperative labor standards. "
    "Platform commission is strictly 0%. The 6.5% cooperative allocation directly funds emergency "
    "medical relief, accident insurance, and year-end member patronage dividends."
)


def calculate_fair_wage(
    base_charge: Optional[Decimal] = None,
    duration_minutes: Optional[int] = None,
    skill_tier: Optional[str] = None,
    travel_distance_km: Optional[float] = None,
    hazard_level: Optional[str] = None,
    required_worker_count: int = 1,
    category_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Computes a deterministic, explainable fair wage quote.
    All calculations use Decimal arithmetic to prevent floating-point rounding errors.
    """
    # 1. Normalize and resolve inputs to documented neutral defaults if unavailable
    base_rate = Decimal(str(base_charge)) if base_charge and base_charge > 0 else DEFAULT_BASE_LABOUR_CHARGE
    duration = int(duration_minutes) if duration_minutes and duration_minutes > 0 else DEFAULT_ESTIMATED_DURATION_MINUTES
    tier = (skill_tier or DEFAULT_SKILL_TIER).upper()
    if tier not in SKILL_TIER_MULTIPLIERS:
        tier = DEFAULT_SKILL_TIER
    
    hazard = (hazard_level or DEFAULT_HAZARD_LEVEL).upper()
    if hazard not in HAZARD_COMPLEXITY_ALLOWANCES:
        hazard = DEFAULT_HAZARD_LEVEL

    worker_count = max(1, min(10, int(required_worker_count or 1)))

    # 2. Base Labor Calculation (per worker)
    base_labor = (base_rate * Decimal(str(worker_count))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    # 3. Duration Adjustment
    # 60 mins included in base. Each additional 30-minute block adds 25% of the base rate.
    duration_adjustment = Decimal('0.00')
    if duration > 60:
        extra_blocks = Decimal(str((duration - 60) // 30))
        duration_adjustment = (extra_blocks * (base_rate * Decimal('0.25')) * Decimal(str(worker_count))).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

    # 4. Skill Tier Adjustment
    multiplier = SKILL_TIER_MULTIPLIERS[tier]
    skill_adjustment = (base_labor * (multiplier - Decimal('1.00'))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    # 5. Travel Transit Allowance
    travel_allowance = Decimal('0.00')
    dist_km = Decimal('0.0')
    if travel_distance_km is not None and travel_distance_km > 0:
        dist_km = Decimal(str(round(travel_distance_km, 1)))
        if dist_km > TRAVEL_BASE_RADIUS_KM:
            billable_distance = dist_km - TRAVEL_BASE_RADIUS_KM
            travel_allowance = (billable_distance * TRAVEL_RATE_PER_KM_BEYOND_BASE).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )

    # 6. Hazard / Complexity Allowance
    hazard_fee = HAZARD_COMPLEXITY_ALLOWANCES[hazard]
    hazard_allowance = (hazard_fee * Decimal(str(worker_count))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    # 7. Subtotal & Cooperative Breakdown
    customer_total = (
        base_labor + duration_adjustment + skill_adjustment + travel_allowance + hazard_allowance
    ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    cooperative_reserve = (customer_total * COOPERATIVE_RESERVE_RATE).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )
    worker_earning = (customer_total - cooperative_reserve).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP
    )

    # 8. Human-readable explainable line items for UI
    explanation: List[Dict[str, str]] = [
        {
            "label": "Base Cooperative Labor",
            "amount": f"₹{base_labor}",
            "detail": f"Standard cooperative floor rate for {worker_count} worker(s)"
        }
    ]

    if duration_adjustment > Decimal('0.00'):
        explanation.append({
            "label": f"Duration Tier ({duration} min)",
            "amount": f"+₹{duration_adjustment}",
            "detail": f"Estimated duration exceeding 60 minutes"
        })

    if skill_adjustment > Decimal('0.00'):
        explanation.append({
            "label": f"Skill Level Allowance ({tier.title()})",
            "amount": f"+₹{skill_adjustment}",
            "detail": f"Vocational tier modifier ({int((multiplier - 1) * 100)}% premium)"
        })

    if travel_allowance > Decimal('0.00'):
        explanation.append({
            "label": f"Transit Allowance ({dist_km} km)",
            "amount": f"+₹{travel_allowance}",
            "detail": f"Transit fee beyond {TRAVEL_BASE_RADIUS_KM} km local radius"
        })

    if hazard_allowance > Decimal('0.00'):
        explanation.append({
            "label": f"Technical Complexity ({hazard.title()})",
            "amount": f"+₹{hazard_allowance}",
            "detail": f"Equipment and safety protocol allowance"
        })

    explanation.append({
        "label": "Worker Direct Payout",
        "amount": f"₹{worker_earning}",
        "detail": "Direct settlement to service provider (100% of service value minus welfare reserve)"
    })

    explanation.append({
        "label": "Cooperative Reserve (6.5%)",
        "amount": f"₹{cooperative_reserve}",
        "detail": "Allocated to member mutual aid, accidental cover & dividend reserve"
    })

    return {
        "category_name": category_name or "General Maintenance",
        "base_amount": str(base_labor),
        "duration_minutes": duration,
        "duration_adjustment": str(duration_adjustment),
        "skill_tier": tier,
        "skill_adjustment": str(skill_adjustment),
        "travel_distance_km": float(dist_km),
        "travel_allowance": str(travel_allowance),
        "hazard_level": hazard,
        "hazard_allowance": str(hazard_allowance),
        "required_worker_count": worker_count,
        "customer_total": str(customer_total),
        "worker_earning": str(worker_earning),
        "cooperative_reserve": str(cooperative_reserve),
        "cooperative_reserve_rate_percent": float(COOPERATIVE_RESERVE_RATE * 100),
        "explanation": explanation,
        "disclaimer": DISCLAIMER_TEXT
    }
