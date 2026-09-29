import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Layers, Package } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';
import {
  useCategories,
  useBrands,
} from '@/lib/category-cache';

const emptyVariant = () => ({
  size: '',
  price: '',
  offerPrice: '',
  stockQuantity: '0',
  sku: '',
});

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Basic fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Type toggle
  const [productType, setProductType] = useState('simple');

  // Simple product fields
  const [price, setPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [sku, setSku] = useState('');

  // Variant product fields
  const [variants, setVariants] = useState([emptyVariant()]);

  // Category & Brand
  const [categorySlug, setCategorySlug] = useState('');
  const [brandSlug, setBrandSlug] = useState('');

  // Season
  const [season, setSeason] = useState('All-Season');

  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual]
  );

  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant()]);
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setSlugManual(false);
    setDescription('');
    setImageUrl('');
    setProductType('simple');
    setPrice('');
    setOfferPrice('');
    setStockQuantity('');
    setSku('');
    setVariants([emptyVariant()]);
    setCategorySlug('');
    setBrandSlug('');
    setSeason('All-Season');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Product name is required.');
      return;
    }
    if (!slug.trim()) {
      toast.error('Product slug is required.');
      return;
    }

    if (productType === 'simple') {
      if (!price || Number(price) <= 0) {
        toast.error('Price must be greater than 0.');
        return;
      }
    } else {
      const validVariants = variants.filter((v) => v.size.trim() && v.price);
      if (validVariants.length === 0) {
        toast.error('At least one variant with size and price is required.');
        return;
      }
    }

    setIsCreating(true);
    try {
      const body = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || name.trim(),
        type: productType,
        imageUrl: imageUrl.trim() || undefined,
        season,
      };

      if (categorySlug) body.category = categorySlug;
      if (brandSlug) body.brand = brandSlug;

      if (productType === 'simple') {
        body.price = parseFloat(price);
        body.offerPrice = offerPrice ? parseFloat(offerPrice) : null;
        body.stockQuantity = parseInt(stockQuantity || '0', 10);
        body.sku = sku.trim();
        body.stockStatus =
          parseInt(stockQuantity || '0', 10) > 0 ? 'instock' : 'outofstock';
      } else {
        body.variants = variants
          .filter((v) => v.size.trim() && v.price)
          .map((v, i) => ({
            size: v.size.trim(),
            price: parseFloat(v.price),
            offerPrice: v.offerPrice ? parseFloat(v.offerPrice) : null,
            stockQuantity: parseInt(v.stockQuantity || '0', 10),
            sku: v.sku.trim(),
            sortOrder: i,
          }));

        const totalStock = variants.reduce(
          (sum, v) => sum + parseInt(v.stockQuantity || '0', 10),
          0
        );
        body.stockStatus = totalStock > 0 ? 'instock' : 'outofstock';
      }

      await apiClient.post('/api/v1/products', body);
      toast.success('Product created successfully!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create product.'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new product in your inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Product Name</label>
            <Input
              required
              placeholder="e.g. Oud Imperial Perfume"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold">Slug</label>
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
              placeholder="oud-imperial-perfume"
              value={slug}
              onChange={(e) => {
                setSlugManual(true);
                setSlug(e.target.value);
              }}
              disabled={!slugManual}
              className={!slugManual ? 'opacity-60' : ''}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Description</label>
            <Input
              placeholder="Brief product description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Product Type Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              {productType === 'simple' ? (
                <Package className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Layers className="h-4 w-4 text-primary" />
              )}
              <div>
                <p className="text-xs font-semibold">
                  {productType === 'simple' ? 'Simple Product' : 'Variant Product'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {productType === 'simple'
                    ? 'Single price & stock'
                    : 'Multiple sizes with individual pricing'}
                </p>
              </div>
            </div>
            <Switch
              checked={productType === 'variant'}
              onCheckedChange={(checked) =>
                setProductType(checked ? 'variant' : 'simple')
              }
            />
          </div>

          {/* Simple Product Fields */}
          {productType === 'simple' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Price (৳)</label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="99.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Offer Price (৳)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Optional"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Stock Quantity</label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">SKU</label>
                  <Input
                    placeholder="OIP-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Variant Product Fields */}
          {productType === 'variant' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold">
                  Size Variants ({variants.length})
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={addVariant}
                >
                  <Plus className="h-3 w-3" /> Add Size
                </Button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end rounded-md border border-border/50 p-2.5 bg-muted/30"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Size
                      </label>
                      <Input
                        required
                        placeholder="e.g. 3ml"
                        className="h-8 text-xs"
                        value={v.size}
                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Price (৳)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        placeholder="199"
                        className="h-8 text-xs"
                        value={v.price}
                        onChange={(e) => updateVariant(i, 'price', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Stock
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-8 text-xs"
                        value={v.stockQuantity}
                        onChange={(e) =>
                          updateVariant(i, 'stockQuantity', e.target.value)
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeVariant(i)}
                      disabled={variants.length <= 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category & Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Category</label>
              <Select
                value={categorySlug || '__none__'}
                onValueChange={(val) =>
                  setCategorySlug(val === '__none__' ? '' : val ?? '')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.did} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Brand</label>
              <Select
                value={brandSlug || '__none__'}
                onValueChange={(val) =>
                  setBrandSlug(val === '__none__' ? '' : val ?? '')
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {brands.map((b) => (
                    <SelectItem key={b.did} value={b.slug}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Season */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Season</label>
            <Select
              value={season}
              onValueChange={(val) => setSeason(val ?? 'All-Season')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All-Season">All Season</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Autumn">Autumn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Image URL (Optional)</label>
            <Input
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
