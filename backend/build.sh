#!/usr/bin/env bash
set -o errexit
set -o pipefail

# Installation des dépendances
pip install -r requirements.txt

# Collecte des fichiers statiques (WhiteNoise)
python manage.py collectstatic --noinput

# Application des migrations
python manage.py migrate

# Synchronisation du dossier seed/ vers Cloudinary (ne s'exécute que si
# Cloudinary est configuré, sinon on saute pour ne pas casser le build)
if [ -n "${CLOUDINARY_CLOUD_NAME:-}" ]; then
  python manage.py seed_media
fi
