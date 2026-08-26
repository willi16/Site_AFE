from django.contrib import admin
from .models import FinancialRecord, MeetingReport


@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = ["title", "amount", "record_type", "date"]
    list_filter = ["record_type"]
    search_fields = ["title", "description"]


@admin.register(MeetingReport)
class MeetingReportAdmin(admin.ModelAdmin):
    list_display = ["title", "date", "visible_to"]
    search_fields = ["title", "summary"]
