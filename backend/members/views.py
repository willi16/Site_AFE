from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.db.models.deletion import ProtectedError
from .models import Member, BureauMember, MembershipApplication, AssociationSettings
from .serializers import (
    MemberSerializer, MemberPublicSerializer, MemberRegisterSerializer,
    BureauMemberSerializer, MembershipApplicationSerializer,
    MembershipApplicationCreateSerializer, AssociationSettingsSerializer,
    generate_username,
)


def get_settings():
    obj, _ = AssociationSettings.objects.get_or_create(pk=1)
    return obj


class MemberPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class IsEditorOrReadOnly(permissions.BasePermission):
    """Ecriture réservée au secrétaire et à l'admin ; les autres membres du bureau consultent uniquement."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "secretary")
        )


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    permission_classes = [IsEditorOrReadOnly]
    pagination_class = MemberPagination
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["user__username", "user__first_name", "user__last_name", "user__email", "phone", "role"]
    ordering_fields = ["user__first_name", "user__last_name", "joined_date", "role"]
    ordering = ["user__last_name"]

    def get_queryset(self):
        qs = Member.objects.all()
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        if self.request.user.is_authenticated and hasattr(self.request.user, "member_profile"):
            if self.request.user.member_profile.role in ("bureau", "admin", "secretary"):
                return qs
        return qs.filter(is_active_member=True, show_in_directory=True)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        member = Member.objects.get(user=request.user)
        serializer = MemberSerializer(member)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def directory(self, request):
        members = Member.objects.filter(is_active_member=True, show_in_directory=True)
        serializer = MemberPublicSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def founders(self, request):
        members = Member.objects.filter(is_founder=True).order_by(
            "-is_initiator", "joined_date"
        )
        serializer = MemberPublicSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = MemberRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": "Inscription réussie. Bienvenue !"},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="apply")
    def apply(self, request):
        serializer = MembershipApplicationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, app = serializer.save()

        # Notify bureau members
        bureau_members = Member.objects.filter(role__in=["bureau", "admin"])
        for bm in bureau_members:
            try:
                send_mail(
                    subject=f"Nouvelle candidature de {user.get_full_name()}",
                    message=f"{user.get_full_name()} ({user.email}) a soumis une candidature d'adhésion.\n\nMotivation : {app.motivation}\n\nConnectez-vous pour examiner la candidature.",
                    from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@afe-association.org',
                    recipient_list=[bm.user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return Response(
            {"message": "Votre candidature a été soumise avec succès. Le bureau l'examinera prochainement."},
            status=status.HTTP_201_CREATED,
        )


    @action(detail=False, methods=["post"], url_path="staff-create")
    def staff_create(self, request):
        data = request.data
        username = data.get("username") or ""
        password = data.get("password") or User.objects.make_random_password()
        email = data.get("email", "")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        role = data.get("role", "member")
        if not username:
            username = generate_username(first_name, last_name, email)
        if User.objects.filter(username=username).exists():
            return Response({"username": ["Utilisateur déjà existant."]}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)
        member = Member.objects.create(
            user=user,
            role=role if role in dict(Member.ROLE_CHOICES) else "member",
            phone=data.get("phone", ""),
            rgpd_consent=True,
            membership_status=True,
        )
        serializer = MemberSerializer(member)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        member = self.get_object()
        if request.user == member.user:
            return Response(
                {"relation_error": "Vous ne pouvez pas supprimer votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if member.role in ("admin", "secretary", "treasurer", "bureau"):
            return Response(
                {"relation_error": f"Impossible de supprimer {member.full_name} : ce membre occupe une fonction au sein du bureau. Réassignez d'abord son poste avant de le supprimer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError as e:
            names = ", ".join(sorted({f.__class__._meta.verbose_name for f, _ in e.protected_objects})) or "d'autres données"
            return Response(
                {"relation_error": f"Impossible de supprimer {member.full_name} : ce membre est encore lié à des enregistrements ({names}). Supprimez d'abord ou désactivez le membre."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def _set_account_status(self, member, account_status):
        member.account_status = account_status
        member.save(update_fields=["account_status"])
        user = member.user
        user.is_active = account_status == "active"
        user.save(update_fields=["is_active"])

    def _check_target_not_self(self, request, member, action_label):
        if request.user == member.user:
            return Response(
                {"detail": f"Vous ne pouvez pas {action_label} votre propre compte."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        member = self.get_object()
        err = self._check_target_not_self(request, member, "activer")
        if err:
            return err
        self._set_account_status(member, "active")
        return Response({"detail": f"Le compte de {member.full_name} a été activé."})

    @action(detail=True, methods=["post"], url_path="suspend")
    def suspend(self, request, pk=None):
        member = self.get_object()
        err = self._check_target_not_self(request, member, "suspendre")
        if err:
            return err
        self._set_account_status(member, "suspended")
        return Response({"detail": f"Le compte de {member.full_name} a été suspendu."})

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        member = self.get_object()
        err = self._check_target_not_self(request, member, "désactiver")
        if err:
            return err
        self._set_account_status(member, "deactivated")
        return Response({"detail": f"Le compte de {member.full_name} a été désactivé."})


class BureauMemberViewSet(viewsets.ModelViewSet):
    serializer_class = BureauMemberSerializer
    permission_classes = [IsEditorOrReadOnly]

    def get_queryset(self):
        return BureauMember.objects.all()


class AssociationSettingsView(viewsets.ViewSet):
    def list(self, request):
        settings_obj = get_settings()
        serializer = AssociationSettingsSerializer(settings_obj)
        return Response(serializer.data)

    def create(self, request):
        settings_obj = get_settings()
        if request.FILES.get("collective_photo"):
            settings_obj.collective_photo = request.FILES["collective_photo"]
        if request.FILES.get("cover_photo"):
            settings_obj.cover_photo = request.FILES["cover_photo"]
        settings_obj.save()
        serializer = AssociationSettingsSerializer(settings_obj)
        return Response(serializer.data)


class MembershipApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipApplicationSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, "member_profile"):
            if self.request.user.member_profile.role in ("bureau", "admin", "secretary"):
                return MembershipApplication.objects.all()
        return MembershipApplication.objects.none()

    def perform_update(self, serializer):
        app = serializer.save(reviewed_by=self.request.user)

        # Notify the applicant
        if app.status in ("approved", "rejected"):
            try:
                status_text = "approuvée" if app.status == "approved" else "rejetée"
                send_mail(
                    subject=f"Votre candidature a été {status_text}",
                    message=f"Bonjour {app.user.get_full_name()},\n\nVotre candidature d'adhésion à l'AFE a été {status_text} par le bureau.\n\n{app.review_note}\n\nCordialement,\nL'équipe de l'AFE",
                    from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@afe-association.org',
                    recipient_list=[app.user.email],
                    fail_silently=True,
                )
            except Exception:
                pass
