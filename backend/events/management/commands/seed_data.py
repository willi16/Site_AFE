from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from members.models import Member, BureauMember, AssociationSettings
from events.models import Event, EventImage, Actualite
from documents.models import Document
from accounting.models import FinancialRecord, MeetingReport, Attendance, Cotisation, GalleryItem
from datetime import timedelta, date
from django.utils import timezone
from PIL import Image, ImageDraw
from django.core.files.base import ContentFile
from django.core.files import File
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOC_DIR = "/home/williams/Projet_personnel/doc_afe"


def make_image(width, height, color, lines=()):
    img = Image.new("RGB", (width, height), color)
    draw = ImageDraw.Draw(img)
    for i, (c1, c2) in enumerate(lines):
        y = i * (height // max(len(lines), 1)) + (height // max(len(lines), 1) // 2)
        draw.rectangle([10, y - 10, width - 10, y + 10], fill=c1)
        draw.rectangle([width - 80, y - 10, width - 10, y + 10], fill=c2)
    buf = __import__("io").BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ContentFile(buf.read(), name="img.png")


def make_text_image(width, height, color, label):
    img = Image.new("RGB", (width, height), color)
    buf = __import__("io").BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return ContentFile(buf.read(), name=f"{label}.png")


def make_pdf(title, body_lines, year):
    """Génère un petit PDF valide en pur Python (sans dépendance)."""
    import zlib
    buf = __import__("io").BytesIO()
    buf.write(b"%PDF-1.4\n")
    offsets = []
    objects = []

    def add(data):
        objects.append(data)

    text_ops = [f"BT /F1 18 Tf 50 760 Td ({_pdf_escape(title)}) Tj ET"]
    y = 720
    for ln in body_lines[:30]:
        text_ops.append(f"BT /F1 11 Tf 50 {y} Td ({_pdf_escape(ln[:110])}) Tj ET")
        y -= 18
    stream = zlib.compress("\n".join(text_ops).encode("latin-1", "replace"))

    obj1 = b"<< /Type /Catalog /Pages 2 0 R >>"
    obj2 = b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>"
    obj3 = b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>"
    obj4 = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
    obj5 = b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream"
    for i, data in enumerate([obj1, obj2, obj3, obj4, obj5], start=1):
        offsets.append(buf.tell())
        buf.write(f"{i} 0 obj\n".encode())
        buf.write(data)
        buf.write(b"\nendobj\n")
    xref_pos = buf.tell()
    buf.write(b"xref\n0 6\n0000000000 65535 f \n")
    for off in offsets:
        buf.write(f"{off:010d} 00000 n \n".encode())
    buf.write(f"trailer << /Size 6 /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode())
    buf.seek(0)
    return ContentFile(buf.read(), name=f"{title}.pdf")


def _pdf_escape(s):
    return s.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


class Command(BaseCommand):
    help = "Peuple la base de données avec des données fictives (editables)"

    def handle(self, *args, **options):
        self.stdout.write("Création des données fictives...")

        admin = self._ensure_user("admin", "admin@afe-association.org", "45bNOKr&wTqdsC3I24", is_superuser=True)
        if not Member.objects.filter(user=admin).exists():
            Member.objects.create(user=admin, role="admin", rgpd_consent=True, membership_status=True)
            self.stdout.write(self.style.SUCCESS("Admin créé: admin / 45bNOKr&wTqdsC3I24"))

        self._seed_accounts()
        admin = User.objects.get(username="admin")
        self._seed_members()
        self._seed_founders()
        self._seed_events(admin)
        self._seed_actualites(admin)
        self._seed_documents()
        self._seed_gallery(admin)
        self._seed_reports(admin)
        self._seed_financial(admin)
        self._seed_presence_cotisations(admin)

        self.stdout.write(self.style.SUCCESS("Données fictives créées avec succès !"))

    def _ensure_user(self, username, email, password, is_superuser=False):
        existing = User.objects.filter(username=username).first()
        if existing:
            return existing
        if is_superuser:
            user = User.objects.create_superuser(username, email, password)
        else:
            user = User.objects.create_user(username, email, password)
        user.save()
        return user

    # Membres réels de l'AFE (transcription_noms.pdf) — bureau + conseillers.
    # Le président fondateur (SAGBO Jean-Pierre) est distinct du président actuel
    # (KOLIWONOU K. Herve). Il se connecte avec le compte membre20.
    BUREAU_ACCOUNTS = [
        # username, mot de passe (identifiants.txt), prénom, nom, rôle membre, poste bureau, ordre, bio
        ("bureau", "mZHjBqXUo7WBQVM0Zm&", "K. Herve", "KOLIWONOU", "bureau", "president", 1, "Président de l'AFE."),
        ("secretaire", "l8mP&2x3TX$U%3nq7%", "Messan", "KPOSSOU", "secretary", "secretary", 2, "Secrétaire de l'AFE, chargé de la correspondance et des archives."),
        ("tresorier", "Dv46XwwByrx$$NT4*d", "Kodjon R.", "ATTIKLE", "treasurer", "treasurer", 3, "Trésorier de l'AFE, chargé de la gestion financière."),
        ("conseiller1", "rSF4^XkB*I@zUoAlqX", "Folly", "AMAVI", "member", "member", 4, "Conseiller de l'AFE."),
        ("conseiller2", "rSF4^XkB*I@zUoAlqX", "Tékôl", "KANGNI-SOUMPE", "member", "member", 5, "Conseiller de l'AFE."),
    ]

    MEMBER_ACCOUNTS = [
        # username, prénom, nom
        ("membre1", "Dailor", "JOHNSON"),
        ("membre2", "Samuel", "AMEGANVI"),
        ("membre3", "Richard", "AHONTO"),
        ("membre4", "Richard", "AFATCHAO"),
        ("membre5", "A. Louis", "AWONOGBEASBO"),
        ("membre6", "Teko", "GABIAM"),
        ("membre7", "Daniel", "KONDO"),
        ("membre8", "Ginado", "ZOGLO"),
        ("membre9", "Gabriel", "KOMANTA"),
        ("membre10", "Kossivi", "AGBODJI"),
        ("membre11", "Anani", "AMAH-TCHOUTCHOU"),
        ("membre12", "Comblan", "PLADJOE"),
        ("membre13", "Messan", "AMAVI"),
        ("membre14", "K. Socrate", "DADD"),
        ("membre15", "F. Donatien", "SENA"),
        ("membre16", "Anani", "ELAVAGNON"),
        ("membre17", "K. Nestor", "AYEWOUI"),
        ("membre18", "K. Abel", "GBESSEKOU"),
        # membre20 = président fondateur (SAGBO Jean-Pierre)
        ("membre20", "Jean-Pierre", "SAGBO"),
    ]

    # Anciens comptes de démonstration à retirer (pas dans la liste réelle)
    STALE_USERNAMES = ["membre19", "membre"]

    def _seed_accounts(self):
        for uname, pwd, fn, ln, role, pos, disp, bio in self.BUREAU_ACCOUNTS:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={"email": f"{uname}@afe-association.org", "first_name": fn, "last_name": ln},
            )
            user.email = f"{uname}@afe-association.org"
            user.first_name = fn
            user.last_name = ln
            user.set_password(pwd)
            user.save()
            member, _ = Member.objects.get_or_create(user=user)
            member.role = role
            member.rgpd_consent = True
            member.membership_status = True
            member.bio = bio
            member.is_active_member = True
            member.show_in_directory = True
            member.save()
            pos_field = pos if pos in dict(BureauMember.POSITION_CHOICES) else "member"
            BureauMember.objects.update_or_create(
                member=member,
                defaults={"position": pos_field, "display_order": disp},
            )
            self.stdout.write(self.style.SUCCESS(
                f"Compte bureau à jour: {uname} / {pwd} ({fn} {ln})"
            ))

    def _seed_members(self):
        now = timezone.now().date()
        for uname, fn, ln in self.MEMBER_ACCOUNTS:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={"email": f"{uname}@afe-association.org", "first_name": fn, "last_name": ln},
            )
            user.email = f"{uname}@afe-association.org"
            user.first_name = fn
            user.last_name = ln
            user.set_password("rSF4^XkB*I@zUoAlqX")
            user.save()
            member, _ = Member.objects.get_or_create(user=user)
            member.role = "member"
            member.rgpd_consent = True
            member.membership_status = True
            if not member.membership_date:
                member.membership_date = now - timedelta(days=int(uname.replace("membre", "")[:2]) % 12 * 30 + 30)
            member.bio = "Membre actif de l'AFE."
            member.is_active_member = True
            member.show_in_directory = True
            member.save()
            if created:
                self.stdout.write(self.style.SUCCESS(f"Compte créé: {uname} / rSF4^XkB*I@zUoAlqX"))

        # Retrait des anciens comptes de démonstration sans personne réelle associée
        for uname in self.STALE_USERNAMES:
            user = User.objects.filter(username=uname).first()
            if user and not user.is_superuser:
                if hasattr(user, "member_profile"):
                    Member.objects.filter(pk=user.member_profile.pk).delete()
                user.delete()
                self.stdout.write(self.style.WARNING(f"Ancien compte fictif supprimé: {uname}"))

        self.stdout.write(self.style.SUCCESS(f"Membres réels: {len(self.MEMBER_ACCOUNTS)} raccordés aux comptes"))

    def _seed_founders(self):
        # Remise à zéro des marqueurs fondateurs pour tous les membres
        Member.objects.update(is_founder=False, founder_title="", is_initiator=False)
        # SAGBO Jean-Pierre (compte membre20) = Président fondateur (distinct du président actuel)
        founder = Member.objects.filter(user__username="membre20").first()
        if founder:
            founder.is_founder = True
            founder.founder_title = "Président fondateur"
            founder.is_initiator = True
            founder.save(update_fields=["is_founder", "founder_title", "is_initiator"])
        # Le président actuel (bureau) n'est PAS fondateur
        president = Member.objects.filter(user__username="bureau").first()
        if president:
            president.is_founder = False
            president.founder_title = ""
            president.is_initiator = False
            president.save(update_fields=["is_founder", "founder_title", "is_initiator"])
        self.stdout.write(self.style.SUCCESS("Président fondateur (SAGBO) distinct du président actuel (KOLIWONOU)"))

    def _seed_events(self, admin):
        now = timezone.now()
        months = [(now + timedelta(days=30 * i)) for i in range(-5, 2)]
        events_data = [
            {"title": "Gala de la Fraternité 2026", "location": "Palais des Congrès", "status": "upcoming",
             "short_description": "Soirée de gala réunissant tous les membres et partenaires.",
             "description": "Soirée de gala réunissant tous les membres et partenaires pour célébrer nos accomplissements. Au programme : dîner, témoignages, remise de prix et divertissement.", "offset_days": 20},
            {"title": "Journée Portes Ouvertes", "location": "Siège de l'AFE", "status": "upcoming",
             "short_description": "Découvrez nos activités et rencontrez les bénévoles.",
             "description": "Venez découvrir nos activités et rencontrer les bénévoles lors de cette journée conviviale.", "offset_days": 40},
            {"title": "Atelier Entraide Solidaire", "location": "Centre Communautaire", "status": "upcoming",
             "short_description": "Atelier pratique dédié à l'entraide et au mutualisme.",
             "description": "Participez à notre atelier pratique dédié à l'entraide et au mutualisme. Échanges de compétences.", "offset_days": 55},
            {"title": "Fête de l'Entraide", "location": "Parc Municipal", "status": "past",
             "short_description": "Célébration annuelle de notre communauté.",
             "description": "Célébration annuelle de notre communauté avec animations, activités et repas partagé.", "offset_days": -45},
            {"title": "Collecte de Don Solidaires", "location": "Centre Social", "status": "past",
             "short_description": "Opération de collecte solidaire.",
             "description": "Opération de collecte de vêtements, jouets et denrées alimentaires pour les familles dans le besoin.", "offset_days": -100},
            {"title": "Assemblée Générale Annuelle", "location": "Maison des Associations", "status": "past",
             "short_description": "Assemblée générale annuelle de l'association.",
             "description": "Assemblée générale annuelle avec bilan d'activité et perspectives.", "offset_days": -155},
            {"title": "Tournoi Sportif Inter-Clubs", "location": "Stade Municipal", "status": "past",
             "short_description": "Tournoi sportif convivial entre les clubs membres.",
             "description": "Tournoi sportif convivial réunissant les clubs et associations partenaires.", "offset_days": -200},
        ]
        colors = [(135, 206, 250), (255, 182, 193), (144, 238, 144), (255, 228, 181), (216, 191, 216), (176, 224, 230), (255, 222, 173)]
        for i, data in enumerate(events_data):
            title = data["title"]
            evt = Event.objects.filter(title=title).first()
            if not evt:
                evt = Event.objects.create(created_by=admin, event_date=now + timedelta(days=data["offset_days"]), **{k: v for k, v in data.items() if k != "offset_days"})
            if not evt.images.exists():
                img = make_text_image(800, 500, colors[i % len(colors)], f"evt{i}")
                evt.images.create(image=img, caption=title, order=0)
        self.stdout.write(self.style.SUCCESS(f"Événements: {Event.objects.count()}"))

    def _seed_actualites(self, admin):
        now = timezone.now()
        news = [
            {"title": "Nouveau partenariat avec la Ville", "content": "L'AFE signe un accord de partenariat historique avec la municipalité pour renforcer nos actions sociales.", "excerpt": "L'AFE signe un accord de partenariat historique.", "offset": 0},
            {"title": "Résultats de la collecte solidaire", "content": "Grâce à la générosité de nos membres et partenaires, nous avons récolté plus de 5000€ et 200kg de denrées.", "excerpt": "Plus de 5000€ récoltés lors de la collecte solidaire.", "offset": 15},
            {"title": "Assemblée Générale 2026", "content": "Retrouvez le compte-rendu complet de notre assemblée annuelle et les perspectives pour l'année à venir.", "excerpt": "Compte-rendu de notre assemblée annuelle.", "offset": 30},
            {"title": "Inauguration du nouveau siège", "content": "Notre nouveau siège social est officiellement inauguré au coeur de la ville.", "excerpt": "Inauguration du nouveau siège social.", "offset": 60},
            {"title": "Campagne d'adhésion 2026", "content": "Lancement de la nouvelle campagne d'adhésion pour l'exercice 2026.", "excerpt": "Nouvelle campagne d'adhésion lancée.", "offset": 90},
        ]
        for n in news:
            if Actualite.objects.filter(title=n["title"]).exists():
                continue
            a = Actualite.objects.create(author=admin, title=n["title"], content=n["content"], excerpt=n["excerpt"], is_published=True)
            a.created_at = now - timedelta(days=n["offset"])
            a.save(update_fields=["created_at"])
            if not a.image:
                img = make_text_image(800, 450, (100, 149, 237), "news")
                a.image.save(f"news_{n['offset']}.png", img, save=True)
        self.stdout.write(self.style.SUCCESS(f"Actualités: {Actualite.objects.count()}"))

    def _seed_documents(self):
        from django.conf import settings
        seed_docs_dir = os.path.join(settings.BASE_DIR, "seed", "documents", "2026", "08")
        docs = [
            {"file": "statuts.pdf", "title": "Statuts de l'AFE", "category": "legal", "visible_to": "public"},
            {"file": "reglement-interieur.pdf", "title": "Règlement Intérieur", "category": "legal", "visible_to": "public"},
            {"file": "rapport_2025.pdf", "title": "Rapport d'activités 2025", "category": "report", "visible_to": "members"},
            {"file": "rapport_Janvier_2026.pdf", "title": "Rapport de Janvier 2026", "category": "report", "visible_to": "members"},
            {"file": "rapport_Février_2026.pdf", "title": "Rapport de Février 2026", "category": "report", "visible_to": "members"},
            {"file": "rapport_Mars_2026.pdf", "title": "Rapport de Mars 2026", "category": "report", "visible_to": "members"},
            {"file": "rapport_Avril_2026.pdf", "title": "Rapport d'Avril 2026", "category": "report", "visible_to": "members"},
            {"file": "rapport_Mai_2026.pdf", "title": "Rapport de Mai 2026", "category": "report", "visible_to": "members"},
            {"file": "rapport_Juin_2026.pdf", "title": "Rapport de Juin 2026", "category": "report", "visible_to": "members"},
        ]
        admin = User.objects.get(username="admin")
        Document.objects.all().delete()
        created = 0
        for d in docs:
            rel = "documents/2026/08/" + d["file"]
            doc = Document.objects.create(uploaded_by=admin, title=d["title"], category=d["category"], visible_to=d["visible_to"], description="")
            src = os.path.join(seed_docs_dir, d["file"])
            if os.path.exists(src):
                with open(src, "rb") as f:
                    doc.file.save(d["file"], File(f), save=False)
                    doc.file.name = rel
                    doc.save(update_fields=["file"])
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Documents: {Document.objects.count()} (créés: {created})"))

    def _seed_gallery(self, admin):
        now = timezone.now()
        GalleryItem.objects.all().delete()
        # 1) Médias réels (photos et vidéos WhatsApp) depuis le dossier seed/gallery
        img_sources, vid_sources = self._collect_seed_media()
        img_by_name = {name: rel for rel, name in img_sources}
        vid_by_name = {name: rel for rel, name in vid_sources}
        for idx, name in enumerate(sorted(img_by_name), start=1):
            self._create_gallery_file_item(img_by_name[name], name, f"Photo AFE {idx}", "image", admin)
        for idx, name in enumerate(sorted(vid_by_name), start=1):
            self._create_gallery_file_item(vid_by_name[name], name, f"Vidéo AFE {idx}", "video", admin)

        # 2) Éléments de démonstration en ligne (Unsplash / YouTube) — conservés
        images = [
            ("Gala de la Fraternité", "image", "Événements", "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80"),
            ("Journée Portes Ouvertes", "image", "Événements", "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"),
            ("Collecte solidaire", "image", "Solidarité", "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80"),
            ("Tournoi sportif", "image", "Activités", "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80"),
            ("Sortie culturelle", "image", "Activités", "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80"),
            ("Rencontre des membres", "image", "Solidarité", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80"),
            ("Atelier d'entraide", "image", "Solidarité", "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80"),
            ("Assemblée générale", "image", "Événements", "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80"),
        ]
        videos = [
            ("Vidéo de présentation de l'AFE", "video", "Vidéos", "https://www.youtube.com/embed/aqz-KE-bpKQ", "youtube"),
            ("Gala de la Fraternité - Moments forts", "video", "Vidéos", "https://www.youtube.com/embed/dQw4w9WgXcQ", "youtube"),
            ("Collecte solidaire 2026", "video", "Vidéos", "https://www.youtube.com/embed/e-ORhEE9VVg", "youtube"),
            ("Nos ateliers d'entraide", "video", "Vidéos", "https://www.youtube.com/embed/1La4QzGeaaQ", "youtube"),
        ]
        for title, ftype, cat, url in images:
            GalleryItem.objects.create(
                title=title, caption=title, category=cat, file_type=ftype,
                image_url=url, is_published=True, created_by=admin,
            )
        for title, ftype, cat, url, platform in videos:
            GalleryItem.objects.create(
                title=title, caption=title, category=cat, file_type=ftype,
                video_url=url, video_platform=platform, is_published=True, created_by=admin,
            )
        self.stdout.write(self.style.SUCCESS(f"Galerie: {GalleryItem.objects.count()} éléments (médias réels + démo en ligne)"))

    def _collect_seed_media(self):
        """Liste les médias réels présents dans backend/seed/gallery (rel seed/gallery, nom)."""
        from django.conf import settings
        seed_gallery = os.path.join(settings.BASE_DIR, "seed", "gallery")
        img_sources = []
        vid_sources = []
        for root, _dirs, files in os.walk(seed_gallery):
            rel_dir = os.path.relpath(root, os.path.join(settings.BASE_DIR, "seed"))
            for fname in sorted(files):
                if fname.lower().startswith("test"):
                    continue
                rel = os.path.join(rel_dir, fname).replace(os.sep, "/")
                if fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif")):
                    img_sources.append((rel, fname))
                elif fname.lower().endswith((".mp4", ".mov", ".mkv", ".avi", ".webm")):
                    vid_sources.append((rel, fname))
        return img_sources, vid_sources

    def _create_gallery_file_item(self, rel, name, title, file_type, admin):
        """Crée un élément de galerie en copiant le fichier seed/ vers le stockage.

        Le contenu est écrit via `default_storage.save(rel, ...)` pour garder un
        chemin relatif identique au dossier seed/ (les `Field.save()` préfixent
        `upload_to=...` et doubleraient le chemin)."""
        from django.conf import settings
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        src = os.path.join(settings.BASE_DIR, "seed", rel)
        with open(src, "rb") as fh:
            content = fh.read()
        saved_name = default_storage.save(rel, ContentFile(content))
        item = GalleryItem(
            title=title,
            caption=name,
            category="Photos" if file_type == "image" else "Vidéos",
            file_type=file_type,
            is_published=True,
            created_by=admin,
        )
        if file_type == "image":
            setattr(item, "image", saved_name)
        else:
            setattr(item, "video", saved_name)
        item.save()
        self.stdout.write(self.style.SUCCESS(f"Média réel ajouté: {title} <- {name}"))

    def _seed_reports(self, admin):
        now = date.today()
        month_names = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin"]
        for i, mname in enumerate(reversed(month_names)):
            title = f"PV Réunion {mname} {now.year}"
            if MeetingReport.objects.filter(title=title).exists():
                continue
            MeetingReport.objects.create(
                title=title,
                date=now.replace(day=15) - timedelta(days=30 * i),
                summary=f"Compte-rendu de la réunion du bureau du mois de {mname} {now.year}. Points abordés : bilan des activités, préparation des événements, suivi des adhésions et des cotisations.",
                visible_to="members",
                created_by=admin,
            )
            title_min = f"PV AG {mname} {now.year}"
            if not MeetingReport.objects.filter(title=title_min).exists():
                MeetingReport.objects.create(
                    title=title_min,
                    date=now.replace(day=28) - timedelta(days=30 * i),
                    summary=f"Procès-verbal de l'assemblée de {mname} {now.year}. Vote du bilan et des orientations.",
                    visible_to="members",
                    created_by=admin,
                )
        self.stdout.write(self.style.SUCCESS(f"Comptes-rendus/PV: {MeetingReport.objects.count()}, Docs: {Document.objects.count()}"))

    def _seed_financial(self, admin):
        now = date.today()
        members_count = Member.objects.filter(role="member").count()
        for i in range(5):
            d = now.replace(day=10) - timedelta(days=30 * i)
            title = f"Cotisations mensuelles {d.strftime('%m/%Y')}"
            if FinancialRecord.objects.filter(title=title, date=d).exists():
                continue
            FinancialRecord.objects.create(
                title=title, description=f"Perception des cotisations des membres pour {d.strftime('%B %Y')}.",
                amount=members_count * 2500, record_type="income", category="Cotisations", date=d, created_by=admin,
            )
            title_dep = f"Frais de fonctionnement {d.strftime('%m/%Y')}"
            if FinancialRecord.objects.filter(title=title_dep, date=d).exists():
                continue
            FinancialRecord.objects.create(
                title=title_dep, description="Loyer, électricité et fournitures du siège.",
                amount=15000, record_type="expense", category="Fonctionnement", date=d, created_by=admin,
            )
        self.stdout.write(self.style.SUCCESS(f"Enregistrements financiers: {FinancialRecord.objects.count()}"))

    def _seed_presence_cotisations(self, admin):
        now = timezone.now()
        members = list(Member.objects.filter(role="member"))
        events = list(Event.objects.filter(status="past"))
        if not events:
            events = list(Event.objects.all()[:3])
        titles = []
        for i in range(-3, 1):
            titles.append(f"Cotisation {now.year} - {now.month + i}")
        for m in members:
            # Attendance
            for evt in events[:3]:
                if Attendance.objects.filter(member=m, event=evt).exists():
                    continue
                status = "present" if (m.id + evt.id) % 4 != 0 else ("excuse" if (m.id + evt.id) % 7 == 0 else "absent")
                Attendance.objects.create(
                    member=m, event=evt, event_title=evt.title,
                    event_date=evt.event_date.date() if evt.event_date else None,
                    status=status, created_by=admin,
                )
            # Cotisations over month
            for mi, label in enumerate(titles):
                if Cotisation.objects.filter(member=m, label=label).exists():
                    continue
                amount = 2500
                paid = amount if (m.id + mi) % 3 != 0 else 0
                status = "paid" if paid >= amount else ("overdue" if mi < 2 else "pending")
                due = (date.today().replace(day=5) - timedelta(days=30 * (len(titles) - mi - 1)))
                Cotisation.objects.create(
                    member=m, label=label, amount=amount, amount_paid=paid,
                    status=status, due_date=due, created_by=admin,
                )
        self.stdout.write(self.style.SUCCESS(f"Présences: {Attendance.objects.count()}, Cotisations: {Cotisation.objects.count()}"))
