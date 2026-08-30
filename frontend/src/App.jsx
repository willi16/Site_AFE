import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/ui/LoadingSpinner';

const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const EventsPage = lazy(() => import('./pages/public/EventsPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const AdhesionPage = lazy(() => import('./pages/public/AdhesionPage'));
const DonationPage = lazy(() => import('./pages/public/DonationPage'));
const GenericPage = lazy(() => import('./pages/public/GenericPage'));
const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'));
const MemberDocuments = lazy(() => import('./pages/member/MemberDocuments'));
const MemberAnnuaire = lazy(() => import('./pages/member/MemberAnnuaire'));
const MemberMediatheque = lazy(() => import('./pages/member/MemberMediatheque'));
const BureauDashboard = lazy(() => import('./pages/bureau/BureauDashboard'));
const TreasurerDashboard = lazy(() => import('./pages/bureau/TreasurerDashboard'));
const SecretaryDashboard = lazy(() => import('./pages/bureau/SecretaryDashboard'));

function ProtectedRoute({ children, requireBureau = false, requireTreasurer = false, requireSecretary = false }) {
  const { isAuthenticated, isBureau, isTreasurer, isSecretary, loading, getDashboardPath, member } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireTreasurer && !isTreasurer && !isBureau) return <Navigate to={getDashboardPath(member)} replace />;
  if (requireSecretary && !isSecretary && !isBureau) return <Navigate to={getDashboardPath(member)} replace />;
  if (requireBureau && !isBureau && !isTreasurer && !isSecretary) return <Navigate to={getDashboardPath(member)} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, member, loading, getDashboardPath } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (isAuthenticated) return <Navigate to={getDashboardPath(member)} replace />;
  return children;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
          <Route path="/association" element={<AboutPage />} />
          <Route path="/association/bureau" element={<GenericPage pageKey="bureau" />} />
          <Route path="/association/membres" element={<GenericPage pageKey="membres" />} />
          <Route path="/association/documents" element={<GenericPage pageKey="documents" />} />
          <Route path="/evenements" element={<EventsPage />} />
          <Route path="/evenements/archives" element={<GenericPage pageKey="archives" />} />
          <Route path="/actualites" element={<GenericPage pageKey="actualites" />} />
          <Route path="/adhesion" element={<AdhesionPage />} />
          <Route path="/don" element={<DonationPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/espace-membre" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/espace-membre/documents" element={<ProtectedRoute><MemberDocuments /></ProtectedRoute>} />
          <Route path="/espace-membre/annuaire" element={<ProtectedRoute><MemberAnnuaire /></ProtectedRoute>} />
          <Route path="/espace-membre/mediatheque" element={<ProtectedRoute><MemberMediatheque /></ProtectedRoute>} />
          <Route path="/espace-bureau" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/membres" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/evenements" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/documents" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/comptabilite" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/fichiers" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/galerie" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/messages" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/agenda" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/actualites" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/dons" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/membres" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/presences" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/documents" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/fichiers" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-secretaire/galerie" element={<ProtectedRoute requireSecretary><SecretaryDashboard /></ProtectedRoute>} />
          <Route path="/espace-tresorier" element={<ProtectedRoute requireTreasurer><TreasurerDashboard /></ProtectedRoute>} />
          <Route path="/espace-tresorier/comptabilite" element={<ProtectedRoute requireTreasurer><TreasurerDashboard /></ProtectedRoute>} />
          <Route path="/espace-tresorier/cotisations" element={<ProtectedRoute requireTreasurer><TreasurerDashboard /></ProtectedRoute>} />
          <Route path="/espace-tresorier/presences" element={<ProtectedRoute requireTreasurer><TreasurerDashboard /></ProtectedRoute>} />
          <Route path="/espace-tresorier/presence-cotisations" element={<ProtectedRoute requireTreasurer><TreasurerDashboard /></ProtectedRoute>} />
          <Route path="/espace-tresorier/etat-global" element={<ProtectedRoute requireTreasurer><TreasurerDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '12px', fontSize: '14px' } }} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
