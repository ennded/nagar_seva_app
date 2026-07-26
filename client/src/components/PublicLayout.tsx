import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PublicLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { isAuthenticated, session } = useAuth();
  const location = useLocation();
  // Staff accounts are provisioned by an Admin, not self-registered — no Register link for them.
  const isStaffLogin = location.pathname.includes('/staff-login');

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to={`/${citySlug}`} className="app-brand">
          {t('common.appName')}
        </Link>
        <nav>
          {isAuthenticated && session ? (
            <Link to={`/${session.citySlug}/${session.user.role.toLowerCase()}`}>{t('citizen.dashboard')}</Link>
          ) : (
            <>
              <Link to={`/${citySlug}/login`}>{t('auth.login')}</Link>
              {!isStaffLogin && <Link to={`/${citySlug}/register`}>{t('auth.register')}</Link>}
            </>
          )}
        </nav>
        <LanguageSwitcher style={{ color: 'white', borderColor: 'white' }} />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
