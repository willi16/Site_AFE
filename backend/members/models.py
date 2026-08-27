from django.db import models
from django.contrib.auth.models import User


class Member(models.Model):
    ROLE_CHOICES = [
        ("member", "Membre"),
        ("bureau", "Bureau"),
        ("secretary", "Secrétaire"),
        ("treasurer", "Trésorier"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="member_profile")
    role = models.CharField("Rôle", max_length=20, choices=ROLE_CHOICES, default="member")
    membership_status = models.BooleanField("Cotisation à jour", default=False)
    membership_date = models.DateField("Date d'adhésion", null=True, blank=True)
    phone = models.CharField("Téléphone", max_length=20, blank=True)
    address = models.TextField("Adresse", blank=True)
    photo = models.ImageField("Photo", upload_to="members/photos/", null=True, blank=True)
    bio = models.TextField("Biographie", blank=True)
    show_in_directory = models.BooleanField("Afficher dans l'annuaire", default=True)
    rgpd_consent = models.BooleanField("Consentement RGPD", default=False)
    joined_date = models.DateField("Date de joining", auto_now_add=True)
    is_active_member = models.BooleanField("Membre actif", default=True)

    class Meta:
        verbose_name = "Membre"
        verbose_name_plural = "Membres"
        ordering = ["-joined_date"]

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_role_display()})"

    @property
    def full_name(self):
        return self.user.get_full_name()

    @property
    def email(self):
        return self.user.email


class BureauMember(models.Model):
    POSITION_CHOICES = [
        ("president", "Président"),
        ("vice_president", "Vice-Président"),
        ("secretary", "Secrétaire"),
        ("treasurer", "Trésorier"),
        ("member", "Conseiller"),
    ]

    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name="bureau_position")
    position = models.CharField("Poste", max_length=20, choices=POSITION_CHOICES)
    display_order = models.PositiveIntegerField("Ordre d'affichage", default=0)
    mandate_start = models.DateField("Début du mandat", null=True, blank=True)
    mandate_end = models.DateField("Fin du mandat", null=True, blank=True)

    class Meta:
        verbose_name = "Membre du Bureau"
        verbose_name_plural = "Membres du Bureau"
        ordering = ["display_order"]

    def __str__(self):
        return f"{self.member.full_name} - {self.get_position_display()}"


class MembershipApplication(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("approved", "Approuvée"),
        ("rejected", "Rejetée"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="applications")
    demand_letter = models.FileField("Lettre de demande", upload_to="applications/letters/%Y/%m/", null=True, blank=True)
    supporting_documents = models.FileField("Documents justificatifs", upload_to="applications/documents/%Y/%m/", null=True, blank=True)
    motivation = models.TextField("Motivation", blank=True)
    status = models.CharField("Statut", max_length=20, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="reviewed_applications")
    review_note = models.TextField("Note du bureau", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Candidature d'adhésion"
        verbose_name_plural = "Candidatures d'adhésion"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Candidature de {self.user.get_full_name()} - {self.get_status_display()}"


class AssociationSettings(models.Model):
    collective_photo = models.ImageField("Photo collective", upload_to="members/collective/", null=True, blank=True)
    cover_photo = models.ImageField("Photo de couverture", upload_to="cover/", null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres de l'association"
        verbose_name_plural = "Paramètres de l'association"

    def __str__(self):
        return "Paramètres de l'association"
