import { useState, useEffect, useMemo } from 'react';
import { useCategories } from '@/lib/category-cache';
import { apiClient } from '@/lib/api-client';
import { clientConfig } from '@/clientConfig';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
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
  Ruler,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Sliders,
  Layers,
  Table as TableIcon,
  X,
  Sparkles,
  Check,
} from 'lucide-react';

const COMMON_COLUMN_SUGGESTIONS = [
  'Chest',
  'Length',
  'Sleeve',
  'Shoulder',
  'Waist',
  'Hip',
  'Inseam',
  'Thigh',
  'Collar',
];

const STANDARD_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'];


// Main Parent Category-wise Size Chart Management Page Component
const SizeChartsPage = () => {
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const [sizeCharts, setSizeCharts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(true);
  const [isSeedingAttr, setIsSeedingAttr] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const [selectedAttributeId, setSelectedAttributeId] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [columns, setColumns] = useState([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [matrixRows, setMatrixRows] = useState([]);
  const [measurementUnit, setMeasurementUnit] = useState('inches');
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetches all configured size charts from backend API
  const fetchSizeCharts = async () => {
    setIsLoadingCharts(true);
    try {
      const res = await apiClient.get('/api/v1/size-charts');
      setSizeCharts(res.data?.data || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch size charts'));
    } finally {
      setIsLoadingCharts(false);
    }
  };

  // Fetches available attributes from backend API
  const fetchAttributes = async () => {
    if (clientConfig?.features?.attribute === false || clientConfig?.features?.attributes === false) {
      return [];
    }
    try {
      const res = await apiClient.get('/api/v1/dashboard/attributes');
      const loaded = res.data?.data || [];
      setAttributes(loaded);
      return loaded;
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to fetch attributes'));
      return [];
    }
  };

  // Seeds standard Size attribute group if none exist in the store
  const handleSeedDefaultAttributes = async () => {
    setIsSeedingAttr(true);
    try {
      const loaded = await fetchAttributes();
      const sizeAttr = loaded.find(
        (a) => a.slug?.toLowerCase() === 'size' || a.name?.toLowerCase().includes('size')
      ) || loaded[0];
      if (sizeAttr) {
        setSelectedAttributeId(sizeAttr._id || sizeAttr.id || '');
        toast.success('Standard attribute group loaded');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load attributes'));
    } finally {
      setIsSeedingAttr(false);
    }
  };

  useEffect(() => {
    fetchSizeCharts();
    fetchAttributes();
  }, []);

  // Filters only root/parent categories that have no parent
  const parentCategories = useMemo(() => {
    return categories.filter((c) => !c.parent);
  }, [categories]);

  // Builds map of size charts by category ID or slug
  const sizeChartMap = useMemo(() => {
    const map = new Map();
    for (const chart of sizeCharts) {
      if (chart.category?._id) map.set(String(chart.category._id), chart);
      if (chart.category?.did) map.set(chart.category.did, chart);
      if (chart.category?.slug) map.set(chart.category.slug, chart);
      if (chart.categorySlug) map.set(chart.categorySlug, chart);
    }
    return map;
  }, [sizeCharts]);

  // Finds currently selected attribute object with standard apparel size sorting
  const activeAttribute = useMemo(() => {
    const attr = attributes.find(
      (a) => a._id === selectedAttributeId || a.slug === selectedAttributeId
    );
    if (!attr) return null;
    const isSizeAttr = attr.slug?.toLowerCase() === 'size' || attr.name?.toLowerCase().includes('size');
    const sortedValues = [...(attr.values || [])].sort((a, b) => {
      const nameA = String(typeof a === 'string' ? a : (a?.name || a?.slug || '')).toUpperCase();
      const nameB = String(typeof b === 'string' ? b : (b?.name || b?.slug || '')).toUpperCase();
      if (isSizeAttr) {
        const idxA = STANDARD_SIZE_ORDER.indexOf(nameA);
        const idxB = STANDARD_SIZE_ORDER.indexOf(nameB);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }
      return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
    });
    return { ...attr, values: sortedValues };
  }, [attributes, selectedAttributeId]);

  // Opens configuration modal for a given parent category
  const handleOpenConfigModal = async (category) => {
    setActiveCategory(category);
    let currentAttrs = attributes;
    if (currentAttrs.length === 0) {
      currentAttrs = await fetchAttributes();
    }

    const existingChart =
      sizeChartMap.get(category.id) ||
      sizeChartMap.get(category._id) ||
      sizeChartMap.get(category.did) ||
      sizeChartMap.get(category.slug);

    if (existingChart) {
      setIsEditingExisting(true);
      setCurrentStep(1);
      setSelectedAttributeId(
        existingChart.attributeId?._id ||
          existingChart.attributeId ||
          currentAttrs.find((a) => a.slug?.toLowerCase().includes('size'))?._id ||
          currentAttrs[0]?._id ||
          ''
      );
      setColumns(existingChart.columns || []);
      setMeasurementUnit(existingChart.unit || 'inches');

      const existingRows = Array.isArray(existingChart.rows)
        ? existingChart.rows.map((r) => ({
            size: r.size,
            values: r.values instanceof Map ? Object.fromEntries(r.values) : (r.values || {}),
          }))
        : [];
      setMatrixRows(existingRows);
      setSelectedSizes(existingRows.map((r) => r.size));
    } else {
      setIsEditingExisting(false);
      setCurrentStep(1);
      const defaultSizeAttr = currentAttrs.find(
        (a) =>
          a.slug?.toLowerCase() === 'size' ||
          a.name?.toLowerCase().includes('size')
      ) || currentAttrs[0];

      setSelectedAttributeId(defaultSizeAttr?._id || defaultSizeAttr?.id || '');
      setColumns(['Chest', 'Length', 'Sleeve']);
      setMeasurementUnit('inches');
      setMatrixRows([]);
      setSelectedSizes([]);
    }

    setNewColumnName('');
    setModalOpen(true);
  };

  // Handles selecting or deselecting a size option
  const handleToggleSize = (sizeLabel) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeLabel)
        ? prev.filter((s) => s !== sizeLabel)
        : [...prev, sizeLabel]
    );
  };

  // Selects all available attribute size options
  const handleSelectAllSizes = (allSizes) => {
    setSelectedSizes(allSizes);
  };

  // Clears all selected size options
  const handleClearAllSizes = () => {
    setSelectedSizes([]);
  };

  // Handles changing the active attribute group
  const handleAttributeChange = (newAttrId) => {
    setSelectedAttributeId(newAttrId);
    const newAttr = attributes.find((a) => a._id === newAttrId || a.id === newAttrId);
    const newValues = (newAttr?.values || []).map((v) =>
      typeof v === 'string' ? v : v.name || v.size || v.slug
    );
    setSelectedSizes((prev) => prev.filter((s) => newValues.includes(s)));
  };

  // Validates size selection and transitions to column definition step
  const handleProceedToColumns = () => {
    if (!selectedAttributeId) {
      toast.error('Please select an attribute group');
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size for this category');
      return;
    }
    setCurrentStep(2);
  };

  // Handles adding a new measurement column
  const handleAddColumn = (columnToAdd) => {
    const trimmed = (columnToAdd || newColumnName).trim();
    if (!trimmed) return;
    if (columns.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Column "${trimmed}" already exists`);
      return;
    }
    setColumns((prev) => [...prev, trimmed]);
    setNewColumnName('');
  };

  // Handles removing a measurement column
  const handleRemoveColumn = (columnToRemove) => {
    setColumns((prev) => prev.filter((c) => c !== columnToRemove));
    setMatrixRows((prev) =>
      prev.map((row) => {
        const nextValues = { ...row.values };
        delete nextValues[columnToRemove];
        return { ...row, values: nextValues };
      })
    );
  };

  // Generates or syncs matrix rows when proceeding to step 3
  const handleProceedToMatrix = () => {
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size variation for this category');
      return;
    }
    if (columns.length === 0) {
      toast.error('Please add at least one measurement column (e.g. Chest, Length)');
      return;
    }

    setMatrixRows((prevRows) => {
      const existingMap = new Map(prevRows.map((r) => [r.size, r.values]));
      return selectedSizes.map((size) => ({
        size,
        values: existingMap.get(size) || {},
      }));
    });

    setCurrentStep(3);
  };

  // Updates single measurement cell in matrix
  const handleCellChange = (size, colName, val) => {
    setMatrixRows((prev) =>
      prev.map((row) => {
        if (row.size !== size) return row;
        return {
          ...row,
          values: {
            ...row.values,
            [colName]: val,
          },
        };
      })
    );
  };

  // Submits and saves size chart to backend API
  const handleSaveSizeChart = async () => {
    if (!activeCategory) return;
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size variation');
      return;
    }
    if (columns.length === 0) {
      toast.error('At least one measurement column is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        categoryId: activeCategory.id || activeCategory._id || activeCategory.did,
        category: activeCategory.id || activeCategory._id || activeCategory.did,
        attributeId: activeAttribute?._id || null,
        attributeName: activeAttribute?.name || 'Size',
        columns,
        rows: matrixRows,
        unit: measurementUnit,
      };

      await apiClient.post('/api/v1/size-charts', payload);
      toast.success(
        `Size chart saved successfully for ${activeCategory.name}`
      );
      setModalOpen(false);
      fetchSizeCharts();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save size chart'));
    } finally {
      setIsSaving(false);
    }
  };

  // Deletes size chart for selected category
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/size-charts/${deleteTarget.id}`);
      toast.success('Size chart deleted successfully');
      fetchSizeCharts();
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete size chart'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter parent categories matching search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return parentCategories;
    const q = searchQuery.toLowerCase().trim();
    return parentCategories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
    );
  }, [parentCategories, searchQuery]);

  const configuredCount = useMemo(() => {
    return parentCategories.filter((c) =>
      Boolean(
        sizeChartMap.get(c.id) ||
          sizeChartMap.get(c._id) ||
          sizeChartMap.get(c.did) ||
          sizeChartMap.get(c.slug)
      )
    ).length;
  }, [parentCategories, sizeChartMap]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-5">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-xs">
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Category Size Charts
              </h2>
              <Badge variant="outline" className="font-semibold text-xs bg-primary/5 text-primary border-primary/20">
                Parent Categories
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define measurement metrics, dimensions, and size variations for each parent category.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className="px-3 py-1.5 rounded-lg bg-muted/60 border flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>Total Categories:</span>
            <span className="text-foreground font-bold">{parentCategories.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Configured:</span>
            <span className="font-bold">{configuredCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search parent category name or slug..."
            className="pl-9 h-10 bg-card border-border/80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isCategoriesLoading || isLoadingCharts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border rounded-2xl bg-card">
          <Ruler className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" />
          <p className="font-semibold text-foreground text-base">No parent categories found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create parent categories in Categories manager to attach size charts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => {
            const chart =
              sizeChartMap.get(cat.id) ||
              sizeChartMap.get(cat._id) ||
              sizeChartMap.get(cat.did) ||
              sizeChartMap.get(cat.slug);

            const isConfigured = Boolean(chart && chart.columns?.length > 0);
            const rowCount = chart?.rows?.length || 0;
            const colCount = chart?.columns?.length || 0;

            return (
              <Card
                key={cat.did || cat.id || cat.slug}
                className={`border rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden bg-card ${
                  isConfigured ? 'border-border/90' : 'border-dashed border-border/80 bg-muted/10'
                }`}
              >
                <CardHeader className="pb-3.5 border-b bg-muted/15">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg font-bold text-foreground truncate">
                          {cat.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted/80 border border-border/60 px-2 py-0.5 rounded-md">
                          /{cat.slug}
                        </span>
                        {isConfigured ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Configured ({rowCount} Sizes)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[11px] font-medium border-border">
                            Not Configured
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isConfigured && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                        title="Delete Size Chart"
                        onClick={() =>
                          setDeleteTarget({
                            id: chart._id || chart.id,
                            name: cat.name,
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-4 pb-2 flex-1 flex flex-col justify-between space-y-4">
                  {isConfigured ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-primary" />
                          {chart.attributeName || 'Size'} Attribute
                        </span>
                        <span className="font-mono uppercase text-[10px] bg-muted px-2 py-0.5 rounded border">
                          Unit: {chart.unit || 'inches'}
                        </span>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Measurement Columns ({colCount})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-md">
                            {chart.attributeName || 'Size'} (Base)
                          </span>
                          {chart.columns?.map((col, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium bg-muted/60 text-foreground border border-border/70 px-2 py-0.5 rounded-md"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Sizes Sample
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {chart.rows?.slice(0, 5).map((row, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="font-mono text-xs px-2 py-0.5 bg-background border-border"
                            >
                              {row.size}
                            </Badge>
                          ))}
                          {chart.rows?.length > 5 && (
                            <span className="text-xs text-muted-foreground self-center">
                              +{chart.rows.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 px-4 text-center rounded-xl border border-dashed border-border/70 bg-muted/20 flex flex-col items-center justify-center space-y-1.5">
                      <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
                      <p className="text-xs font-semibold text-foreground">
                        No size guide configured
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Click below to set up attributes and measurement metrics.
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-2 pb-4 border-t bg-muted/5">
                  <Button
                    onClick={() => handleOpenConfigModal(cat)}
                    variant={isConfigured ? 'outline' : 'default'}
                    className={`w-full font-semibold text-xs cursor-pointer gap-2 h-9 rounded-xl ${
                      isConfigured
                        ? 'border-border hover:bg-primary/10 hover:text-primary hover:border-primary/40'
                        : 'shadow-xs'
                    }`}
                  >
                    {isConfigured ? (
                      <>
                        <Edit2 className="h-3.5 w-3.5" /> Edit Size Chart
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Configure Size Chart
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-[60vw] max-w-[60vw] sm:max-w-[60vw] max-h-[90vh] overflow-y-auto p-6 rounded-2xl"
        >
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-xl font-bold flex items-center gap-2 truncate">
                  <Ruler className="h-5 w-5 text-primary shrink-0" />
                  {isEditingExisting ? 'Edit Size Chart' : 'Create Size Chart'} —{' '}
                  <span className="text-primary truncate">{activeCategory?.name}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Configure measurement dimensions for parent category{' '}
                  <span className="font-mono text-foreground font-semibold">
                    /{activeCategory?.slug}
                  </span>
                </DialogDescription>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span
                    onClick={() => setCurrentStep(1)}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                      currentStep === 1
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    1. Attribute & Sizes
                  </span>
                  <span
                    onClick={handleProceedToColumns}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                      currentStep === 2
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    2. Columns
                  </span>
                  <span
                    onClick={handleProceedToMatrix}
                    className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                      currentStep === 3
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    3. Matrix Data
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setModalOpen(false)}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer shrink-0 border border-border/60"
                  title="Close modal"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {currentStep === 1 && (
            <div className="space-y-6 pt-3">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-primary" />
                  Step 1: Select Source Attribute & Category Sizes
                </h4>
                <p className="text-xs text-muted-foreground">
                  Select which attribute defines the sizes and choose the specific size options for &ldquo;{activeCategory?.name}&rdquo;.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Choose Attribute Group *
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      {attributes.length} {attributes.length === 1 ? 'group' : 'groups'} available
                    </span>
                  </div>
                  {attributes.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 space-y-3">
                      <div className="flex items-center gap-2 text-amber-500">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-bold">No attribute groups found in the store</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Attributes (e.g. Size, Color) are needed to define variations for size charts.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSeedingAttr}
                          onClick={handleSeedDefaultAttributes}
                          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{isSeedingAttr ? 'Loading attributes...' : 'Load Standard "Size" Attribute'}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Select
                      value={selectedAttributeId}
                      onValueChange={(val) => handleAttributeChange(val)}
                    >
                      <SelectTrigger className="w-full h-11 bg-card">
                        <SelectValue placeholder="Select an attribute (e.g. Size)">
                          {activeAttribute?.name || 'Select an attribute (e.g. Size)'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {attributes.map((attr) => (
                          <SelectItem key={attr._id || attr.id} value={attr._id || attr.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{attr.name}</span>
                              <span className="text-xs text-muted-foreground font-mono">
                                ({attr.values?.length || 0} values)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {activeAttribute && (
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          Available Sizes in &ldquo;{activeAttribute.name}&rdquo;:
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Click to select or unselect sizes for this category
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-background border text-[11px]">
                          <span className="font-bold text-primary">{selectedSizes.length}</span> / {activeAttribute.values?.length || 0} selected
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSelectAllSizes(
                              (activeAttribute.values || []).map((v) =>
                                typeof v === 'string' ? v : v.name || v.slug
                              )
                            )
                          }
                          className="h-7 text-xs px-2.5 font-semibold cursor-pointer"
                        >
                          Select All
                        </Button>
                        {selectedSizes.length > 0 && (
                          <Button
                            type="button"
                            variant="cancel"
                            size="sm"
                            onClick={handleClearAllSizes}
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {activeAttribute.values?.map((val, idx) => {
                        const sizeLabel = typeof val === 'string' ? val : val.name || val.slug;
                        const isSelected = selectedSizes.includes(sizeLabel);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleSize(sizeLabel)}
                            className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border select-none ${
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold'
                                : 'bg-card text-muted-foreground hover:text-foreground border-border/80 hover:border-primary/40 hover:bg-muted/40 shadow-2xs'
                            }`}
                          >
                            <div
                              className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-primary-foreground text-primary border-primary-foreground'
                                  : 'border-muted-foreground/40 group-hover:border-primary/60 bg-muted/20'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <span className="font-mono">{sizeLabel}</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedSizes.length === 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Please select at least one size variation above for this category.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="cancel"
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleProceedToColumns}
                  disabled={!selectedAttributeId || selectedSizes.length === 0}
                  className="cursor-pointer text-xs font-semibold gap-2 shadow-xs"
                >
                  Next: Define Columns <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 pt-3">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <TableIcon className="h-4 w-4 text-primary" />
                  Step 2: Define Measurement Columns
                </h4>
                <p className="text-xs text-muted-foreground">
                  Specify the dimension metrics you wish to measure for each size (e.g. Chest, Length, Sleeve).
                </p>
              </div>

              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <label className="text-xs font-bold text-foreground block">
                  Add Measurement Column
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type column name (e.g. Chest, Length, Sleeve, Waist)..."
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddColumn();
                      }
                    }}
                    className="h-10 bg-card flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddColumn()}
                    disabled={!newColumnName.trim()}
                    className="cursor-pointer gap-1.5 font-semibold text-xs h-10 px-4 shrink-0"
                  >
                    <Plus className="h-4 w-4" /> Add Column
                  </Button>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Quick Suggestions:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_COLUMN_SUGGESTIONS.map((preset) => {
                      const isAdded = columns.some(
                        (c) => c.toLowerCase() === preset.toLowerCase()
                      );
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={isAdded}
                          onClick={() => handleAddColumn(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-muted/50 text-muted-foreground/50 border-border/40 cursor-not-allowed'
                              : 'bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 text-foreground border-border/80 shadow-2xs'
                          }`}
                        >
                          + {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Active Columns for this Chart ({columns.length + 1})
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Base column &ldquo;{activeAttribute?.name || 'Size'}&rdquo; is locked as row identifier
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 p-3 rounded-xl border bg-card min-h-[50px] items-center">
                  <span className="text-xs font-bold bg-primary/15 text-primary border border-primary/30 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {activeAttribute?.name || 'Size'} (Base)
                  </span>

                  {columns.map((col) => (
                    <span
                      key={col}
                      className="text-xs font-semibold bg-muted text-foreground border border-border/80 px-3 py-1 rounded-lg flex items-center gap-2 group hover:border-destructive/40 transition-colors"
                    >
                      <span>{col}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColumn(col)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer hover:scale-110 transition-all"
                        title={`Remove ${col}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Measurement Unit
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Units displayed in chart header and product page modal
                  </span>
                </div>
                <Select
                  value={measurementUnit}
                  onValueChange={(val) => setMeasurementUnit(val)}
                >
                  <SelectTrigger className="w-36 h-9 bg-card">
                    <SelectValue>
                      {measurementUnit === 'inches' ? 'Inches (in)' : measurementUnit === 'cm' ? 'Centimeters (cm)' : 'Millimeters (mm)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inches">Inches (in)</SelectItem>
                    <SelectItem value="cm">Centimeters (cm)</SelectItem>
                    <SelectItem value="mm">Millimeters (mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="cursor-pointer text-xs gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Attribute
                </Button>
                <Button
                  type="button"
                  onClick={handleProceedToMatrix}
                  disabled={columns.length === 0}
                  className="cursor-pointer text-xs font-semibold gap-2 shadow-xs"
                >
                  Proceed to Data Matrix <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 pt-3">
              <div className="flex items-center justify-between flex-wrap gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <TableIcon className="h-4 w-4 text-primary" />
                    Step 3: Fill Measurement Matrix
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Enter measurement values for each variation size ({measurementUnit}).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs h-8.5 px-3 font-semibold gap-1.5 rounded-lg cursor-pointer border-border"
                  >
                    <Sliders className="h-3.5 w-3.5 text-primary" /> Edit Sizes ({selectedSizes.length})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs h-8.5 px-3.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5 shadow-sm rounded-lg cursor-pointer transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add / Edit Columns
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border/90 overflow-x-auto bg-card shadow-xs">
                <table className="w-full text-xs text-left border-collapse table-fixed min-w-[500px]">
                  <thead>
                    <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                      <th className="p-3 font-bold text-foreground uppercase tracking-wider w-28 border-r text-center">
                        {activeAttribute?.name || 'Size'}
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col}
                          className="p-3 font-semibold text-foreground uppercase tracking-wider border-r last:border-r-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">
                              {col} ({measurementUnit})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveColumn(col)}
                              className="text-muted-foreground hover:text-destructive cursor-pointer p-0.5 shrink-0"
                              title={`Remove ${col}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixRows.map((row, rowIdx) => (
                      <tr
                        key={row.size}
                        className={`border-b last:border-0 transition-colors ${
                          rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                        } hover:bg-muted/30`}
                      >
                        <td className="p-3 font-bold text-foreground font-mono border-r bg-muted/20 text-center w-28">
                          <span className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/25 font-bold text-xs">
                            {row.size}
                          </span>
                        </td>
                        {columns.map((col) => (
                          <td key={col} className="p-2 border-r last:border-r-0">
                            <Input
                              type="text"
                              value={row.values?.[col] || ''}
                              onChange={(e) =>
                                handleCellChange(row.size, col, e.target.value)
                              }
                              className="h-9 w-full text-xs font-mono bg-background focus:ring-1 text-center"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="cursor-pointer text-xs gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Columns
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="cancel"
                    onClick={() => setModalOpen(false)}
                    disabled={isSaving}
                    className="cursor-pointer text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveSizeChart}
                    disabled={isSaving}
                    className="cursor-pointer text-xs font-semibold gap-2 shadow-sm"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving Size Chart...' : 'Save Size Chart'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category Size Chart"
        description={`Are you sure you want to delete the size chart for "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SizeChartsPage;
