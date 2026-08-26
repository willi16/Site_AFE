from rest_framework import serializers
from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "full_name", "email", "phone", "subject", "message", "created_at"]
        read_only_fields = ["is_read", "created_at"]


class ContactMessageAdminSerializer(serializers.ModelSerializer):
    subject_display = serializers.CharField(source="get_subject_display", read_only=True)

    class Meta:
        model = ContactMessage
        fields = [
            "id", "full_name", "email", "phone", "subject",
            "subject_display", "message", "is_read", "created_at",
        ]
        read_only_fields = ["created_at"]
