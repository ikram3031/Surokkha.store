import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { RotateCw, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

// Renders the cache purge button on the navbar to clear edge and dashboard caches
export const CacheCleanButton = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isPurging, setIsPurging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCleanCache = async () => {
    if (isPurging) return;
    setIsPurging(true);
    setIsSuccess(false);

    try {
      const res = await apiClient.post('/api/v1/system/purge-cache', {});
      await queryClient.invalidateQueries();

      setIsSuccess(true);
      const cfPurged = res.data?.data?.cloudflarePurged;
      const details = res.data?.data?.details || t('nav.cache_cleaned', 'Cache Cleaned Successfully');

      toast.success(
        cfPurged
          ? 'Cloudflare Edge & Dashboard cache cleaned!'
          : `${t('nav.cache_cleaned', 'Cache Cleaned Successfully')}: ${details}`
      );

      setTimeout(() => {
        setIsSuccess(false);
      }, 2500);
    } catch (err) {
      await queryClient.invalidateQueries();
      const errMsg = err.response?.data?.message || err.message || 'Failed to purge server cache.';
      toast.error(errMsg);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCleanCache}
      disabled={isPurging}
      className={`h-8 gap-1.5 px-2.5 text-xs font-mono font-medium transition-all duration-200 border-border/80 hover:bg-muted/80 ${
        isSuccess
          ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
          : 'text-muted-foreground hover:text-foreground'
      }`}
      title={t('nav.clean_cache', 'Clean Cache')}
      aria-label="Clean cache"
    >
      {isPurging ? (
        <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" />
      ) : isSuccess ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-orange-500 hover:scale-110 transition-transform" />
      )}
      <span className="hidden sm:inline">
        {isPurging ? t('common.loading', 'Cleaning...') : isSuccess ? t('common.saved', 'Cleaned') : t('nav.clean_cache', 'Clean Cache')}
      </span>
    </Button>
  );
};
