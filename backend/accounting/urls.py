from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FinancialRecordViewSet, MeetingReportViewSet,
    AttendanceViewSet, CotisationViewSet, GalleryItemViewSet,
)

router = DefaultRouter()
router.register(r"financial-records", FinancialRecordViewSet, basename="financial-record")
router.register(r"meeting-reports", MeetingReportViewSet, basename="meeting-report")
router.register(r"attendances", AttendanceViewSet, basename="attendance")
router.register(r"cotisations", CotisationViewSet, basename="cotisation")
router.register(r"gallery", GalleryItemViewSet, basename="gallery")

urlpatterns = [
    path("", include(router.urls)),
]
