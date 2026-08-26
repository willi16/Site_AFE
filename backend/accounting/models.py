from django.db import models
from django.contrib.auth.models import User


class FinancialRecord(models.Model):
    TYPE_CHOICES = [
        ("income", "Recette"),
        ("expense", "Dépense"),
    ]

    title = models.CharField("Titre", max_length=200)
    description = models.TextField("Description", blank=True)
    amount = models.DecimalField("Montant", max_digits=10, decimal_places=2)
    record_type = models.CharField("Type", max_length=10, choices=TYPE_CHOICES)
    category = models.CharField("Catégorie", max_length=100, blank=True)
    date = models.DateField("Date")
    receipt = models.FileField("Justificatif", upload_to="accounting/receipts/%Y/%m/", null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="financial_records")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Enregistrement financier"
        verbose_name_plural = "Enregistrements financiers"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.title} - {self.amount} EUR"


class MeetingReport(models.Model):
    title = models.CharField("Titre", max_length=200)
    date = models.DateField("Date de la réunion")
    summary = models.TextField("Résumé")
    file = models.FileField("PV", upload_to="meetings/%Y/%m/", null=True, blank=True)
    visible_to = models.CharField("Visible pour", max_length=20, default="bureau")
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="meeting_reports")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Compte-rendu de réunion"
        verbose_name_plural = "Comptes-rendus de réunions"
        ordering = ["-date"]

    def __str__(self):
        return self.title
