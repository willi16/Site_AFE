from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


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


class Attendance(models.Model):
    """Présence d'un membre à un événement (suivi trésorier)."""

    STATUS_CHOICES = [
        ("present", "Présent"),
        ("absent", "Absent"),
        ("excuse", "Excusé"),
    ]

    member = models.ForeignKey(
        "members.Member", on_delete=models.CASCADE, related_name="attendances"
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.CASCADE, related_name="attendances", null=True, blank=True
    )
    event_title = models.CharField("Événement", max_length=200, blank=True)
    event_date = models.DateField("Date", null=True, blank=True)
    status = models.CharField("Statut", max_length=10, choices=STATUS_CHOICES, default="absent")
    notes = models.CharField("Notes", max_length=255, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="attendance_records")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Présence"
        verbose_name_plural = "Présences"
        ordering = ["-event_date", "member__user__last_name"]
        unique_together = [["member", "event"]]

    def __str__(self):
        return f"{self.member.full_name} - {self.event_title or self.event}"


class Cotisation(models.Model):
    """Cotisation d'un membre par événement/période (suivi trésorier)."""

    STATUS_CHOICES = [
        ("paid", "Payée"),
        ("pending", "En attente"),
        ("overdue", "En retard"),
    ]

    member = models.ForeignKey(
        "members.Member", on_delete=models.CASCADE, related_name="cotisations"
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.SET_NULL, null=True, blank=True, related_name="cotisations"
    )
    label = models.CharField("Libellé", max_length=200)
    amount = models.DecimalField("Montant dû", max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField("Montant payé", max_digits=10, decimal_places=2, default=0)
    status = models.CharField("Statut", max_length=10, choices=STATUS_CHOICES, default="pending")
    due_date = models.DateField("Échéance", null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="cotisations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cotisation"
        verbose_name_plural = "Cotisations"
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.member.full_name} - {self.label}"

    @property
    def balance(self):
        return self.amount - self.amount_paid


class Donation(models.Model):
    """Don d'un visiteur (sans compte) effectué sur l'un des numéros de l'association."""

    STATUS_CHOICES = [
        ("received", "Reçu"),
        ("confirmed", "Confirmé"),
    ]

    donor_name = models.CharField("Nom du donateur", max_length=200)
    donor_phone = models.CharField("Téléphone du donateur", max_length=20, blank=True)
    method = models.CharField("Méthode", max_length=100, blank=True)
    target_number = models.CharField("Numéro de réception", max_length=50, blank=True)
    amount = models.DecimalField("Montant", max_digits=12, decimal_places=2)
    message = models.TextField("Message", blank=True)
    status = models.CharField("Statut", max_length=20, choices=STATUS_CHOICES, default="received")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Don"
        verbose_name_plural = "Dons"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Don de {self.donor_name} - {self.amount}"


class Notification(models.Model):
    """Notification interne destinée à un membre (ex. nouveau don pour le secrétaire)."""

    recipient = models.ForeignKey("members.Member", on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField("Titre", max_length=200)
    message = models.TextField("Message", blank=True)
    is_read = models.BooleanField("Lue", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class GalleryItem(models.Model):
    """Élément de la galerie / archives (photos d'événements)."""

    title = models.CharField("Titre", max_length=200)
    image = models.ImageField("Image", upload_to="gallery/%Y/%m/", null=True, blank=True)
    image_url = models.URLField("URL image externe", blank=True)
    video = models.FileField("Vidéo", upload_to="gallery/videos/%Y/%m/", null=True, blank=True)
    video_url = models.URLField("URL vidéo externe", blank=True)
    video_platform = models.CharField("Plateforme vidéo", max_length=30, blank=True)
    caption = models.CharField("Légende", max_length=255, blank=True)
    category = models.CharField("Catégorie", max_length=100, blank=True)
    file_type = models.CharField("Type", max_length=10, default="image", choices=[("image", "Image"), ("video", "Vidéo")])
    is_published = models.BooleanField("Publié", default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="gallery_items")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Élément de galerie"
        verbose_name_plural = "Éléments de galerie"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
