import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Trash2,
  RotateCcw,
  Package,
  ShoppingBag,
  AlertCircle,
  Eye,
  CheckCircle2,
  ImageIcon,
} from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { useCategories, useBrands, getCategoryName, getBrandName } from '@/lib/category-cache';
import { clientConfig } from '@/clientConfig';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';

const TrashPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;

  // Mode: 'products' | 'orders'
  const [trashType, setTrashType] = useState('products');

  // Common Filter / Pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  // Product specific filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');

  // Order specific filters
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');

  // Dialog states
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkActionTarget, setBulkActionTarget] = useState(null); // 'restore' | 'delete'

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  // Reset page & selection on mode switch
  const handleTypeSwitch = (type) => {
    setTrashType(type);
    setCurrentPage(1);
    setSelectedIds([]);
    setSearchQuery('');
  };

  // 1. Fetch Inactive Products
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
  } = useQuery({
    queryKey: [
      'trash-products',
      { search: searchQuery, category: categoryFilter, brand: brandFilter, page: currentPage },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('isActive', 'false');
      params.append('page', String(currentPage));
      params.append('limit', '15');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (brandFilter !== 'All') params.append('brand', brandFilter);

      const res = await apiClient.get(`/api/v1/products?${params.toString()}`);
      return res.data;
    },
    enabled: trashType === 'products',
  });

  // 2. Fetch Inactive / Deleted Orders
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    isError: isOrdersError,
  } = useQuery({
    queryKey: [
      'trash-orders',
      { search: searchQuery, status: orderStatusFilter, page: currentPage },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('active', 'false');
      params.append('page', String(currentPage));
      params.append('limit', '15');
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (orderStatusFilter !== 'All') params.append('status', orderStatusFilter);

      const res = await apiClient.get(`/api/v1/orders?${params.toString()}`);
      return res.data;
    },
    enabled: trashType === 'orders',
  });

  const products = productsData?.data ?? [];
  const productTotalPages = productsData?.meta?.totalPages ?? 1;

  const orders = ordersData?.data ?? [];
  const orderTotalPages = ordersData?.meta?.totalPages ?? ordersData?.pagination?.pages ?? 1;

  const totalPages = trashType === 'products' ? productTotalPages : orderTotalPages;

  // Single Actions
  const handleRestoreProduct = async (product) => {
    setIsProcessing(true);
    try {
      await apiClient.put(`/api/v1/products/${product.id || product._id}`, { isActive: true });
      toast.success(`Product "${product.name}" restored successfully!`);
      queryClient.invalidateQueries({ queryKey: ['trash-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setRestoreTarget(null);
    } catch {
      toast.error('Failed to restore product.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDeleteProduct = async (product) => {
    setIsProcessing(true);
    try {
      await apiClient.delete(`/api/v1/products/${product.id || product._id}`);
      toast.success(`Product "${product.name}" permanently deleted.`);
      queryClient.invalidateQueries({ queryKey: ['trash-products'] });
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete product permanently.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreOrder = async (order) => {
    setIsProcessing(true);
    try {
      await apiClient.put(`/api/v1/orders/${order.id || order._id}`, { active: true });
      toast.success(`Order #${order.orderNumber} restored successfully!`);
      queryClient.invalidateQueries({ queryKey: ['trash-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setRestoreTarget(null);
    } catch {
      toast.error('Failed to restore order.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk Actions
  const handleBulkRestore = async () => {
    setIsProcessing(true);
    try {
      if (trashType === 'products') {
        await Promise.all(
          selectedIds.map((id) => apiClient.put(`/api/v1/products/${id}`, { isActive: true }))
        );
        toast.success(`${selectedIds.length} products restored successfully!`);
        queryClient.invalidateQueries({ queryKey: ['trash-products'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        await Promise.all(
          selectedIds.map((id) => apiClient.put(`/api/v1/orders/${id}`, { active: true }))
        );
        toast.success(`${selectedIds.length} orders restored successfully!`);
        queryClient.invalidateQueries({ queryKey: ['trash-orders'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
      }
      setSelectedIds([]);
      setBulkActionTarget(null);
    } catch {
      toast.error('Failed to restore selected items.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      if (trashType === 'products') {
        await Promise.all(
          selectedIds.map((id) => apiClient.delete(`/api/v1/products/${id}`))
        );
        toast.success(`${selectedIds.length} products permanently deleted.`);
        queryClient.invalidateQueries({ queryKey: ['trash-products'] });
      } else {
        await apiClient.post('/api/v1/orders/bulk-delete', { ids: selectedIds });
        toast.success(`${selectedIds.length} orders permanently deleted.`);
        queryClient.invalidateQueries({ queryKey: ['trash-orders'] });
      }
      setSelectedIds([]);
      setBulkActionTarget(null);
    } catch {
      toast.error('Failed to delete selected items.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Checkbox helpers
  const handleSelectAll = (checked, items) => {
    if (checked) {
      setSelectedIds(items.map((item) => item.id || item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex-1 space-y-5 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Trash & Inactive Archive</h2>
            <p className="text-xs text-muted-foreground">
              Manage, restore, or permanently remove inactive products and soft-deleted orders.
            </p>
          </div>
        </div>

        {/* Radio Selector for Trash Type */}
        <div className="flex items-center bg-muted/60 p-1.5 rounded-xl border border-border shrink-0">
          <label
            onClick={() => handleTypeSwitch('products')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              trashType === 'products'
                ? 'bg-background text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <input
              type="radio"
              name="trashType"
              value="products"
              checked={trashType === 'products'}
              onChange={() => handleTypeSwitch('products')}
              className="sr-only"
            />
            <Package className="h-3.5 w-3.5 text-primary" />
            <span>Inactive Products</span>
          </label>

          <label
            onClick={() => handleTypeSwitch('orders')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              trashType === 'orders'
                ? 'bg-background text-foreground shadow-xs border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <input
              type="radio"
              name="trashType"
              value="orders"
              checked={trashType === 'orders'}
              onChange={() => handleTypeSwitch('orders')}
              className="sr-only"
            />
            <ShoppingBag className="h-3.5 w-3.5 text-primary" />
            <span>Deleted Orders</span>
          </label>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={
              trashType === 'products'
                ? 'Search inactive products by name, SKU...'
                : 'Search deleted orders by number, phone...'
            }
            className="pl-8 h-9 text-xs"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setSelectedIds([]);
            }}
          />
        </div>

        {/* Product Filters */}
        {trashType === 'products' && (
          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto justify-end flex-wrap">
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
                setSelectedIds([]);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.did || c.slug} value={c.slug || c.did}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={brandFilter}
              onValueChange={(val) => {
                setBrandFilter(val);
                setCurrentPage(1);
                setSelectedIds([]);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.did || b.slug} value={b.slug || b.did}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Order Filters */}
        {trashType === 'orders' && (
          <div className="flex items-center gap-2 w-full sm:w-auto ml-auto justify-end flex-wrap">
            <Select
              value={orderStatusFilter}
              onValueChange={(val) => {
                setOrderStatusFilter(val);
                setCurrentPage(1);
                setSelectedIds([]);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 animate-in fade-in">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkActionTarget('restore')}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
              Restore Selected
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkActionTarget('delete')}
              disabled={isProcessing}
              className="h-8 text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Permanently
            </Button>
          </div>
        </div>
      )}

      {/* 1. PRODUCTS TABLE VIEW */}
      {trashType === 'products' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={(e) => handleSelectAll(e.target.checked, products)}
                  />
                </TableHead>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden lg:table-cell">{hasBrand ? 'Category & Brand' : 'Category'}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isProductsLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : isProductsError ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-destructive">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    Failed to load inactive products.
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
                      <p className="font-semibold text-sm">Trash is empty</p>
                      <p className="text-xs">There are no inactive or deleted products right now.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const id = product.id || product._id;
                  const isSelected = selectedIds.includes(id);
                  const img = product.imageUrl || product.thumbnailUrl;

                  return (
                    <TableRow
                      key={id}
                      className={isSelected ? 'bg-muted/40' : 'hover:bg-muted/20'}
                    >
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-md border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                          {img ? (
                            <img src={resolveImageUrl(img)} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-foreground truncate max-w-[220px]">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            /{product.slug}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                        {product.sku || '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {product.type || 'simple'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        ৳{product.price || product.basePrice || (product.variants?.[0]?.price) || '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          <p className="font-medium truncate max-w-[150px]">
                            📁 {getCategoryName(product.category || product.categories?.[0], categories)}
                          </p>
                          {hasBrand && (
                            <p className="text-[11px] truncate max-w-[150px]">
                              🏷️ {getBrandName(product.brand || product.brands?.[0], brands)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                          Inactive
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRestoreTarget(product)}
                            title="Restore Product (Set Active)"
                            className="h-8 px-2.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(product)}
                            title="Permanently Delete Product"
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 2. ORDERS TABLE VIEW */}
      {trashType === 'orders' && (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                    checked={orders.length > 0 && selectedIds.length === orders.length}
                    onChange={(e) => handleSelectAll(e.target.checked, orders)}
                  />
                </TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOrdersLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell><Skeleton className="h-4 w-4 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : isOrdersError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-destructive">
                    <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                    Failed to load deleted orders.
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500/70" />
                      <p className="font-semibold text-sm">No deleted orders</p>
                      <p className="text-xs">There are no soft-deleted orders in the archive.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const id = order.id || order._id;
                  const isSelected = selectedIds.includes(id);
                  const customer = order.billingInfo || order.shippingInfo || {};

                  return (
                    <TableRow
                      key={id}
                      className={isSelected ? 'bg-muted/40' : 'hover:bg-muted/20'}
                    >
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-foreground">
                        <Link
                          to={`/dashboard/orders/${id}`}
                          className="text-primary hover:underline"
                        >
                          #{order.orderNumber || id.slice(-6)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {customer.fullName || 'Anonymous'}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {customer.phone || customer.email || '—'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs font-semibold">
                        {order.items?.length || 1} item(s)
                      </TableCell>
                      <TableCell className="text-xs font-bold">
                        ৳{order.totals?.total || order.total || 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
                          {order.status || 'cancelled'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRestoreTarget(order)}
                            title="Restore Order"
                            className="h-8 px-2.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/dashboard/orders/${id}`)}
                            title="View Order Details"
                            className="h-8 px-2 text-xs hover:bg-muted cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage((p) => p - 1);
                }}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-xs font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                }}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Single Restore Confirm Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(restoreTarget)}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        onConfirm={() => {
          if (trashType === 'products') handleRestoreProduct(restoreTarget);
          else handleRestoreOrder(restoreTarget);
        }}
        title={`Restore ${trashType === 'products' ? 'Product' : 'Order'}?`}
        description={`Are you sure you want to restore "${
          trashType === 'products'
            ? restoreTarget?.name
            : '#' + (restoreTarget?.orderNumber || restoreTarget?.id)
        }" back to active status?`}
        confirmText="Restore"
        variant="default"
      />

      {/* Single Delete Confirm Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => handlePermanentDeleteProduct(deleteTarget)}
        title="Permanently Delete Product?"
        description={`This action CANNOT be undone. "${deleteTarget?.name}" will be completely removed from the database.`}
        confirmText="Delete Forever"
        variant="destructive"
      />

      {/* Bulk Action Confirm Dialog */}
      <ConfirmDeleteDialog
        open={Boolean(bulkActionTarget)}
        onOpenChange={(open) => !open && setBulkActionTarget(null)}
        onConfirm={() => {
          if (bulkActionTarget === 'restore') handleBulkRestore();
          else handleBulkDelete();
        }}
        title={
          bulkActionTarget === 'restore'
            ? `Restore ${selectedIds.length} ${trashType}?`
            : `Permanently Delete ${selectedIds.length} ${trashType}?`
        }
        description={
          bulkActionTarget === 'restore'
            ? `All selected ${trashType} will be reactivated and restored.`
            : `This action CANNOT be undone. All selected ${trashType} will be permanently removed.`
        }
        confirmText={bulkActionTarget === 'restore' ? 'Restore All' : 'Delete Forever'}
        variant={bulkActionTarget === 'restore' ? 'default' : 'destructive'}
      />
    </div>
  );
};

export default TrashPage;
