import requests
import time
from django.core.management.base import BaseCommand
from bets.models import Category, Movie, Nominee

TMDB_API_KEY = "0c1e8aea4bd1239b5384e6a4546caeb1"
TMDB_BASE_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

DATA = {
    "Melhor Filme": [
        "Bugonia", "F1", "Frankenstein", "Hamnet", "Marty Supreme", 
        "Uma Batalha Após a Outra", "O Agente Secreto", "Valor Sentimental", "Pecadores", "Sonhos de Trem"
    ],
    "Melhor Direção": [
        "Chloé Zhao (Hamnet)", "Josh Safdie (Marty Supreme)", "Paul Thomas Anderson (Uma Batalha Após a Outra)", 
        "Joachim Trier (Valor Sentimental)", "Ryan Coogler (Pecadores)"
    ],
    "Melhor Ator": [
        "Timothée Chalamet (Marty Supreme)", "Leonardo DiCaprio (Uma Batalha Após a Outra)", "Ethan Hawke (Blue Moon)", 
        "Michael B. Jordan (Pecadores)", "Wagner Moura (O Agente Secreto)"
    ],
    "Melhor Atriz": [
        "Jessie Buckley (Hamnet)", "Rose Byrne (Se Eu Tivesse Pernas, Eu Te Chutaria)", "Kate Hudson (Song Sung Blue)", 
        "Renate Reinsve (Valor Sentimental)", "Emma Stone (Bugonia)"
    ],
    "Melhor Ator Coadjuvante": [
        "Benicio del Toro (Uma Batalha Após a Outra)", "Jacob Elordi (Frankenstein)", "Delroy Lindo (Pecadores)", 
        "Sean Penn (Uma Batalha Após a Outra)", "Stellan Skarsgård (Valor Sentimental)"
    ],
    "Melhor Atriz Coadjuvante": [
        "Elle Fanning (Valor Sentimental)", "Inga Ibsdotter Lilleaas (Valor Sentimental)", "Amy Madigan (A Hora do Mal)", 
        "Wunmi Mosaku (Pecadores)", "Teyana Taylor (Uma Batalha Após a Outra)"
    ],
    "Melhor Roteiro Original": [
        "Blue Moon", "Foi Apenas Um Acidente", "Marty Supreme", "Valor Sentimental", "Pecadores"
    ],
    "Melhor Roteiro Adaptado": [
        "Bugonia", "Frankenstein", "Hamnet", "Uma Batalha Após a Outra", "Sonhos de Trem"
    ],
    "Melhor Filme de Animação": [
        "Arco", "Elio", "Guerreiras do K-Pop", "A Pequena Amélie", "Zootopia 2"
    ],
    "Melhor Filme Internacional": [
        "O Agente Secreto", "Foi Apenas Um Acidente", "Valor Sentimental", "Sirât", "A Voz de Hind Rajab"
    ],
    "Melhor Fotografia": [
        "Frankenstein", "Marty Supreme", "Uma Batalha Após a Outra", "Pecadores", "Sonhos de Trem"
    ],
    "Melhor Design de Produção": [
        "Frankenstein", "Hamnet", "Marty Supreme", "Uma Batalha Após a Outra", "Pecadores"
    ],
    "Melhor Canção Original": [
        "Dear Me (Diane Warren: Relentless)", "Golden (Guerreiras do K-Pop)", 
        "I Lied to You (Pecadores)", "Sweet Dreams of Joy (Viva Verdi!)", "Train Dreams (Sonhos de Trem)"
    ],
    # Add more if needed, reduced for brevity in prototype but covers main ones
}

class Command(BaseCommand):
    help = 'Populate Oscar 2026 Data'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting Population...")
        
        for category_name, items in DATA.items():
            category, _ = Category.objects.get_or_create(name=category_name, defaults={'slug': category_name.lower().replace(' ', '-')})
            self.stdout.write(f"Processing {category_name}...")
            
            for item in items:
                movie_obj = None
                person_name = None
                secondary = None
                
                # Heuristics
                if "(" in item and ")" in item:
                    # Likely "Person (Movie)" or "Song (Movie)"
                    parts = item.split("(")
                    main_part = parts[0].strip().replace('"', '')
                    extra_part = parts[1].replace(")", "").strip()
                    
                    if "Canção" in category_name:
                        person_name = main_part # Song Name
                        secondary = extra_part # Artist/Movie
                        # Try to find movie from extra_part
                        if ":" in extra_part:
                             movie_name = extra_part.split(":")[-1].strip()
                             movie_obj = self.get_movie(movie_name)
                        else:
                             movie_obj = self.get_movie(extra_part)

                    elif "Direção" in category_name or "Ator" in category_name or "Atriz" in category_name:
                        person_name = main_part
                        movie_name = extra_part
                        movie_obj = self.get_movie(movie_name)
                    else:
                        # Fallback
                        movie_obj = self.get_movie(item)
                else:
                    # Likely just a movie name
                    movie_obj = self.get_movie(item)

                # Create Nominee
                nominee, created = Nominee.objects.get_or_create(
                    category=category,
                    movie=movie_obj,
                    person_name=person_name,
                    secondary_text=secondary
                )
                
                # If person, fetch person image
                if person_name and not nominee.image_url:
                    img = self.fetch_person_image(person_name)
                    if img:
                        nominee.image_url = img
                        nominee.save()
            
            time.sleep(0.5) # Rate limit

    def get_movie(self, title):
        if not title: return None
        # Check DB
        movie, created = Movie.objects.get_or_create(title=title)
        if created or not movie.poster_url:
            self.stdout.write(f"  Fetching TMDB for movie: {title}")
            data = self.tmdb_search("movie", title)
            if data:
                movie.original_title = data.get('original_title')
                if data.get('poster_path'):
                    movie.poster_url = f"{IMAGE_BASE_URL}{data.get('poster_path')}"
                    movie.save()
        return movie

    def fetch_person_image(self, name):
        self.stdout.write(f"  Fetching TMDB for person: {name}")
        data = self.tmdb_search("person", name)
        if data and data.get('profile_path'):
            return f"{IMAGE_BASE_URL}{data.get('profile_path')}"
        return None

    def tmdb_search(self, endpoint, query):
        url = f"{TMDB_BASE_URL}/search/{endpoint}"
        params = {"api_key": TMDB_API_KEY, "query": query, "language": "pt-BR"}
        try:
            resp = requests.get(url, params=params)
            if resp.status_code == 200:
                results = resp.json().get('results', [])
                if results: return results[0]
        except: pass
        return None
