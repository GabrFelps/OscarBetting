import requests
from django.core.management.base import BaseCommand
from bets.models import Movie, Nominee

TMDB_API_KEY = "0c1e8aea4bd1239b5384e6a4546caeb1"
TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

class Command(BaseCommand):
    help = 'Fetches posters and images from TMDB for Movies and Nominees'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting TMDB update...")
        
        # 1. Update Movies
        movies = Movie.objects.filter(poster_url__isnull=True) | Movie.objects.filter(poster_url='')
        for movie in movies:
            self.stdout.write(f"Searching for movie: {movie.title}...")
            search_url = f"{TMDB_BASE_URL}/search/movie"
            params = {
                "api_key": TMDB_API_KEY,
                "query": movie.title,
                "language": "pt-BR"
            }
            try:
                resp = requests.get(search_url, params=params)
                data = resp.json()
                if data['results']:
                    best_match = data['results'][0]
                    poster_path = best_match.get('poster_path')
                    if poster_path:
                        movie.poster_url = f"{IMAGE_BASE_URL}{poster_path}"
                        movie.save()
                        self.stdout.write(self.style.SUCCESS(f"Updated poster for {movie.title}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error fetching {movie.title}: {e}"))

        # 2. Update People (Nominees without Movie link, or just Person images)
        # Nominees that have 'person_name' and NO 'image_url'
        nominees = Nominee.objects.filter(image_url__isnull=True).exclude(person_name__isnull=True).exclude(person_name__exact='')
        for nom in nominees:
            # If the nominee is linked to a movie, we might want the movie poster? 
            # or if it's an Actor category, we want the Actor's face?
            # Build heuristic: If category name contains "Actor", "Actress", "Director", search for Person.
            # Else if linked to movie, use movie poster (already handled by serializer fallback, but let's be explicit if needed).
            
            # For now, let's assume if it has person_name, we try to find the person's face.
            cat_name = nom.category.name.lower()
            if any(x in cat_name for x in ['ator', 'atriz', 'diretor', 'actor', 'actress', 'director']):
                self.stdout.write(f"Searching for person: {nom.person_name}...")
                search_url = f"{TMDB_BASE_URL}/search/person"
                params = {
                    "api_key": TMDB_API_KEY,
                    "query": nom.person_name
                }
                try:
                    resp = requests.get(search_url, params=params)
                    data = resp.json()
                    if data['results']:
                        best_match = data['results'][0]
                        profile_path = best_match.get('profile_path')
                        if profile_path:
                            nom.image_url = f"{IMAGE_BASE_URL}{profile_path}"
                            nom.save()
                            self.stdout.write(self.style.SUCCESS(f"Updated image for {nom.person_name}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error fetching {nom.person_name}: {e}"))
        
        self.stdout.write(self.style.SUCCESS("Done!"))
