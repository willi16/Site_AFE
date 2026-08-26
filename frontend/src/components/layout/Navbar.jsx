import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, FileText, Users, Calendar, Camera, Newspaper, HandHeart, Phone, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navLinks = [
  { label: 'Accueil', path: '/' },
  {
    label: "L'Association",
    children: [
      { label: 'Qui sommes-nous ?', path: '/association', icon: FileText },
      { label: 'Le Bureau', path: '/association/bureau', icon: Users },
      { label: 'Nos Membres', path: '/association/membres', icon: Users },
      { label: 'Textes officiels', path: '/association/documents', icon: FileText },
    ],
  },
  {
    label: 'Vie Associative',
    children: [
      { label: 'Agenda', path: '/evenements', icon: Calendar },
      { label: 'Galerie & Archives', path: '/evenements/archives', icon: Camera },
      { label: 'Actualités', path: '/actualites', icon: Newspaper },
    ],
  },
  {
    label: 'Nous Rejoindre',
    children: [
      { label: 'Adhésion', path: '/adhesion', icon: HandHeart },
      { label: 'Contact', path: '/contact', icon: Phone },
    ],
  },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { isAuthenticated, isBureau, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo-afe.jpg" alt="AFE Logo" className="h-10 w-10 rounded-xl object-cover group-hover:scale-105 transition-transform" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-primary-500 font-[var(--font-display)]">AFE</span>
              <span className="block text-[10px] text-surface-500 -mt-1 tracking-wider">FRATERNITÉ & ENTRAIDE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.children && setOpenDropdown(link.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  to={link.children ? link.children[0].path : link.path}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-surface-700 hover:text-primary-500 rounded-lg hover:bg-primary-50 transition-all"
                >
                  {link.label}
                  {link.children && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />}
                </Link>
                {link.children && openDropdown === link.label && (
                  <div className="absolute top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-surface-100 py-2 mt-1 animate-fadeInUp">
                    {link.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:text-primary-500 hover:bg-primary-50 transition-all"
                      >
                        {child.icon && <child.icon className="w-4 h-4" />}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Auth section */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-surface-50 transition-all">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-surface-700">{user?.first_name || user?.username}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
                </button>
                <div className="absolute right-0 top-full w-56 bg-white rounded-xl shadow-xl border border-surface-100 py-2 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to={isBureau ? '/espace-bureau' : '/espace-membre'} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 hover:text-primary-500 hover:bg-primary-50">
                    <LayoutDashboard className="w-4 h-4" />
                    {isBureau ? 'Espace Bureau' : 'Espace Membre'}
                  </Link>
                  <hr className="my-1 border-surface-100" />
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm">
                <User className="w-4 h-4 mr-2" />
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-surface-50">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-surface-100 shadow-xl animate-fadeInUp">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <div key={link.label}>
                {link.children ? (
                  <>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === link.label ? null : link.label)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-surface-700 rounded-xl hover:bg-surface-50"
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === link.label && (
                      <div className="pl-4 space-y-1">
                        {link.children.map((child) => (
                          <Link key={child.path} to={child.path} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-600 rounded-lg hover:bg-primary-50 hover:text-primary-500">
                            {child.icon && <child.icon className="w-4 h-4" />}
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link to={link.path} className="block px-4 py-3 text-sm font-medium text-surface-700 rounded-xl hover:bg-surface-50">
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
            <hr className="border-surface-100" />
            {isAuthenticated ? (
              <>
                <Link to={isBureau ? '/espace-bureau' : '/espace-membre'} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary-500 rounded-xl hover:bg-primary-50">
                  <LayoutDashboard className="w-4 h-4" />
                  {isBureau ? 'Espace Bureau' : 'Espace Membre'}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 rounded-xl hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary w-full text-sm justify-center">
                <User className="w-4 h-4 mr-2" />
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
