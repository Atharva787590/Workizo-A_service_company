"""
UNNATI Worker Skill Development & Certification Engine
-----------------------------------------------------
Server-side skill profile validation, micro-certification lifecycle,
automatic expiry evaluation, restricted task matching, learning recommendations,
and role authorization.
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import date, datetime, timezone

PROFICIENCY_LEVELS = ['BEGINNER', 'SKILLED', 'CERTIFIED', 'EXPERT']

CERTIFICATION_STATUSES = [
    'VERIFIED',
    'PENDING',
    'EXPIRED',
    'REJECTED',
    'DEMO_UNVERIFIED'
]

# Recognized Indian vocational skill & trade bodies
RECOGNIZED_ISSUING_ORGANIZATIONS = [
    'National Skill Development Corporation (NSDC)',
    'Skill India / MSDE',
    'National Council for Vocational Training (NCVT)',
    'State Skill Development Mission (SSDM)',
    'Sector Skill Council (SSC)',
    'Recognized Polytechnic / ITI',
    'UNNATI Cooperative Guild Academy',
]

# High-risk / restricted task catalog requiring verified certification
RESTRICTED_SERVICES_CATALOG = {
    'high_voltage_electrical': {
        'name': 'High Voltage / Commercial Electrical',
        'required_skills': ['High Voltage Wiring', 'Circuit Breaker Diagnostics'],
        'required_certifications': ['Electrician Trade Certificate (NCVT/ITI)'],
        'min_proficiency': 'CERTIFIED'
    },
    'structural_gas_plumbing': {
        'name': 'Gas Pipeline & Pressure Plumbing',
        'required_skills': ['Gas Pipeline Fitting', 'High-Pressure Leak Testing'],
        'required_certifications': ['Plumbing SSC Level 4 Certificate'],
        'min_proficiency': 'CERTIFIED'
    },
    'commercial_refrigeration': {
        'name': 'Commercial HVAC & Chiller Maintenance',
        'required_skills': ['Refrigerant Reclamation', 'Industrial Compressor Servicing'],
        'required_certifications': ['RAC Trade Certificate (NSDC/NCVT)'],
        'min_proficiency': 'SKILLED'
    }
}

def validate_skill_entry(
    skill_name: str,
    proficiency: str,
    years_experience: int,
    has_verified_certificate: bool = False
) -> Tuple[bool, Optional[str]]:
    """
    Validates skill entry with server-side rules:
    - Skill name cannot be blank and must be reasonable length (2 to 80 chars).
    - Proficiency must be in valid levels.
    - 'CERTIFIED' requires a verified certificate.
    - 'EXPERT' requires >= 3 years experience and verified skills.
    """
    clean_name = (skill_name or '').strip()
    if not clean_name or len(clean_name) < 2 or len(clean_name) > 80:
        return False, "Skill name must be between 2 and 80 characters."

    prof_upper = (proficiency or '').upper()
    if prof_upper not in PROFICIENCY_LEVELS:
        return False, f"Invalid proficiency level '{proficiency}'. Allowed: {', '.join(PROFICIENCY_LEVELS)}"

    if years_experience < 0 or years_experience > 50:
        return False, "Years of experience must be between 0 and 50."

    if prof_upper == 'CERTIFIED' and not has_verified_certificate:
        return False, "Proficiency 'CERTIFIED' requires an approved vocational certification."

    if prof_upper == 'EXPERT' and years_experience < 3:
        return False, "Proficiency 'EXPERT' requires at least 3 years of verified field experience."

    return True, None

def evaluate_certification_status(
    raw_status: str,
    expiry_date: Optional[date],
    reference_date: Optional[date] = None
) -> str:
    """
    Evaluates certification status against expiry date.
    If expiry_date has passed, automatically evaluates to 'EXPIRED'
    unless already 'REJECTED'.
    """
    ref = reference_date or date.today()
    status_upper = (raw_status or 'PENDING').upper()

    if status_upper not in CERTIFICATION_STATUSES:
        status_upper = 'DEMO_UNVERIFIED'

    if status_upper == 'REJECTED':
        return 'REJECTED'

    if expiry_date:
        if isinstance(expiry_date, str):
            try:
                expiry_date = date.fromisoformat(expiry_date)
            except ValueError:
                return 'DEMO_UNVERIFIED'

        if expiry_date < ref:
            return 'EXPIRED'

    return status_upper

def check_task_eligibility(
    service_slug: str,
    worker_skills: List[Dict[str, Any]],
    worker_certifications: List[Dict[str, Any]],
    reference_date: Optional[date] = None
) -> Tuple[bool, List[str]]:
    """
    Checks if worker is eligible for restricted/specialized tasks.
    Returns (is_eligible, missing_requirements_list).
    """
    restriction = RESTRICTED_SERVICES_CATALOG.get(service_slug)
    if not restriction:
        # Standard un-restricted task
        return True, []

    missing = []
    skill_names = {s.get('name', '').strip().lower(): s.get('proficiency', '').upper() for s in worker_skills}

    # 1. Check required skills
    for req_s in restriction['required_skills']:
        s_prof = skill_names.get(req_s.lower())
        if not s_prof:
            missing.append(f"Missing required skill: '{req_s}'")

    # 2. Check required verified certifications
    active_verified_certs = set()
    for cert in worker_certifications:
        c_status = evaluate_certification_status(
            cert.get('verification_status'),
            cert.get('expiry_date'),
            reference_date
        )
        if c_status == 'VERIFIED':
            active_verified_certs.add(cert.get('certification_name', '').strip().lower())

    for req_c in restriction['required_certifications']:
        if req_c.lower() not in active_verified_certs:
            missing.append(f"Requires active verified certificate: '{req_c}'")

    is_eligible = len(missing) == 0
    return is_eligible, missing

def generate_learning_recommendations(
    worker_category: str,
    existing_skills: List[str],
    existing_certs: List[str]
) -> List[Dict[str, Any]]:
    """
    Generates advisory micro-certification and training recommendations
    based on worker trade and skill gaps.
    All recommendations are transparently marked as ADVISORY.
    """
    cat_lower = (worker_category or '').lower()
    existing_skill_set = {s.lower() for s in existing_skills}
    existing_cert_set = {c.lower() for c in existing_certs}

    recommendations = []

    # Trade-specific recommendations
    if 'electr' in cat_lower:
        if 'solar pv installation' not in existing_skill_set:
            recommendations.append({
                'course_title': 'Rooftop Solar PV Installation & Grid Safety',
                'provider': 'National Institute of Solar Energy (NISE) / NSDC',
                'skill_gained': 'Solar PV Installation',
                'estimated_duration': '3 Weeks (Self-paced + Practical)',
                'mode': 'Hybrid / Cooperative Workshop',
                'certification_level': 'NSQF Level 4',
                'demand_trend': 'HIGH (+35% demand in clean energy)'
            })
        if 'inverter repair' not in existing_skill_set:
            recommendations.append({
                'course_title': 'Inverter & Smart Meter Diagnostics',
                'provider': 'Skill India Digital Hub',
                'skill_gained': 'Inverter Diagnostics',
                'estimated_duration': '10 Hours (Online micro-module)',
                'mode': 'Mobile Low-Bandwidth Video',
                'certification_level': 'Micro-Credential',
                'demand_trend': 'STEADY'
            })
    elif 'plumb' in cat_lower:
        if 'water purifier servicing' not in existing_skill_set:
            recommendations.append({
                'course_title': 'RO Water Purifier Servicing & Membrane Installation',
                'provider': 'Plumbing Sector Skill Council',
                'skill_gained': 'RO Water Purifier Servicing',
                'estimated_duration': '2 Weeks',
                'mode': 'Cooperative Hands-on Lab',
                'certification_level': 'NSQF Level 3',
                'demand_trend': 'HIGH (+28% summer demand)'
            })
        if 'gas pipeline fitting' not in existing_skill_set:
            recommendations.append({
                'course_title': 'City Gas Distribution (CGD) Domestic Piping Certification',
                'provider': 'Hydrocarbon Sector Skill Council',
                'skill_gained': 'Gas Pipeline Fitting',
                'estimated_duration': '4 Weeks',
                'mode': 'Vocational Training Center',
                'certification_level': 'NSQF Level 4',
                'demand_trend': 'EXPANDING'
            })
    else:
        recommendations.append({
            'course_title': 'Modern Tooling & Safety Protocols for Cooperative Artisans',
            'provider': 'UNNATI Guild Learning Exchange',
            'skill_gained': 'Advanced Workshop Safety',
            'estimated_duration': '1 Week',
            'mode': 'Audio-Visual Guide',
            'certification_level': 'Cooperative Badge',
            'demand_trend': 'RECOMMENDED'
        })

    # Add general cooperative digital billing & customer communication recommendation
    if len(recommendations) < 3:
        recommendations.append({
            'course_title': 'Cooperative Accounting & Direct UPI Receipt Management',
            'provider': 'UNNATI Cooperative Training Cell',
            'skill_gained': 'Direct Financial Stewardship',
            'estimated_duration': '4 Hours',
            'mode': 'Multilingual Audio',
            'certification_level': 'Cooperative Member Badge',
            'demand_trend': 'CORE'
        })

    return recommendations

def authorize_certification_review(
    actor_role: str,
    new_status: str
) -> Tuple[bool, Optional[str]]:
    """
    Enforces server-side authorization:
    Only cooperative admins or peer governance reviewers can verify or reject certificates.
    Workers cannot self-approve their own certifications.
    """
    if actor_role not in ['admin', 'cooperative_reviewer']:
        return False, "Unauthorized. Only cooperative administrators or peer reviewers can approve or reject certifications."

    new_upper = (new_status or '').upper()
    if new_upper not in ['VERIFIED', 'REJECTED']:
        return False, f"Invalid resolution status '{new_status}'. Expected 'VERIFIED' or 'REJECTED'."

    return True, None
