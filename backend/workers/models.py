from django.db import models
from django.conf import settings
from services.models import ServiceCategory

class WorkerProfile(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    objects = models.Manager()

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='worker_profile')
    service_category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='workers')
    experience = models.IntegerField(default=0)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    dob = models.CharField(max_length=50, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    father_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account = models.CharField(max_length=20, blank=True, null=True)
    ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    
    profile_photo = models.ImageField(upload_to='worker_photos/profile/', blank=True, null=True)
    aadhaar_photo = models.ImageField(upload_to='worker_photos/aadhaar/', blank=True, null=True)
    pan_photo = models.ImageField(upload_to='worker_photos/pan/', blank=True, null=True)
    
    is_verified = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    online_status = models.BooleanField(default=False)

    # UNNATI Micro-payout readiness & skill certification fields
    upi_id = models.CharField(max_length=100, blank=True, null=True)
    payout_readiness = models.CharField(
        max_length=50,
        choices=(
            ('VERIFIED', 'Verified Payout Account'),
            ('PENDING', 'Payout Verification Pending'),
            ('UNAVAILABLE', 'Payout Unavailable'),
            ('DEMO_MODE', 'Demo / Sandbox Mode'),
        ),
        default='DEMO_MODE'
    )
    aeps_enabled = models.BooleanField(default=False)
    nsdc_certified = models.BooleanField(default=False)
    nsdc_cert_number = models.CharField(max_length=100, blank=True, null=True)
    nsdc_trade_name = models.CharField(max_length=100, blank=True, null=True)
    skill_india_verified = models.BooleanField(default=False)
    skill_badges = models.JSONField(default=list, blank=True)

    # UNNATI Provider-Ready Verification States
    identity_verification_status = models.CharField(max_length=50, default='DEMO_UNVERIFIED')
    aadhaar_ekyc_status = models.CharField(max_length=50, default='DEMO_UNVERIFIED')
    police_verification_status = models.CharField(max_length=50, default='NOT_SUBMITTED')
    skill_verification_status = models.CharField(max_length=50, default='DEMO_UNVERIFIED')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Worker Profile for {self.user.email}"

class Wallet(models.Model):
    objects = models.Manager()

    worker = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pending_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wallet for {self.worker.email} - Balance: ₹{self.current_balance}"

class WalletTransaction(models.Model):
    TYPE_CHOICES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    )

    objects = models.Manager()

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wallet Txn #{self.id} - {self.transaction_type.upper()} ₹{self.amount} for {self.wallet.worker.email}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_worker_wallet(sender, instance, created, **kwargs):
    if instance.role == 'worker':
        Wallet.objects.get_or_create(worker=instance)


