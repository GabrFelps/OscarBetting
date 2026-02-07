from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Category, Bet
from .serializers import CategorySerializer, BetSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny] # Allow reading categories without auth? Maybe. Or IsAuthenticated.

class BetViewSet(viewsets.ModelViewSet):
    serializer_class = BetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Bet.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if bet exists for this user and category
        category = serializer.validated_data['category']
        nominee = serializer.validated_data['nominee']
        
        # We need to check if the nominee matches category constraint again if needed, 
        # but serializer.validate() handles it.
        
        # Update or Create
        obj, created = Bet.objects.update_or_create(
            user=request.user,
            category=category,
            defaults={'nominee': nominee}
        )
        
        # Return response
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK, headers=headers)

    def perform_create(self, serializer):
        # This is bypassed by overriding create, but kept for safety if needed
        serializer.save(user=self.request.user)
