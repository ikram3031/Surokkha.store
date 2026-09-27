import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Package, AlertTriangle, CheckCircle2, XCircle, TrendingDown } from 'lucide-react';
import { useProducts } from '@/hooks/use-products';
import { useCategories, useBrands } from '@/lib/category-cache';
import { clientConfig } from '@/clientConfig';

// Renders the product stock management dashboard with stock status breakdown and filter controls
const StockManagementPage = () => {
  const { t } = useTranslation();
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('all');

  const { data: productsResponse, isLoading } = useProducts({
    search: searchQuery || undefined,
    category: categoryFilter !== 'All' ? categoryFilter : undefined,
    brand: brandFilter !== 'All' ? brandFilter : undefined,
  });
  const products = useMemo(() => Array.isArray(productsResponse?.data)
    ? productsResponse.data
    : [], [productsResponse?.data]);

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const filtered = useMemo(() => {
    if (stockFilter === 'all') return products;
    if (stockFilter === 'low') return products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10);
    if (stockFilter === 'out') return products.filter((p) => p.status === 'Out of Stock');
    if (stockFilter === 'in') return products.filter((p) => p.status === 'In Stock');
    return products;
  }, [products, stockFilter]);

  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.status === 'In Stock').length;
  const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 10).length;
  const outOfStockCount = products.filter((p) => p.status === 'Out of Stock').length;

  const getStockBadge = (product) => {
    if (product.status === 'Out of Stock' || (product.stock ?? 0) === 0) {
      return <Badge variant="destructive" className="w-[100px] inline-flex items-center justify-center gap-1 text-[10px] whitespace-nowrap shrink-0"><XCircle className="h-3 w-3" />{t('products.out_of_stock')}</Badge>;
    }
    if ((product.stock ?? 0) < 10) {
      return <Badge variant="outline" className="w-[100px] inline-flex items-center justify-center gap-1 text-[10px] border-amber-500 text-amber-500 whitespace-nowrap shrink-0"><AlertTriangle className="h-3 w-3" />{t('products.low_stock')}</Badge>;
    }
    return <Badge variant="outline" className="w-[100px] inline-flex items-center justify-center gap-1 text-[10px] border-emerald-500 text-emerald-500 whitespace-nowrap shrink-0"><CheckCircle2 className="h-3 w-3" />{t('products.in_stock')}</Badge>;
  };

  const getTotalVariantStock = (product) => {
    if (product.type !== 'variant' || !product.variants?.length) return product.stock ?? 0;
    return product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('products.stock_management')}</h2>
        <p className="text-muted-foreground text-sm mt-1">{t('products.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setStockFilter('all')}
          className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${stockFilter === 'all' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'bg-card'}`}
        >
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">
            <Package className="h-3.5 w-3.5" />
            {t('products.title')}
          </div>
          <p className="text-2xl font-bold">{isLoading ? '—' : totalProducts}</p>
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('in')}
          className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${stockFilter === 'in' ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20' : 'bg-card'}`}
        >
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium mb-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t('products.in_stock')}
          </div>
          <p className="text-2xl font-bold text-emerald-600">{isLoading ? '—' : inStockCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('low')}
          className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${stockFilter === 'low' ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/20' : 'bg-card'}`}
        >
          <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mb-1">
            <TrendingDown className="h-3.5 w-3.5" />
            {t('products.low_stock')}
          </div>
          <p className="text-2xl font-bold text-amber-600">{isLoading ? '—' : lowStockCount}</p>
        </button>
        <button
          type="button"
          onClick={() => setStockFilter('out')}
          className={`rounded-xl border p-4 text-left transition-all hover:shadow-sm ${stockFilter === 'out' ? 'border-destructive bg-destructive/5 ring-1 ring-destructive/20' : 'bg-card'}`}
        >
          <div className="flex items-center gap-2 text-destructive text-xs font-medium mb-1">
            <XCircle className="h-3.5 w-3.5" />
            {t('products.out_of_stock')}
          </div>
          <p className="text-2xl font-bold text-destructive">{isLoading ? '—' : outOfStockCount}</p>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('products.search_products')}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? 'All')}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={t('products.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{`${t('products.category')}: ${t('common.all')}`}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.did} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasBrand && (
            <Select value={brandFilter} onValueChange={(value) => setBrandFilter(value ?? 'All')}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('products.brand')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{`${t('products.brand')}: ${t('common.all')}`}</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.did} value={brand.name}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="bg-card text-card-foreground shadow-sm border rounded-lg">
        <div className="p-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('products.product_name')}</TableHead>
                  <TableHead>{t('products.sku')}</TableHead>
                  <TableHead>{t('common.details')}</TableHead>
                  <TableHead className="text-center">{t('products.stock_quantity')}</TableHead>
                  <TableHead className="text-center">{t('common.status')}</TableHead>
                  <TableHead>{t('products.attributes_variations')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-md" /><Skeleton className="h-4 w-32" /></div></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-4 w-10 mx-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-5 w-20 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((product) => (
                    <TableRow key={product.id} className={(product.stock ?? 0) === 0 ? 'bg-destructive/3' : (product.stock ?? 0) < 10 ? 'bg-amber-500/3' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-md border flex-shrink-0">
                              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted flex-shrink-0">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {product.type === 'variant' ? 'Variable' : 'Simple'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold text-sm ${(product.stock ?? 0) === 0 ? 'text-destructive' : (product.stock ?? 0) < 10 ? 'text-amber-600' : ''}`}>
                          {getTotalVariantStock(product)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStockBadge(product)}
                      </TableCell>
                      <TableCell>
                        {product.type === 'variant' && (product.variants?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {(product.variants || []).map((v) => (
                              <span
                                key={v.size}
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                                  v.stockStatus === 'outofstock' || v.stockQuantity === 0
                                    ? 'border-destructive/30 bg-destructive/5 text-destructive'
                                    : v.stockQuantity < 5
                                    ? 'border-amber-500/30 bg-amber-500/5 text-amber-600'
                                    : 'border-border bg-muted/50 text-muted-foreground'
                                }`}
                              >
                                <span className="font-medium">{v.size}</span>
                                <span className="opacity-60">×</span>
                                <span className="font-semibold">{v.stockQuantity}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {t('products.no_products_found')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagementPage;
