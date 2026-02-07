from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=255)
    original_title = models.CharField(max_length=255, blank=True, null=True)
    director = models.CharField(max_length=255, blank=True, null=True)
    poster_url = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return self.title

class Nominee(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='nominees')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, null=True, blank=True)
    person_name = models.CharField(max_length=255, blank=True, null=True, help_text="For actors/directors not tied to a specific movie object or if manual entry preferred")
    secondary_text = models.CharField(max_length=255, blank=True, null=True, help_text="Extra info like Song Name or Character Name")
    image_url = models.URLField(blank=True, null=True)
    is_winner = models.BooleanField(default=False)

    def __str__(self):
        if self.movie:
            return f"{self.movie.title} - {self.category.name}"
        return f"{self.person_name} - {self.category.name}"

class Bet(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='bets')
    nominee = models.ForeignKey(Nominee, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'category')

    def __str__(self):
        return f"{self.user.username} - {self.category.name} - {self.nominee}"
