from django.db import models
from django.contrib.auth.models import User


class Document(models.Model):
    CATEGORY_CHOICES = [
        ("report", "Compte-rendu"),
        ("financial", "Comptabilité"),
        ("legal", "Officiel"),
        ("minutes", "Procès-verbal"),
        ("other", "Autre"),
    ]

    VISIBILITY_CHOICES = [
        ("public", "Public"),
        ("members", "Membres"),
        ("bureau", "Bureau"),
    ]

    title = models.CharField("Titre", max_length=200)
    description = models.TextField("Description", blank=True)
    file = models.FileField("Fichier", upload_to="documents/%Y/%m/")
    category = models.CharField("Catégorie", max_length=20, choices=CATEGORY_CHOICES)
    visible_to = models.CharField("Visible pour", max_length=20, choices=VISIBILITY_CHOICES, default="members")
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="uploaded_documents")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
