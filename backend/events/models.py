from django.db import models
from django.contrib.auth.models import User


class Event(models.Model):
    STATUS_CHOICES = [
        ("upcoming", "À venir"),
        ("past", "Passé"),
    ]
    title = models.CharField("Titre", max_length=200)
    description = models.TextField("Description")
    short_description = models.CharField("Description courte", max_length=300, blank=True)
    event_date = models.DateTimeField("Date de l'événement")
    end_date = models.DateTimeField("Date de fin", null=True, blank=True)
    location = models.CharField("Lieu", max_length=200, blank=True)
    status = models.CharField("Statut", max_length=20, choices=STATUS_CHOICES, default="upcoming")
    is_published = models.BooleanField("Publié", default=True)
    is_monthly_assembly = models.BooleanField("Assemblée mensuelle", default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Événement"
        verbose_name_plural = "Événements"
        ordering = ["-event_date"]

    def __str__(self):
        return self.title


class EventImage(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField("Image", upload_to="events/%Y/%m/")
    caption = models.CharField("Légende", max_length=200, blank=True)
    order = models.PositiveIntegerField("Ordre", default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Image d'événement"
        verbose_name_plural = "Images d'événements"
        ordering = ["order"]

    def __str__(self):
        return f"Image for {self.event.title}"


class Actualite(models.Model):
    title = models.CharField("Titre", max_length=200)
    content = models.TextField("Contenu")
    excerpt = models.CharField("Extrait", max_length=300, blank=True)
    image = models.ImageField("Image", upload_to="actualites/%Y/%m/", null=True, blank=True)
    is_published = models.BooleanField("Publié", default=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="actualites")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Actualité"
        verbose_name_plural = "Actualités"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
