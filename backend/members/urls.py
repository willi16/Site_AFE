from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import MemberViewSet, BureauMemberViewSet, MembershipApplicationViewSet

router = DefaultRouter()
router.register(r"members", MemberViewSet, basename="member")
router.register(r"bureau", BureauMemberViewSet, basename="bureau")
router.register(r"applications", MembershipApplicationViewSet, basename="application")

urlpatterns = [
    path("", include(router.urls)),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
