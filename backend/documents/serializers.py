from rest_framework import serializers
from .models import Document


def media_url(obj, request=None):
    """Retourne l'URL d'accès au fichier d'un document.

    - Documents contenus en base (upload du bureau : `file_data`) → endpoint
      protégé `/api/documents/<id>/serve/`.
    - Documents seed/ (`file` relatif) → même endpoint serve (lecture depuis
      seed/).
    - Fichiers hébergés en externe (nom stocké = URL complète) → tels quels.
    """
    if obj.file_data:
        return _serve_path(obj, request)
    if not obj.file:
        return None
    name = obj.file.name
    if name.startswith(("http://", "https://")):
        return name
    return _serve_path(obj, request)


def _serve_path(obj, request=None):
    serve_path = f"/api/documents/{obj.id}/serve/"
    if request is not None:
        return request.build_absolute_uri(serve_path)
    return serve_path


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True, default="")
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    visible_to_display = serializers.CharField(source="get_visible_to_display", read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id", "title", "description", "file", "category",
            "category_display", "visible_to", "visible_to_display",
            "uploaded_by_name", "created_at", "updated_at",
        ]
        read_only_fields = ["uploaded_by", "created_at", "updated_at"]

    def get_file(self, obj):
        return media_url(obj, self.context.get("request"))


class DocumentPublicSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ["id", "title", "description", "file", "category", "category_display", "created_at"]
        read_only_fields = ["created_at"]

    def get_file(self, obj):
        return media_url(obj, self.context.get("request"))
