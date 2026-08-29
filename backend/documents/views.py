from django.http import FileResponse, Http404
from django.conf import settings
from django.core.files.storage import default_storage
from pathlib import Path

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from afe_api.validators import validate_upload, ALLOWED_DOCUMENTS
from .models import Document
from .serializers import DocumentSerializer, DocumentPublicSerializer


def _resolve_document_path(doc):
    """Retourne le chemin réel du fichier d'un document.

    On privilégie le dossier seed/ (versionné dans git, donc toujours présent
    sur Render) puis le MEDIA_ROOT (pour les documents uploadés)."""
    rel = doc.file.name
    if not rel:
        return None
    seed_file = Path(settings.BASE_DIR) / "seed" / rel
    if seed_file.exists():
        return str(seed_file)
    if default_storage.exists(rel):
        return default_storage.path(rel)
    return None


def _validate_uploaded_file(request):
    upload = request.FILES.get("file")
    if upload is not None:
        validate_upload(ALLOWED_DOCUMENTS)(upload)


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
            return Document.objects.all()
        if hasattr(user, "member_profile") and user.member_profile.role in ("bureau", "admin", "secretary"):
            return Document.objects.all()
        return Document.objects.filter(visible_to__in=["public", "members"])

    def perform_create(self, serializer):
        try:
            _validate_uploaded_file(self.request)
        except Exception as exc:
            raise ValidationError(detail=str(exc))
        serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        try:
            _validate_uploaded_file(self.request)
        except Exception as exc:
            raise ValidationError(detail=str(exc))
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=["get"], url_path="serve")
    def serve(self, request, pk=None):
        """Diffuse le fichier d'un document (visionnage / téléchargement)."""
        doc = self.get_object()
        path = _resolve_document_path(doc)
        if not path:
            raise Http404("Fichier introuvable.")
        response = FileResponse(open(path, "rb"))
        response["Content-Disposition"] = f'inline; filename="{Path(path).name}"'
        # Autorise l'affichage du PDF dans une iframe du site public (ex. Vercel)
        response["X-Frame-Options"] = "ALLOWALL"
        return response
