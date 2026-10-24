import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBrands, getBrandName } from '@/lib/category-cache';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit2, Trash2, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { getApiErrorMessage } from '@/lib/error-handler';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Renders the brands management page with search, creation dialog, and paginated brands table
const BrandsPage = () => {
  const { t } = useTranslation();
  const { data: brands = [], isLoading } = useBrands();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const [isOpen, setIsOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual]
  );

  const openAddDialog = () => {
    setEditingBrand(null);
    setName('');
    setSlug('');
    setSlugManual(false);
    setDescription('');
    setIsOpen(true);
  };

  const openEditDialog = (brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setSlug(brand.slug);
    setSlugManual(true);
    setDescription(brand.description || '');
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error(t('common.required'));
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim(),
      };

      if (editingBrand) {
        await apiClient.put(`/api/v1/brands/${editingBrand.did}`, body);
        toast.success(t('common.saved'));
      } else {
        await apiClient.post('/api/v1/brands', body);
        toast.success(t('common.saved'));
      }

      queryClient.invalidateQueries({ queryKey: ['brands-cache'] });
      setIsOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/brands/${deleteTarget.did}`);
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['brands-cache'] });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const totalPages = Math.ceil(filteredBrands.length / PAGE_SIZE);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('categories_brands.brand_title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t('categories_brands.add_brand')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('common.search_placeholder')}
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">{t('common.loading')}</div>
      ) : filteredBrands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.no_data')}</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('products.slug')}</TableHead>
                <TableHead>{t('categories_brands.parent_category')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBrands.map((brand) => (
                <TableRow key={brand.did}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    {brand.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{brand.slug}</TableCell>
                  <TableCell className="font-mono text-xs">{brand.parent ? getBrandName(brand.parent) ?? brand.parent : ''}</TableCell>
                  <TableCell className="space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(brand)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ did: brand.did, name: brand.name })}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
              <span className="text-sm text-muted-foreground">
                {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, filteredBrands.length)} {t('common.of')} {filteredBrands.length}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? t('categories_brands.edit_brand') : t('categories_brands.add_brand')}</DialogTitle>
            <DialogDescription>
              {t('products.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">{t('categories_brands.brand_name')}</label>
              <Input
                required
                placeholder="e.g. Creed"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">{t('products.slug')}</label>
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground underline"
                  onClick={() => setSlugManual(!slugManual)}
                >
                  {slugManual ? 'Auto-generate' : 'Edit manually'}
                </button>
              </div>
              <Input
                required
                placeholder="creed"
                value={slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setSlug(e.target.value);
                }}
                disabled={!slugManual}
                className={!slugManual ? 'opacity-60' : ''}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">{t('common.description')}</label>
              <Textarea
                placeholder={t('common.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="cancel" onClick={() => setIsOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={t('common.delete')}
        description={`${t('common.confirm_delete')} (${deleteTarget?.name ?? ''})`}
      />
    </div>
  );
};

export default BrandsPage;