class TwoWayRating(models.Model):
    """
    UNNATI Two-Way Rating System
    Enables both customer-to-worker and worker-to-customer evaluation with category scores.
    """
    TYPE_CHOICES = (
        ('CUSTOMER_TO_WORKER', 'Customer to Worker'),
        ('WORKER_TO_CUSTOMER', 'Worker to Customer'),
    )

    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='two_way_ratings')
    rater = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_two_way_ratings')
    ratee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_two_way_ratings')
    rating_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='CUSTOMER_TO_WORKER')
    overall_rating = models.IntegerField(default=5)
    category_scores = models.JSONField(default=dict, blank=True)
    review = models.TextField(blank=True, null=True)

    # Anti-bias protection flags
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.CharField(max_length=255, blank=True, null=True)
    suspicion_score = models.FloatField(default=0.0)

    # Dispute status
    is_disputed = models.BooleanField(default=False)
    dispute_reason = models.TextField(blank=True, null=True)
    dispute_status = models.CharField(
        max_length=50,
        choices=(
            ('NONE', 'No Dispute'),
            ('PENDING_REVIEW', 'Under Peer Review'),
            ('RESOLVED_UPHELD', 'Dispute Upheld'),
            ('RESOLVED_DISMISSED', 'Dispute Dismissed'),
        ),
        default='NONE'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Enforce no duplicate ratings per rater per booking
        unique_together = ('booking', 'rater')

    def __str__(self):
        return f"{self.rating_type}: {self.overall_rating}★ from {self.rater.email} to {self.ratee.email} (Booking #{self.booking_id})"


class PeerEndorsement(models.Model):
    """
    UNNATI Cooperative Peer Endorsements
    Verified members vouch for peer skills without self-endorsement or duplicates.
    """
    endorser = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_peer_endorsements')
    endorsee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_peer_endorsements')
    skill_name = models.CharField(max_length=100)
    endorsement_note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('endorser', 'endorsee', 'skill_name')

    def __str__(self):
        return f"Endorsement: {self.skill_name} by {self.endorser.email} for {self.endorsee.email}"


class GovernanceReviewCase(models.Model):
    """
    Cooperative Peer Governance Review Queue
    Handles flagged ratings, retaliatory bias appeals, and member disputes with immutable audit trails.
    """
    CASE_TYPES = (
        ('RATING_DISPUTE', 'Rating Dispute'),
        ('SUSPICIOUS_BIAS_FLAG', 'Suspicious Bias Flag'),
        ('VERIFICATION_APPEAL', 'Verification Appeal'),
    )
    STATUS_CHOICES = (
        ('OPEN_IN_QUEUE', 'Open in Review Queue'),
        ('UNDER_PEER_REVIEW', 'Under Peer Review'),
        ('RESOLVED_UPHELD', 'Resolved Upheld'),
        ('RESOLVED_DISMISSED', 'Resolved Dismissed'),
    )

    case_id = models.CharField(max_length=50, unique=True)
    case_type = models.CharField(max_length=50, choices=CASE_TYPES, default='RATING_DISPUTE')
    target_rating = models.ForeignKey(TwoWayRating, on_delete=models.SET_NULL, null=True, blank=True, related_name='governance_cases')
    target_worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='worker_governance_cases')
    raised_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='raised_governance_cases')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='OPEN_IN_QUEUE')
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_governance_cases')
    resolution_notes = models.TextField(blank=True, null=True)
    audit_trail = models.JSONField(default=list, blank=True)
    evidence_items = models.JSONField(default=list, blank=True)
    ai_recommendation = models.CharField(max_length=200, blank=True, null=True)
    appeal_status = models.CharField(max_length=50, default='NONE', blank=True)
    appeal_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Governance Case {self.case_id} ({self.case_type}) - Status: {self.status}"


