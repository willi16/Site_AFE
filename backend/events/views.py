from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Event, EventImage, Actualite
from .serializers import (
    EventSerializer, EventListSerializer,
    EventImageSerializer, ActualiteSerializer, ActualiteListSerializer,
)


class IsBureauOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, "member_profile")
            and request.user.member_profile.role in ("admin", "secretary")
        )


class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBureauOrReadOnly]

    def get_serializer_class(self):
        if self.action == "list":
            return EventListSerializer
        return EventSerializer

    def get_queryset(self):
        qs = Event.objects.all()
        if self.request.method == "GET" and not (
            self.request.user.is_authenticated
            and hasattr(self.request.user, "member_profile")
            and self.request.user.member_profile.role in ("bureau", "admin", "secretary")
        ):
            qs = qs.filter(is_published=True)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def upcoming(self, request):
        events = Event.objects.filter(
            status="upcoming", is_published=True, event_date__gte=timezone.now()
        )[:5]
        serializer = EventListSerializer(events, many=True)
        return Response(serializer.data)


class EventImageViewSet(viewsets.ModelViewSet):
    serializer_class = EventImageSerializer
    permission_classes = [IsBureauOrReadOnly]

    def get_queryset(self):
        return EventImage.objects.filter(event_id=self.kwargs["event_pk"])

    def perform_create(self, serializer):
        event = Event.objects.get(pk=self.kwargs["event_pk"])
        serializer.save(event=event)


class ActualiteViewSet(viewsets.ModelViewSet):
    permission_classes = [IsBureauOrReadOnly]

    def get_serializer_class(self):
        if self.action == "list":
            return ActualiteListSerializer
        return ActualiteSerializer

    def get_queryset(self):
        if self.request.method == "GET" and not (
            self.request.user.is_authenticated
            and hasattr(self.request.user, "member_profile")
            and self.request.user.member_profile.role in ("bureau", "admin", "secretary")
        ):
            return Actualite.objects.filter(is_published=True)
        return Actualite.objects.all()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
