import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// GRD Section 10 — SC Portal layout with 3 tabs + badge on New Requests

export default function SCLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [newCount, setNewCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchNewCount = useCallback(async () => {
    try {
      const { data } = await api.get('/api/complaints/my', {
        params: { status: 'assigned' },
      });
      setNewCount(data.complaints?.length ?? 0);
    } catch {
      // silently fail — badge just won't show
    }
  }, []);

  useEffect(() => {
    fetchNewCount();
    // Re-poll every 60 seconds to keep badge fresh
    const interval = setInterval(fetchNewCount, 60000);
    return () => clearInterval(interval);
  }, [fetchNewCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/sc/new-requests', label: 'New Requests', icon: '📥', badge: newCount },
    { path: '/sc/my-complaints', label: 'My Complaints', icon: '📋', badge: 0 },
    { path: '/sc/billing', label: 'Billing', icon: '💰', badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-muted transition"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="text-lg">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Service Centre Portal</p>
            <p className="text-sm font-semibold text-foreground leading-tight">{user?.name || 'SC Dashboard'}</p>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          Logout
        </button>
      </header>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-card border-b border-border px-4 py-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      )}

      {/* ── Page Content ── */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
        <Outlet context={{ refreshBadge: fetchNewCount }} />
      </main>
    </div>
  );
}
