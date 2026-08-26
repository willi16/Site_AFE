from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventImageViewSet, ActualiteViewSet

router = DefaultRouter()
router.register(r"events", EventViewSet, basename="event")
router.register(r"actualites", ActualiteViewSet, basename="actualite")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "events/<int:event_pk>/images/",
        EventImageViewSet.as_view({"get": "list", "post": "create"}),
        name="event-images",
    ),
    path(
        "events/<int:event_pk>/images/<int:pk>/",
        EventImageViewSet.as_view({"get": "retrieve", "put": "update", "delete": "destroy"}),
        name="event-image-detail",
    ),
]
