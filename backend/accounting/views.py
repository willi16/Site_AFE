from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination


class CotisationPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
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


class IsBureauOrSecretary(permissions.BasePermission):
    """Présences gérées par le trésorier, l'admin ET le secrétaire ; les autres membres du bureau consultent uniquement."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "treasurer", "secretary")
        )


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsBureauOrSecretary]

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
    pagination_class = CotisationPagination

    def get_queryset(self):
        qs = Cotisation.objects.select_related("member__user", "event")
        member_id = self.request.query_params.get("member")
        if member_id:
            qs = qs.filter(member_id=member_id)
        event_id = self.request.query_params.get("event")
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], url_path="etat-global")
    def etat_global(self, request):
        from django.db.models import Sum, Q, Value, DecimalField
        from django.db.models.functions import Coalesce
        from members.models import Member
        from functools import reduce
        import operator
        from datetime import datetime

        ABSENT_FEE = 500
        EXCUSE_FEE = 200

        ASSISTANCE_TYPES = [
            {"type": "mariage", "label": "Mariage", "amount": 100000, "keywords": ["mariage"]},
            {"type": "naissance", "label": "Nouvelle naissance", "amount": 50000, "keywords": ["naissance"]},
            {"type": "hospitalisation", "label": "Hospitalisation (selon le cas du BE)", "amount": 100000, "keywords": ["hospitalisation"]},
            {"type": "deces", "label": "Décès (père, mère, belle-famille)", "amount": 250000, "keywords": ["décès", "deuil"]},
            {"type": "liberation", "label": "Libération (membre / femme)", "amount": 50000, "keywords": ["libération"]},
        ]

        start = request.query_params.get("start_date")
        end = request.query_params.get("end_date")
        calendar = request.query_params.get("period")

        def coti_filter():
            f = {}
            if start:
                f["due_date__gte"] = start
            if end:
                f["due_date__lte"] = end
            if calendar and not start and not end:
                try:
                    month = datetime.strptime(calendar, "%Y-%m")
                    f["due_date__year"] = month.year
                    f["due_date__month"] = month.month
                except ValueError:
                    pass
            return f

        def att_filter():
            f = {}
            if start:
                f["event_date__gte"] = start
            if end:
                f["event_date__lte"] = end
            return f

        members = Member.objects.select_related("user").all()
        rows = []

        for m in members:
            cotis = m.cotisations.all().filter(**coti_filter())
            total_due = cotis.aggregate(s=Coalesce(Sum("amount", output_field=DecimalField()), Value(0), output_field=DecimalField()))["s"]
            total_paid = cotis.aggregate(s=Coalesce(Sum("amount_paid", output_field=DecimalField()), Value(0), output_field=DecimalField()))["s"]

            atts = m.attendances.all().filter(**att_filter())
            n_present = atts.filter(status="present").count()
            n_absent = atts.filter(status="absent").count()
            n_excuse = atts.filter(status="excuse").count()
            penalties = n_absent * ABSENT_FEE + n_excuse * EXCUSE_FEE
            balance = total_due - total_paid
            if balance <= 0:
                status_label = "À jour"
            elif total_paid > 0:
                status_label = "En retard (partiel)"
            else:
                status_label = "Non payé"

            rows.append({
                "member_id": m.id,
                "full_name": m.full_name,
                "email": m.email,
                "role": m.role,
                "present": n_present,
                "absences": n_absent,
                "excuses": n_excuse,
                "total_due": total_due,
                "total_paid": total_paid,
                "balance": balance,
                "penalties": penalties,
                "status": status_label,
            })

        rows.sort(key=lambda r: (-r["absences"], -r["balance"], r["full_name"].lower()))

        all_cotis = Cotisation.objects.all().filter(**coti_filter())
        assistances = []
        for a in ASSISTANCE_TYPES:
            q = reduce(operator.or_, [Q(label__icontains=k) for k in a["keywords"]])
            matches = all_cotis.filter(q)
            ev_ids = {c.event_id for c in matches if c.event_id}
            count = len(ev_ids) + matches.filter(event_id__isnull=True).count()
            if count:
                assistances.append({
                    "type": a["type"],
                    "label": a["label"],
                    "amount": a["amount"],
                    "count": count,
                    "total": a["amount"] * count,
                })

        total_disbursed = sum(x["total"] for x in assistances)
        total_assistances = sum(x["count"] for x in assistances)

        totals = {
            "total_due": sum(r["total_due"] for r in rows),
            "total_paid": sum(r["total_paid"] for r in rows),
            "balance": sum(r["balance"] for r in rows),
            "penalties": sum(r["penalties"] for r in rows),
            "total_present": sum(r["present"] for r in rows),
            "total_absent": sum(r["absences"] for r in rows),
            "total_excuse": sum(r["excuses"] for r in rows),
            "total_disbursed": total_disbursed,
            "total_assistances": total_assistances,
        }
        # Pagination serveur pour la table des membres
        from rest_framework.pagination import PageNumberPagination

        class _P(PageNumberPagination):
            page_size = 10
            page_size_query_param = "page_size"
            max_page_size = 100

        paginator = _P()
        page = paginator.paginate_queryset(rows, request, view=self)
        return Response({
            "members": rows if page is None else page,
            "count": len(rows),
            "totals": totals,
            "assistances": assistances,
            "start_date": start,
            "end_date": end,
            "period": calendar,
        })


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
