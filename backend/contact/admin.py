from django.contrib import admin
from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "subject", "is_read", "created_at"]
    list_filter = ["subject", "is_read"]
    search_fields = ["full_name", "email", "message"]
