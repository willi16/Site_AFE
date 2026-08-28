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

    def _seed_accounts(self):
        accounts = [
            ("bureau", "bureau@afe-association.org", "mZHjBqXUo7WBQVM0Zm&", "Marie", "Dupont", "bureau", "president", 1, "Présidente de l'AFE depuis 2020."),
            ("tresorier", "tresorier@afe-association.org", "Dv46XwwByrx$$NT4*d", "Paul", "Bernard", "treasurer", "treasurer", 2, "Trésorier de l'AFE, chargé de la gestion financière."),
            ("secretaire", "secretaire@afe-association.org", "l8mP&2x3TX$U%3nq7%", "Sophie", "Leclerc", "secretary", "secretary", 3, "Secrétaire de l'AFE, chargée de la correspondance et des archives."),
            ("conseiller1", "conseiller1@afe-association.org", "rSF4^XkB*I@zUoAlqX", "Amadou", "Diallo", "member", "member", 4, "Conseiller de l'AFE."),
            ("conseiller2", "conseiller2@afe-association.org", "rSF4^XkB*I@zUoAlqX", "Claire", "Durand", "member", "member", 5, "Conseillère de l'AFE."),
        ]
        for uname, email, pwd, fn, ln, role, pos, disp, bio in accounts:
            if not User.objects.filter(username=uname).exists():
                user = User.objects.create_user(uname, email, pwd, first_name=fn, last_name=ln)
                m = Member.objects.create(
                    user=user, role=role, rgpd_consent=True, membership_status=True, bio=bio,
                )
                pos_field = pos if pos in dict(BureauMember.POSITION_CHOICES) else "member"
                BureauMember.objects.create(member=m, position=pos_field, display_order=disp)
                self.stdout.write(self.style.SUCCESS(f"Compte créé: {uname} / {pwd}"))

    def _seed_members(self):
        members_data = [
            ("membre1", "Awa", "Camara"), ("membre2", "Salam", "Traoré"), ("membre3", "Fatou", "Ndiaye"),
            ("membre4", "Ibrahima", "Sow"), ("membre5", "Mariam", "Cissé"), ("membre6", "Oumar", "Bâ"),
            ("membre7", "Aminata", "Koné"), ("membre8", "Moussa", "Diallo"), ("membre9", "Khadija", "Fofana"),
            ("membre10", "Seydou", "Keïta"), ("membre11", "Rokhaya", "Gueye"), ("membre12", "Aliou", "Ndiaye"),
            ("membre13", "Nafi", "Sarr"), ("membre14", "Cheikh", "Niang"), ("membre15", "Bineta", "Diop"),
            ("membre16", "Mamadou", "Thiam"), ("membre17", "Adja", "Fall"), ("membre18", "Idrissa", "Kaba"),
            ("membre19", "Penda", "Mbow"), ("membre20", "Souleymane", "Kane"),
        ]
        existing = {m.user.username for m in Member.objects.select_related("user")}
        now = timezone.now()
        for uname, fn, ln in members_data:
            if uname in existing:
                continue
            user = User.objects.create_user(uname, f"{uname}@afe-association.org", "rSF4^XkB*I@zUoAlqX", first_name=fn, last_name=ln)
            Member.objects.create(
                user=user, role="member", rgpd_consent=True, membership_status=True,
                membership_date=now - timedelta(days=30 * (int(uname[-1]) % 12 + 1)),
                bio=f"Membre actif de l'AFE."
            )
        self.stdout.write(self.style.SUCCESS(f"Membres fictifs: {len(members_data)} créés"))

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
        docs = [
            {"title": "Statuts de l'AFE", "category": "legal", "visible_to": "public", "file": "STATUTS DE AFE DEF.pdf"},
            {"title": "Règlement Intérieur", "category": "legal", "visible_to": "public", "file": "RÈGLEMENT INTÉRIEUR  AFE DEF.pdf"},
        ]
        for d in docs:
            if Document.objects.filter(title=d["title"]).exists():
                continue
            doc = Document.objects.create(uploaded_by=User.objects.get(username="admin"), title=d["title"], category=d["category"], visible_to=d["visible_to"], description="")
            src = os.path.join(DOC_DIR, d["file"])
            if os.path.exists(src):
                with open(src, "rb") as f:
                    doc.file.save(os.path.basename(src), File(f), save=True)
        self.stdout.write(self.style.SUCCESS("Statuts + Règlement attachés"))
        # Fallback in case DOC_DIR missing
        for d in docs:
            doc = Document.objects.filter(title=d["title"]).first()
            if doc and not doc.file:
                src = os.path.join(DOC_DIR, d["file"])
                if os.path.exists(src):
                    with open(src, "rb") as f:
                        doc.file.save(os.path.basename(src), File(f), save=True)

    def _seed_gallery(self, admin):
        now = timezone.now()
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
            if GalleryItem.objects.filter(title=title).exists():
                continue
            GalleryItem.objects.create(
                title=title, caption=title, category=cat, file_type=ftype,
                image_url=url, is_published=True, created_by=admin,
            )
        for title, ftype, cat, url, platform in videos:
            if GalleryItem.objects.filter(title=title).exists():
                continue
            GalleryItem.objects.create(
                title=title, caption=title, category=cat, file_type=ftype,
                video_url=url, video_platform=platform, is_published=True, created_by=admin,
            )
        self.stdout.write(self.style.SUCCESS(f"Galerie: {GalleryItem.objects.count()} (internet images + vidéos)"))

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
        for i, mname in enumerate(reversed(month_names)):
            title = f"Rapport d'activité {mname} {now.year}"
            doc = Document.objects.filter(title=title).first()
            if not doc:
                doc = Document.objects.create(
                    title=title,
                    description=f"Rapport d'activité du mois de {mname} {now.year}. Réalisations, indicateurs et perspectives.",
                    category="report",
                    visible_to="members",
                    uploaded_by=admin,
                )
            if doc and not doc.file:
                body = [
                    f"RAPPORT D'ACTIVITÉ - {mname.upper()} {now.year}",
                    "",
                    f"Rapport d'activité de l'association pour le mois de {mname} {now.year}.",
                    "",
                    "1. Activités menées",
                    f"   - Réunion du bureau du {mname} {now.year}",
                    "   - Organisation d'événements associatifs",
                    "   - Accueil et suivi de nouveaux adhérents",
                    "",
                    "2. Indicateurs",
                    f"   - Adhérents actifs en {mname} {now.year}: {Member.objects.filter(role='member').count()}",
                    "   - Événements planifiés: 3",
                    "   - Taux de recouvrement des cotisations: 85%",
                    "",
                    "3. Perspectives",
                    "   - Consolider la trésorerie de l'association",
                    "   - Développer les partenariats locaux",
                    "   - Organiser l'assemblée générale",
                ]
                doc.file.save(f"rapport_{mname}_{now.year}.pdf", make_pdf(title, body, now.year), save=True)
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
