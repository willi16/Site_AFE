from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import ContactMessage
from .serializers import ContactMessageSerializer, ContactMessageAdminSerializer


class ContactMessageViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, "member_profile"):
            if self.request.user.member_profile.role in ("bureau", "admin"):
                return ContactMessageAdminSerializer
        return ContactMessageSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        if self.request.user.is_authenticated and hasattr(self.request.user, "member_profile"):
            if self.request.user.member_profile.role in ("bureau", "admin"):
                return ContactMessage.objects.all()
        return ContactMessage.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais."},
            status=status.HTTP_201_CREATED,
        )