class CooperativeProposal(models.Model):
    """
    UNNATI Cooperative Resolution / Proposal
    Server-authoritative democratic voting for cooperative rules, budget, and policy.
    """
    proposal_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, default='POLICY')
    proposer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='coop_proposals')
    proposer_name = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=50, default='ACTIVE') # DRAFT, ACTIVE, CLOSED, PASSED, REJECTED
    voting_type = models.CharField(max_length=50, default='YES_NO_ABSTAIN')
    options = models.JSONField(default=list, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    quorum_needed = models.IntegerField(default=5)
    total_votes = models.IntegerField(default=0)
    tally = models.JSONField(default=dict, blank=True)
    result_summary = models.TextField(blank=True, null=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.proposal_id}: {self.title} [{self.status}]"


class CooperativeBallot(models.Model):
    """
    UNNATI Secret Ballot Record for Resolutions
    Preserves voter privacy via cryptographic voter hashing and verifiable receipt tokens.
    """
    proposal = models.ForeignKey(CooperativeProposal, on_delete=models.CASCADE, related_name='ballots')
    voter_hash = models.CharField(max_length=64, db_index=True)
    choice = models.CharField(max_length=100)
    receipt_token = models.CharField(max_length=64, unique=True)
    idempotency_key = models.CharField(max_length=120, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('proposal', 'voter_hash')

    def __str__(self):
        return f"Ballot {self.receipt_token} on {self.proposal.proposal_id}"


class CooperativeElection(models.Model):
    """
    UNNATI Board Elections
    Democratic executive elections: One-member-one-vote with candidate profiles.
    """
    election_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    role_title = models.CharField(max_length=150)
    term = models.CharField(max_length=50, default='2026-2028')
    status = models.CharField(max_length=50, default='ACTIVE') # UPCOMING, ACTIVE, CLOSED, CONCLUDED
    candidates = models.JSONField(default=list, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    winner_id = models.CharField(max_length=50, null=True, blank=True)
    winner_name = models.CharField(max_length=150, null=True, blank=True)
    total_votes = models.IntegerField(default=0)
    results = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Election {self.election_id}: {self.title} ({self.status})"


class ElectionBallot(models.Model):
    """
    UNNATI Secret Ballot Record for Board Elections
    """
    election = models.ForeignKey(CooperativeElection, on_delete=models.CASCADE, related_name='ballots')
    voter_hash = models.CharField(max_length=64, db_index=True)
    candidate_id = models.CharField(max_length=50)
    receipt_token = models.CharField(max_length=64, unique=True)
    idempotency_key = models.CharField(max_length=120, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('election', 'voter_hash')

    def __str__(self):
        return f"Election Ballot {self.receipt_token} for {self.election.election_id}"



class WorkerSkill(models.Model):
    """
    UNNATI Structured Worker Skill Profile
    Supports BEGINNER, SKILLED, CERTIFIED, and EXPERT proficiency levels.
    """
    PROFICIENCY_CHOICES = (
        ('BEGINNER', 'Beginner'),
        ('SKILLED', 'Skilled'),
        ('CERTIFIED', 'Certified'),
        ('EXPERT', 'Expert'),
    )

    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='worker_skills')
    name = models.CharField(max_length=100)
    category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='category_skills')
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='SKILLED')
    years_of_experience = models.IntegerField(default=1)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('worker', 'name')

    def __str__(self):
        return f"{self.worker.email} - {self.name} ({self.proficiency})"


class WorkerCertification(models.Model):
    """
    UNNATI Micro-Certification Records
    Tracks Skill India / NSDC, NCVT, and recognized vocational credentials with expiry handling.
    """
    STATUS_CHOICES = (
        ('VERIFIED', 'Verified'),
        ('PENDING', 'Pending Verification'),
        ('EXPIRED', 'Expired'),
        ('REJECTED', 'Rejected'),
        ('DEMO_UNVERIFIED', 'Demo / Unverified'),
    )

    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certifications')
    certification_name = models.CharField(max_length=200)
    issuing_organization = models.CharField(max_length=200)
    credential_id = models.CharField(max_length=100, blank=True, null=True)
    issue_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    verification_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')
    verification_notes = models.TextField(blank=True, null=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_certifications')
    document_url = models.CharField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.certification_name} for {self.worker.email} - {self.verification_status}"


class WorkerSocialSecurity(models.Model):
    """
    UNNATI Provider-Ready Social Security & Insurance Record
    Tracks official schemes: PMSBY, PMJJBY, Ayushman Bharat PM-JAY, e-Shram, PM-SYM, and Cooperative Welfare.
    Never fabricates government verification or enrollment.
    """
    SCHEME_CHOICES = (
        ('PMSBY', 'Pradhan Mantri Suraksha Bima Yojana (Accident Cover)'),
        ('PMJJBY', 'Pradhan Mantri Jeevan Jyoti Bima Yojana (Life Cover)'),
        ('PM_JAY', 'Ayushman Bharat PM-JAY (Health Cover)'),
        ('E_SHRAM', 'e-Shram Gig Worker National Registry'),
        ('PM_SYM', 'Pradhan Mantri Shram Yogi Maandhan (Pension)'),
        ('COOP_WELFARE', 'Cooperative Emergency Welfare Mutual Aid'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active Coverage'),
        ('PENDING', 'Enrollment / Verification Pending'),
        ('EXPIRED', 'Coverage Expired / Renewal Needed'),
        ('NOT_ENROLLED', 'Not Enrolled'),
        ('UNVERIFIED', 'Unverified Claim'),
    )

    worker = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='social_security_records')
    scheme_code = models.CharField(max_length=30, choices=SCHEME_CHOICES)
    scheme_name = models.CharField(max_length=150)
    coverage_amount_inr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='NOT_ENROLLED')
    policy_reference = models.CharField(max_length=100, blank=True, null=True)
    enrolled_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    verified_by_cooperative = models.BooleanField(default=False)
    verification_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('worker', 'scheme_code')

    def __str__(self):
        return f"{self.scheme_code} for {self.worker.email} - {self.status}"

