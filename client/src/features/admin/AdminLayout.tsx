import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Users,
  ClipboardList,
  Megaphone,
  Phone,
  Truck,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export function AdminLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const base = `/${citySlug}/admin`;

  const navItems = [
    { to: base, end: true, icon: LayoutDashboard, label: t('admin.nav.dashboard') },
    { to: `${base}/requests`, icon: ClipboardList, label: t('admin.nav.requests') },
    { to: `${base}/wards`, icon: MapPin, label: t('admin.nav.wards') },
    { to: `${base}/departments`, icon: Building2, label: t('admin.nav.departments') },
    { to: `${base}/staff`, icon: Users, label: t('admin.nav.staff') },
    { to: `${base}/vehicles`, icon: Truck, label: t('admin.vehicles.title') },
    { to: `${base}/announcements`, icon: Megaphone, label: t('admin.nav.announcements') },
    { to: `${base}/emergency-contacts`, icon: Phone, label: t('admin.nav.emergencyContacts') },
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">{t('common.appName')}</div>
        <div className="admin-sidebar-role">{t('role.ADMIN')}</div>
        <nav className="admin-nav" aria-label={t('admin.nav.dashboard')}>
          {navItems.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button type="button" className="admin-nav-link admin-logout" onClick={handleLogout}>
          <LogOut size={22} aria-hidden="true" />
          <span>{t('common.logout')}</span>
        </button>
      </aside>
      <div className="admin-content-area">
        <header className="admin-topbar">
          <span>{session?.user.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="admin-topbar-role">{t('role.ADMIN')}</span>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
