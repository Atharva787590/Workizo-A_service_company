# Generated for UNNATI Cooperative Platform (SIH 2026)

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workers', '0003_workerprofile_dob_workerprofile_father_name_and_more'),
        ('services', '0001_initial'),
        ('bookings', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # WorkerProfile fields
        migrations.AddField(
            model_name='workerprofile',
            name='upi_id',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='payout_readiness',
            field=models.CharField(choices=[('VERIFIED', 'Verified Payout Account'), ('PENDING', 'Payout Verification Pending'), ('UNAVAILABLE', 'Payout Unavailable'), ('DEMO_MODE', 'Demo / Sandbox Mode')], default='DEMO_MODE', max_length=50),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='aeps_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='nsdc_certified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='nsdc_cert_number',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='nsdc_trade_name',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='skill_india_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='skill_badges',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='identity_verification_status',
            field=models.CharField(default='DEMO_UNVERIFIED', max_length=50),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='aadhaar_ekyc_status',
            field=models.CharField(default='DEMO_UNVERIFIED', max_length=50),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='police_verification_status',
            field=models.CharField(default='NOT_SUBMITTED', max_length=50),
        ),
        migrations.AddField(
            model_name='workerprofile',
            name='skill_verification_status',
            field=models.CharField(default='DEMO_UNVERIFIED', max_length=50),
        ),
        # CooperativeProposal
        migrations.CreateModel(
            name='CooperativeProposal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('proposal_id', models.CharField(max_length=50, unique=True)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('category', models.CharField(default='POLICY', max_length=50)),
                ('proposer_name', models.CharField(blank=True, max_length=150)),
                ('status', models.CharField(default='ACTIVE', max_length=50)),
                ('voting_type', models.CharField(default='YES_NO_ABSTAIN', max_length=50)),
                ('options', models.JSONField(blank=True, default=list)),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('quorum_needed', models.IntegerField(default=5)),
                ('total_votes', models.IntegerField(default=0)),
                ('tally', models.JSONField(blank=True, default=dict)),
                ('result_summary', models.TextField(blank=True, null=True)),
                ('is_public', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('proposer', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='coop_proposals', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        # CooperativeBallot
        migrations.CreateModel(
            name='CooperativeBallot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('voter_hash', models.CharField(db_index=True, max_length=64)),
                ('choice', models.CharField(max_length=100)),
                ('receipt_token', models.CharField(max_length=64, unique=True)),
                ('idempotency_key', models.CharField(blank=True, max_length=120, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('proposal', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ballots', to='workers.cooperativeproposal')),
            ],
            options={
                'unique_together': {('proposal', 'voter_hash')},
            },
        ),
        # CooperativeElection
        migrations.CreateModel(
            name='CooperativeElection',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('election_id', models.CharField(max_length=50, unique=True)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('role_title', models.CharField(max_length=150)),
                ('term', models.CharField(default='2026-2028', max_length=50)),
                ('status', models.CharField(default='ACTIVE', max_length=50)),
                ('candidates', models.JSONField(blank=True, default=list)),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('end_time', models.DateTimeField(blank=True, null=True)),
                ('winner_id', models.CharField(blank=True, max_length=50, null=True)),
                ('winner_name', models.CharField(blank=True, max_length=150, null=True)),
                ('total_votes', models.IntegerField(default=0)),
                ('results', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        # ElectionBallot
        migrations.CreateModel(
            name='ElectionBallot',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('voter_hash', models.CharField(db_index=True, max_length=64)),
                ('candidate_id', models.CharField(max_length=50)),
                ('receipt_token', models.CharField(max_length=64, unique=True)),
                ('idempotency_key', models.CharField(blank=True, max_length=120, null=True, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('election', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ballots', to='workers.cooperativeelection')),
            ],
            options={
                'unique_together': {('election', 'voter_hash')},
            },
        ),
        # TwoWayRating
        migrations.CreateModel(
            name='TwoWayRating',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating_type', models.CharField(choices=[('CUSTOMER_TO_WORKER', 'Customer to Worker'), ('WORKER_TO_CUSTOMER', 'Worker to Customer')], default='CUSTOMER_TO_WORKER', max_length=50)),
                ('overall_rating', models.IntegerField(default=5)),
                ('category_scores', models.JSONField(blank=True, default=dict)),
                ('review', models.TextField(blank=True, null=True)),
                ('is_flagged', models.BooleanField(default=False)),
                ('flag_reason', models.CharField(blank=True, max_length=255, null=True)),
                ('suspicion_score', models.FloatField(default=0.0)),
                ('is_disputed', models.BooleanField(default=False)),
                ('dispute_reason', models.TextField(blank=True, null=True)),
                ('dispute_status', models.CharField(choices=[('NONE', 'No Dispute'), ('PENDING_REVIEW', 'Under Peer Review'), ('RESOLVED_UPHELD', 'Dispute Upheld'), ('RESOLVED_DISMISSED', 'Dispute Dismissed')], default='NONE', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('booking', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='two_way_ratings', to='bookings.booking')),
                ('ratee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_two_way_ratings', to=settings.AUTH_USER_MODEL)),
                ('rater', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='submitted_two_way_ratings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('booking', 'rater')},
            },
        ),
        # PeerEndorsement
        migrations.CreateModel(
            name='PeerEndorsement',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('skill_name', models.CharField(max_length=100)),
                ('endorsement_note', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('endorsee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_peer_endorsements', to=settings.AUTH_USER_MODEL)),
                ('endorser', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='given_peer_endorsements', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('endorser', 'endorsee', 'skill_name')},
            },
        ),
        # GovernanceReviewCase
        migrations.CreateModel(
            name='GovernanceReviewCase',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('case_id', models.CharField(max_length=50, unique=True)),
                ('case_type', models.CharField(choices=[('RATING_DISPUTE', 'Rating Dispute'), ('SUSPICIOUS_BIAS_FLAG', 'Suspicious Bias Flag'), ('VERIFICATION_APPEAL', 'Verification Appeal')], default='RATING_DISPUTE', max_length=50)),
                ('status', models.CharField(choices=[('OPEN_IN_QUEUE', 'Open in Review Queue'), ('UNDER_PEER_REVIEW', 'Under Peer Review'), ('RESOLVED_UPHELD', 'Resolved Upheld'), ('RESOLVED_DISMISSED', 'Resolved Dismissed')], default='OPEN_IN_QUEUE', max_length=50)),
                ('resolution_notes', models.TextField(blank=True, null=True)),
                ('audit_trail', models.JSONField(blank=True, default=list)),
                ('evidence_items', models.JSONField(blank=True, default=list)),
                ('ai_recommendation', models.CharField(blank=True, max_length=200, null=True)),
                ('appeal_status', models.CharField(blank=True, default='NONE', max_length=50)),
                ('appeal_notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('raised_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='raised_governance_cases', to=settings.AUTH_USER_MODEL)),
                ('reviewer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_governance_cases', to=settings.AUTH_USER_MODEL)),
                ('target_rating', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='governance_cases', to='workers.twowayrating')),
                ('target_worker', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='worker_governance_cases', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        # WorkerSkill
        migrations.CreateModel(
            name='WorkerSkill',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('proficiency', models.CharField(choices=[('BEGINNER', 'Beginner'), ('SKILLED', 'Skilled'), ('CERTIFIED', 'Certified'), ('EXPERT', 'Expert')], default='SKILLED', max_length=20)),
                ('years_of_experience', models.IntegerField(default=1)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='category_skills', to='services.servicecategory')),
                ('worker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='worker_skills', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('worker', 'name')},
            },
        ),
        # WorkerCertification
        migrations.CreateModel(
            name='WorkerCertification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('certification_name', models.CharField(max_length=200)),
                ('issuing_organization', models.CharField(max_length=200)),
                ('credential_id', models.CharField(blank=True, max_length=100, null=True)),
                ('issue_date', models.DateField()),
                ('expiry_date', models.DateField(blank=True, null=True)),
                ('verification_status', models.CharField(choices=[('VERIFIED', 'Verified'), ('PENDING', 'Pending Verification'), ('EXPIRED', 'Expired'), ('REJECTED', 'Rejected'), ('DEMO_UNVERIFIED', 'Demo / Unverified')], default='PENDING', max_length=30)),
                ('verification_notes', models.TextField(blank=True, null=True)),
                ('document_url', models.CharField(blank=True, max_length=500, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_certifications', to=settings.AUTH_USER_MODEL)),
                ('worker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certifications', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        # WorkerSocialSecurity
        migrations.CreateModel(
            name='WorkerSocialSecurity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('scheme_code', models.CharField(choices=[('PMSBY', 'Pradhan Mantri Suraksha Bima Yojana (Accident Cover)'), ('PMJJBY', 'Pradhan Mantri Jeevan Jyoti Bima Yojana (Life Cover)'), ('PM_JAY', 'Ayushman Bharat PM-JAY (Health Cover)'), ('E_SHRAM', 'e-Shram Gig Worker National Registry'), ('PM_SYM', 'Pradhan Mantri Shram Yogi Maandhan (Pension)'), ('COOP_WELFARE', 'Cooperative Emergency Welfare Mutual Aid')], max_length=30)),
                ('scheme_name', models.CharField(max_length=150)),
                ('coverage_amount_inr', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('status', models.CharField(choices=[('ACTIVE', 'Active Coverage'), ('PENDING', 'Enrollment / Verification Pending'), ('EXPIRED', 'Coverage Expired / Renewal Needed'), ('NOT_ENROLLED', 'Not Enrolled'), ('UNVERIFIED', 'Unverified Claim')], default='NOT_ENROLLED', max_length=30)),
                ('policy_reference', models.CharField(blank=True, max_length=100, null=True)),
                ('enrolled_date', models.DateField(blank=True, null=True)),
                ('expiry_date', models.DateField(blank=True, null=True)),
                ('verified_by_cooperative', models.BooleanField(default=False)),
                ('verification_notes', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('worker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_security_records', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('worker', 'scheme_code')},
            },
        ),
    ]
