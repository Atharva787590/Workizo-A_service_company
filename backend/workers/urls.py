from django.urls import path
from workers.views import (
    WorkerRegisterProfileView, WalletDetailView, WalletWithdrawView,
    WorkerDashboardStatsView, WorkerEarningsIntelligenceView,
    TwoWayRatingSubmitView, TwoWayRatingListView, RatingDisputeSubmitView,
    PeerEndorsementSubmitView, WorkerTrustProfileView,
    GovernanceCasesListView, GovernanceCaseResolveView, GovernanceCaseAppealView,
    CooperativeProposalsView, CooperativeProposalVoteView,
    CooperativeElectionsView, CooperativeElectionVoteView,
    PublicGovernanceTransparencyView,
    WorkerSkillsView, WorkerCertificationsView,
    WorkerCertificationReviewView, WorkerLearningRecommendationsView,
    WorkerSocialSecurityView, WorkerSocialSecurityStatusUpdateView
)

urlpatterns = [
    path('register-profile/', WorkerRegisterProfileView.as_view(), name='register_profile'),
    path('wallet/', WalletDetailView.as_view(), name='wallet_details'),
    path('wallet/withdraw/', WalletWithdrawView.as_view(), name='wallet_withdraw'),
    path('dashboard-stats/', WorkerDashboardStatsView.as_view(), name='dashboard_stats'),
    path('earnings-intelligence/', WorkerEarningsIntelligenceView.as_view(), name='earnings_intelligence'),

    # UNNATI Trust & Two-Way Rating Endpoints
    path('two-way-rate/', TwoWayRatingSubmitView.as_view(), name='two_way_rate_submit'),
    path('ratings/<int:booking_id>/', TwoWayRatingListView.as_view(), name='two_way_ratings_list'),
    path('rate-dispute/', RatingDisputeSubmitView.as_view(), name='rate_dispute_submit'),
    path('peer-endorse/', PeerEndorsementSubmitView.as_view(), name='peer_endorse_submit'),
    path('trust-profile/<int:worker_id>/', WorkerTrustProfileView.as_view(), name='worker_trust_profile'),
    path('governance/cases/', GovernanceCasesListView.as_view(), name='governance_cases_list'),
    path('governance/cases/<str:case_id>/resolve/', GovernanceCaseResolveView.as_view(), name='governance_case_resolve'),
    path('governance/cases/<str:case_id>/appeal/', GovernanceCaseAppealView.as_view(), name='governance_case_appeal'),

    # UNNATI Cooperative Governance & Democratic Voting Endpoints
    path('governance/proposals/', CooperativeProposalsView.as_view(), name='cooperative_proposals'),
    path('governance/proposals/<str:proposal_id>/vote/', CooperativeProposalVoteView.as_view(), name='cooperative_proposal_vote'),
    path('governance/elections/', CooperativeElectionsView.as_view(), name='cooperative_elections'),
    path('governance/elections/<str:election_id>/vote/', CooperativeElectionVoteView.as_view(), name='cooperative_election_vote'),
    path('governance/public-feed/', PublicGovernanceTransparencyView.as_view(), name='cooperative_governance_public_feed'),

    # UNNATI Worker Skill Development & Certification Endpoints
    path('skills/', WorkerSkillsView.as_view(), name='worker_skills'),
    path('skills/<int:worker_id>/', WorkerSkillsView.as_view(), name='worker_skills_detail'),
    path('certifications/', WorkerCertificationsView.as_view(), name='worker_certifications'),
    path('certifications/<int:worker_id>/', WorkerCertificationsView.as_view(), name='worker_certifications_detail'),
    path('certifications/<int:cert_id>/review/', WorkerCertificationReviewView.as_view(), name='worker_certification_review'),
    path('learning-recommendations/', WorkerLearningRecommendationsView.as_view(), name='worker_learning_recommendations'),

    # UNNATI Social Security & Insurance Tracker Endpoints
    path('social-security/', WorkerSocialSecurityView.as_view(), name='worker_social_security'),
    path('social-security/<int:worker_id>/', WorkerSocialSecurityView.as_view(), name='worker_social_security_detail'),
    path('social-security/<int:record_id>/status/', WorkerSocialSecurityStatusUpdateView.as_view(), name='worker_social_security_status_update'),
]



