from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from django.contrib.auth.models import User
from .models import Category, Bet, Nominee
from .serializers import CategorySerializer, BetSerializer, UserRegistrationSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

class BetViewSet(viewsets.ModelViewSet):
    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        category = serializer.validated_data['category']
        nominee = serializer.validated_data['nominee']
        
        obj, created = Bet.objects.update_or_create(
            user=request.user,
            category=category,
            defaults={'nominee': nominee}
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK, headers=headers)

class AdminWinnerView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        """
        Expects: { "category_id": 1, "nominee_id": 10 }
        Sets is_winner=True for nominee_id, False for others in category.
        """
        category_id = request.data.get('category_id')
        nominee_id = request.data.get('nominee_id')
        
        try:
            category = Category.objects.get(id=category_id)
            nominee = Nominee.objects.get(id=nominee_id, category=category)
            
            # Reset others
            category.nominees.update(is_winner=False)
            
            # Set winner
            nominee.is_winner = True
            nominee.save()
            
            return Response({"status": "Winner updated", "winner": str(nominee)})
        except (Category.DoesNotExist, Nominee.DoesNotExist):
            return Response({"error": "Invalid Category or Nominee"}, status=status.HTTP_400_BAD_REQUEST)
