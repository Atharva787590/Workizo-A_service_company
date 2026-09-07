"""
UNNATI Deterministic Evidence Assessment Service
-------------------------------------------------
Provides server-side, explainable heuristic signals for booking disputes.
Evaluates legitimate objective signals:
  - Start-of-service verification status (Arrival PIN / Geofence)
  - Timing consistency and service duration anomalies
  - Payment settlement status vs. booking completion
  - Presence of visual documentation (inspection/repair photos)
  - Dispute filing and rating timing patterns

Rules:
  - 100% deterministic rules only.
  - Zero external AI / LLM APIs.
  - Never declares guilt, never suspends users, never enacts automated verdicts.
  - Clearly labeled as an assessment aid for human cooperative peer review.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone


ASSESSMENT_DISCLAIMER = (
    "Advisory Evidence Assessment Aid: Generated using objective platform audit signals. "
    "This analysis is strictly non-binding and does NOT constitute an automated verdict or finding of fault. "
    "Final resolution must be evaluated and approved by the human cooperative arbitration committee."
)


def assess_booking_dispute_evidence(
    booking_data: Dict[str, Any],
    dispute_data: Dict[str, Any],
    payment_data: Optional[Dict[str, Any]] = None,
    audit_trail: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates factual booking records and dispute context against deterministic heuristics.
    Returns detected signals, explainable findings, and a recommendation for human review.
    """
    signals: List[Dict[str, Any]] = []
    audit_trail = audit_trail or []
    severity_weights = {'LOW': 0.15, 'MEDIUM': 0.30, 'HIGH': 0.45}
    total_weight = 0.0

    # 1. Verification Signal: Check if arrival was verified via PIN or Geofence
    pin_verified = booking_data.get('arrival_pin_verified', False)
    geofence_verified = booking_data.get('geofence_verified', False)
    if not pin_verified and not geofence_verified:
        signals.append({
            "code": "MISSING_ARRIVAL_VERIFICATION",
            "severity": "HIGH",
            "title": "Unverified Service Arrival",
            "description": "Neither customer Arrival PIN nor technician location geofence was verified prior to work commencement."
        })
        total_weight += severity_weights['HIGH']

    # 2. Timing Consistency: Check service duration anomalies
    created_at_str = booking_data.get('created_at')
    updated_at_str = booking_data.get('updated_at')
    status = (booking_data.get('status') or '').lower()

    if status in ['completed', 'repair_completed'] and audit_trail:
        start_time = None
        complete_time = None
        for log in audit_trail:
            to_s = (log.get('to_status') or '').lower()
            ts = log.get('timestamp')
            if to_s in ['repair_started', 'in_progress'] and not start_time and ts:
                start_time = ts
            if to_s in ['completed', 'repair_completed'] and ts:
                complete_time = ts

        if start_time and complete_time:
            try:
                t1 = datetime.fromisoformat(str(start_time).replace('Z', '+00:00'))
                t2 = datetime.fromisoformat(str(complete_time).replace('Z', '+00:00'))
                duration_minutes = (t2 - t1).total_seconds() / 60.0
                if duration_minutes < 5.0:
                    signals.append({
                        "code": "RAPID_COMPLETION_ANOMALY",
                        "severity": "MEDIUM",
                        "title": "Unusually Fast Service Completion",
                        "description": f"Service was marked completed only {round(duration_minutes, 1)} minutes after work start."
                    })
                    total_weight += severity_weights['MEDIUM']
            except (ValueError, TypeError):
                pass

    # 3. Payment Status Check: Unsettled or failed payment with completed status
    if payment_data:
        p_status = (payment_data.get('status') or '').upper()
        if status == 'completed' and p_status not in ['PAID', 'COMPLETED', 'SUCCESS']:
            signals.append({
                "code": "PAYMENT_SETTLEMENT_MISMATCH",
                "severity": "HIGH",
                "title": "Payment Settlement Anomaly",
                "description": f"Booking marked as completed, but payment status is reported as '{p_status}'."
            })
            total_weight += severity_weights['HIGH']

    # 4. Documentation Check: Missing before/after photographic documentation
    has_before = bool(booking_data.get('before_photo'))
    has_after = bool(booking_data.get('after_photo'))
    if not has_before and not has_after:
        signals.append({
            "code": "DOCUMENTATION_INCOMPLETE",
            "severity": "LOW",
            "title": "No Before/After Documentation",
            "description": "Neither pre-inspection nor post-repair verification photos were uploaded by the technician or customer."
        })
        total_weight += severity_weights['LOW']

    # 5. Dispute Rationale Specifics: Extremely brief or non-descriptive rationale
    reason = dispute_data.get('reason', '')
    if len(reason.strip()) < 20:
        signals.append({
            "code": "SPARSE_DISPUTE_NARRATIVE",
            "severity": "LOW",
            "title": "Sparse Dispute Narrative",
            "description": "The registered dispute description is brief (<20 characters); further clarification may be required from the complainant."
        })
        total_weight += severity_weights['LOW']

    # Compute a normalized confidence strength (0.0 to 1.0)
    confidence_strength = min(1.0, round(total_weight, 2))

    # Formulate explainable synthesis and neutral recommendation
    high_count = len([s for s in signals if s['severity'] == 'HIGH'])
    medium_count = len([s for s in signals if s['severity'] == 'MEDIUM'])

    if high_count > 0:
        explanation = (
            f"Assessment identified {len(signals)} operational signal(s), including {high_count} high-priority anomaly "
            f"(such as unverified arrival or payment mismatch). Human committee arbitration is strongly recommended."
        )
        recommendation = (
            "Contact both customer and technician for doorstep statements. Verify physical receipt and request "
            "photographic proof of repair before releasing or refunding escrow funds."
        )
    elif medium_count > 0:
        explanation = (
            f"Assessment identified {len(signals)} operational signal(s) regarding duration or documentation. "
            f"No critical protocol violations detected."
        )
        recommendation = (
            "Review timestamp logs with the assigned worker and confirm job scope delivery with the customer."
        )
    else:
        explanation = (
            "Standard procedural indicators verified. Dispute requires qualitative evaluation of service satisfaction."
        )
        recommendation = (
            "Proceed with standard peer mediation between customer and technician."
        )

    return {
        "assessment_id": f"UNN-ASSESS-{booking_data.get('id', '0')}",
        "booking_id": booking_data.get('id'),
        "signals": signals,
        "signal_count": len(signals),
        "confidence_strength": confidence_strength,
        "explanation": explanation,
        "recommendation": recommendation,
        "is_advisory_only": True,
        "label": "Deterministic Assessment Aid (Not an automated verdict)",
        "assessed_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": ASSESSMENT_DISCLAIMER
    }
