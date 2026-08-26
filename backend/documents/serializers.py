from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True, default="")
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    visible_to_display = serializers.CharField(source="get_visible_to_display", read_only=True)

    class Meta:
        model = Document
        fields = [
            "id", "title", "description", "file", "category",
            "category_display", "visible_to", "visible_to_display",
            "uploaded_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["uploaded_by", "created_at", "updated_at"]


class DocumentPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "title", "description", "file", "category", "created_at"]
        read_only_fields = ["created_at"]
