import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { LOGIN } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from './AuthContext';
import { AuthCard } from '../../components/AuthCard';

export function LoginPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [runLogin, { loading, error }] = useMutation<{ login: AuthPayload }>(LOGIN);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { data } = await runLogin({ variables: { email, password } });
    if (data) {
      login(data.login);
      navigate(`/${data.login.citySlug}/citizen`);
    }
  }

  return (
    <AuthCard
      icon={User}
      title={t('auth.citizenLogin')}
      subtitle={t('auth.citizenLoginSubtitle')}
      footer={
        <>
          <span>
            {t('auth.noAccount')} <Link to={`/${citySlug}/register`}>{t('auth.registerHere')}</Link>
          </span>
          <Link to={`/${citySlug}/staff-login`}>{t('auth.loginAsStaff')}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <label>
          {t('auth.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('auth.password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="form-error">{error.message}</p>}
        <button type="submit" disabled={loading}>
          {t('auth.login')}
        </button>
      </form>
    </AuthCard>
  );
}
