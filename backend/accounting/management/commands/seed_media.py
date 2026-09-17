from pathlib import Path

from django.apps import apps
from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from django.db import models


class Command(BaseCommand):
    help = (
        "Synchronise le dossier seed/ vers le stockage de fichiers (Cloudinary en "
        "production) et met à jour les champs des modèles en conséquence.\n"
        "Utilisation : ajoute/modifie un fichier dans backend/seed/, pousse le code, "
        "et cette commande (lancée à chaque déploiement) upload les médias."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simuler sans écrire ni uploader (affiche ce qui serait fait).",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        seed_root = Path(settings.BASE_DIR) / "seed"
        if not seed_root.exists():
            self.stdout.write(self.style.WARNING(f"Dossier seed introuvable : {seed_root}"))
            return

        files_count = 0
        updated_count = 0
        for model in apps.get_models():
            file_fields = [
                f
                for f in model._meta.fields
                if isinstance(f, (models.FileField, models.ImageField))
            ]
            if not file_fields:
                continue
            for instance in model._default_manager.all():
                for field in file_fields:
                    field_file = getattr(instance, field.name)
                    rel = field_file.name
                    if not rel:
                        continue
                    seed_file = seed_root / rel
                    if not seed_file.exists():
                        continue
                    # Nom déjà relatif au dossier seed/ (ex. documents et
                    # médias réels de la galerie) : le contenu est servi
                    # directement depuis seed/ par les endpoints /serve/, un
                    # (ré)upload vers le stockage (Cloudinary) est inutile.
                    if rel == str(seed_file.relative_to(seed_root)):
                        files_count += 1
                        self.stdout.write(f"Déjà servi depuis seed/  {model.__name__}.{field.name} <- {rel}")
                        continue
                    files_count += 1
                    if dry_run:
                        self.stdout.write(f"[DRY-RUN] {model.__name__}.{field.name} <- {rel}")
                        continue
                    storage = field_file.storage
                    with open(seed_file, "rb") as fh:
                        saved_name = storage.save(rel, File(fh))
                    setattr(instance, field.name, saved_name)
                    instance.save(update_fields=[field.name])
                    updated_count += 1
                    self.stdout.write(f"OK  {model.__name__}.{field.name} <- {rel}")

        flavor = "Simulation (dry-run)" if dry_run else "Terminé"
        self.stdout.write(
            self.style.SUCCESS(
                f"{flavor} : {files_count} fichier(s) trouvé(s), {updated_count} mis à jour."
            )
        )
