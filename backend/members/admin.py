from django.contrib import admin
from .models import Member, BureauMember


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ["user", "role", "membership_status", "is_active_member", "is_founder", "is_initiator"]
    list_filter = ["role", "membership_status", "is_active_member", "is_founder", "is_initiator"]
    search_fields = ["user__first_name", "user__last_name", "user__email"]


@admin.register(BureauMember)
class BureauMemberAdmin(admin.ModelAdmin):
    list_display = ["member", "position", "display_order"]
    list_filter = ["position"]
