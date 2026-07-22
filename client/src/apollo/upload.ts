const MEDIA_URL = import.meta.env.VITE_MEDIA_URL ?? 'http://localhost:4003';

export async function uploadComplaintPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${MEDIA_URL}/api/upload/complaint-photo`, { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Photo upload failed');
  }
  const saved: { url: string; key: string } = await res.json();
  return `${MEDIA_URL}${saved.url}`;
}
