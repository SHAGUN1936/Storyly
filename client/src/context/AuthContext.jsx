import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => setUser(userData);
  const logout = async () => {
    // Clear the user SYNCHRONOUSLY first so the same React batch that
    // navigates to /login also sees user=null. Otherwise Login's
    // `if (user) return <Navigate to="/studio" />` bounces us right back
    // to the protected route and only resolves after a manual refresh.
    setUser(null);
    try { await authAPI.logout(); } catch (_) { /* server-side cleanup best-effort */ }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
