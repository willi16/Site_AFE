"""
Validation des fichiers téléversés (upload) pour l'API AFE.

Objectif de sécurité : empêcher le téléversement de fichiers dangereux
(fichiers exécutables, scripts HTML/JS qui pourraient provoquer du
« stored XSS » ou de la défiguration du site, fichiers PHP, etc.).

À utiliser dans les serializers DRF avec :
    file = serializers.FileField(validators=[validate_upload(allowed=[...])])
"""

import os

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible

# Extensions interdites (fichiers potentiellement exécutables / scripts)
BLOCKED_EXTENSIONS = {
    "php", "phtml", "php3", "php4", "php5", "php7", "phar",
    "exe", "dll", "bat", "cmd", "com", "msi", "sh", "bash", "csh",
    "js", "jsx", "mjs", "py", "rb", "pl", "asm", "jar",
    "html", "htm", "shtml", "xhtml", "asp", "aspx", "jsp", "cfm",
    "svgz",
}

# Extensions autorisées par catégorie de destination
ALLOWED_IMAGES = {"jpg", "jpeg", "png", "gif", "webp", "bmp"}
ALLOWED_DOCUMENTS = {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "odt", "ods", "odp"}
ALLOWED_VIDEOS = {"mp4", "webm", "mov", "avi", "mkv", "m4v"}


def _get_extension(filename):
    ext = os.path.splitext((filename or "").lower())[1].lstrip(".")
    return ext


@deconstructible
class UploadFileValidator:
    """Valide qu'un fichier téléversé a une extension autorisée et non dangereuse."""

    def __init__(self, allowed_extensions=None):
        self.allowed_extensions = set(allowed_extensions) if allowed_extensions else None

    def __call__(self, value):
        name = getattr(value, "name", "") or ""
        ext = _get_extension(name)

        # Double extension (ex. "photo.jpg.php") -> rejetée
        base = os.path.basename(name).lower()
        if base.count(".") > 1:
            raise ValidationError("Nom de fichier non autorisé (extension multiple détectée).")

        if ext in BLOCKED_EXTENSIONS:
            raise ValidationError(f"Ce type de fichier (.{ext}) n'est pas autorisé.")

        if self.allowed_extensions is not None and ext not in self.allowed_extensions:
            allowed = ", ".join(sorted(self.allowed_extensions))
            raise ValidationError(f"Extension non autorisée. Extensions acceptées : {allowed}.")

        return value


def validate_upload(allowed_extensions=None):
    """Renvoie un validateur prêt à l'emploi pour un champ FileField."""
    return UploadFileValidator(allowed_extensions)
