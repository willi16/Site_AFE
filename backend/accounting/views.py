from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FinancialRecord, MeetingReport, Attendance, Cotisation, GalleryItem, Donation, Notification
from .serializers import (
    FinancialRecordSerializer, MeetingReportSerializer,
    AttendanceSerializer, CotisationSerializer, GalleryItemSerializer,
    DonationSerializer, DonationCreateSerializer, NotificationSerializer,
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

    @action(detail=False, methods=["get"], url_path="etat-global")
    def etat_global(self, request):
        from django.db.models import Sum, Q
        from members.models import Member

        # pénalités de retard / absence
        ABSENT_FEE = 500
        EXCUSE_FEE = 200

        members = Member.objects.select_related("user").all()
        rows = []
        calendar = request.query_params.get("period")
        for m in members:
            cotis = m.cotisations.all()
            if calendar:
                from datetime import datetime
                try:
                    month = datetime.strptime(calendar, "%Y-%m")
                    cotis = cotis.filter(due_date__year=month.year, due_date__month=month.month)
                except ValueError:
                    pass
            total_due = cotis.aggregate(s=Sum("amount"))["s"] or 0
            total_paid = cotis.aggregate(s=Sum("amount_paid"))["s"] or 0

            atts = m.attendances.all()
            n_absent = atts.filter(status="absent").count()
            n_excuse = atts.filter(status="excuse").count()
            penalties = n_absent * ABSENT_FEE + n_excuse * EXCUSE_FEE

            rows.append({
                "member_id": m.id,
                "full_name": m.full_name,
                "email": m.email,
                "role": m.role,
                "total_due": total_due,
                "total_paid": total_paid,
                "balance": total_due - total_paid,
                "absences": n_absent,
                "excuses": n_excuse,
                "penalties": penalties,
                "grand_total": (total_due - total_paid) + penalties,
            })

        rows.sort(key=lambda r: (-r["grand_total"], r["full_name"].lower()))
        totals = {
            "total_due": sum(r["total_due"] for r in rows),
            "total_paid": sum(r["total_paid"] for r in rows),
            "balance": sum(r["balance"] for r in rows),
            "penalties": sum(r["penalties"] for r in rows),
            "grand_total": sum(r["grand_total"] for r in rows),
        }
        return Response({"members": rows, "totals": totals})


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


class IsSecretaryOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "secretary")
        )


class DonationViewSet(viewsets.ModelViewSet):
    serializer_class = DonationSerializer
    permission_classes = [IsSecretaryOrAdmin]
    http_method_names = ["get", "post"]

    def get_permissions(self):
        if self.action == "create":
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        return Donation.objects.all()

    def get_serializer_class(self):
        if self.action == "create":
            return DonationCreateSerializer
        return DonationSerializer

    def create(self, request, *args, **kwargs):
        serializer = DonationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donation = serializer.save()

        # Notifier le secrétaire / l'admin du nouveau don
        from django.apps import apps
        Member = apps.get_model("members", "Member")
        for member in Member.objects.filter(role__in=["admin", "secretary"]):
            Notification.objects.create(
                recipient=member,
                title="Nouveau don reçu",
                message=f"{donation.donor_name} a fait un don de {donation.amount} ({donation.method} - {donation.target_number}).",
            )

        return Response(
            {"message": "Merci pour votre généreux don ! Le secrétaire a été notifié."},
            status=status.HTTP_201_CREATED,
        )


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsSecretaryOrAdmin]
    http_method_names = ["get", "post", "patch"]

    def get_queryset(self):
        if not (self.request.user.is_authenticated and hasattr(self.request.user, "member_profile")):
            return Notification.objects.none()
        return Notification.objects.filter(recipient__user=self.request.user).order_by("-created_at")

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"detail": "Toutes les notifications ont été marquées comme lues."})

    @action(detail=False, methods=["get"])
    def unread(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"count": count})
