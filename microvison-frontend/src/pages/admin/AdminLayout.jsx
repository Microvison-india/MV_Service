import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', label: 'Action Centre', icon: '⚡' },
    { path: '/admin/complaints', label: 'All Complaints', icon: '📋' },
    { path: '/admin/service-centres', label: 'Service Centres', icon: '🏢' },
    { path: '/admin/presets', label: 'Presets', icon: '🏷️' },
    { path: '/admin/billing', label: 'Billing', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Sticky Top Header ── */}
      <header className="sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            className="sm:hidden p-2 rounded-md hover:bg-muted transition text-foreground"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className="text-lg">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Microvision Administration</p>
            <p className="text-sm font-semibold text-foreground leading-tight">
              {user?.name || 'Admin Dashboard'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'} // matches exactly for index page
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-lg hover:bg-muted font-medium"
        >
          Logout
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-card border-b border-border px-4 py-2 flex flex-col gap-1 shadow-inner animate-in slide-in-from-top duration-200">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}

      {/* Page Content Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
