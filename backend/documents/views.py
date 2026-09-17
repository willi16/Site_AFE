from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from django.core.files.storage import default_storage
from pathlib import Path
import mimetypes

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from afe_api.validators import validate_upload, ALLOWED_DOCUMENTS
from .models import Document
from .serializers import DocumentSerializer, DocumentPublicSerializer


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
        # Membres, bureau et admin connectés : accès à tous les documents.
        if (
            user.is_authenticated
            and getattr(user, "member_profile", None)
        ):
            return Document.objects.all()
        # Visiteurs (non connectés) : uniquement les documents publics
        # (règlement intérieur + statuts).
        return Document.objects.filter(visible_to="public")

    def perform_create(self, serializer):
        try:
            _validate_uploaded_file(self.request)
        except Exception as exc:
            raise ValidationError(detail=str(exc))
        doc = serializer.save(uploaded_by=self.request.user)
        self._attach_upload(doc)

    def perform_update(self, serializer):
        try:
            _validate_uploaded_file(self.request)
        except Exception as exc:
            raise ValidationError(detail=str(exc))
        doc = serializer.save(uploaded_by=self.request.user)
        self._attach_upload(doc)

    def _attach_upload(self, doc):
        """Persiste le fichier envoyé en multipart en base de données.

        Le champ `file` du serializer est un SerializerMethodField (lecture
        seule) : le fichier envoyé par le bureau n'était jamais enregistré
        (document sans fichier → pas de bouton Visionner/Télécharger pour les
        membres). Le disque de Render étant éphémère et Cloudinary refusant la
        livraison raw (401), le contenu est stocké en base (Postgres survit
        aux redéploiements) et diffusé via /serve/ (authentifié)."""
        upload = self.request.FILES.get("file")
        if upload is None:
            return
        MAX = 25 * 1024 * 1024
        if upload.size > MAX:
            raise ValidationError(detail="Fichier trop volumineux (max 25 Mo).")
        doc.file_data = upload.read()
        doc._upload_name = upload.name
        if doc.file and doc.file.name:
            try:
                doc.file.delete(save=False)
            except Exception:
                pass
        doc.file = ""
        doc.save(update_fields=["file_data", "file"])

    @action(detail=True, methods=["get"], url_path="serve")
    def serve(self, request, pk=None):
        """Diffuse le fichier d'un document (visionnage / téléchargement)."""
        doc = self.get_object()
        if doc.file_data:
            name = getattr(doc, "_upload_name", None) or doc.title
            content_type = mimetypes.guess_type(name)[0] or "application/pdf"
            response = HttpResponse(bytes(doc.file_data), content_type=content_type)
            response["Content-Disposition"] = f'inline; filename="{Path(name).name}"'
            response["X-Frame-Options"] = "ALLOWALL"
            return response
        path = self._local_path(doc)
        if not path:
            raise Http404("Fichier introuvable.")
        response = FileResponse(open(path, "rb"))
        response["Content-Disposition"] = f'inline; filename="{Path(path).name}"'
        # Autorise l'affichage du PDF dans une iframe du site public (ex. Vercel)
        response["X-Frame-Options"] = "ALLOWALL"
        return response

    def _local_path(self, doc):
        rel = doc.file.name if doc.file else ""
        if not rel or rel.startswith(("http://", "https://")):
            return None
        seed_file = Path(settings.BASE_DIR) / "seed" / rel
        if seed_file.exists():
            return str(seed_file)
        try:
            if default_storage.exists(rel):
                return default_storage.path(rel)
        except (NotImplementedError, OSError):
            pass
        return None
