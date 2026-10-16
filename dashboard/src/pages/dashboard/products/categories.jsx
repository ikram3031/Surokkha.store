import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategories } from '@/lib/category-cache';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit2, Trash2, FolderTree } from 'lucide-react';
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

// Renders the categories management page with parent-child relationships, creation dialog, and hierarchy list
const CategoriesPage = () => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
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
    setEditingCategory(null);
    setName('');
    setSlug('');
    setSlugManual(false);
    setDescription('');
    setParentId('');
    setIsOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setName(category.name);
    setSlug(category.slug);
    setSlugManual(true);
    setDescription(category.description || '');

    const rawParent = category.parent;
    let matchedParentDid = '';
    if (rawParent) {
      if (typeof rawParent === 'object') {
        const found = categories.find(
          (c) =>
            (rawParent.did && c.did === rawParent.did) ||
            (rawParent._id && (c._id === String(rawParent._id) || c.id === String(rawParent._id))) ||
            (rawParent.id && (c.id === String(rawParent.id) || c._id === String(rawParent.id))) ||
            (rawParent.slug && c.slug === rawParent.slug)
        );
        matchedParentDid = found?.did || rawParent.did || rawParent.slug || String(rawParent._id || rawParent.id || '');
      } else if (typeof rawParent === 'string') {
        const found = categories.find(
          (c) => c.did === rawParent || c.id === rawParent || c._id === rawParent || c.slug === rawParent
        );
        matchedParentDid = found?.did || rawParent;
      }
    }
    setParentId(matchedParentDid);
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
        parent: parentId || null,
      };

      if (editingCategory) {
        await apiClient.put(`/api/v1/categories/${editingCategory.did}`, body);
        toast.success(t('common.saved'));
      } else {
        await apiClient.post('/api/v1/categories', body);
        toast.success(t('common.saved'));
      }

      queryClient.invalidateQueries({ queryKey: ['categories-cache'] });
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
      await apiClient.delete(`/api/v1/categories/${deleteTarget.did}`);
      toast.success(t('common.saved'));
      queryClient.invalidateQueries({ queryKey: ['categories-cache'] });
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')));
    } finally {
      setIsDeleting(false);
    }
  };

  const getParentCategoryName = (cat) => {
    if (!cat.parent) return null;
    if (typeof cat.parent === 'object' && cat.parent?.name) {
      return cat.parent.name;
    }
    const parentId = typeof cat.parent === 'object' ? cat.parent.did || cat.parent._id || cat.parent.id : cat.parent;
    const found = categories.find(
      (c) => c.did === parentId || c._id === parentId || c.id === parentId || c.slug === parentId
    );
    return found?.name || null;
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">{t('categories_brands.category_title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('products.subtitle')}
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" /> {t('categories_brands.add_category')}
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
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t('common.no_data')}</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('products.slug')}</TableHead>
                <TableHead>{t('categories_brands.parent_category')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((cat) => {
                const parentName = getParentCategoryName(cat);
                return (
                  <TableRow key={cat.did}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                      {cat.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                    <TableCell>
                      {parentName ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border/50">
                          {parentName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(cat)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ did: cat.did, name: cat.name })}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? t('categories_brands.edit_category') : t('categories_brands.add_category')}</DialogTitle>
            <DialogDescription>
              {t('products.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">{t('categories_brands.category_name')}</label>
              <Input
                required
                placeholder="e.g. Fragrance"
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
                placeholder="fragrance"
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

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">{t('categories_brands.parent_category')}</label>
              <Select
                value={parentId || '__none__'}
                onValueChange={(val) => setParentId(val === '__none__' ? '' : (val ?? ''))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('common.select_option')}>
                    {parentId && parentId !== '__none__'
                      ? categories.find((c) => c.did === parentId || c.slug === parentId || c._id === parentId || c.id === parentId)?.name || parentId
                      : 'None'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories
                    .filter(
                      (c) =>
                        !c.parent &&
                        (!editingCategory || c.did !== editingCategory.did)
                    )
                    .map((c) => (
                      <SelectItem key={c.did} value={c.did}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
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

export default CategoriesPage;
