from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, BetViewSet
from .leaderboard import LeaderboardView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'bets', BetViewSet, basename='bet')

urlpatterns = [
    path('', include(router.urls)),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]
