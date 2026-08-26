#!/bin/bash
# Script de démarrage pour le projet AFE

set -e

echo "=== Démarrage du projet AFE ==="

# Backend
echo "1. Activation de l'environnement virtuel Python..."
cd backend
source venv/bin/activate
echo "   Environnement: $(which python)"

echo "2. Vérification des migrations..."
python manage.py migrate --run-syncdb 2>/dev/null || true

echo "3. Collecte des static files..."
python manage.py collectstatic --noinput 2>/dev/null || true

echo "4. Lancement du serveur Django (port 8000)..."
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

echo "5. Lancement du serveur Vite (port 5173)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=== Services démarrés ==="
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   Admin:    http://localhost:8000/admin/"
echo "   API Docs: http://localhost:8000/api/docs/"
echo ""
echo "   Ctrl+C pour arrêter"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
