# Association de Fraternité et d'Entraide (AFE) — Site Web

Bienvenue ! Ce document explique **tout** : ce qu'est ce projet, ce qu'il fait,
comment l'installer, comment le faire fonctionner, et comment le mettre en ligne.

Il est écrit volontairement **très simplement**, sans jargon, pour que
**tout le monde** puisse le comprendre — même une personne qui n'a jamais
touché à l'informatique (un « analphabète du numérique »).

---

## Table des matières

1. [C'est quoi ce projet ?](#1-cest-quoi-ce-projet)
2. [Ce que le site permet de faire](#2-ce-que-le-site-permet-de-faire)
3. [Qui peut faire quoi ? (les rôles)](#3-qui-peut-faire-quoi-les-rôles)
4. [Langage et « pièces » du projet](#4-langage-et-pièces-du-projet)
5. [Installer sur un ordinateur (développeur)](#5-installer-sur-un-ordinateur-développeur)
6. [Créer un compte admin au départ](#6-créer-un-compte-admin-au-départ)
7. [Lancer le site](#7-lancer-le-site)
8. [Mettre en ligne (production / déploiement)](#8-mettre-en-ligne-production--déploiement)
9. [Les comptes de test](#9-les-comptes-de-test)
10. [Structure du projet (pour les développeurs)](#10-structure-du-projet-pour-les-développeurs)
11. [Les branches et GitHub](#11-les-branches-et-github)
12. [Problèmes fréquents et solutions](#12-problèmes-fréquents-et-solutions)

---

## 1. C'est quoi ce projet ?

C'est le **site internet officiel de l'Association de Fraternité et d'Entraide (AFE)**.

Ce site permet à l'association de :

- **se présenter** au public (qui nous sommes, notre bureau, nos membres) ;
- **publier** ses événements, ses actualités et ses photos ;
- **recevoir** des candidatures d'adhésion et des dons ;
- et surtout, **gérer son fonctionnement interne** : présences, cotisations,
  comptabilité, dans un espace « membres » et un espace « bureau » protégés par mot de passe.

Le site a **deux parties** :

1. **La partie publique** → visible par tout le monde (même sans compte).
2. **La partie privée** → accessible uniquement avec un identifiant et un mot de passe
   (les membres et le bureau de l'association).

---

## 2. Ce que le site permet de faire

### Côté public (tout le monde, sans compte)
- **Accueil** : présentation générale du site.
- **L'association** : présentation, le **bureau** (président, etc.), la liste des **membres**.
- **Documents** : les textes officiels de l'association (statuts, règlement intérieur…).
- **Événements** : le calendrier des événements à venir, et les **archives** des événements passés.
- **Actualités** : les nouvelles publiées par l'association.
- **Galerie** : les photos et vidéos.
- **Candidature d'adhésion** : formulaire pour demander à devenir membre (avec photo, pièce d'identité…).
- **Faire un don** : les visiteurs peuvent déclarer un don.
- **Contact** : envoyer un message à l'association.

### Côté membre (avec compte)
- **Espace membre** : consulter ses documents, l'annuaire des membres, la médiathèque.

### Côté bureau / secrétaire / trésorier / admin (avec compte)
- **Membres** : gérer la liste, activer/suspendre/désactiver un compte, les photos.
- **Événements** : créer et modifier les événements.
- **Documents & fichiers** : publier les textes officiels et fichiers.
- **Galerie** : gérer les photos et vidéos.
- **Actualités** : rédiger et publier les nouvelles.
- **Dons** : recevoir et gérer les dons des visiteurs (avec notifications).
- **Présences** : enregistrer qui est présent / absent / excusé à chaque événement.
- **Cotisations** : enregistrer et suivre les cotisations de chaque membre.
- **Feuille présence + cotisations** : une seule page pour cocher les présences ET les cotisations.
- **État global** : un rapport global (voir ci-dessous).
- **Comptabilité** : enregistrer les recettes et les dépenses.

### Le rapport « État global » (espace trésorier)
C'est un **tableau de bord complet** qui résume la vie de l'association
sur une période choisie (le trésorier choisit librement les **dates de début et de fin**).
Il affiche :

- le **nombre de présences et d'absences** sur la période ;
- le **nombre d'assistances** effectuées et **par type**
  (mariage, naissance, hospitalisation, décès, libération), avec le **montant
  prévu par les règles/statuts** pour chaque type ;
- le **montant total déboursé** par l'association pour ces assistances ;
- **l'état financier de chaque membre** : combien il doit, combien il a payé,
  son solde et son statut (à jour / en retard / non payé).

---

## 3. Qui peut faire quoi ? (les rôles)

Chaque compte sur le site a un **rôle** (= un « poste » qui donne des droits).

| Rôle | En français | Ce qu'il peut faire |
|------|-------------|---------------------|
| `member` | Membre | Voir son espace membre, les documents et l'annuaire. |
| `bureau` | Membre du bureau (ex. président) | Consulter, mais sans pouvoir modifier les finances. |
| `secretary` | Secrétaire | Gérer les membres, événements, présences, documents, galerie, actualités et dons. |
| `treasurer` | Trésorier | Gérer les cotisations, la comptabilité, les présences et le rapport « État global ». |
| `admin` | Administrateur | **Tout faire** sur le site. | 

> 💡 **Règle importante** : on ne peut **jamais** détruire par accident ce qu'un autre
> a écrit. Chaque action importante demande une **confirmation** avant d'être validée.

---

## 4. Langage et « pièces » du projet

Le projet est découpé en **deux grandes parties** (le « cerveau » et le « visage ») :

| Partie | Dossier | Rôle | Langage |
|--------|---------|------|---------|
| **Backend** | `backend/` | Le « cerveau » : la logique, les données (qu'il y a derrière le site). | Python + Django |
| **Frontend** | `frontend/` | Le « visage » : ce que l'on voit et avec quoi on clique. | React (JavaScript) |

Le backend et le frontend **communiquent** par une « passerelle » appelée **API**.
L'API est un ensemble de « prises » : le frontend demande de l'information à l'API,
et l'API lui répond. C'est un peu comme un serveur au restaurant qui transmet les plats
entre la cuisine (backend) et la salle (frontend).

Pour la production (mise en ligne), on utilise aussi **Docker**, qui permet de
regrouper tous les morceaux du site dans des « boîtes » prêtes à l'emploi.

---

## 5. Installer sur un ordinateur (développeur)

> Cette partie s'adresse à une personne qui va **installer et faire tourner** le site
> sur son ordinateur (pour le développement ou les tests). Pour simplement *utiliser*
> le site, il suffit d'avoir un compte (voir partie 6 et 7).

### Outils à installer avant de commencer
1. **Python 3** (pour le backend) — voir https://www.python.org/
2. **Node.js** (pour le frontend) — voir https://nodejs.org/
3. **Git** (pour récupérer le code) — voir https://git-scm.com/
4. *(optionnel pour la mise en ligne)* **Docker** — voir https://www.docker.com/

### 1) Récupérer le code
Ouvre un terminal (invite de commande) et tape :

```bash
git clone https://github.com/willi16/Site_AFE.git
cd Site_AFE
```

### 2) Préparer le backend (Python)
```bash
cd backend
python -m venv venv                 # crée un espace « propre » pour le projet
source venv/bin/activate            # active cet espace (sur Windows : venv\Scripts\activate)
pip install -r requirements.txt     # installe les « briques » nécessaires
```

Crée un fichier **`.env`** (la clé secrète) dans `backend/` :

```bash
# backend/.env
DJANGO_SECRET_KEY=cle-secrete-tres-longue-et-impossible-a-devinner
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

> 🔒 **Important** : le fichier `.env` contient des secrets. Il ne doit **jamais** être
> mis en ligne (il est déjà exclu de Git automatiquement).

Prépare la base de données (crée les tables) :
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

### 3) Préparer le frontend (Node)
```bash
cd ../frontend
npm install                        # installe les « briques » du frontend
```

---

## 6. Créer un compte admin au départ

Pour pouvoir se connecter la **première fois**, il faut créer un
« super-utilisateur » (un compte administrateur). Tape, dans le dossier `backend/` :

```bash
python manage.py createsuperuser
```

Il te demandera un **nom d'utilisateur**, un **email** et un **mot de passe**.
Note bien ces informations : c'est avec elles que tu te connecteras.

Ce compte est un **admin Django** : il peut tout faire.

---

## 7. Lancer le site

Tu as deux façons de lancer le site :

### Méthode simple (deux boutons) : le script `start.sh`
À la racine du projet (`Site_AFE/`), tape :
```bash
./start.sh
```
Cela démarre automatiquement le backend **et** le frontend.

### Méthode manuelle (deux terminaux)

**Terminal 1 — le backend :**
```bash
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2 — le frontend :**
```bash
cd frontend
npm run dev
```

### Où se connecter ?
| Quoi | Adresse |
|------|---------|
| Le site (frontend) | http://localhost:5173 |
| Le backend (API) | http://localhost:8000/api/ |
| La page d'administration Django | http://localhost:8000/admin/ |
| La documentation automatique de l'API | http://localhost:8000/api/docs/ |

Ouvre **http://localhost:5173** dans ton navigateur pour voir le site.

---

## 8. Mettre en ligne (production / déploiement)

Mettre en ligne = rendre le site accessible sur Internet pour tout le monde,
pas seulement sur ton ordinateur.

Le projet est déjà préparé pour être **conteneurisé** avec **Docker**
(fichier `docker-compose.yml` à la racine) et servi par **Nginx**.

Pour construire et lancer la version de production :
```bash
docker compose up --build -d
```

Cela lance trois « services » :
- **db** : la base de données (PostgreSQL) ;
- **backend** : l'API portée par Gunicorn sur le port 8000 ;
- **frontend** : le site (les fichiers construits) servi par Nginx sur les ports 80/443.

Pour la mise en ligne sur un vrai serveur, crée un fichier `backend/.env`
avec les vraies valeurs de production, puis lance la commande ci-dessus.

---

## 9. Les comptes de test

Pour tester sans casser les vraies données, le projet prévoit des comptes de démonstration :

| Rôle | Nom d'utilisateur | Mot de passe |
|------|-------------------|--------------|
| Admin | `admin` | `admin123` |
| Secrétaire | `secretaire` | `secretaire123` |
| Trésorier | `tresorier` | `tresorier123` |
| Bureau | `bureau` | `bureau123` |
| Membre | `membre` | `membre123` |

> Ces comptes servent au développement. En production, change tous ces mots de passe !

---

## 10. Structure du projet (pour les développeurs)

```
Site_AFE/
├── backend/            → le « cerveau » (Python / Django)
│   ├── afe_api/        → configuration principale du backend
│   ├── accounting/     → présences, cotisations, finances, dons, galerie, notifications
│   ├── contact/        → messages de contact
│   ├── documents/      → textes officiels (statuts, règlement…)
│   ├── events/         → événements, actualités, images
│   ├── members/        → membres, bureau, candidatures d'adhésion, réglages
│   ├── manage.py       → point d'entrée des commandes Django
│   └── requirements.txt→ liste des « briques » Python
├── frontend/           → le « visage » (React / JavaScript)
│   └── src/
│       ├── api/        → le « client » qui parle à l'API
│       ├── components/ → des morceaux d'interface réutilisables
│       ├── context/    → gestion de la connexion (qui est connecté)
│       ├── pages/      → les pages du site
│       │   ├── public/   → pages visibles par tous
│       │   ├── member/   → espace membre
│       │   └── bureau/   → espaces bureau/secrétaire/trésorier
│       └── utils/      → fonctions utiles (ex. le module « règlement » des cotisations)
├── nginx/              → configuration du serveur web pour la production
├── docker-compose.yml  → la « recette » Docker pour la mise en ligne
├── start.sh            → script qui lance tout d'un coup
└── README.md           → ce document
```

### Les principales « briques » de données (modèles)
- **Member** : un membre de l'association (avec son rôle et son statut de compte).
- **BureauMember** : un membre du bureau et son poste (président, secrétaire, …).
- **MembershipApplication** : une candidature d'adhésion.
- **Event** : un événement (avec une case « assemblée mensuelle »).
- **Actualite** : une actualité.
- **Attendance** (présence) : qui était présent/absent/excusé à un événement.
- **Cotisation** : une cotisation d'un membre (montant dû, montant payé, statut).
- **FinancialRecord** : une recette ou une dépense (comptabilité).
- **MeetingReport** : un compte-rendu de réunion.
- **Donation** : un don d'un visiteur.
- **GalleryItem** : une photo ou une vidéo de la galerie.
- **Document** : un texte officiel (statuts, règlement intérieur…).
- **ContactMessage** : un message de contact.

---

## 11. Les branches et GitHub

Le code est géré avec **Git** et hébergé sur **GitHub**.
Voici le sens des « branches » (des versions différentes du code) :

| Branche | Rôle |
|---------|------|
| `main` | La version **stable** (celle qui tourne en production). |
| `dev` | La version de **développement** (où l'on travaille les nouveautés). |
| `deployment` | Une **copie de `main`** utilisée pour organiser la mise en ligne. |

- On travaille sur `dev`, on vérifie, puis on « pousse » les changements.
- Quand c'est prêt et validé, on « pousse » vers `main`.
- La branche `deployment` sert de référence au moment de déployer.

---

## 12. Problèmes fréquents et solutions

**« Le frontend ne répond pas »** → Vérifie que `npm run dev` tourne dans un terminal,
et que tu ouvres **http://localhost:5173**.

**« L'API renvoie une erreur 401 »** → Tu n'es pas connecté ou ton compte n'a pas le
droit requis. Connecte-toi avec un compte du bon rôle (voir partie 3 et 9).

**« La page est blanche / ne charge pas »** → Reconstruis le frontend :
```bash
cd frontend && npm run build
```

**« J'ai changé les données (modèles) mais ça plante »** → Rejoue les migrations :
```bash
cd backend && source venv/bin/activate && python manage.py migrate
```

**« Je ne me souviens plus des commandes »** → Lis simplement le fichier `start.sh` :
il fait le travail à ta place.

---

*Bon courage et bonne utilisation ! Si un point reste flou, hésite pas à demander.*
