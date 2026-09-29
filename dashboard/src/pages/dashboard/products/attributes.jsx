import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sliders,
  X,
  Upload,
  Image as ImageIcon,
  Layers,
  Save,
} from 'lucide-react';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
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

function sortAttributeValues(vals = []) {
  if (!Array.isArray(vals)) return [];
  return [...vals].sort((a, b) => {
    const valA = typeof a === "string" ? a : (a?.name || a?.size || "");
    const valB = typeof b === "string" ? b : (b?.name || b?.size || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
  });
}

const AttributesPage = () => {
  const navigate = useNavigate();
  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [values, setValues] = useState([]);
  const [newValueName, setNewValueName] = useState('');
  const [newValueSlug, setNewValueSlug] = useState('');
  const [newValueSlugManual, setNewValueSlugManual] = useState(false);
  const [newValueImage, setNewValueImage] = useState(null);
  const [newValueImagePreview, setNewValueImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  const fetchAttributes = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/dashboard/attributes');
      const raw = res.data?.data || [];
      const sortedData = raw.map((attr) => ({
        ...attr,
        values: sortAttributeValues(attr.values || []),
      }));
      setAttributes(sortedData);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch attributes'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual]
  );

  const handleNewValueNameChange = (value) => {
    setNewValueName(value);
    if (!newValueSlugManual) {
      setNewValueSlug(slugify(value));
    }
  };

  const openAddDialog = () => {
    setEditingAttribute(null);
    setName('');
    setSlug('');
    setSlugManual(false);
    setValues([]);
    setNewValueName('');
    setNewValueSlug('');
    setNewValueSlugManual(false);
    setNewValueImage(null);
    setNewValueImagePreview(null);
    setIsOpen(true);
  };

  const openEditDialog = (attr) => {
    navigate(`/dashboard/products/attributes/${attr._id}`);
  };

  // Validate image: 1:1 Aspect Ratio, Max 1MB, JPG/JPEG/PNG only
  const validateImageFile = (file) => {
    return new Promise((resolve, reject) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return reject(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.'));
      }

      if (file.size > 2 * 1024 * 1024) {
        return reject(new Error('Image size must be 2 MB or less.'));
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const ratio = img.width / img.height;
        // Allow slight tolerance of ±3%
        if (ratio < 0.97 || ratio > 1.03) {
          return reject(
            new Error(`Image must have a 1:1 square ratio (e.g. 1000x1000px or 1500x1500px). Current: ${img.width}x${img.height}px`)
          );
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid image file.'));
      };
      img.src = objectUrl;
    });
  };

  // Upload image to /api/v1/images/upload with type=attribute
  const uploadImageToServer = async (file, attributeSlugVal, valueSlugVal) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'attribute');
    formData.append('attributeSlug', attributeSlugVal || 'attr');
    formData.append('valueSlug', valueSlugVal || 'val');

    const res = await apiClient.post('/api/v1/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data?.imageUrl;
  };

  // Handle uploading for an existing value item in the list
  const handleExistingValueImageUpload = async (index, file) => {
    if (!file) return;
    try {
      await validateImageFile(file);
      setUploadingIndex(index);

      const targetVal = values[index];
      const uploadedUrl = await uploadImageToServer(
        file,
        slug || slugify(name),
        targetVal.slug || slugify(targetVal.name)
      );

      setValues((prev) =>
        prev.map((v, i) => (i === index ? { ...v, imageUrl: uploadedUrl } : v))
      );
      toast.success('Image uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveExistingValueImage = (index) => {
    setValues((prev) =>
      prev.map((v, i) => (i === index ? { ...v, imageUrl: null } : v))
    );
  };

  // Handle uploading for the new value input box
  const handleNewValueImageSelect = async (file) => {
    if (!file) return;
    try {
      await validateImageFile(file);
      setNewValueImage(file);
      setNewValueImagePreview(URL.createObjectURL(file));
      toast.success('1:1 image selected');
    } catch (err) {
      toast.error(err.message || 'Image selection failed');
    }
  };

  const addValue = async () => {
    const trimmedName = newValueName.trim();
    if (!trimmedName) return;
    const trimmedSlug = newValueSlug.trim() || slugify(trimmedName);

    if (
      values.some(
        (v) =>
          v.slug === trimmedSlug ||
          v.name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      toast.error('Value with this name or slug already exists in this group');
      return;
    }

    let finalImageUrl = null;
    if (newValueImage) {
      try {
        finalImageUrl = await uploadImageToServer(
          newValueImage,
          slug || slugify(name),
          trimmedSlug
        );
      } catch (err) {
        toast.error('Failed to upload value image');
        return;
      }
    }

    setValues((prev) =>
      sortAttributeValues([
        ...prev,
        { name: trimmedName, slug: trimmedSlug, imageUrl: finalImageUrl },
      ])
    );
    setNewValueName('');
    setNewValueSlug('');
    setNewValueSlugManual(false);
    setNewValueImage(null);
    setNewValueImagePreview(null);
  };

  const removeValue = (index) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        values,
      };

      if (editingAttribute) {
        await apiClient.put(
          `/api/v1/dashboard/attributes/${editingAttribute._id}`,
          body
        );
        toast.success('Attribute updated successfully');
      } else {
        await apiClient.post('/api/v1/dashboard/attributes', body);
        toast.success('Attribute created successfully');
      }

      fetchAttributes();
      setIsOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save attribute'));
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
      await apiClient.delete(
        `/api/v1/dashboard/attributes/${deleteTarget._id}`
      );
      toast.success('Attribute deleted successfully');
      fetchAttributes();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete attribute'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAttributes = attributes.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Product Attributes
            </h2>
            <p className="text-sm text-muted-foreground">
              Manage variation attributes and per-value images (e.g. Size, Volume, Color).
            </p>
          </div>
        </div>
        <Button onClick={openAddDialog} className="cursor-pointer gap-2 font-semibold">
          <Plus className="h-4 w-4" />
          Add Attribute
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search attributes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Layout: 3 Cards Per Row on Large Screens */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : filteredAttributes.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border rounded-xl bg-card">
          <Sliders className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-foreground">No attributes found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &quot;Add Attribute&quot; to create your first attribute group.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttributes.map((attr) => {
            const valCount = attr.values?.length || 0;
            return (
              <Card
                key={attr._id}
                className="border shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3.5 border-b bg-muted/15">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <CardTitle className="text-lg font-bold text-foreground truncate">
                        {attr.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground font-mono bg-muted/80 border border-border/60 px-2 py-0.5 rounded-md">
                          {attr.slug}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[11px] font-semibold bg-primary/10 text-primary border-primary/25 px-2 py-0.5"
                        >
                          {valCount} {valCount === 1 ? 'Value' : 'Values'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full border-border/80 hover:bg-primary/15 hover:text-primary hover:border-primary/40 cursor-pointer transition-all"
                        title="Edit Attribute"
                        onClick={() => openEditDialog(attr)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full text-destructive border-destructive/30 hover:bg-destructive/15 hover:text-destructive hover:border-destructive/50 cursor-pointer transition-all"
                        title="Delete Attribute"
                        onClick={() => setDeleteTarget(attr)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                      Configured Values
                    </p>

                    {valCount === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                        No values configured yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {attr.values.map((v, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-muted/50 hover:bg-muted border border-border/70 rounded-lg p-1.5 min-w-0 transition-colors"
                            title={`${v.name} (${v.slug})`}
                          >
                            {v.imageUrl ? (
                              <img
                                src={resolveImageUrl(v.imageUrl)}
                                alt={v.name}
                                className="h-7 w-7 rounded object-cover border shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded bg-background flex items-center justify-center border shrink-0">
                                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-foreground leading-tight truncate">
                                {v.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono leading-tight truncate">
                                {v.slug}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Attribute Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAttribute ? 'Edit Attribute Group' : 'Add New Attribute Group'}
            </DialogTitle>
            <DialogDescription>
              Configure attribute name, slug, and per-value 1:1 square assets saved to{' '}
              <span className="font-mono text-primary font-semibold">/uploads/assets/attributes</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-2">
            {/* Attribute Main Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Attribute Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Size, Volume, Color"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Slug <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. size, volume, color"
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(slugify(e.target.value));
                  }}
                  required
                />
              </div>
            </div>

            {/* Attribute Values Manager */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-bold text-foreground">
                  Attribute Values ({values.length})
                </h4>
                <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border">
                  1:1 Square Ratio • Max 2MB • JPG/PNG/WEBP
                </span>
              </div>

              {/* Add New Value Input Row */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Value Name *
                    </label>
                    <Input
                      placeholder="e.g. 5ml, 10ml, Red"
                      value={newValueName}
                      onChange={(e) => handleNewValueNameChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                      Value Slug *
                    </label>
                    <Input
                      placeholder="e.g. 5ml, 10ml, red"
                      value={newValueSlug}
                      onChange={(e) => {
                        setNewValueSlugManual(true);
                        setNewValueSlug(slugify(e.target.value));
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  {/* Image Selector for New Value */}
                  <div className="flex items-center gap-2">
                    {newValueImagePreview ? (
                      <div className="relative h-10 w-36 rounded-lg border-2 border-primary/40 bg-muted/30 overflow-hidden flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={newValueImagePreview}
                            alt="preview"
                            className="h-7 w-7 rounded object-cover border"
                          />
                          <span className="text-[11px] font-mono truncate text-foreground">
                            {newValueImage?.name || 'Selected'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewValueImage(null);
                            setNewValueImagePreview(null);
                          }}
                          className="h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shrink-0"
                          title="Remove Image"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer transition-all">
                        <Upload className="h-4 w-4 text-primary" />
                        <span>Upload 1:1 Image</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleNewValueImageSelect(file);
                          }}
                        />
                      </label>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={addValue}
                    disabled={!newValueName.trim()}
                    className="cursor-pointer gap-1.5 text-xs h-9 font-semibold shadow-xs"
                  >
                    <Plus className="h-4 w-4" /> Add to List
                  </Button>
                </div>
              </div>

              {/* Configured Values List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {values.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-xl">
                    No values added to this attribute yet.
                  </p>
                ) : (
                  values.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4.5 min-h-[115px] rounded-2xl border border-border/80 bg-background hover:bg-muted/30 hover:border-primary/40 transition-all gap-4 shadow-xs group"
                    >
                      {/* Left: Image Preview & Upload Trigger */}
                      {val.imageUrl ? (
                        <div className="relative size-20 shrink-0 group/img">
                          <div className="size-20 rounded-2xl border border-border/80 bg-muted/20 overflow-hidden shadow-xs">
                            <img
                              src={resolveImageUrl(val.imageUrl)}
                              alt={val.name}
                              className="h-full w-full object-cover rounded-xl group-hover/img:scale-105 transition-transform duration-200"
                            />
                          </div>
                          {/* Bordered Cross Button on Top Right Corner */}
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingValueImage(idx)}
                            className="absolute -top-2 -right-2 size-6.5 rounded-full bg-destructive text-destructive-foreground border-2 border-background shadow-md hover:scale-115 flex items-center justify-center cursor-pointer transition-all z-20"
                            title="Remove Image"
                          >
                            <X className="h-3.5 w-3.5 stroke-[2.5]" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className={`size-20 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 flex flex-col items-center justify-center text-muted-foreground hover:text-primary cursor-pointer shrink-0 transition-all gap-1.5 shadow-2xs ${
                            uploadingIndex === idx ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          title="Upload 1:1 Image (Max 2MB)"
                        >
                          <Upload className="h-5 w-5 text-primary/80" />
                          <span className="text-xs font-semibold">
                            {uploadingIndex === idx ? '...' : '+ Image'}
                          </span>
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleExistingValueImageUpload(idx, file);
                            }}
                          />
                        </label>
                      )}

                      {/* Middle: Centered Value Name & Slug */}
                      <div className="min-w-0 flex-1 flex flex-col items-center justify-center text-center space-y-1.5 px-2">
                        <p className="text-base font-bold text-foreground leading-tight truncate max-w-full">
                          {val.name}
                        </p>
                        <span className="inline-block text-xs font-mono text-muted-foreground px-2.5 py-1 rounded-md bg-muted/60 border border-border/50">
                          {val.slug}
                        </span>
                      </div>

                      {/* Right: Delete Action */}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer rounded-lg transition-colors"
                        title="Delete Value"
                        onClick={() => removeValue(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="cursor-pointer text-xs font-semibold gap-1.5"
              >
                <Save className="h-4 w-4" />
                {isSubmitting
                  ? 'Saving...'
                  : editingAttribute
                  ? 'Update Attribute'
                  : 'Save Attribute'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Attribute"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AttributesPage;
