from django.contrib import admin
from .models import Category, Movie, Nominee, Bet

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')
    search_fields = ('name',)

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('title', 'director')
    search_fields = ('title', 'director')

@admin.register(Nominee)
class NomineeAdmin(admin.ModelAdmin):
    list_display = ('category', 'get_nominee_name', 'is_winner')
    list_filter = ('category', 'is_winner')
    
    def get_nominee_name(self, obj):
        return str(obj)
    get_nominee_name.short_description = 'Nominee'

@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'nominee', 'timestamp')
    list_filter = ('category', 'user')
