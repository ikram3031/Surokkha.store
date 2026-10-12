import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  HardDrive,
  FileText,
} from 'lucide-react';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';
import { formatDate, formatDateTime } from '@/utils/dateHelper';

// Renders the all media assets gallery with grid preview, copy direct URL, and modal inspection
const AllMediaPage = () => {
  const { t } = useTranslation();
  const [mediaList, setMediaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchMedia = async (page = 1, search = '') => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/images', {
        params: {
          page,
          limit: 20,
          search,
        },
      });
      const data = res.data?.data || [];
      const meta = res.data?.meta || {};
      setMediaList(data);
      setTotalPages(meta.totalPages || 1);
      setTotalFiles(meta.total || data.length);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(currentPage, activeSearch);
  }, [currentPage, activeSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const handleCopyLink = (url) => {
    if (!url) return;
    const fullUrl = resolveImageUrl(url);
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {t('admin.all_media')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {totalFiles} {t('common.entries')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2 w-full sm:w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('common.search_placeholder')}
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" className="cursor-pointer text-xs font-semibold shrink-0">
            {t('common.search')}
          </Button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground border border-dashed rounded-2xl bg-card">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30 text-primary" />
          <p className="text-base font-bold text-foreground">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mediaList.map((item, idx) => (
            <Card
              key={idx}
              onClick={() => setSelectedMedia(item)}
              className="group overflow-hidden border border-border/80 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer bg-card flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full bg-muted/20 flex items-center justify-center overflow-hidden border-b">
                {item.url.match(/\.(jpeg|jpg|png|webp|gif|svg|avif)$/i) ? (
                  <img
                    src={resolveImageUrl(item.url)}
                    alt={item.filename}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground p-4">
                    <FileText className="h-10 w-10 text-primary/70 mb-1" />
                    <span className="text-[11px] font-mono uppercase">{item.filename.split('.').pop()}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-black/60 border border-white/20 backdrop-blur-xs">
                    {t('common.view')} &amp; {t('common.copy')}
                  </span>
                </div>
              </div>

              <CardContent className="p-2.5">
                <p className="text-xs font-semibold text-foreground truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>{formatFileSize(item.size)}</span>
                  <span>{formatDate(item.updatedAt || item.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={currentPage === pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  pageNum === currentPage - 2 ||
                  pageNum === currentPage + 2
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="sm:max-w-3xl md:max-w-4xl p-0 max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="p-4 sm:p-5 border-b shrink-0">
            <DialogTitle className="text-base font-bold text-foreground truncate pr-6">
              {selectedMedia?.filename || t('common.preview')}
            </DialogTitle>
          </DialogHeader>

          {selectedMedia && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="relative w-full min-h-[220px] max-h-[380px] rounded-2xl border border-border/70 bg-neutral-900/60 dark:bg-neutral-950/80 backdrop-blur-xs flex items-center justify-center overflow-hidden p-3 shadow-inner">
                {selectedMedia.url.match(/\.(jpeg|jpg|png|webp|gif|svg|avif)$/i) ? (
                  <img
                    src={resolveImageUrl(selectedMedia.url)}
                    alt={selectedMedia.filename}
                    className="max-h-[350px] w-auto max-w-full object-contain rounded-xl shadow-lg transition-transform duration-200"
                  />
                ) : (
                  <div className="py-12 flex flex-col items-center text-muted-foreground">
                    <FileText className="h-16 w-16 text-primary/80 mb-3" />
                    <p className="text-sm font-mono font-semibold text-foreground">{selectedMedia.filename}</p>
                    <span className="text-xs text-muted-foreground mt-1 uppercase font-mono tracking-wider">
                      {selectedMedia.filename.split('.').pop()} File
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60">
                  <HardDrive className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('common.quantity')}</p>
                    <p className="font-semibold text-foreground font-mono mt-0.5">{formatFileSize(selectedMedia.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/60">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{t('common.date')}</p>
                    <p className="font-semibold text-foreground font-mono mt-0.5">
                      {formatDateTime(selectedMedia.updatedAt || selectedMedia.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  {t('products.slug')}
                </label>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Input
                    readOnly
                    value={resolveImageUrl(selectedMedia.url)}
                    className="font-mono text-xs text-foreground bg-muted/40 border-border select-all cursor-text flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleCopyLink(selectedMedia.url)}
                    className="h-9 px-4 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-semibold gap-1.5 cursor-pointer text-xs shrink-0 transition-all"
                    title={t('common.copy')}
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? t('common.copied') : t('common.copy')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 border-border hover:border-primary/40 cursor-pointer text-xs shrink-0"
                    title={t('common.view')}
                    asChild
                  >
                    <a
                      href={resolveImageUrl(selectedMedia.url)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllMediaPage;
