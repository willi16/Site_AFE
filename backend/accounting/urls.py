from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FinancialRecordViewSet, MeetingReportViewSet

router = DefaultRouter()
router.register(r"financial-records", FinancialRecordViewSet, basename="financial-record")
router.register(r"meeting-reports", MeetingReportViewSet, basename="meeting-report")

urlpatterns = [
    path("", include(router.urls)),
]
