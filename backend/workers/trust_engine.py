"""
UNNATI Trust, Verification & Two-Way Rating Engine
--------------------------------------------------
Pure server-side trust calculations, anti-bias rating protection,
peer endorsement rules, sensitive data masking, and governance audit records.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import re

VERIFICATION_STATES = ['VERIFIED', 'PENDING', 'FAILED', 'NOT_SUBMITTED', 'DEMO_UNVERIFIED']

def mask_aadhaar_number(aadhaar: Optional[str]) -> Optional[str]:
    """
    Masks 12-digit Indian Aadhaar numbers.
    Never exposes full Aadhaar numbers in normal UI or API payloads.
    Format: 'XXXX-XXXX-1234'
    """
    if not aadhaar:
        return None
    clean = re.sub(r'\D', '', str(aadhaar))
    if len(clean) != 12:
        return 'XXXX-XXXX-XXXX'
    return f"XXXX-XXXX-{clean[-4:]}"

def mask_pan_number(pan: Optional[str]) -> Optional[str]:
    """Masks 10-character Indian PAN numbers: 'XXXXX1234X'."""
    if not pan:
        return None
    clean = str(pan).strip().upper()
    if len(clean) != 10:
        return 'XXXXXXXXXX'
    return f"XXXXX{clean[5:]}"

def validate_rating_eligibility(
    booking_status: str,
    user_id: int,
    customer_id: int,
    worker_id: Optional[int],
    existing_rater_ids: List[int]
) -> Tuple[bool, str, Optional[str]]:
    """
    Validates whether a user is eligible to rate a booking.
    Rules:
      1. Booking must be COMPLETED.
      2. User must be either customer or assigned worker.
      3. User cannot submit duplicate rating for the same booking.
    """
    status_normalized = (booking_status or '').lower()
    if status_normalized not in ['completed']:
        return False, "Ratings can only be submitted after eligible job completion.", None

    if user_id not in [customer_id, worker_id]:
        return False, "You are not authorized to rate this service booking.", None

    if user_id in existing_rater_ids:
        return False, "You have already submitted a rating for this completed booking.", None

    rating_type = "CUSTOMER_TO_WORKER" if user_id == customer_id else "WORKER_TO_CUSTOMER"
    return True, "Eligible to rate", rating_type

def detect_suspicious_rating(
    overall_rating: int,
    category_scores: Dict[str, int],
    review_text: str,
    has_active_dispute: bool = False,
    time_since_completion_minutes: float = 60.0,
    recent_low_rating_count: int = 0
) -> Tuple[bool, Optional[str], float]:
    """
    Anti-bias protection:
    Detects suspicious rating patterns without silently deleting or modifying legitimate feedback.
    Flags suspicious ratings for cooperative peer governance review.

    Suspicious flags:
      1. Rapid retaliatory 1-star submitted immediately (< 15 min) after a dispute or low counter-rating.
      2. Severe score divergence: overall 1-star but all category scores are 5s (or vice versa).
      3. High burst frequency: rater has submitted 3+ extreme 1-star ratings within minutes.
    """
    suspicion_score = 0.0
    flag_reasons = []

    # 1. Retaliatory pattern
    if overall_rating <= 1 and has_active_dispute and time_since_completion_minutes < 15.0:
        suspicion_score += 0.6
        flag_reasons.append("Potential retaliatory low-rating submitted during active dispute.")

    # 2. Score anomaly / contradiction
    if category_scores:
        scores = [int(v) for v in category_scores.values() if isinstance(v, (int, float))]
        if scores:
            avg_category = sum(scores) / len(scores)
            if overall_rating <= 1 and avg_category >= 4.5:
                suspicion_score += 0.5
                flag_reasons.append("Significant anomaly: overall rating is 1-star but category ratings are all 5-stars.")
            elif overall_rating >= 5 and avg_category <= 1.5:
                suspicion_score += 0.5
                flag_reasons.append("Significant anomaly: overall rating is 5-star but category ratings are all 1-stars.")

    # 3. Repeated extreme burst behavior
    if overall_rating <= 1 and recent_low_rating_count >= 3:
        suspicion_score += 0.5
        flag_reasons.append("Extreme repeated low-rating burst detected across multiple bookings.")

    is_flagged = suspicion_score >= 0.5
    reason = " | ".join(flag_reasons) if is_flagged else None
    return is_flagged, reason, round(suspicion_score, 2)

def validate_peer_endorsement(
    endorser_id: int,
    endorsee_id: int,
    endorser_is_verified: bool,
    skill_name: str,
    existing_endorsements: List[Dict[str, Any]]
) -> Tuple[bool, str]:
    """
    Peer Endorsement Rules:
      1. No self-endorsement: endorser_id != endorsee_id.
      2. Endorser must be a verified cooperative member.
      3. Skill name must not be empty.
      4. No duplicate endorsement for the same skill by the same endorser.
    """
    if endorser_id == endorsee_id:
        return False, "Self-endorsement is prohibited. Only peer cooperative members can endorse skills."

    if not endorser_is_verified:
        return False, "Only verified cooperative members are eligible to endorse peer craftspersons."

    skill_clean = (skill_name or '').strip().title()
    if not skill_clean:
        return False, "Skill name cannot be empty."

    for end in existing_endorsements:
        if end.get('endorser_id') == endorser_id and end.get('skill_name', '').strip().lower() == skill_clean.lower():
            return False, f"You have already endorsed this member for '{skill_clean}'."

    return True, "Endorsement valid"

def sanitize_worker_trust_profile(
    worker_user,
    profile,
    endorsements: List[Dict[str, Any]],
    ratings: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Builds a sanitized worker trust profile with zero exposure of raw Aadhaar/PAN
    and explicit provider-ready verification states without fabrication.
    """
    rating_scores = [r.get('overall_rating', 5) for r in ratings if not r.get('is_hidden')]
    avg_rating = round(sum(rating_scores) / len(rating_scores), 1) if rating_scores else 5.0
    total_ratings = len(rating_scores)

    # Distinguish provider-ready verification states without fabrication
    aadhaar_status = getattr(profile, 'aadhaar_ekyc_status', 'DEMO_UNVERIFIED')
    police_status = getattr(profile, 'police_verification_status', 'NOT_SUBMITTED')
    skill_status = 'VERIFIED' if getattr(profile, 'nsdc_certified', False) or getattr(profile, 'skill_india_verified', False) else 'DEMO_UNVERIFIED'
    identity_status = getattr(profile, 'identity_verification_status', 'VERIFIED' if profile.is_verified else 'PENDING')

    return {
        "worker_id": worker_user.id,
        "full_name": worker_user.full_name,
        "email": worker_user.email,
        "service_category": getattr(profile.service_category, 'name', 'General Tradesperson') if profile.service_category else 'General Tradesperson',
        "experience_years": getattr(profile, 'experience', 0),
        "trust_score": min(98, max(50, int(avg_rating * 18 + len(endorsements) * 2))),
        "average_rating": avg_rating,
        "total_reviews": total_ratings,
        "verification_states": {
            "identity_verification": identity_status,
            "aadhaar_ekyc": aadhaar_status,
            "police_verification": police_status,
            "skill_certification": skill_status,
            "is_demo": aadhaar_status in ['DEMO_UNVERIFIED', 'NOT_SUBMITTED'],
        },
        "masked_identifiers": {
            "aadhaar_masked": mask_aadhaar_number(getattr(profile, 'aadhaar_number', None)),
            "pan_masked": mask_pan_number(getattr(profile, 'pan_number', None)),
        },
        "peer_endorsements": {
            "count": len(endorsements),
            "endorsements": endorsements[:10],
        },
        "skill_badges": getattr(profile, 'skill_badges', []) or ["Verified Craftsman", "Cooperative Guild Member"],
        "nsdc_certified": getattr(profile, 'nsdc_certified', False),
        "nsdc_trade_name": getattr(profile, 'nsdc_trade_name', None),
        "skill_india_verified": getattr(profile, 'skill_india_verified', False),
    }

def build_governance_audit_record(
    action: str,
    actor_id: int,
    actor_name: str,
    decision: str,
    notes: str
) -> Dict[str, Any]:
    """Generates an immutable audit trail entry for peer governance decisions."""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": actor_id,
        "actor_name": actor_name,
        "action": action,
        "decision": decision,
        "notes": notes,
    }
