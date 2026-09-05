from rest_framework import serializers
from services.models import ServiceCategory, SystemSetting, ServiceCatalogItem

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ('id', 'name', 'is_active', 'description', 'icon', 'base_labour_charge')

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = (
            'id', 'company_name', 'company_logo', 'contact_details',
            'gst_percentage', 'support_email', 'support_phone',
            'terms_conditions', 'privacy_policy'
        )


class ServiceCatalogItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ServiceCatalogItem
        fields = (
            'id', 'category', 'category_name', 'name', 'slug', 'description',
            'typical_duration_minutes', 'estimated_base_price', 'estimated_max_price',
            'pricing_guidance', 'required_skills', 'required_certification_level',
            'is_restricted', 'icon', 'is_active'
        )
