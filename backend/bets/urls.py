from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, BetViewSet, RegisterView, AdminWinnerView
from .leaderboard import LeaderboardView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'bets', BetViewSet, basename='bet')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('admin/winner/', AdminWinnerView.as_view(), name='admin-winner'),
]
