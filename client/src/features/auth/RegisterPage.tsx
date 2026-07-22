import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { REGISTER_CITIZEN } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload, WardRef } from '../../graphql/types';
import { useAuth } from './AuthContext';

export function RegisterPage() {
  const { t } = useTranslation();
  const { citySlug = '' } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [wardId, setWardId] = useState('');

  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, {
    variables: { citySlug },
  });
  const [registerCitizen, { loading, error }] = useMutation<{ registerCitizen: AuthPayload }>(REGISTER_CITIZEN);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { data } = await registerCitizen({
      variables: { input: { citySlug, name, mobile, email, password, wardId } },
    });
    if (data) {
      login(data.registerCitizen);
      navigate(`/${data.registerCitizen.citySlug}/citizen`);
    }
  }

  return (
    <div className="auth-page">
      <h1>{t('auth.register')}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          {t('auth.name')}
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          {t('auth.mobile')}
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
        </label>
        <label>
          {t('auth.email')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          {t('auth.password')}
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <label>
          {t('auth.ward')}
          <select value={wardId} onChange={(e) => setWardId(e.target.value)} required>
            <option value="" disabled>
              {t('auth.selectWard')}
            </option>
            {wardsData?.wardsByCity.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name} ({ward.code})
              </option>
            ))}
          </select>
        </label>
        {error && <p className="form-error">{error.message}</p>}
        <button type="submit" disabled={loading}>
          {t('auth.register')}
        </button>
      </form>
      <p>
        {t('auth.haveAccount')} <Link to={`/${citySlug}/login`}>{t('auth.loginHere')}</Link>
      </p>
    </div>
  );
}
