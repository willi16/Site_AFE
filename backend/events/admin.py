from django.contrib import admin
from .models import Event, EventImage, Actualite


class EventImageInline(admin.TabularInline):
    model = EventImage
    extra = 1


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "event_date", "status", "is_published"]
    list_filter = ["status", "is_published"]
    search_fields = ["title", "description"]
    inlines = [EventImageInline]


@admin.register(Actualite)
class ActualiteAdmin(admin.ModelAdmin):
    list_display = ["title", "is_published", "created_at"]
    list_filter = ["is_published"]
    search_fields = ["title", "content"]
