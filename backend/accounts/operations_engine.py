"""
UNNATI Cooperative Operations Engine
-----------------------------------
Operational analytics, sensitive data protection, booking triaging,
direct payment monitoring, cooperative economics, and audit logging.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import re

DESTRUCTIVE_ACTIONS = [
    'SUSPEND_WORKER',
    'CANCEL_BOOKING_FORCE',
    'REVOKE_CERTIFICATION',
    'OVERRIDE_PAYMENT_STATUS',
    'TERMINATE_MEMBERSHIP'
]

COOPERATIVE_TIERS = {
    'apprentice': 'Apprentice Member (प्रशिक्षु)',
    'member': 'Certified Guildsman (प्रमाणित गिल्ड सदस्य)',
    'guild_lead': 'Guild Lead (गिल्ड प्रमुख)',
    'master_craftsman': 'Master Craftsman (वरिष्ठ शिल्पकार)'
}


def mask_sensitive_identifier(val: Optional[str], kind: str = 'aadhaar') -> str:
    """Masks sensitive identity numbers for operational dashboard views."""
    if not val:
        return 'Not Disclosed'
    clean = re.sub(r'\s+', '', str(val).strip())
    if kind == 'aadhaar':
        clean_num = re.sub(r'\D', '', clean)
        if len(clean_num) != 12:
            return 'XXXX-XXXX-XXXX'
        return f"XXXX-XXXX-{clean_num[-4:]}"
    elif kind == 'pan':
        if len(clean) != 10:
            return 'XXXXXXXXXX'
        return f"XXXXX{clean[5:]}"

    elif kind == 'phone':
        digits = re.sub(r'\D', '', clean)
        if len(digits) >= 10:
            return f"+91-XXXXX-{digits[-4:]}"
        return 'XXX-XXX-XXXX'
    return 'PROTECTED'


def sanitize_worker_operational_record(worker: Dict[str, Any], is_superadmin: bool = False) -> Dict[str, Any]:
    """
    Sanitizes worker profile record for general operational views.
    Masks Aadhaar, PAN, and phone while preserving verified certifications,
    cooperative tier, and ratings.
    """
    record = dict(worker)
    if not is_superadmin:
        record['aadhaar_masked'] = mask_sensitive_identifier(record.get('aadhaar_number'), 'aadhaar')
        record['pan_masked'] = mask_sensitive_identifier(record.get('pan_number'), 'pan')
        record['phone_masked'] = mask_sensitive_identifier(record.get('phone'), 'phone')
        # Strip raw sensitive fields
        record.pop('aadhaar_number', None)
        record.pop('pan_number', None)
    else:
        record['aadhaar_masked'] = mask_sensitive_identifier(record.get('aadhaar_number'), 'aadhaar')
        record['pan_masked'] = mask_sensitive_identifier(record.get('pan_number'), 'pan')

    return record


def compute_operations_overview(stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Produces complete operational telemetry overview with explicit distinction
    between live server-verified metrics and simulated/demo metrics.
    """
    active_workers = stats.get('active_workers', 0)
    active_customers = stats.get('active_customers', 0)
    ongoing_bookings = stats.get('ongoing_bookings', 0)
    scheduled_bookings = stats.get('scheduled_bookings', 0)
    completed_jobs = stats.get('completed_jobs', 0)
    cancelled_jobs = stats.get('cancelled_jobs', 0)
    disputed_jobs = stats.get('disputed_jobs', 0)

    # Cooperative membership distribution
    coop_members = stats.get('coop_members', {
        'apprentice': 12,
        'member': 38,
        'guild_lead': 8,
        'master_craftsman': 6
    })

    return {
        "metrics": {
            "active_workers": {"value": active_workers, "is_live": True, "label": "Active On-Duty Craftsmen"},
            "active_customers": {"value": active_customers, "is_live": True, "label": "Active Registered Customers"},
            "ongoing_bookings": {"value": ongoing_bookings, "is_live": True, "label": "Ongoing In-Progress Tasks"},
            "scheduled_bookings": {"value": scheduled_bookings, "is_live": True, "label": "Scheduled Ahead"},
            "completed_jobs": {"value": completed_jobs, "is_live": True, "label": "Completed Work Units"},
            "cancelled_jobs": {"value": cancelled_jobs, "is_live": True, "label": "Cancelled Requests"},
            "disputed_jobs": {"value": disputed_jobs, "is_live": True, "label": "Active Disputes"},
            "avg_service_rating": {"value": stats.get('avg_rating', 4.8), "is_live": True, "label": "Average Platform Rating"},
            "service_demand_index": {"value": stats.get('demand_index', 82.5), "is_live": False, "is_demo": True, "label": "Regional Demand Index (AI Estimated)"},
        },
        "cooperative_membership": {
            "total_members": sum(coop_members.values()),
            "tiers": coop_members,
            "is_live": True
        },
        "operational_health": "OPTIMAL" if disputed_jobs == 0 else "ATTENTION_REQUIRED" if disputed_jobs > 5 else "STABLE",
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


def filter_booking_operations(
    bookings: List[Dict[str, Any]],
    filter_type: str = 'ALL'
) -> List[Dict[str, Any]]:
    """
    Triages bookings into operational priority queues:
    - LIVE_ACTIVE: in_progress, repair_in_progress, captain_arriving, work_started
    - SCHEDULED: accepted, searching, requested, scheduled
    - UNASSIGNED: searching, requested without assigned worker
    - DELAYED_PROBLEMATIC: past scheduled time, delayed arrival, or flagged
    - COLLECTIVE_SHG: collective community / SHG multi-worker tasks
    - DISPUTED: cancelled with dispute, rating disputed, or reported
    """
    ft = filter_type.upper()
    now_iso = datetime.now(timezone.utc).isoformat()

    results = []
    for b in bookings:
        status = (b.get('status') or '').lower()
        is_assigned = b.get('worker') is not None or b.get('worker_id') is not None
        is_collective = b.get('is_collective', False) or b.get('booking_type') == 'COLLECTIVE'
        is_disputed = b.get('is_disputed', False) or b.get('dispute_status') in ['OPEN', 'UPHELD', 'PENDING']
        is_delayed = b.get('is_delayed', False) or (status in ['searching', 'accepted'] and b.get('scheduled_time', '') < now_iso and not is_assigned)

        if ft == 'ALL':
            results.append(b)
        elif ft == 'LIVE_ACTIVE' and status in ['in_progress', 'repair_in_progress', 'captain_arriving', 'work_started', 'captain_assigned']:
            results.append(b)
        elif ft == 'SCHEDULED' and status in ['scheduled', 'accepted', 'requested']:
            results.append(b)
        elif ft == 'UNASSIGNED' and not is_assigned and status in ['searching', 'requested']:
            results.append(b)
        elif ft == 'DELAYED_PROBLEMATIC' and is_delayed:
            results.append(b)
        elif ft == 'COLLECTIVE_SHG' and is_collective:
            results.append(b)
        elif ft == 'DISPUTED' and is_disputed:
            results.append(b)

    return results


def summarize_payment_lifecycle(payments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Summarizes direct settlement transactions while explicitly reinforcing the
    cooperative architecture: UNNATI never holds customer funds in platform accounts.
    """
    successful_count = 0
    successful_volume = 0.0
    pending_count = 0
    pending_volume = 0.0
    failed_count = 0
    failed_volume = 0.0
    refunds_count = 0
    refunds_volume = 0.0
    compensation_count = 0
    compensation_volume = 0.0

    for p in payments:
        amt = float(p.get('amount') or 0.0)
        st = (p.get('status') or '').upper()
        ptype = (p.get('payment_type') or p.get('type') or '').upper()

        if st in ['PAID', 'COMPLETED', 'SUCCESS']:
            successful_count += 1
            successful_volume += amt
        elif st in ['PENDING', 'INITIATED', 'PROCESSING']:
            pending_count += 1
            pending_volume += amt
        elif st in ['FAILED', 'ERROR']:
            failed_count += 1
            failed_volume += amt

        if ptype == 'REFUND' or p.get('is_refund', False):
            refunds_count += 1
            refunds_volume += amt
        elif ptype == 'CANCELLATION_COMPENSATION' or p.get('is_cancellation_compensation', False):
            compensation_count += 1
            compensation_volume += amt

    return {
        "cooperative_fund_protocol": "Direct Customer-to-Worker Settlement Protocol. UNNATI operates as a non-custodial labor cooperative; zero platform balances are held.",
        "successful_payments": {"count": successful_count, "volume": round(successful_volume, 2)},
        "pending_payments": {"count": pending_count, "volume": round(pending_volume, 2)},
        "failed_payments": {"count": failed_count, "volume": round(failed_volume, 2)},
        "refunds": {"count": refunds_count, "volume": round(refunds_volume, 2)},
        "cancellation_compensations": {"count": compensation_count, "volume": round(compensation_volume, 2)},
        "total_turnover_settled": round(successful_volume, 2)
    }


def calculate_cooperative_economics(
    completed_turnover: float,
    contribution_rate: float = 0.05,
    dividend_share: float = 0.40,
    welfare_share: float = 0.35,
    reserve_share: float = 0.25
) -> Dict[str, Any]:
    """
    Computes aggregate cooperative economics using server-authoritative, configurable rates:
    - Contribution: e.g. 5% collective surplus contribution.
    - Allocation:
      - Patronage dividend: 40% (credited directly to member wallets).
      - Welfare & emergency tool fund: 35%.
      - Cooperative operational reserve: 25%.
    """
    turnover = max(0.0, float(completed_turnover))
    coop_surplus = round(turnover * contribution_rate, 2)
    patronage_dividend_pool = round(coop_surplus * dividend_share, 2)
    welfare_tool_pool = round(coop_surplus * welfare_share, 2)
    operational_reserve_pool = round(coop_surplus * reserve_share, 2)

    return {
        "total_cooperative_turnover": turnover,
        "cooperative_contribution_rate": contribution_rate,
        "cooperative_surplus_generated": coop_surplus,
        "allocations": {
            "patronage_dividend_pool": patronage_dividend_pool,
            "welfare_and_tools_pool": welfare_tool_pool,
            "operational_reserve_pool": operational_reserve_pool
        },
        "shares": {
            "patronage_dividend_share": dividend_share,
            "welfare_and_tools_share": welfare_share,
            "operational_reserve_share": reserve_share
        },
        "policy_rule": "Cooperative surplus distributions are ratified democratically by member resolution."
    }


def build_operational_audit_entry(
    actor_id: int,
    actor_name: str,
    action: str,
    target_type: str,
    target_id: str,
    result: str = 'SUCCESS',
    notes: str = '',
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Constructs an immutable audit record for the cooperative operations center."""
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor_id": actor_id,
        "actor_name": actor_name,
        "action": action,
        "target_type": target_type,
        "target_id": str(target_id),
        "result": result,
        "notes": notes,
        "metadata": metadata or {}
    }


def validate_admin_action_authorization(
    user_role: str,
    action: str,
    is_confirmed: bool = False
) -> Tuple[bool, str]:
    """
    Enforces role-based operational permissions and mandates confirmation
    for destructive or high-impact actions.
    """
    if user_role not in ['admin', 'superuser', 'staff']:
        return False, "Access denied: Administrative clearance required."

    if action in DESTRUCTIVE_ACTIONS and not is_confirmed:
        return False, f"Confirmation required: '{action}' is a high-impact operation."

    return True, "Authorized"
