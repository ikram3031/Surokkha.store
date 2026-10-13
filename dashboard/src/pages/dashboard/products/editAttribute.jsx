import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Sliders,
  Plus,
  Trash2,
  Upload,
  X,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { toast } from 'sonner';
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
    const valA = typeof a === 'string' ? a : a?.name || a?.size || '';
    const valB = typeof b === 'string' ? b : b?.name || b?.size || '';
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

export default function EditAttributePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(true);
  const [values, setValues] = useState([]);

  // New Value inputs
  const [newValueName, setNewValueName] = useState('');
  const [newValueSlug, setNewValueSlug] = useState('');
  const [newValueSlugManual, setNewValueSlugManual] = useState(false);
  const [newValueImage, setNewValueImage] = useState(null);
  const [newValueImagePreview, setNewValueImagePreview] = useState(null);

  const fetchAttribute = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/dashboard/attributes');
      const allAttrs = res.data?.data || [];
      const current = allAttrs.find((a) => a._id === id || a.id === id);

      if (!current) {
        toast.error('Attribute group not found');
        navigate('/dashboard/products/attributes');
        return;
      }

      setName(current.name || '');
      setSlug(current.slug || '');
      setValues(sortAttributeValues(current.values || []));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch attribute details'));
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAttribute();
  }, [fetchAttribute]);

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
        if (ratio < 0.97 || ratio > 1.03) {
          return reject(
            new Error(
              `Image must have a 1:1 square ratio (e.g. 1000x1000px or 1500x1500px). Current: ${img.width}x${img.height}px`
            )
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
      toast.error('Value with this name or slug already exists');
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
        toast.error('Failed to upload image');
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
      toast.error('Attribute Name and Slug are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        values,
      };

      await apiClient.put(`/api/v1/dashboard/attributes/${id}`, body);
      toast.success('Attribute updated successfully');
      navigate('/dashboard/products/attributes');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update attribute'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6 w-full space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted/40 animate-pulse rounded-xl border" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 w-full max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard/products/attributes')}
            className="h-9 w-9 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Edit Attribute: <span className="text-primary">{name}</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage variation details, value list, and per-value 1:1 image assets.
            </p>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="gap-2 px-5 cursor-pointer font-semibold"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Update Attribute'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Attribute Properties */}
        <Card className="border shadow-xs w-full">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">
              Attribute Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Attribute Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slugManual) setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Size, Volume, Color"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">
                  Attribute Slug <span className="text-destructive">*</span>
                </label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. size, volume, color"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attribute Values & Images Manager */}
        <Card className="border shadow-xs w-full">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base font-bold text-foreground">
                Attribute Values ({values.length})
              </CardTitle>
              <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border">
                1:1 Square Ratio • Max 2MB • JPG/PNG/WEBP
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Add New Value Section */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                Add New Value
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Value Name *
                  </label>
                  <Input
                    placeholder="e.g. 5ml, 10ml, Red"
                    value={newValueName}
                    onChange={(e) => {
                      setNewValueName(e.target.value);
                      if (!newValueSlugManual) {
                        setNewValueSlug(slugify(e.target.value));
                      }
                    }}
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

                {/* Prominent Image Upload Button / Preview */}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    1:1 Image (Optional)
                  </label>
                  {newValueImagePreview ? (
                    <div className="relative h-10 w-full rounded-lg border-2 border-primary/40 bg-muted/30 overflow-hidden flex items-center justify-between px-2">
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
                    <label className="flex items-center justify-center gap-2 h-10 px-3 rounded-lg border-2 border-dashed border-primary/30 hover:border-primary text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 cursor-pointer transition-all">
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

                <div>
                  <Button
                    type="button"
                    onClick={addValue}
                    disabled={!newValueName.trim()}
                    className="cursor-pointer gap-1.5 text-xs h-10 w-full font-semibold shadow-xs"
                  >
                    <Plus className="h-4 w-4" /> Add Value
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Configured Values in 3-Column Grid */}
            <div>
              {values.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground border border-dashed rounded-2xl bg-background/50">
                  <Sliders className="h-12 w-12 mx-auto mb-2 opacity-30 text-primary" />
                  <p className="text-base font-bold text-foreground">No values configured yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Use the form above to add attribute values and upload optional 1:1 images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                  {values.map((val, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 min-h-[160px] rounded-2xl border border-border/80 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all gap-4 shadow-xs group"
                    >
                      {/* Left: Large 1:1 Image Box */}
                      {val.imageUrl ? (
                        <div className="relative size-32 shrink-0 group/img">
                          <div className="size-32 rounded-2xl border border-border/80 bg-muted/20 overflow-hidden shadow-xs">
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
                            className="absolute -top-2 -right-2 size-7 rounded-full bg-destructive text-destructive-foreground border-2 border-background shadow-md hover:scale-115 flex items-center justify-center cursor-pointer transition-all z-20"
                            title="Remove Image"
                          >
                            <X className="h-4 w-4 stroke-[2.5]" />
                          </button>
                        </div>
                      ) : (
                        <label
                          className={`size-32 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/10 flex flex-col items-center justify-center text-muted-foreground hover:text-primary cursor-pointer shrink-0 transition-all gap-2 shadow-2xs ${
                            uploadingIndex === idx ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          title="Upload 1:1 Image (Max 2MB)"
                        >
                          <Upload className="h-7 w-7 text-primary/80" />
                          <span className="text-xs font-bold">+ Image</span>
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
                      <div className="min-w-0 flex-1 flex flex-col items-center justify-center text-center space-y-2 px-2">
                        <p className="text-lg sm:text-xl font-bold text-foreground truncate max-w-full">
                          {val.name}
                        </p>
                        <span className="inline-block text-xs font-mono text-muted-foreground px-3 py-1 rounded-md bg-muted/70 border border-border/60">
                          {val.slug}
                        </span>
                      </div>

                      {/* Right: Delete Action */}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 text-destructive/70 hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer rounded-xl transition-colors"
                        title="Delete Value"
                        onClick={() => removeValue(idx)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
