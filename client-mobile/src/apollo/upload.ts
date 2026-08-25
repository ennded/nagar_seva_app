import { MEDIA_URL } from '../config';

// React Native's fetch/FormData takes a {uri, name, type} descriptor instead of a File/Blob —
// this is what expo-image-picker's ImagePickerAsset gives us.
export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

async function upload(endpoint: string, file: PickedFile): Promise<string> {
  const formData = new FormData();
  // React Native's FormData accepts this object shape at runtime even though the DOM FormData
  // type doesn't declare it — see https://reactnative.dev/docs/network#uploading-files.
  formData.append('file', file as unknown as Blob);
  const res = await fetch(`${MEDIA_URL}${endpoint}`, { method: 'POST', body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Upload failed');
  }
  const saved: { url: string; key: string } = await res.json();
  return `${MEDIA_URL}${saved.url}`;
}

export function uploadComplaintPhoto(file: PickedFile): Promise<string> {
  return upload('/api/upload/complaint-photo', file);
}

export function uploadKycDocument(file: PickedFile): Promise<string> {
  return upload('/api/upload/kyc-document', file);
}
