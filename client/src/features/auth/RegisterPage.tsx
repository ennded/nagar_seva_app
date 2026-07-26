import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { WARDS_BY_CITY } from '../../graphql/queries/public.queries';
import { REGISTER_CITIZEN } from '../../graphql/mutations/auth.mutations';
import type { AuthPayload, WardRef } from '../../graphql/types';
import { useAuth } from './AuthContext';
import { uploadKycDocument } from '../../apollo/upload';
import { AuthCard } from '../../components/AuthCard';

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
  const [aadharDocUrl, setAadharDocUrl] = useState('');
  const [voterIdDocUrl, setVoterIdDocUrl] = useState('');
  const [uploadingAadhar, setUploadingAadhar] = useState(false);
  const [uploadingVoterId, setUploadingVoterId] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: wardsData } = useQuery<{ wardsByCity: WardRef[] }>(WARDS_BY_CITY, {
    variables: { citySlug },
  });
  const [registerCitizen, { loading, error }] = useMutation<{ registerCitizen: AuthPayload }>(REGISTER_CITIZEN);

  async function handleAadharChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAadhar(true);
    setUploadError(null);
    try {
      setAadharDocUrl(await uploadKycDocument(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAadhar(false);
    }
  }

  async function handleVoterIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVoterId(true);
    setUploadError(null);
    try {
      setVoterIdDocUrl(await uploadKycDocument(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingVoterId(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { data } = await registerCitizen({
      variables: {
        input: {
          citySlug,
          name,
          mobile,
          email,
          password,
          wardId,
          aadharDocUrl: aadharDocUrl || undefined,
          voterIdDocUrl: voterIdDocUrl || undefined,
        },
      },
    });
    if (data) {
      login(data.registerCitizen);
      navigate(`/${data.registerCitizen.citySlug}/citizen`);
    }
  }

  return (
    <AuthCard
      icon={User}
      title={t('auth.register')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <span>
          {t('auth.haveAccount')} <Link to={`/${citySlug}/login`}>{t('auth.loginHere')}</Link>
        </span>
      }
    >
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
        <label>
          {t('auth.aadharDoc')}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleAadharChange} />
        </label>
        {uploadingAadhar && <p>{t('common.loading')}</p>}
        {aadharDocUrl && <p className="form-success">{t('auth.docUploaded')}</p>}
        <label>
          {t('auth.voterIdDoc')}
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleVoterIdChange} />
        </label>
        {uploadingVoterId && <p>{t('common.loading')}</p>}
        {voterIdDocUrl && <p className="form-success">{t('auth.docUploaded')}</p>}
        {uploadError && <p className="form-error">{uploadError}</p>}
        {error && <p className="form-error">{error.message}</p>}
        <button type="submit" disabled={loading || uploadingAadhar || uploadingVoterId}>
          {t('auth.register')}
        </button>
      </form>
    </AuthCard>
  );
}
