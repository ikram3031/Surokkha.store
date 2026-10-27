import React, { useRef, useState } from 'react';
import { UploadCloud, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, resolveImageUrl } from '@/lib/api-client';

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;
const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'heic',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'ppt', 'pptx',
];

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (file) => /\.(jpe?g|png|webp|gif|heic)$/i.test(file.url || file.name || '');

/**
 * Document / image attachments for a bill or payment.
 * kind: 'bills' | 'payments' (decides the upload folder), value: [{ name, url, size, mimeType }]
 */
export const AttachmentUploader = ({ kind, value = [], onChange }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  // Files uploaded in this session but not saved yet: removing one also deletes it from the server
  const [freshUrls, setFreshUrls] = useState([]);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    if (value.length + files.length > MAX_ATTACHMENTS) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files`);
      return;
    }

    setUploading(true);
    let next = [...value];
    const added = [];
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast.error(`${file.name}: file type not allowed`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name}: larger than 5 MB`);
        continue;
      }
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post(`/api/v1/accounts/attachments/${kind}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const saved = res.data?.data;
        if (saved?.url) {
          next = [...next, saved];
          added.push(saved.url);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || `${file.name}: upload failed`);
      }
    }
    setUploading(false);
    if (added.length > 0) {
      setFreshUrls((prev) => [...prev, ...added]);
      onChange(next);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = async (file) => {
    onChange(value.filter((f) => f.url !== file.url));
    if (freshUrls.includes(file.url)) {
      setFreshUrls((prev) => prev.filter((u) => u !== file.url));
      // url looks like /uploads/docs/<kind>/<YYMM>/<filename>
      const [, , , folder, filename] = file.url.split('/').filter(Boolean);
      if (folder && filename) {
        await apiClient.delete(`/api/v1/accounts/attachments/${kind}/${folder}/${filename}`).catch(() => {});
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
        className="hidden"
        onChange={(e) => uploadFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          uploadFiles(e.dataTransfer.files);
        }}
        className="w-full rounded-lg border-2 border-dashed bg-muted/20 hover:bg-muted/40 transition-colors px-4 py-5 flex flex-col items-center gap-1 text-center cursor-pointer disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <UploadCloud className="w-5 h-5 text-primary" />
        )}
        <span className="text-xs font-semibold text-foreground">
          {uploading ? 'Uploading...' : 'Click or drop files to upload'}
        </span>
        <span className="text-[11px] text-muted-foreground">
          Images, PDF, Word, Excel, CSV, TXT · max 5 MB per file
        </span>
      </button>

      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((file) => (
            <li key={file.url} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs">
              {isImage(file) ? (
                <ImageIcon className="w-4 h-4 shrink-0 text-blue-500" />
              ) : (
                <FileText className="w-4 h-4 shrink-0 text-amber-500" />
              )}
              <a
                href={resolveImageUrl(file.url)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 truncate font-medium text-foreground hover:underline"
                title={file.name}
              >
                {file.name || file.url.split('/').pop()}
              </a>
              <span className="text-[11px] text-muted-foreground shrink-0">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(file)}
                className="text-muted-foreground hover:text-destructive cursor-pointer"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttachmentUploader;
