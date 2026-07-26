import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../features/auth/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export function DashboardLayout() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate(`/${citySlug}`);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to={`/${citySlug}`} className="app-brand">
          {t('common.appName')}
        </Link>
        <nav>
          <Link to={`/${citySlug}/citizen`}>{t('citizen.myRequests')}</Link>
          <Link to={`/${citySlug}/citizen/garbage`}>{t('garbage.nav')}</Link>
        </nav>
        <LanguageSwitcher style={{ color: 'white', borderColor: 'white' }} />
        {session && (
          <div className="app-header-user">
            <span>
              {session.user.name} ({session.user.role})
            </span>
            <button type="button" onClick={handleLogout}>
              {t('common.logout')}
            </button>
          </div>
        )}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
