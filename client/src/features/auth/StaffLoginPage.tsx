import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { REQUEST_OTP, VERIFY_OTP } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from './AuthContext';

const ROLE_HOME: Record<string, string> = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  NAGARSEVAK: 'nagarsevak',
  NAGARADHYAKSH: 'nagaradhyaksh',
  DRIVER: 'driver',
};

export function StaffLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [requestOtp, { loading: requesting, error: requestError }] = useMutation<{ requestOtp: boolean }>(
    REQUEST_OTP,
  );
  const [verifyOtp, { loading: verifying, error: verifyError }] = useMutation<{ verifyOtp: AuthPayload }>(
    VERIFY_OTP,
  );

  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    await requestOtp({ variables: { mobile } });
    setOtpSent(true);
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const { data } = await verifyOtp({ variables: { mobile, code } });
    if (data) {
      login(data.verifyOtp);
      const homeSegment = ROLE_HOME[data.verifyOtp.user.role] ?? 'citizen';
      navigate(`/${data.verifyOtp.citySlug}/${homeSegment}`);
    }
  }

  return (
    <div className="auth-page">
      <h1>{t('auth.staffLogin')}</h1>
      {!otpSent ? (
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
          {verifyError && <p className="form-error">{verifyError.message}</p>}
          <button type="submit" disabled={verifying}>
            {t('auth.verifyOtp')}
          </button>
        </form>
      )}
    </div>
  );
}
