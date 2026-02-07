from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Movie, Nominee, Bet

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ['id', 'title', 'director', 'poster_url']

class NomineeSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(read_only=True)
    
    class Meta:
        model = Nominee
        fields = ['id', 'movie', 'person_name', 'secondary_text', 'image_url', 'is_winner']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Flatten representation
        representation['name'] = str(instance)
        
        # Helper for frontend to get the "main" image
        if instance.image_url:
            representation['display_image'] = instance.image_url
        elif instance.movie and instance.movie.poster_url:
            representation['display_image'] = instance.movie.poster_url
        else:
            representation['display_image'] = None
            
        return representation

class CategorySerializer(serializers.ModelSerializer):
    nominees = NomineeSerializer(many=True, read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'order', 'nominees']

class BetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bet
        fields = ['id', 'category', 'nominee', 'timestamp']
        read_only_fields = ['user']

    def validate(self, data):
        if data['nominee'].category != data['category']:
            raise serializers.ValidationError("Nominee does not belong to this category.")
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user
