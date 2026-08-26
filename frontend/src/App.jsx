import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import EventsPage from './pages/public/EventsPage';
import ContactPage from './pages/public/ContactPage';
import LoginPage from './pages/public/LoginPage';
import AdhesionPage from './pages/public/AdhesionPage';
import GenericPage from './pages/public/GenericPage';
import MemberDashboard from './pages/member/MemberDashboard';
import BureauDashboard from './pages/bureau/BureauDashboard';
import LoadingSpinner from './components/ui/LoadingSpinner';

function ProtectedRoute({ children, requireBureau = false }) {
  const { isAuthenticated, isBureau, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireBureau && !isBureau) return <Navigate to="/espace-membre" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isBureau, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (isAuthenticated) return <Navigate to={isBureau ? '/espace-bureau' : '/espace-membre'} replace />;
  return children;
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
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
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/espace-membre" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/espace-membre/documents" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/espace-membre/annuaire" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/espace-membre/mediatheque" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/membres" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/evenements" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/documents" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/comptabilite" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/fichiers" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="/espace-bureau/messages" element={<ProtectedRoute requireBureau><BureauDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '12px', fontSize: '14px' } }} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
