from rest_framework import viewsets, permissions
from .models import FinancialRecord, MeetingReport
from .serializers import FinancialRecordSerializer, MeetingReportSerializer


class IsBureau(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("bureau", "admin", "treasurer")
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
