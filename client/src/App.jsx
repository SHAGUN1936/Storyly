import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TemplateDetail from './pages/TemplateDetail';
import MyVideos from './pages/MyVideos';
import Liked from './pages/Liked';
import Watch from './pages/Watch';
import Admin from './pages/Admin';
// Public info + marketplace + builder pages
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Tutorials from './pages/Tutorials';
import Stories from './pages/Stories';
import Marketplace from './pages/Marketplace';
import Builder from './pages/Builder';
import { StorylyMark } from './components/StorylyLogo';
import ScrollToTop from './components/ScrollToTop';

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-brand-500/40 animate-pulse" />
          <div className="relative animate-pulse">
            <StorylyMark size={64} idSuffix="route-loader" />
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/studio" replace />;
  return children;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Root = Landing (public marketing). /landing kept as an alias. */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/watch/:slug" element={<Watch />} />

          {/* Marketplace + Builder (the new earning model) */}
          <Route path="/marketplace/*" element={<Marketplace />} />
          <Route path="/builder/*"     element={<Builder />} />

          {/* Info / legal / help — each page handles its own sub-routes */}
          <Route path="/about/*"     element={<About />} />
          <Route path="/privacy/*"   element={<Privacy />} />
          <Route path="/terms/*"     element={<Terms />} />
          <Route path="/contact/*"   element={<Contact />} />
          <Route path="/help/*"      element={<Help />} />
          <Route path="/tutorials/*" element={<Tutorials />} />
          <Route path="/stories/*"   element={<Stories />} />

          {/* Signed-in app — wrapped in Layout shell (top nav + decor + footer).
              `Route element=<Layout>` (no path) is a layout route — it provides
              the shell without prefixing child paths. */}
          <Route element={<Layout />}>
            <Route path="/studio"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/liked"         element={<ProtectedRoute><Liked /></ProtectedRoute>} />
            <Route path="/template/:id"  element={<ProtectedRoute><TemplateDetail /></ProtectedRoute>} />
            <Route path="/my-videos"     element={<ProtectedRoute><MyVideos /></ProtectedRoute>} />
            <Route path="/admin"         element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
