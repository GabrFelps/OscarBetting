from rest_framework import views, permissions
from rest_framework.response import Response
from django.db.models import Count, Q
from django.contrib.auth.models import User
from .models import Bet, Nominee

class LeaderboardView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        # Calculate scores
        # Score = Count of bets where bet.nominee.is_winner = True
        
        users = User.objects.annotate(
            score=Count('bets', filter=Q(bets__nominee__is_winner=True))
        ).order_by('-score')
        
        data = [
            {'username': u.username, 'score': u.score}
            for u in users
        ]
        return Response(data)
