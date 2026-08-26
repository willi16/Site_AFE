from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Member, BureauMember
from .serializers import (
    MemberSerializer, MemberPublicSerializer, MemberRegisterSerializer,
    BureauMemberSerializer,
)


class IsAdminOrBureau(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("bureau", "admin")
        )


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer
    permission_classes = [IsAdminOrBureau]

    def get_queryset(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, "member_profile"):
            if self.request.user.member_profile.role in ("bureau", "admin"):
                return Member.objects.all()
        return Member.objects.filter(is_active_member=True, show_in_directory=True)

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


class BureauMemberViewSet(viewsets.ModelViewSet):
    serializer_class = BureauMemberSerializer
    permission_classes = [IsAdminOrBureau]

    def get_queryset(self):
        return BureauMember.objects.all()
