import os

import cloudinary.uploader
from cloudinary_storage.storage import MediaCloudinaryStorage

VIDEO_EXTS = {".mp4", ".mov", ".avi", ".webm", ".mkv", ".wmv", ".m4v", ".mpg", ".mpeg"}
RAW_EXTS = {
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt",
    ".zip", ".rar", ".7z", ".odt", ".ods", ".csv",
}


class MediaCloudinaryStorageAuto(MediaCloudinaryStorage):
    """Stockage Cloudinary mixte (images, vidéos, documents).

    Le type Cloudinary (image/vidéo/raw) est choisi selon l'extension du
    fichier pour garantir une URL de livraison correcte. Le nom stocké en
    base est l'URL sécurisée complète (secure_url), qui embarque le bon type.
    """

    RESOURCE_TYPE = "auto"

    def _upload(self, name, content):
        ext = os.path.splitext(name.lower())[1]
        if ext in VIDEO_EXTS:
            resource_type = "video"
        elif ext in RAW_EXTS:
            resource_type = "raw"
        else:
            resource_type = "image"
        options = {"use_filename": True, "resource_type": resource_type, "tags": self.TAG}
        folder = os.path.dirname(name)
        if folder:
            options["folder"] = folder
        return cloudinary.uploader.upload(content, **options)

    def _save(self, name, content):
        name = self._normalise_name(name)
        response = self._upload(name, content)
        return response["secure_url"]

    def _get_url(self, name):
        if name.startswith(("http://", "https://")):
            return name
        return cloudinary.utils.cloudinary_url(name)[0]

    def url(self, name):
        return self._get_url(name)
