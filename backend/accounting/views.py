from rest_framework import viewsets, permissions
from .models import FinancialRecord, MeetingReport, Attendance, Cotisation, GalleryItem
from .serializers import (
    FinancialRecordSerializer, MeetingReportSerializer,
    AttendanceSerializer, CotisationSerializer, GalleryItemSerializer,
)


class IsBureau(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "treasurer")
        )


class IsAdminOrBureauReadWrite(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "secretary")
        )


class FinancialRecordViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialRecordSerializer
    permission_classes = [IsBureau]

    def get_queryset(self):
        return FinancialRecord.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MeetingReportViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingReportSerializer
    permission_classes = [IsBureau]

    def get_queryset(self):
        return MeetingReport.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsBureau]

    def get_queryset(self):
        qs = Attendance.objects.select_related("member__user", "event")
        event_id = self.request.query_params.get("event")
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    def perform_create(self, serializer):
        event = serializer.validated_data.get("event")
        event_title = ""
        event_date = None
        if event:
            event_title = event.title
            event_date = event.event_date.date() if event.event_date else None
        serializer.save(
            created_by=self.request.user,
            event_title=event_title or serializer.validated_data.get("event_title", ""),
            event_date=event_date,
        )

    def perform_update(self, serializer):
        event = serializer.validated_data.get("event")
        data = dict(serializer.validated_data)
        if event:
            data["event_title"] = event.title
            data["event_date"] = event.event_date.date() if event.event_date else None
        data["created_by"] = self.request.user
        serializer.save(**data)


class CotisationViewSet(viewsets.ModelViewSet):
    serializer_class = CotisationSerializer
    permission_classes = [IsBureau]

    def get_queryset(self):
        qs = Cotisation.objects.select_related("member__user", "event")
        member_id = self.request.query_params.get("member")
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)


class GalleryItemViewSet(viewsets.ModelViewSet):
    serializer_class = GalleryItemSerializer
    permission_classes = [IsAdminOrBureauReadWrite]

    def get_queryset(self):
        qs = GalleryItem.objects.all()
        if not (self.request.user.is_authenticated and hasattr(self.request.user, "member_profile")):
            qs = qs.filter(is_published=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
