from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from members.models import Member, BureauMember
from events.models import Event, Actualite
from documents.models import Document
from datetime import timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = "Peuple la base de données avec des données initiales"

    def handle(self, *args, **options):
        self.stdout.write("Création des données initiales...")

        if not User.objects.filter(username="admin").exists():
            admin = User.objects.create_superuser("admin", "admin@afe-association.org", "admin123")
            admin.first_name = "Admin"
            admin.last_name = "AFE"
            admin.save()
            Member.objects.create(user=admin, role="admin", rgpd_consent=True, membership_status=True)
            self.stdout.write(self.style.SUCCESS("Superuser créé: admin / admin123"))

        if not User.objects.filter(username="bureau").exists():
            bureau_user = User.objects.create_user("bureau", "bureau@afe-association.org", "bureau123")
            bureau_user.first_name = "Marie"
            bureau_user.last_name = "Dupont"
            bureau_user.save()
            member = Member.objects.create(user=bureau_user, role="bureau", rgpd_consent=True, membership_status=True, bio="Présidente de l'AFE depuis 2020.")
            BureauMember.objects.create(member=member, position="president", display_order=1)
            self.stdout.write(self.style.SUCCESS("Utilisateur bureau créé: bureau / bureau123"))

        if not User.objects.filter(username="secretaire").exists():
            sec_user = User.objects.create_user("secretaire", "secretaire@afe-association.org", "secretaire123")
            sec_user.first_name = "Sophie"
            sec_user.last_name = "Leclerc"
            sec_user.save()
            sec_member = Member.objects.create(user=sec_user, role="secretary", rgpd_consent=True, membership_status=True, bio="Secrétaire de l'AFE, chargée de la correspondance et des archives.")
            BureauMember.objects.create(member=sec_member, position="secretary", display_order=3)
            self.stdout.write(self.style.SUCCESS("Secrétaire créé: secretaire / secretaire123"))

        if not User.objects.filter(username="membre").exists():
            membre_user = User.objects.create_user("membre", "membre@afe-association.org", "membre123")
            membre_user.first_name = "Jean"
            membre_user.last_name = "Martin"
            membre_user.save()
            Member.objects.create(user=membre_user, role="member", rgpd_consent=True, membership_status=True)
            self.stdout.write(self.style.SUCCESS("Membre créé: membre / membre123"))

        if not User.objects.filter(username="tresorier").exists():
            tres_user = User.objects.create_user("tresorier", "tresorier@afe-association.org", "tresorier123")
            tres_user.first_name = "Paul"
            tres_user.last_name = "Bernard"
            tres_user.save()
            tres_member = Member.objects.create(user=tres_user, role="treasurer", rgpd_consent=True, membership_status=True, bio="Trésorier de l'AFE, chargé de la gestion financière.")
            BureauMember.objects.create(member=tres_member, position="treasurer", display_order=2)
            self.stdout.write(self.style.SUCCESS("Trésorier créé: tresorier / tresorier123"))

        now = timezone.now()
        events_data = [
            {"title": "Gala de la Fraternité 2026", "description": "Soirée de gala réunissant tous les membres et partenaires pour célébrer nos accomplissements de l'année. Au programme : dîner, témoignages, remise de prix et divertissement.", "short_description": "Soirée de gala réunissant tous les membres et partenaires.", "event_date": now + timedelta(days=20), "location": "Palais des Congrès", "status": "upcoming"},
            {"title": "Journée Portes Ouvertes", "description": "Venez découvrir nos activités et rencontrer les bénévoles lors de cette journée conviviale. Stations d'activités, présentations et collation offerte.", "short_description": "Découvrez nos activités et rencontrez les bénévoles.", "event_date": now + timedelta(days=40), "location": "Siège de l'AFE", "status": "upcoming"},
            {"title": "Atelier Entraide Solidaire", "description": "Participez à notre atelier pratique dédié à l'entraide et au mutualisme. Échanges de compétences et partage de bonnes pratiques.", "short_description": "Atelier pratique dédié à l'entraide et au mutualisme.", "event_date": now + timedelta(days=55), "location": "Centre Communautaire", "status": "upcoming"},
            {"title": "Fête de l'Entraide 2025", "description": "Célébration annuelle de notre communauté avec animations, activités et repas partagé. Un moment de convivialité pour tous.", "short_description": "Célébration annuelle de notre communauté.", "event_date": now - timedelta(days=45), "location": "Parc Municipal", "status": "past"},
            {"title": "Collecte de Don Solidaires", "description": "Opération de collecte de vêtements, jouets et denrées alimentaires pour les familles dans le besoin.", "short_description": "Opération de collecte solidaire.", "event_date": now - timedelta(days=100), "location": "Centre Social", "status": "past"},
        ]
        for data in events_data:
            if not Event.objects.filter(title=data["title"]).exists():
                Event.objects.create(created_by=admin, **data)

        news_data = [
            {"title": "Nouveau partenariat avec la Ville", "content": "L'AFE signe un accord de partenariat historique avec la municipalité pour renforcer nos actions sociales et accroître notre impact sur le territoire.", "excerpt": "L'AFE signe un accord de partenariat historique avec la municipalité."},
            {"title": "Résultats de la collecte solidaire", "content": "Grâce à la générosité de nos membres et partenaires, nous avons récolté plus de 5000€ et 200kg de denrées pour les familles dans le besoin.", "excerpt": "Plus de 5000€ récoltés lors de la collecte solidaire."},
            {"title": "Assemblée Générale 2026", "content": "Retrouvez le compte-rendu complet de notre assemblée annuelle et les perspectives passionnantes pour l'année à venir.", "excerpt": "Compte-rendu de notre assemblée annuelle."},
        ]
        for data in news_data:
            if not Actualite.objects.filter(title=data["title"]).exists():
                Actualite.objects.create(author=admin, **data)

        docs_data = [
            {"title": "Statuts de l'AFE", "category": "legal", "visible_to": "public"},
            {"title": "Règlement Intérieur", "category": "legal", "visible_to": "public"},
            {"title": "Rapport d'activité 2025", "category": "report", "visible_to": "public"},
        ]
        for data in docs_data:
            if not Document.objects.filter(title=data["title"]).exists():
                Document.objects.create(uploaded_by=admin, **data)

        self.stdout.write(self.style.SUCCESS("Données initiales créées avec succès !"))
