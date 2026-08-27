from django.contrib import admin
from .models import FinancialRecord, MeetingReport, Attendance, Cotisation, GalleryItem


@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = ["title", "amount", "record_type", "date"]
    list_filter = ["record_type"]
    search_fields = ["title", "description"]


@admin.register(MeetingReport)
class MeetingReportAdmin(admin.ModelAdmin):
    list_display = ["title", "date", "visible_to"]
    search_fields = ["title", "summary"]


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ["member", "event_title", "event_date", "status"]
    list_filter = ["status"]


@admin.register(Cotisation)
class CotisationAdmin(admin.ModelAdmin):
    list_display = ["member", "label", "amount", "amount_paid", "status", "due_date"]
    list_filter = ["status"]
    search_fields = ["label", "member__user__username", "member__user__first_name", "member__user__last_name"]


@admin.register(GalleryItem)
class GalleryItemAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "file_type", "is_published", "created_at"]
    list_filter = ["category", "file_type", "is_published"]
