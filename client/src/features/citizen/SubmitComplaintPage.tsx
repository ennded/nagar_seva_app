import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { SUBMIT_COMPLAINT } from '../../graphql/mutations/request.mutations';
import { MY_REQUESTS } from '../../graphql/queries/request.queries';
import type { RequestUnion } from '../../graphql/types';
import { uploadComplaintPhoto } from '../../apollo/upload';

const CATEGORIES = ['garbage', 'roads', 'water_supply', 'streetlight', 'drainage', 'other'];

export function SubmitComplaintPage() {
  const { t } = useTranslation();
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [submitComplaint, { loading, error }] = useMutation<{ submitComplaint: RequestUnion }>(SUBMIT_COMPLAINT, {
    refetchQueries: [{ query: MY_REQUESTS }],
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const urls = await Promise.all(Array.from(files).map(uploadComplaintPhoto));
      setPhotoUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { data } = await submitComplaint({
      variables: { input: { title, category, description, address, photoUrls } },
    });
    if (data) navigate(`/${citySlug}/citizen/requests/${data.submitComplaint.id}`);
  }

  return (
    <div className="request-form-page">
      <h1>{t('citizen.newComplaint')}</h1>
      <form onSubmit={handleSubmit}>
        <label>
          {t('citizen.title')}
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          {t('citizen.category')}
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('citizen.description')}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </label>
        <label>
          {t('citizen.address')}
          <input value={address} onChange={(e) => setAddress(e.target.value)} required />
        </label>
        <label>
          {t('citizen.photos')}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} />
        </label>
        {uploading && <p>{t('common.loading')}</p>}
        {uploadError && <p className="form-error">{uploadError}</p>}
        {photoUrls.length > 0 && (
          <ul className="photo-preview-list">
            {photoUrls.map((url) => (
              <li key={url}>
                <img src={url} alt="" />
              </li>
            ))}
          </ul>
        )}
        {error && <p className="form-error">{error.message}</p>}
        <button type="submit" disabled={loading || uploading}>
          {t('common.submit')}
        </button>
      </form>
    </div>
  );
}
