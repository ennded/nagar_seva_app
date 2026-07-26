import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { LogOut, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { StaffShellFrame } from './StaffShellFrame';

export interface StaffNavItem {
  to: string;
  end?: boolean;
  icon: LucideIcon;
  label: string;
}

export function StaffLayout({ navItems, roleLabel }: { navItems: StaffNavItem[]; roleLabel: string }) {
  const { t } = useTranslation();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { citySlug } = useParams<{ citySlug: string }>();

  function handleLogout() {
    logout();
    navigate(`/${citySlug}`);
  }

  return (
    <StaffShellFrame>
      <aside className="admin-sidebar">
        <Link to={`/${citySlug}`} className="admin-sidebar-brand">
          {t('common.appName')}
        </Link>
        <div className="admin-sidebar-role">{roleLabel}</div>
        <nav className="admin-nav" aria-label={roleLabel}>
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
            <span className="admin-topbar-role">{roleLabel}</span>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </StaffShellFrame>
  );
}
