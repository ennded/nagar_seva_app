import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Users, FileText, Bell, BarChart3, Trash2, type LucideIcon } from 'lucide-react';
import { REQUEST_OTP, VERIFY_OTP } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload } from '../../graphql/types';
import { useAuth } from './AuthContext';
import { AuthCard } from '../../components/AuthCard';

const ROLE_HOME: Record<string, string> = {
  ADMIN: 'admin',
  OFFICER: 'officer',
  NAGARSEVAK: 'nagarsevak',
  NAGARADHYAKSH: 'nagaradhyaksh',
  DRIVER: 'driver',
};

const ROLE_META: Record<string, { Icon: LucideIcon; color: string }> = {
  admin: { Icon: Users, color: '#1E8A5F' },
  officer: { Icon: FileText, color: '#6B46C1' },
  nagarsevak: { Icon: Bell, color: '#D97706' },
  nagaradhyaksh: { Icon: BarChart3, color: '#DC2626' },
  driver: { Icon: Trash2, color: '#0891B2' },
};

export function StaffLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { role } = useParams<{ role?: string }>();
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const roleKey = role?.toLowerCase() ?? '';
  const meta = ROLE_META[roleKey];
  const title = role ? (t(`auth.roleLogin.${role.toUpperCase()}`, { defaultValue: t('auth.staffLogin') }) as string) : t('auth.staffLogin');

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
    <AuthCard icon={meta?.Icon ?? Users} iconColor={meta?.color} title={title} subtitle={t('auth.staffLoginSubtitle')}>
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
    </AuthCard>
  );
}
