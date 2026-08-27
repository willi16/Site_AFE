"""Ajoute les photos et vidéos réelles de l'association (depuis un dossier source) à la galerie.

Remplace les éléments en ligne (images externes / vidéos YouTube) liés lors du seed
par le contenu réel local (fichiers image / vidéo uploadés).
"""

import os

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.conf import settings

from accounting.models import GalleryItem

IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
VIDEO_EXTENSIONS = (".mp4", ".mov", ".mkv", ".avi", ".webm")


class Command(BaseCommand):
    help = (
        "Copie les images et vidéos d'un dossier source vers la galerie "
        "et remplace les éléments en ligne (Unsplash/YouTube) par le contenu réel local."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            type=str,
            default=os.path.expanduser(
                os.path.join("~", "Projet_personnel", "doc_afe")
            ),
            help="Dossier contenant les images et vidéos. Défaut: ~/Projet_personnel/doc_afe",
        )
        parser.add_argument(
            "--remove-external",
            action="store_true",
            help="Supprimer les éléments en ligne (image_url/video_url) existants (recommandé).",
        )

    def handle(self, *args, **options):
        source = options["source"]
        if not os.path.isdir(source):
            self.stderr.write(self.style.ERROR(f"Dossier source introuvable : {source}"))
            return

        if options["remove_external"]:
            removed = GalleryItem.objects.filter(
                file_type="image"
            ).exclude(image_url="").count() + GalleryItem.objects.filter(
                file_type="video"
            ).exclude(video_url="").count()
            GalleryItem.objects.filter(file_type="image").exclude(image_url="").delete()
            GalleryItem.objects.filter(file_type="video").exclude(video_url="").delete()
            self.stdout.write(self.style.WARNING(f"Éléments en ligne supprimés : {removed}"))

        gallery_root = settings.MEDIA_ROOT / "gallery"
        videos_dir = gallery_root / "videos"
        gallery_root.mkdir(parents=True, exist_ok=True)
        videos_dir.mkdir(parents=True, exist_ok=True)

        files = sorted(os.listdir(source))
        images = [f for f in files if f.lower().endswith(IMAGE_EXTENSIONS)]
        videos = [f for f in files if f.lower().endswith(VIDEO_EXTENSIONS)]

        self._add_images(source, images, gallery_root)
        self._add_videos(source, videos, videos_dir)

        self.stdout.write(
            self.style.SUCCESS(
                f"Galerie: {GalleryItem.objects.count()} éléments "
                f"({images.__len__()} images, {videos.__len__()} vidéos)"
            )
        )

    def _add_images(self, source, images, gallery_root):
        for idx, name in enumerate(images, start=1):
            path = os.path.join(source, name)
            with open(path, "rb") as fh:
                content = fh.read()
            rel = f"gallery/{name}"
            item = GalleryItem(
                title=f"Photo AFE {idx}",
                caption=name,
                category="Photos",
                file_type="image",
                is_published=True,
            )
            item.image.save(rel, ContentFile(content), save=False)
            item.save()

    def _add_videos(self, source, videos, videos_dir):
        for idx, name in enumerate(videos, start=1):
            path = os.path.join(source, name)
            with open(path, "rb") as fh:
                content = fh.read()
            rel = f"gallery/videos/{name}"
            item = GalleryItem(
                title=f"Vidéo AFE {idx}",
                caption=name,
                category="Vidéos",
                file_type="video",
                is_published=True,
            )
            item.video.save(rel, ContentFile(content), save=False)
            item.save()
