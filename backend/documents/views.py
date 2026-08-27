from rest_framework import viewsets, permissions
from .models import Document
from .serializers import DocumentSerializer, DocumentPublicSerializer


class IsBureauOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "secretary")
        )


class DocumentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBureauOrReadOnly]

    def get_serializer_class(self):
        if self.action == "list":
            if self.request.user.is_authenticated:
                return DocumentSerializer
            return DocumentPublicSerializer
        return DocumentSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Document.objects.filter(visible_to="public")
        if hasattr(user, "member_profile") and user.member_profile.role in ("bureau", "admin", "secretary"):
            return Document.objects.all()
        return Document.objects.filter(visible_to__in=["public", "members"])

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
