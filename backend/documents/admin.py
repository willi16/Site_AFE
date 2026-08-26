from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "visible_to", "created_at"]
    list_filter = ["category", "visible_to"]
    search_fields = ["title", "description"]
