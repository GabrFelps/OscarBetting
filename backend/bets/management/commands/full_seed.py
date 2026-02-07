from django.core.management.base import BaseCommand
from bets.models import Category, Nominee, Movie
import time

class Command(BaseCommand):
    help = 'Populates the database with all 24 Oscar categories and nominees'

    def handle(self, *args, **options):
        self.stdout.write("Starting full seed...")

        # Data Structure
        data = {
            "Melhor Filme": [
                {"movie": "Bugonia"}, {"movie": "F1"}, {"movie": "Frankenstein"}, {"movie": "Hamnet"}, 
                {"movie": "Marty Supreme"}, {"movie": "Uma Batalha Após a Outra"}, {"movie": "O Agente Secreto"}, 
                {"movie": "Valor Sentimental"}, {"movie": "Pecadores"}, {"movie": "Sonhos de Trem"}
            ],
            "Melhor Direção": [
                {"person": "Chloé Zhao", "movie": "Hamnet"}, 
                {"person": "Josh Safdie", "movie": "Marty Supreme"}, 
                {"person": "Paul Thomas Anderson", "movie": "Uma Batalha Após a Outra"}, 
                {"person": "Joachim Trier", "movie": "Valor Sentimental"}, 
                {"person": "Ryan Coogler", "movie": "Pecadores"}
            ],
            "Melhor Ator": [
                {"person": "Timothée Chalamet", "movie": "Marty Supreme"}, 
                {"person": "Leonardo DiCaprio", "movie": "Uma Batalha Após a Outra"}, 
                {"person": "Ethan Hawke", "movie": "Blue Moon"}, 
                {"person": "Michael B. Jordan", "movie": "Pecadores"}, 
                {"person": "Wagner Moura", "movie": "O Agente Secreto"}
            ],
             "Melhor Atriz": [
                {"person": "Jessie Buckley", "movie": "Hamnet"}, 
                {"person": "Rose Byrne", "movie": "Se Eu Tivesse Pernas, Eu Te Chutaria"}, 
                {"person": "Kate Hudson", "movie": "Song Sung Blue"}, 
                {"person": "Renate Reinsve", "movie": "Valor Sentimental"}, 
                {"person": "Emma Stone", "movie": "Bugonia"}
            ],
            "Melhor Ator Coadjuvante": [
                {"person": "Benicio del Toro", "movie": "Uma Batalha Após a Outra"}, 
                {"person": "Jacob Elordi", "movie": "Frankenstein"}, 
                {"person": "Delroy Lindo", "movie": "Pecadores"}, 
                {"person": "Sean Penn", "movie": "Uma Batalha Após a Outra"}, 
                {"person": "Stellan Skarsgård", "movie": "Valor Sentimental"}
            ],
            "Melhor Atriz Coadjuvante": [
                {"person": "Elle Fanning", "movie": "Valor Sentimental"}, 
                {"person": "Inga Ibsdotter Lilleaas", "movie": "Valor Sentimental"}, 
                {"person": "Amy Madigan", "movie": "A Hora do Mal"}, 
                {"person": "Wunmi Mosaku", "movie": "Pecadores"}, 
                {"person": "Teyana Taylor", "movie": "Uma Batalha Após a Outra"}
            ],
            "Melhor Roteiro Original": [
                {"movie": "Blue Moon"}, {"movie": "Foi Apenas Um Acidente"}, {"movie": "Marty Supreme"}, 
                {"movie": "Valor Sentimental"}, {"movie": "Pecadores"}
            ],
            "Melhor Roteiro Adaptado": [
                {"movie": "Bugonia"}, {"movie": "Frankenstein"}, {"movie": "Hamnet"}, 
                {"movie": "Uma Batalha Após a Outra"}, {"movie": "Sonhos de Trem"}
            ],
            "Melhor Filme de Animação": [
                {"movie": "Arco"}, {"movie": "Elio"}, {"movie": "Guerreiras do K-Pop"}, 
                {"movie": "A Pequena Amélie"}, {"movie": "Zootopia 2"}
            ],
             "Melhor Filme Internacional": [
                {"movie": "O Agente Secreto", "secondary": "Brasil"}, 
                {"movie": "Foi Apenas Um Acidente", "secondary": "França"}, 
                {"movie": "Valor Sentimental", "secondary": "Noruega"}, 
                {"movie": "Sirât", "secondary": "Espanha"}, 
                {"movie": "A Voz de Hind Rajab", "secondary": "Tunísia"}
            ],
            "Melhor Documentário (Longa-metragem)": [
                {"movie": "Alabama: Presos no Alabama"}, {"movie": "Embaixo da Luz Neon"}, 
                {"movie": "Rompendo Rochas"}, {"movie": "Mr Nobody Against Putin"}, 
                {"movie": "A Vizinha Perfeita"}
            ],
            "Melhor Documentário (Curta-metragem)": [
                {"movie": "Quartos Vazios"}, {"movie": "Armado com uma Câmera"}, 
                {"movie": "Children No More"}, {"movie": "O Diabo Não Tem Descanso"}, 
                {"movie": "Perfectly a Strangeness"}
            ],
            "Melhor Curta-metragem (Live Action)": [
                {"movie": "Butchers Stain"}, {"movie": "Um Amigo de Dorothy"}, 
                {"movie": "Jane Austens Period Drama"}, {"movie": "The Singers"}, 
                {"movie": "Two People Exchanging Saliva"}
            ],
            "Melhor Curta-metragem (Animação)": [
                {"movie": "Butterfly"}, {"movie": "Forevergreen"}, 
                {"movie": "The Girl Who Cried Pearls"}, {"movie": "Retirement Plan"}, 
                {"movie": "The Three Sisters"}
            ],
            "Melhor Direção de Elenco": [
                {"movie": "Hamnet"}, {"movie": "Marty Supreme"}, 
                {"movie": "Uma Batalha Após a Outra"}, {"movie": "O Agente Secreto"}, 
                {"movie": "Pecadores"}
            ],
             "Melhor Fotografia": [
                {"movie": "Frankenstein"}, {"movie": "Marty Supreme"}, 
                {"movie": "Uma Batalha Após a Outra"}, {"movie": "Pecadores"}, 
                {"movie": "Sonhos de Trem"}
            ],
            "Melhor Montagem": [
                {"movie": "F1"}, {"movie": "Marty Supreme"}, 
                {"movie": "Uma Batalha Após a Outra"}, {"movie": "Valor Sentimental"}, 
                {"movie": "Pecadores"}
            ],
            "Melhor Design de Produção": [
                {"movie": "Frankenstein"}, {"movie": "Hamnet"}, 
                {"movie": "Marty Supreme"}, {"movie": "Uma Batalha Após a Outra"}, 
                {"movie": "Pecadores"}
            ],
             "Melhor Figurino": [
                {"movie": "Avatar: Fogo e Cinzas"}, {"movie": "Frankenstein"}, 
                {"movie": "Hamnet"}, {"movie": "Marty Supreme"}, 
                {"movie": "Pecadores"}
            ],
            "Melhor Maquiagem e Cabelo": [
                {"movie": "Frankenstein"}, {"movie": "Kokuho"}, 
                {"movie": "Pecadores"}, {"movie": "Coração de Lutador"}, 
                {"movie": "A Meia-Irmã Feia"}
            ],
             "Melhor Trilha Sonora Original": [
                {"movie": "Bugonia"}, {"movie": "Frankenstein"}, 
                {"movie": "Hamnet"}, {"movie": "Uma Batalha Após a Outra"}, 
                {"movie": "Pecadores"}
            ],
            "Melhor Canção Original": [
                {"movie": "Relentless", "secondary": "Dear Me"}, 
                {"movie": "Guerreiras do K-Pop", "secondary": "Golden"}, 
                {"movie": "Pecadores", "secondary": "I Lied to You"}, 
                {"movie": "Viva Verdi!", "secondary": "Sweet Dreams of Joy"}, 
                {"movie": "Sonhos de Trem", "secondary": "Train Dreams"}
            ],
            "Melhor Som": [
                {"movie": "F1"}, {"movie": "Frankenstein"}, 
                {"movie": "Uma Batalha Após a Outra"}, {"movie": "Pecadores"}, 
                {"movie": "Sirât"}
            ],
             "Melhores Efeitos Visuais": [
                {"movie": "Avatar: Fogo e Cinzas"}, {"movie": "F1"}, 
                {"movie": "Jurassic World: Recomeço"}, {"movie": "O Ônibus Perdido"}, 
                {"movie": "Pecadores"}
            ]
        # Safe Seed - Idempotent
        self.stdout.write("Starting safe seed (checking for missing data)...")
        # Category.objects.all().delete() # DANGEROUS IN PROD - REMOVED
        
        # Populate
        for cat_name, nominees in data.items():
            category, created = Category.objects.get_or_create(name=cat_name)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created category: {cat_name}"))
            else:
                self.stdout.write(f"Category already exists: {cat_name}")
            
            for nom_data in nominees:
                movie = None
                movie_title = nom_data.get('movie')
                person_name = nom_data.get('person')
                secondary_text = nom_data.get('secondary')

                if movie_title == "Pecadores":
                     # Ensure we map Pecadores -> Sinners for TMDB lookup
                    movie, _ = Movie.objects.get_or_create(title="Sinners")
                elif movie_title:
                   movie, _ = Movie.objects.get_or_create(title=movie_title)
                
                nominee, n_created = Nominee.objects.get_or_create(
                    category=category,
                    movie=movie,
                    person_name=person_name,
                    secondary_text=secondary_text
                )
                if n_created:
                     self.stdout.write(f"  + Added nominee: {movie_title or person_name}")
        
        self.stdout.write(self.style.SUCCESS('Seed complete!'))
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded 24 categories!'))
