"""Utilitaires pour les événements récurrents de l'association."""

import calendar
from datetime import date, timedelta

MONTHLY_ASSEMBLY_TITLE = "Assemblée mensuelle — dernier dimanche"


def last_sunday_of_month(year, month):
    """Retourne la date du dernier dimanche du mois donné."""
    last_day = calendar.monthrange(year, month)[1]
    d = date(year, month, last_day)
    offset = (d.weekday() - 6) % 7
    return d - timedelta(days=offset)


def get_monthly_assembly_date(year, month):
    """Renvoi un date pour l'assemblée mensuelle (dernier dimanche)."""
    return last_sunday_of_month(year, month)
