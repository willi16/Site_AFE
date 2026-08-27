from rest_framework import serializers
from .models import Document


def media_url(obj):
    if not obj.file:
        return None
    url = obj.file.url
    return url


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True, default="")
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    visible_to_display = serializers.CharField(source="get_visible_to_display", read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id", "title", "description", "file", "category",
            "category_display", "visible_to", "visible_to_display",
            "uploaded_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["uploaded_by", "created_at", "updated_at"]

    def get_file(self, obj):
        return media_url(obj)


class DocumentPublicSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "title", "description", "file", "category", "created_at"]
        read_only_fields = ["created_at"]

    def get_file(self, obj):
        return media_url(obj)
