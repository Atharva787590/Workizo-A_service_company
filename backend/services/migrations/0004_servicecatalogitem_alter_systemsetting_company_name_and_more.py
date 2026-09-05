# Generated for UNNATI Cooperative Platform (SIH 2026)

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0003_systemsetting_rating_is_hidden_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='systemsetting',
            name='company_name',
            field=models.CharField(default='UNNATI', max_length=100),
        ),
        migrations.AlterField(
            model_name='systemsetting',
            name='support_email',
            field=models.EmailField(default='support@unnati.coop', max_length=254),
        ),
        migrations.CreateModel(
            name='ServiceCatalogItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('slug', models.SlugField(blank=True, max_length=160)),
                ('description', models.TextField()),
                ('typical_duration_minutes', models.PositiveIntegerField(default=60)),
                ('estimated_base_price', models.DecimalField(decimal_places=2, default=299.0, max_digits=10)),
                ('estimated_max_price', models.DecimalField(decimal_places=2, default=599.0, max_digits=10)),
                ('pricing_guidance', models.TextField(default='Covers standard inspection + labor up to duration. Parts and complex diagnostics billed transparently on-site with zero platform commission.')),
                ('required_skills', models.JSONField(blank=True, default=list)),
                ('required_certification_level', models.CharField(choices=[('BEGINNER', 'Beginner'), ('SKILLED', 'Skilled'), ('CERTIFIED', 'Certified'), ('EXPERT', 'Expert')], default='SKILLED', max_length=30)),
                ('is_restricted', models.BooleanField(default=False)),
                ('icon', models.CharField(blank=True, max_length=100, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='catalog_items', to='services.servicecategory')),
            ],
            options={
                'ordering': ['category', 'name'],
            },
        ),
    ]
