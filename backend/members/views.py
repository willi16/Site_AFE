from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from .models import Member, BureauMember, MembershipApplication, AssociationSettings
from .serializers import (
    MemberSerializer, MemberPublicSerializer, MemberRegisterSerializer,
    BureauMemberSerializer, MembershipApplicationSerializer,
    MembershipApplicationCreateSerializer, AssociationSettingsSerializer,
)


def get_settings():
    obj, _ = AssociationSettings.objects.get_or_create(pk=1)
    return obj


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

    def get_queryset(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, "member_profile"):
            if self.request.user.member_profile.role in ("bureau", "admin", "secretary"):
                return Member.objects.all()
        return Member.objects.filter(is_active_member=True, show_in_directory=True)

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
        username = data.get("username")
        password = data.get("password") or User.objects.make_random_password()
        email = data.get("email", "")
        first_name = data.get("first_name", "")
        last_name = data.get("last_name", "")
        role = data.get("role", "member")
        if not username:
            return Response({"detail": "username requis"}, status=status.HTTP_400_BAD_REQUEST)
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
