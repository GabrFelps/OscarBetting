from rest_framework import serializers
from .models import Category, Movie, Nominee, Bet

class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = ['id', 'title', 'director']

class NomineeSerializer(serializers.ModelSerializer):
    movie = MovieSerializer(read_only=True)
    
    class Meta:
        model = Nominee
        fields = ['id', 'movie', 'person_name', 'image_url', 'is_winner']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Flatten representation for easier frontend consumption
        representation['name'] = str(instance)
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
        # Ensure nominee belongs to the category
        if data['nominee'].category != data['category']:
            raise serializers.ValidationError("Nominee does not belong to this category.")
        return data

    def create(self, validated_data):
        # Assign current user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
