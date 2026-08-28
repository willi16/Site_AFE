#!/usr/bin/env bash
set -o errexit
set -o pipefail

# Installation des dépendances
pip install -r requirements.txt

# Collecte des fichiers statiques (WhiteNoise)
python manage.py collectstatic --noinput

# Application des migrations
python manage.py migrate
