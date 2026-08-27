"""Crée/garantit les événements 'Assemblée mensuelle' du dernier dimanche de chaque mois."""

import argparse
from datetime import date, datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from events.models import Event
from events.utils import last_sunday_of_month, MONTHLY_ASSEMBLY_TITLE


def add_months(source_date, months):
    """Ajoute un nombre de mois à une date (gère le changement d'année)."""
    month_index = source_date.year * 12 + (source_date.month - 1) + months
    year = month_index // 12
    month = month_index % 12 + 1
    day = min(source_date.day, 28)
    return date(year, month, day)


class Command(BaseCommand):
    help = (
        "Crée les événements 'Assemblée mensuelle' pour le dernier dimanche "
        "des prochains mois (par défaut: mois courant + 3 mois suivants)."
        "Les événements déjà présents pour un mois donné ne sont pas dupliqués."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--months",
            type=int,
            default=4,
            help="Nombre de mois à planifier (dont le mois courant). Défaut: 4.",
        )

    def handle(self, *args, **options):
        now = timezone.now().date()
        months_ahead = options["months"]
        created = 0
        skipped = 0

        for i in range(months_ahead):
            month_date = add_months(now, i)
            assembly_date = last_sunday_of_month(month_date.year, month_date.month)
            if assembly_date < now:
                continue
            exists = Event.objects.filter(
                title=MONTHLY_ASSEMBLY_TITLE,
                event_date__date=assembly_date,
            ).exists()
            if exists:
                skipped += 1
                continue
            Event.objects.create(
                title=MONTHLY_ASSEMBLY_TITLE,
                description=(
                    "Assemblée mensuelle de l'association, tenue le dernier "
                    f"dimanche du mois ({assembly_date.strftime('%d/%m/%Y')}). "
                    "La présence de chaque membre sera relevée."
                ),
                short_description="Assemblée mensuelle — dernier dimanche",
                event_date=timezone.make_aware(
                    datetime(
                        assembly_date.year,
                        assembly_date.month,
                        assembly_date.day,
                        10,
                        0,
                    ),
                    timezone.get_current_timezone(),
                ),
                location="Salle de réunion de l'association",
                status="upcoming",
                is_published=True,
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{created} assemblée(s) mensuelle(s) créée(s), {skipped} déjà présente(s)."
            )
        )
