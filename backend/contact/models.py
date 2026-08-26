from django.db import models


class ContactMessage(models.Model):
    SUBJECT_CHOICES = [
        ("info", "Demande d'information"),
        ("adhesion", "Adhésion"),
        ("partnership", "Partenariat"),
        ("other", "Autre"),
    ]

    full_name = models.CharField("Nom complet", max_length=200)
    email = models.EmailField("Email")
    phone = models.CharField("Téléphone", max_length=20, blank=True)
    subject = models.CharField("Sujet", max_length=20, choices=SUBJECT_CHOICES, default="info")
    message = models.TextField("Message")
    is_read = models.BooleanField("Lu", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Message de contact"
        verbose_name_plural = "Messages de contact"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} - {self.get_subject_display()}"
