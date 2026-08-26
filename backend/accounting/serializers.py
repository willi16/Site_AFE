from rest_framework import serializers
from .models import FinancialRecord, MeetingReport


class FinancialRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default="")
    record_type_display = serializers.CharField(source="get_record_type_display", read_only=True)

    class Meta:
        model = FinancialRecord
        fields = [
            "id", "title", "description", "amount", "record_type",
            "record_type_display", "category", "date", "receipt",
            "created_by_name", "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]


class MeetingReportSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default="")

    class Meta:
        model = MeetingReport
        fields = [
            "id", "title", "date", "summary", "file",
            "visible_to", "created_by_name", "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]
