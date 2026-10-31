import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserStudio from './pages/UserStudio';
import TemplatePreview from './pages/TemplatePreview';
import BuilderLivePreview from './pages/BuilderLivePreview';
import MyVideos from './pages/MyVideos';
import Account from './pages/Account';
import Receipts from './pages/Receipts';
import Watch from './pages/Watch';
import Admin from './pages/Admin';
import AdminTemplateLibrary from './pages/AdminTemplateLibrary';
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

  // NProgress bar on route changes — quick start, fast finish.
  useEffect(() => {
    NProgress.configure({ showSpinner: false, trickleSpeed: 160, minimum: 0.18 });
    NProgress.start();
    const t = setTimeout(() => NProgress.done(), 340);
    return () => { clearTimeout(t); NProgress.done(); };
  }, [location.pathname]);

  /* Toasts dismiss on ANY click anywhere (plus their own × button and a
     ~1.5s auto-timeout set on the Toaster). The listener is added on the
     next frame so the very click that triggered a toast doesn't also
     dismiss it. */
  useEffect(() => {
    const dismissAll = () => toast.dismiss();
    let raf = requestAnimationFrame(() => {
      document.addEventListener('pointerdown', dismissAll);
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', dismissAll);
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        /* Offset toasts BELOW the floating navbar (~96px tall) so the
           welcome / error popups don't sit on top of the nav. The
           extra ~16px gives breathing room between nav and toast. */
        offset="7rem"
        /* Quick auto-dismiss; also closes on the × button or any click
           anywhere (see the pointerdown listener above). */
        duration={1500}
        richColors
        toastOptions={{
          style: {
            borderRadius: '14px',
            border: '1px solid rgba(139,92,246,0.25)',
            fontFamily: 'Inter, system-ui, sans-serif',
          },
          className: 'storyly-toast',
        }}
      />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Root = Landing (public marketing). /landing kept as an alias. */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/watch/:slug" element={<Watch />} />
          {/* Full-browser live preview of the editor's current design (data
              handed over via localStorage). No Layout chrome — looks like the
              real shared website. */}
          <Route path="/live-preview" element={<BuilderLivePreview />} />

          {/* User Studio — the full admin-style visual editor for users.
              Rendered OUTSIDE the Layout shell so it owns the whole screen
              (its own dark editor chrome). ProtectedRoute still gates it. */}
          <Route
            path="/template/:id/customize"
            element={<ProtectedRoute><UserStudio /></ProtectedRoute>}
          />
          {/* Full editor at /edit — also full-screen (outside Layout) so the
              dark studio chrome owns the viewport, matching /customize. */}
          <Route
            path="/template/:id/edit"
            element={<ProtectedRoute><UserStudio /></ProtectedRoute>}
          />

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
            {/* /liked redirects into My pages → "Liked" filter. */}
            <Route path="/liked"         element={<Navigate to="/my-videos?filter=liked" replace />} />
            {/* Default landing for a chosen template = the read-only
                preview. The full editor stays available at /edit for
                builders/power users + draft resumption. */}
            <Route path="/template/:id"      element={<ProtectedRoute><TemplatePreview /></ProtectedRoute>} />
            <Route path="/my-videos"     element={<ProtectedRoute><MyVideos /></ProtectedRoute>} />
            <Route path="/account"       element={<ProtectedRoute><Account /></ProtectedRoute>} />
            <Route path="/receipts"      element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
            <Route path="/admin"         element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute adminOnly><AdminTemplateLibrary /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
