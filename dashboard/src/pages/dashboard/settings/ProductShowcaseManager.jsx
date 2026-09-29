import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Trash2, Package, Save, Loader2, X, ShoppingBag, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { toast } from 'sonner';

// Normalizes product properties across different API response formats
const normalizeProduct = (p) => {
  if (!p || typeof p !== 'object') return null;
  const id = p._id ? String(p._id) : (p.id ? String(p.id) : (p.did || ''));
  const did = p.did || id;
  const name = p.name || 'Untitled Product';
  const sku = p.sku || did || '—';
  
  let price = 0;
  if (p.price !== undefined && p.price !== null) price = Number(p.price);
  else if (p.salePrice !== undefined && p.salePrice !== null) price = Number(p.salePrice);
  else if (p.offerPrice !== undefined && p.offerPrice !== null) price = Number(p.offerPrice);
  else if (Array.isArray(p.variants) && p.variants.length > 0 && p.variants[0]?.price) {
    price = Number(p.variants[0].price);
  }

  const rawImg =
    p.image ||
    p.imageUrl ||
    p.image_url ||
    p.thumbnailUrl ||
    p.thumbnail_url ||
    (Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : '') ||
    '';

  const image = resolveImageUrl(rawImg);
  const rawStatus = String(p.stockStatus || '').toLowerCase().trim();
  const isOutOfStock =
    rawStatus === 'outofstock' ||
    rawStatus === 'out_of_stock' ||
    rawStatus === 'out of stock';

  const stockStatus = isOutOfStock ? 'Out of Stock' : 'In Stock';

  return {
    ...p,
    id,
    _id: id,
    did,
    name,
    sku,
    price,
    image,
    stockStatus,
    isOutOfStock,
  };
};

