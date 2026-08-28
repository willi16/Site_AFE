from rest_framework import serializers
from .models import Event, EventImage, Actualite


class EventImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventImage
        fields = ["id", "image", "caption", "order"]


class EventSerializer(serializers.ModelSerializer):
    images = EventImageSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True, default="")

    class Meta:
        model = Event
        fields = [
            "id", "title", "description", "short_description",
            "event_date", "end_date", "location", "status",
            "is_published", "is_monthly_assembly", "images", "created_by_name",
            "created_at", "updated_at",
        ]
        read_only_fields = ["created_by", "created_at", "updated_at"]


class EventListSerializer(serializers.ModelSerializer):
    image_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id", "title", "short_description", "event_date",
            "end_date", "location", "status", "is_monthly_assembly", "image_count",
        ]

    def get_image_count(self, obj):
        return obj.images.count()


class ActualiteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True, default="")

    class Meta:
        model = Actualite
        fields = [
            "id", "title", "content", "excerpt", "image",
            "is_published", "author_name", "created_at", "updated_at",
        ]
        read_only_fields = ["author", "created_at", "updated_at"]


class ActualiteListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Actualite
        fields = ["id", "title", "excerpt", "image", "created_at"]
