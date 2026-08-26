import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, Share2, ExternalLink, Heart } from 'lucide-react';

const footerLinks = {
  association: {
    title: "L'Association",
    links: [
      { label: 'Qui sommes-nous ?', path: '/association' },
      { label: 'Le Bureau', path: '/association/bureau' },
      { label: 'Nos Membres', path: '/association/membres' },
      { label: 'Textes officiels', path: '/association/documents' },
    ],
  },
  vie: {
    title: 'Vie Associative',
    links: [
      { label: 'Agenda', path: '/evenements' },
      { label: 'Galerie & Archives', path: '/evenements/archives' },
      { label: 'Actualités', path: '/actualites' },
    ],
  },
  rejoindre: {
    title: 'Nous Rejoindre',
    links: [
      { label: 'Adhésion', path: '/adhesion' },
      { label: 'Faire un don', path: '/don' },
      { label: 'Contact', path: '/contact' },
      { label: 'Espace Membre', path: '/login' },
    ],
  },
};

function Footer() {
  return (
    <footer className="bg-surface-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo-afe.jpg" alt="AFE Logo" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <span className="text-xl font-bold">AFE</span>
                <span className="block text-xs text-surface-400">Fraternité & Entraide</span>
              </div>
            </div>
            <p className="text-surface-400 text-sm leading-relaxed mb-6">
              L'Association de Fraternité et d'Entraide œuvre pour le bien-être et l'entraide au sein de notre communauté depuis sa création.
            </p>
            <div className="flex gap-3">
              {[Globe, Share2, ExternalLink, Heart].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center text-surface-400 hover:bg-primary-500 hover:text-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-5 text-white">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.path}>
                    <Link to={link.path} className="text-sm text-surface-400 hover:text-accent-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact & Newsletter */}
        <div className="mt-12 pt-8 border-t border-surface-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-surface-400">
                  <Mail className="w-4 h-4 text-accent-400" />
                  associationfe@gmail.com
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-400">
                  <Phone className="w-4 h-4 text-accent-400" />
                  91 08 90 82 / 92 07 59 13
                </div>
                <div className="flex items-center gap-3 text-sm text-surface-400">
                  <MapPin className="w-4 h-4 text-accent-400" />
                  Agodékè
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Newsletter</h3>
              <p className="text-sm text-surface-400 mb-3">Restez informé de nos actualités</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-sm text-white placeholder:text-surface-500 focus:outline-none focus:border-primary-500"
                />
                <button type="button" className="btn-accent text-sm px-5">
                  S'inscrire
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-surface-500">
            &copy; {new Date().getFullYear()} AFE - Association de Fraternité et d'Entraide. Tous droits réservés.
          </p>
          <p className="text-xs text-surface-500 flex items-center gap-1">
            Fait avec <Heart className="w-3 h-3 text-red-500 fill-red-500" /> pour la communauté
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
