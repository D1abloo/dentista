import { Download, Eye } from 'lucide-react';
import { downloadDemoFileRef, getDemoFile, isImageMime, isPdfMime, openDemoFilePreview } from '@/lib/demoFiles';
import { Button } from '@/components/ui';

export function FileActions({
  fileRef,
  fileName,
  mimeType,
  onOpen
}: {
  fileRef?: string;
  fileName?: string;
  mimeType?: string;
  onOpen?: () => void;
}) {
  if (!fileRef) return null;
  const stored = getDemoFile(fileRef);
  const name = fileName ?? stored?.name ?? 'archivo';
  const mime = mimeType ?? stored?.mimeType;
  const isPdf = isPdfMime(mime, name);
  const isImg = isImageMime(mime, name);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        tone="ghost"
        className="!text-xs"
        onClick={() => downloadDemoFileRef(fileRef, name)}
      >
        <Download className="mr-1 inline h-3 w-3" />
        {isPdf ? 'Descargar PDF' : 'Descargar'}
      </Button>
      <Button
        tone="ghost"
        className="!text-xs"
        onClick={() => {
          onOpen?.();
          openDemoFilePreview(fileRef);
        }}
      >
        <Eye className="mr-1 inline h-3 w-3" />
        Ver {isImg ? 'imagen' : isPdf ? 'PDF' : 'archivo'}
      </Button>
    </div>
  );
}
