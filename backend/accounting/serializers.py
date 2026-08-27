from rest_framework import serializers
from .models import FinancialRecord, MeetingReport, Attendance, Cotisation, GalleryItem


def media_url(obj, field):
    value = getattr(obj, field, None)
    if not value:
        return None
    return value.url


def build_absolute(serializer, path):
    request = serializer.context.get("request")
    if request:
        return request.build_absolute_uri(path)
    return path


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


class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    member_email = serializers.CharField(source="member.email", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "member", "member_name", "member_email", "event",
            "event_title", "event_date", "status", "status_display",
            "notes", "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]


class CotisationSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    member_email = serializers.CharField(source="member.email", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True, default="")
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cotisation
        fields = [
            "id", "member", "member_name", "member_email", "event", "event_title",
            "label", "amount", "amount_paid", "balance", "status", "status_display",
            "due_date", "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]


class GalleryItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)
    media_url = serializers.SerializerMethodField()
    is_video = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default="")

    class Meta:
        model = GalleryItem
        fields = [
            "id", "title", "image", "image_url", "video", "video_url", "video_platform",
            "media_url", "is_video", "caption", "category", "file_type",
            "is_published", "created_by_name", "created_at",
        ]
        read_only_fields = ["created_by", "created_at"]

    def get_media_url(self, obj):
        if obj.file_type == "video":
            if obj.video_url:
                return obj.video_url
            if obj.video:
                return build_absolute(self, obj.video.url)
            return None
        if obj.image_url:
            return obj.image_url
        if obj.image:
            return build_absolute(self, obj.image.url)
        return None

    def get_is_video(self, obj):
        return obj.file_type == "video"
