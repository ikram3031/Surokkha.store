import { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { toast } from 'sonner';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024;

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const useCmsAssets = () => {
  const queryClient = useQueryClient();
  const [copiedKey, setCopiedKey] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeUploadingSlot, setActiveUploadingSlot] = useState(null);
  const fileInputRefs = useRef({});

  const {
    data: assets = [],
    isLoading: isAssetsLoading,
    isFetching: isAssetsFetching,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ['dash-assets'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dash/assets');
      return res.data?.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const assetsMap = useMemo(() => {
    const map = new Map();
    assets.forEach((a) => {
      map.set(a.filename.toLowerCase(), a);
      const withoutExt = a.filename.replace(/\.[^/.]+$/, '').toLowerCase();
      map.set(withoutExt, a);
    });
    return map;
  }, [assets]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, targetFilename, slotKey }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFilename', targetFilename);
      if (slotKey) formData.append('slotKey', slotKey);
      const res = await apiClient.post('/api/v1/dash/assets/upload-slot', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (res, vars) => {
      toast.success(res.message || `Saved as ${vars.targetFilename}`);
      setActiveUploadingSlot(null);
      const isBranding =
        vars.targetFilename?.includes('logo') ||
        vars.targetFilename?.includes('favicon') ||
        vars.slotKey === 'logo' ||
        vars.slotKey === 'favicon';
      if (isBranding) {
        const newVer = Date.now();
        try { localStorage.setItem('brand_logo_version', String(newVer)); } catch {}
        window.dispatchEvent(new CustomEvent('brand-logo-updated', { detail: { timestamp: newVer, slotKey: vars.slotKey } }));
      }
      queryClient.invalidateQueries({ queryKey: ['dash-assets'] });
    },
    onError: (err) => {
      setActiveUploadingSlot(null);
      toast.error(err.response?.data?.message || 'Failed to upload asset.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (filename) => {
      const res = await apiClient.delete(`/api/v1/dash/assets/${encodeURIComponent(filename)}`);
      return res.data;
    },
    onSuccess: (_, filename) => {
      toast.success(`Asset "${filename}" deleted`);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['dash-assets'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete asset.');
    },
  });

  const handleSlotClick = (slotKey) => {
    fileInputRefs.current[slotKey]?.click();
  };

  const handleFileChange = (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideoSlot = slot.type === 'video' || slot.filename?.endsWith('.mp4') || slot.key?.includes('video');
    const maxLimit = isVideoSlot ? MAX_VIDEO_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
    const limitLabel = isVideoSlot ? '100MB' : '10MB';
    if (file.size > maxLimit) {
      toast.error(`File size (${formatBytes(file.size)}) exceeds ${limitLabel} limit.`);
      e.target.value = '';
      return;
    }
    setActiveUploadingSlot(slot.key);
    uploadMutation.mutate({ file, targetFilename: slot.filename, slotKey: slot.key });
    e.target.value = '';
  };

  const handleCopyUrl = (relativePath, key) => {
    const fullUrl = resolveImageUrl(relativePath);
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(key);
    toast.success('URL copied!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownload = (filename) => {
    const url = resolveImageUrl(`/uploads/assets/${filename}`);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const findAsset = (slot) => {
    const targetName = slot.filename.toLowerCase();
    const withoutExt = targetName.replace(/\.[^/.]+$/, '');
    return (
      assetsMap.get(targetName) ||
      assetsMap.get(withoutExt) ||
      (slot.key === 'logo' ? assetsMap.get('logo.webp') || assetsMap.get('logo') : null) ||
      (slot.key === 'favicon' ? assetsMap.get('favicon.ico') || assetsMap.get('favicon') : null)
    );
  };

  return {
    assets, assetsMap, isAssetsLoading, isAssetsFetching, refetchAssets,
    uploadMutation, deleteMutation,
    copiedKey, deleteTarget, setDeleteTarget, activeUploadingSlot,
    fileInputRefs,
    handleSlotClick, handleFileChange, handleCopyUrl, handleDownload,
    findAsset,
  };
};