// Manages showcase product curation with live search, normalization, and persistence
export const ProductShowcaseManager = ({ showcaseKey, title, icon: TagIcon, iconColor }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [stagedProducts, setStagedProducts] = useState([]);
  const [browseModalOpen, setBrowseModalOpen] = useState(false);
  const [browseSearchQuery, setBrowseSearchQuery] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 1. Fetch full store-utils data cached via TanStack Query
  const { data: storeUtilsData, isLoading: isStoreUtilsLoading } = useQuery({
    queryKey: ['store-utils'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/store-utils');
      return res.data?.data || { featured: [], bestSeller: [] };
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });

  // 2. Initialize and normalize staged products whenever storeUtilsData updates (only active & in-stock)
  useEffect(() => {
    if (storeUtilsData && Array.isArray(storeUtilsData[showcaseKey])) {
      const mapped = storeUtilsData[showcaseKey]
        .map(normalizeProduct)
        .filter((p) => p && p.isActive !== false && !p.isOutOfStock);
      setStagedProducts(mapped);
    }
  }, [storeUtilsData, showcaseKey]);

  // 3. Live search query for inline autocomplete dropdown using high-performance aggregation
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['showcase-product-search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      const res = await apiClient.post('/api/v1/dash/products', {
        q: debouncedQuery,
        limit: 12,
        isActive: true,
        stockStatus: 'instock',
      });
      const raw = res.data?.data || [];
      return raw
        .map(normalizeProduct)
        .filter((p) => p && p.isActive !== false && !p.isOutOfStock);
    },
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 30,
  });

  // 4. Query active in-stock products for the Browse Catalog modal using aggregation
  const { data: allCatalogProducts = [], isLoading: isCatalogLoading } = useQuery({
    queryKey: ['catalog-browse-products', browseSearchQuery],
    queryFn: async () => {
      const payload = {
        limit: 60,
        isActive: true,
        stockStatus: 'instock',
        sort: 'createdAt',
        order: 'desc',
      };
      if (browseSearchQuery.trim()) {
        payload.q = browseSearchQuery.trim();
      }
      const res = await apiClient.post('/api/v1/dash/products', payload);
      const raw = res.data?.data || [];

      return raw
        .map(normalizeProduct)
        .filter((p) => p && p.isActive !== false && !p.isOutOfStock);
    },
    enabled: browseModalOpen,
    staleTime: 1000 * 60,
  });

  // Filter out already staged products from inline search results dropdown
  const availableSearchResults = useMemo(() => {
    const stagedIdSet = new Set(stagedProducts.map((p) => p.id || p._id || p.did));
    return searchResults.filter((p) => !stagedIdSet.has(p.id || p._id || p.did));
  }, [searchResults, stagedProducts]);

  // Compute dirty state (unsaved changes vs server data)
  const isDirty = useMemo(() => {
    const serverList = (storeUtilsData && Array.isArray(storeUtilsData[showcaseKey]))
      ? storeUtilsData[showcaseKey].map(normalizeProduct).filter(Boolean)
      : [];
    const serverIds = serverList.map((p) => p.id || p._id || p.did).join(',');
    const stagedIds = stagedProducts.map((p) => p.id || p._id || p.did).join(',');
    return serverIds !== stagedIds;
  }, [storeUtilsData, showcaseKey, stagedProducts]);

  // Add product to showcase staging
  const handleAddProduct = (product) => {
    const pId = product.id || product._id || product.did;
    if (!stagedProducts.some((sp) => (sp.id || sp._id || sp.did) === pId)) {
      setStagedProducts((prev) => [...prev, product]);
      toast.success(`Added ${product.name} to ${title}`);
    }
    setSearchQuery('');
    setDebouncedQuery('');
  };

  // Remove product from showcase staging
  const handleRemoveProduct = (productId) => {
    setStagedProducts((prev) => prev.filter((p) => (p.id || p._id || p.did) !== productId));
  };

  // Mutation to persist updated showcase list to /api/v1/store-utils
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        [showcaseKey]: stagedProducts.map((p) => p.id || p._id || p.did),
      };
      const res = await apiClient.put('/api/v1/store-utils', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${title} saved successfully!`);
      const updatedData = data?.data;
      if (updatedData) {
        queryClient.setQueryData(['store-utils'], updatedData);
        if (Array.isArray(updatedData[showcaseKey])) {
          setStagedProducts(updatedData[showcaseKey].map(normalizeProduct).filter(Boolean));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['store-utils'] });
    },
    onError: (err) => {
      console.error(`Failed to save ${title}:`, err);
      toast.error(`Failed to save ${title}. Please try again.`);
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border shadow-xs w-full">
        {/* Header with Title, Count Badge, and Actions */}
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TagIcon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
              <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-semibold bg-muted">
                {stagedProducts.length} Products Added
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBrowseModalOpen(true)}
                className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
                Browse Catalog
              </Button>

              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!isDirty || saveMutation.isPending}
                className={`h-9 gap-1.5 text-xs font-semibold px-4 cursor-pointer transition-all ${
                  isDirty
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md ring-2 ring-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted opacity-70'
                }`}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add Product Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={`Search products by title, SKU, or keyword to add to ${title.toLowerCase()}...`}
              className="pl-9 pr-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedQuery('');
                }}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Search Results */}
          {debouncedQuery.length > 0 && (
            <div className="rounded-lg border bg-card p-2 shadow-md divide-y divide-border text-xs">
              {isSearching ? (
                <div className="flex items-center justify-center p-4 text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Searching products...</span>
                </div>
              ) : availableSearchResults.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground">
                  No matching un-added products found for &quot;{debouncedQuery}&quot;.
                </div>
              ) : (
                availableSearchResults.map((product) => {
                  const pId = product.id || product._id || product.did;
                  return (
                    <div
                      key={pId}
                      className="flex items-center justify-between py-2 px-2 hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-9 w-9 rounded object-cover border shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0 border">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {product.sku || 'No SKU'} • ৳{product.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-medium gap-1 shrink-0 cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleAddProduct(product)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Staged Products Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isStoreUtilsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-9 w-9 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : stagedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-36 text-center text-muted-foreground text-xs space-y-2">
                      <p>No products are currently added to {title}.</p>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setBrowseModalOpen(true)}
                        className="text-xs cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Browse Catalog & Add Products
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  stagedProducts.map((product) => {
                    const pId = product.id || product._id || product.did;
                    return (
                      <TableRow key={pId}>
                        <TableCell>
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-9 w-9 rounded object-cover border"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-9 w-9 rounded bg-muted flex items-center justify-center border">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-foreground">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {product.sku || '—'}
                        </TableCell>
                        <TableCell className="text-xs font-semibold font-mono">
                          ৳{product.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              product.isOutOfStock
                                ? 'text-destructive bg-destructive/10 border-destructive/20'
                                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            }`}
                          >
                            {product.stockStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                            title={`Remove from ${title}`}
                            onClick={() => handleRemoveProduct(pId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Browse Full Catalog Modal */}
      <Dialog open={browseModalOpen} onOpenChange={setBrowseModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <span>Browse Catalog & Add to {title}</span>
            </DialogTitle>
            <DialogDescription>
              Select products from your inventory to showcase in {title}.
            </DialogDescription>
          </DialogHeader>

          {/* Search bar inside modal */}
          <div className="relative my-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by product name, SKU..."
              value={browseSearchQuery}
              onChange={(e) => setBrowseSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Product list in modal */}
          <div className="flex-1 overflow-y-auto max-h-[50vh] divide-y divide-border border rounded-md p-1">
            {isCatalogLoading ? (
              <div className="p-8 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading catalog products...</span>
              </div>
            ) : allCatalogProducts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                No products found.
              </div>
            ) : (
              allCatalogProducts.map((p) => {
                const pId = p.id || p._id || p.did;
                const isAlreadyAdded = stagedProducts.some((sp) => (sp.id || sp._id || sp.did) === pId);

                return (
                  <div
                    key={pId}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/40 transition-colors rounded-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-10 w-10 rounded object-cover border shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 border">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="truncate">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">
                          {p.sku || 'No SKU'} • ৳{p.price.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isAlreadyAdded ? 'secondary' : 'default'}
                      disabled={isAlreadyAdded}
                      className="h-8 text-xs font-medium shrink-0 cursor-pointer"
                      onClick={() => handleAddProduct(p)}
                    >
                      {isAlreadyAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
