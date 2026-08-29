#!/usr/bin/env bash
set -o errexit
set -o pipefail

# Installation des dépendances
pip install -r requirements.txt

# Collecte des fichiers statiques (WhiteNoise)
python manage.py collectstatic --noinput

# Application des migrations
python manage.py migrate

# Synchronisation du dossier seed/ vers le stockage de fichiers (Cloudinary
# pour les images/vidéos lorsque c'est configuré, stockage local pour les
# documents PDF). S'exécute à chaque déploiement.
python manage.py seed_media

# (Re)création du jeu de données complet : documents, membres, fondateurs, ...
python manage.py seed_data
