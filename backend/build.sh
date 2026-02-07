#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate

# Seed Data (Idempotent)
echo "Seeding database..."
python manage.py full_seed
python manage.py update_posters
