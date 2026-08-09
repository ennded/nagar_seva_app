import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { LOGIN, REQUEST_OTP, VERIFY_OTP } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from './AuthContext';
import { AuthCard } from '../../components/AuthCard';

export function LoginPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState<'password' | 'otp'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [runLogin, { loading, error }] = useMutation<{ login: AuthPayload }>(LOGIN);

  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [requestOtp, { loading: requesting, error: requestError }] = useMutation<{ requestOtp: boolean }>(
    REQUEST_OTP,
  );
  const [verifyOtp, { loading: verifying, error: verifyError }] = useMutation<{ verifyOtp: AuthPayload }>(
    VERIFY_OTP,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { data } = await runLogin({ variables: { email, password } });
    if (data) {
      login(data.login);
      navigate(`/${data.login.citySlug}/citizen`);
    }
  }

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    await requestOtp({ variables: { mobile } });
    setOtpSent(true);
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    setOtpError(null);
    const { data } = await verifyOtp({ variables: { mobile, code } });
    if (data) {
      if (data.verifyOtp.user.role !== 'CITIZEN') {
        setOtpError(t('auth.otpNotCitizen'));
        return;
      }
      login(data.verifyOtp);
      navigate(`/${data.verifyOtp.citySlug}/citizen`);
    }
  }

  return (
    <AuthCard
      icon={User}
      title={t('auth.citizenLogin')}
      subtitle={mode === 'password' ? t('auth.citizenLoginSubtitle') : t('auth.citizenOtpLoginSubtitle')}
      footer={
        <>
          <span>
            {t('auth.noAccount')} <Link to={`/${citySlug}/register`}>{t('auth.registerHere')}</Link>
          </span>
          {mode === 'password' ? (
            <button type="button" className="link-button" onClick={() => setMode('otp')}>
              {t('auth.loginWithOtp')}
            </button>
          ) : (
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setMode('password');
                setOtpSent(false);
                setOtpError(null);
              }}
            >
              {t('auth.loginWithPassword')}
            </button>
          )}
        </>
      }
    >
      {mode === 'password' ? (
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
      ) : !otpSent ? (
        <form onSubmit={handleRequestOtp}>
          <label>
            {t('auth.mobile')}
            <input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </label>
          {requestError && <p className="form-error">{requestError.message}</p>}
          <button type="submit" disabled={requesting}>
            {t('auth.requestOtp')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <p>{t('auth.otpSent')}</p>
          <label>
            {t('auth.otpCode')}
            <input value={code} onChange={(e) => setCode(e.target.value)} required />
          </label>
          {(verifyError || otpError) && <p className="form-error">{otpError ?? verifyError?.message}</p>}
          <button type="submit" disabled={verifying}>
            {t('auth.verifyOtp')}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
