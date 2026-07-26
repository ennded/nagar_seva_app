import { FileText, PlayCircle } from 'lucide-react';

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

export function FilePreview({ url }: { url: string }) {
  if (IMAGE_EXT.test(url)) {
    return <img src={url} alt="" />;
  }
  if (VIDEO_EXT.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="file-preview-doc">
        <PlayCircle size={28} />
        <span>Video</span>
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="file-preview-doc">
      <FileText size={28} />
      <span>PDF</span>
    </a>
  );
}
