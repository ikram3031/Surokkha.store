import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutTemplate,
  FileText,
  Mail,
  Sparkles,
  Printer,
  Send,
  RotateCcw,
  Save,
  Image as ImageIcon,
  Check,
  ZoomIn,
  ZoomOut,
  Code,
  Sliders,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { clientConfig } from '@/clientConfig';
import { printDocument } from '@/lib/print-engine/printEngine';
import { StudioFloatingViewSwitcher } from '@/lib/print-engine/StudioFloatingViewSwitcher';
import { MediaPickerModal } from '@/components/dashboard/media-picker-modal';

import { ColorPickerInput } from './components/ColorPickerInput';
import { DynamicTokenChips } from './components/DynamicTokenChips';
import { InvoicePaperPreview } from './components/InvoicePaperPreview';
import { EmailPreviewCard } from './components/EmailPreviewCard';
import { SendTestEmailModal } from './components/SendTestEmailModal';

// Built-in presets matching backend defaults
const TEMPLATE_PRESETS = {
  modern: {
    id: 'modern',
    name: 'Modern Clean',
    description: 'Contemporary teal & slate palette with clean typography',
    branding: {
      primaryColor: '#0f172a',
      secondaryColor: '#0d9488',
      darkColor: '#0f172a',
      lightBgColor: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '8px',
    },
    header: {
      logoHeight: 50,
      logoPlacement: 'left',
      showHeaderAccent: true,
      documentTitle: 'INVOICE',
      documentSubtitle: 'Sales & Order Receipt',
      showWatermark: false,
      watermarkText: 'PAID',
    },
    table: {
      showSku: true,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: true,
      currencySymbol: '৳',
    },
    footer: {
      showNotes: true,
      showTerms: true,
      showSignatures: true,
      showQrCode: true,
    },
    email: {
      bannerBg: '#0f172a',
      buttonColor: '#0d9488',
      buttonText: 'View Order Online',
    },
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist Mono',
    description: 'Clean monochrome lines, zero clutter, sharp angles',
    branding: {
      primaryColor: '#18181b',
      secondaryColor: '#52525b',
      darkColor: '#18181b',
      lightBgColor: '#fafafa',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '0px',
    },
    header: {
      logoHeight: 45,
      logoPlacement: 'center',
      showHeaderAccent: false,
      documentTitle: 'INVOICE',
      documentSubtitle: '',
      showWatermark: false,
      watermarkText: 'PAID',
    },
    table: {
      showSku: false,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: false,
      currencySymbol: '৳',
    },
    footer: {
      showNotes: true,
      showTerms: true,
      showSignatures: false,
      showQrCode: false,
    },
    email: {
      bannerBg: '#18181b',
      buttonColor: '#18181b',
      buttonText: 'Track Order',
    },
  },
  classic: {
    id: 'classic',
    name: 'Classic Corporate',
    description: 'Navy blue accents, elegant serif headers, formal layout',
    branding: {
      primaryColor: '#1e3a8a',
      secondaryColor: '#b45309',
      darkColor: '#1e293b',
      lightBgColor: '#f8fafc',
      fontFamily: 'Georgia, serif',
      borderRadius: '4px',
    },
    header: {
      logoHeight: 52,
      logoPlacement: 'left',
      showHeaderAccent: true,
      documentTitle: 'TAX INVOICE',
      documentSubtitle: 'Official Commercial Receipt',
      showWatermark: true,
      watermarkText: 'ORIGINAL',
    },
    table: {
      showSku: true,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: true,
      currencySymbol: '৳',
    },
    footer: {
      showNotes: true,
      showTerms: true,
      showSignatures: true,
      showQrCode: true,
    },
    email: {
      bannerBg: '#1e3a8a',
      buttonColor: '#1e3a8a',
      buttonText: 'View Order Details',
    },
  },
  bold: {
    id: 'bold',
    name: 'Bold Vibrant',
    description: 'Indigo & vibrant rose accents with rounded modern aesthetics',
    branding: {
      primaryColor: '#4338ca',
      secondaryColor: '#db2777',
      darkColor: '#0f172a',
      lightBgColor: '#fdf4ff',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '12px',
    },
    header: {
      logoHeight: 55,
      logoPlacement: 'right',
      showHeaderAccent: true,
      documentTitle: 'ORDER INVOICE',
      documentSubtitle: 'Official Customer Receipt',
      showWatermark: false,
      watermarkText: 'PAID',
    },
    table: {
      showSku: true,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: true,
      currencySymbol: '৳',
    },
    footer: {
      showNotes: true,
      showTerms: true,
      showSignatures: true,
      showQrCode: true,
    },
    email: {
      bannerBg: '#4338ca',
      buttonColor: '#db2777',
      buttonText: 'Check Order Status',
    },
  },
};

// Realistic mock orders for live preview
const SAMPLE_ORDERS = {
  standard: {
    orderId: '10284',
    formattedOrderId: '#10284',
    orderStatus: 'Processing',
    paymentStatus: 'PAID',
    paymentMethod: 'bKash Online Payment',
    createdAt: new Date().toISOString(),
    customer: {
      name: 'Tanvir Ahmed',
      email: 'tanvir.ahmed@example.com',
      phone: '+880 1712-345678',
      address: 'House 42, Road 11, Block D, Banani',
      city: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1213',
    },
    items: [
      {
        name: 'Premium Oxford Cotton Shirt',
        sku: 'OXF-BLU-L',
        variant: 'Navy Blue / L',
        quantity: 2,
        price: 1850,
        total: 3700,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&auto=format&fit=crop',
      },
      {
        name: 'Genuine Leather Minimalist Wallet',
        sku: 'WLT-BRN-01',
        variant: 'Vintage Brown',
        quantity: 1,
        price: 1250,
        total: 1250,
        image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=120&auto=format&fit=crop',
      },
    ],
    subtotal: 4950,
    discount: 250,
    deliveryCharge: 80,
    tax: 0,
    totalAmount: 4780,
    paidAmount: 4780,
    dueAmount: 0,
  },
  multiItem: {
    orderId: '10285',
    formattedOrderId: '#10285',
    orderStatus: 'Delivered',
    paymentStatus: 'Cash On Delivery',
    paymentMethod: 'COD (Cash On Delivery)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    customer: {
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@example.com',
      phone: '+880 1819-876543',
      address: 'Flat 5B, Green Heritage, Nasirabad',
      city: 'Chittagong',
      district: 'Chittagong',
      postalCode: '4000',
    },
    items: [
      {
        name: 'Silk Floral Printed Scarf',
        sku: 'SCF-SLK-04',
        variant: 'Emerald Garden',
        quantity: 1,
        price: 950,
        total: 950,
      },
      {
        name: 'Organic Bamboo Loungewear Set',
        sku: 'LNG-BAM-M',
        variant: 'Dusty Rose / M',
        quantity: 2,
        price: 2400,
        total: 4800,
      },
      {
        name: 'Handcrafted Ceramic Coffee Mug',
        sku: 'MUG-CRM-02',
        variant: 'Speckled White',
        quantity: 2,
        price: 450,
        total: 900,
      },
    ],
    subtotal: 6650,
    discount: 500,
    deliveryCharge: 120,
    tax: 0,
    totalAmount: 6270,
    paidAmount: 0,
    dueAmount: 6270,
  },
};

export function TemplatesPage() {
  const queryClient = useQueryClient();
  const printableRef = useRef(null);

  // View & UI mode
  const [viewMode, setViewMode] = useState('split'); // 'edit' | 'split' | 'preview'
  const [previewTab, setPreviewTab] = useState('invoice'); // 'invoice' | 'email'
  const [sampleKey, setSampleKey] = useState('standard');
  const [zoomScale, setZoomScale] = useState(0.92);

  // Modals
  const [mediaPickerTarget, setMediaPickerTarget] = useState(null); // 'logo' | 'sig1' | 'sig2'
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);

  // Full template config state
  const [config, setConfig] = useState(TEMPLATE_PRESETS.modern);

  // Fetch settings from server
  const { data: serverConfig, isLoading, isFetching } = useQuery({
    queryKey: ['template-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/settings/templates');
      return res.data?.data || null;
    },
  });

  useEffect(() => {
    if (serverConfig) {
      setConfig({
        preset: serverConfig.preset || 'modern',
        isActive: serverConfig.isActive !== false,
        branding: {
          primaryColor: serverConfig.branding?.primaryColor || '#0f172a',
          secondaryColor: serverConfig.branding?.secondaryColor || '#0d9488',
          darkColor: serverConfig.branding?.darkColor || '#0f172a',
          lightBgColor: serverConfig.branding?.lightBgColor || '#f8fafc',
          fontFamily: serverConfig.branding?.fontFamily || 'Inter, sans-serif',
          borderRadius: serverConfig.branding?.borderRadius || '8px',
        },
        header: {
          logoUrl: serverConfig.header?.logoUrl || '',
          logoHeight: serverConfig.header?.logoHeight || 50,
          logoPlacement: serverConfig.header?.logoPlacement || 'left',
          showHeaderAccent: serverConfig.header?.showHeaderAccent !== false,
          documentTitle: serverConfig.header?.documentTitle || 'INVOICE',
          documentSubtitle: serverConfig.header?.documentSubtitle || 'Sales & Order Receipt',
          showWatermark: serverConfig.header?.showWatermark === true,
          watermarkText: serverConfig.header?.watermarkText || 'PAID',
        },
        table: {
          showSku: serverConfig.table?.showSku !== false,
          showVariantBadge: serverConfig.table?.showVariantBadge !== false,
          showUnitPrice: serverConfig.table?.showUnitPrice !== false,
          zebraStripes: serverConfig.table?.zebraStripes === true,
          currencySymbol: serverConfig.table?.currencySymbol || '৳',
          itemHeader: serverConfig.table?.itemHeader || 'Item Description',
          skuHeader: serverConfig.table?.skuHeader || 'SKU',
          priceHeader: serverConfig.table?.priceHeader || 'Unit Price',
          qtyHeader: serverConfig.table?.qtyHeader || 'Qty',
          totalHeader: serverConfig.table?.totalHeader || 'Total',
        },
        footer: {
          showNotes: serverConfig.footer?.showNotes !== false,
          notes: serverConfig.footer?.notes || 'Thank you for shopping with {{brandName}}! For any inquiries, please contact {{supportEmail}}.',
          showTerms: serverConfig.footer?.showTerms !== false,
          termsAndConditions: serverConfig.footer?.termsAndConditions || '1. Goods once sold can be exchanged within 7 days with original invoice tag.\n2. Warranty claims require this printed invoice receipt.\n3. Delivery charges are non-refundable on returned packages.',
          showSignatures: serverConfig.footer?.showSignatures !== false,
          signature1Name: serverConfig.footer?.signature1Name || 'Customer Signature',
          signature1Title: serverConfig.footer?.signature1Title || 'Received by',
          signature1Image: serverConfig.footer?.signature1Image || '',
          signature2Name: serverConfig.footer?.signature2Name || 'Authorized Signatory',
          signature2Title: serverConfig.footer?.signature2Title || 'For Store Management',
          signature2Image: serverConfig.footer?.signature2Image || '',
          showQrCode: serverConfig.footer?.showQrCode === true,
          bottomNotice: serverConfig.footer?.bottomNotice || '{{brandName}} • All Rights Reserved • System Generated Invoice',
        },
        email: {
          subject: serverConfig.email?.subject || 'Invoice for Order {{orderId}} - {{brandName}}',
          bannerBg: serverConfig.email?.bannerBg || '#0f172a',
          greeting: serverConfig.email?.greeting || 'Dear {{customerName}}, thank you for shopping with {{brandName}}!',
          orderStatusMessage: serverConfig.email?.orderStatusMessage || 'Your order {{orderId}} has been successfully placed and is now being processed.',
          buttonText: serverConfig.email?.buttonText || 'View Order Online',
          buttonColor: serverConfig.email?.buttonColor || '#0d9488',
          footerText: serverConfig.email?.footerText || 'If you have questions about your order, simply reply to this email or reach us at {{supportEmail}}.',
        },
        customCss: serverConfig.customCss || '',
      });
    }
  }, [serverConfig]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.put('/api/v1/settings/templates', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Template settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['template-settings'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save template settings');
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/v1/settings/templates/reset');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Templates restored to default presets!');
      queryClient.invalidateQueries({ queryKey: ['template-settings'] });
      if (data.data) {
        setConfig(data.data);
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset templates');
    },
  });

  // State update helpers
  const updateNested = (section, key, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: value,
      },
    }));
  };

  const applyPreset = (presetKey) => {
    const preset = TEMPLATE_PRESETS[presetKey];
    if (!preset) return;

    setConfig((prev) => ({
      ...prev,
      preset: presetKey,
      branding: {
        ...prev.branding,
        ...preset.branding,
      },
      header: {
        ...prev.header,
        ...preset.header,
        logoUrl: prev.header?.logoUrl || '', // Retain current logo
      },
      table: {
        ...prev.table,
        ...preset.table,
      },
      footer: {
        ...prev.footer,
        ...preset.footer,
      },
      email: {
        ...prev.email,
        ...preset.email,
      },
    }));
    toast.success(`Applied "${preset.name}" preset!`);
  };

  const handleMediaSelect = (url) => {
    if (mediaPickerTarget === 'logo') {
      updateNested('header', 'logoUrl', url);
      toast.success('Logo updated successfully!');
    } else if (mediaPickerTarget === 'sig1') {
      updateNested('footer', 'signature1Image', url);
      toast.success('Signature 1 image updated!');
    } else if (mediaPickerTarget === 'sig2') {
      updateNested('footer', 'signature2Image', url);
      toast.success('Signature 2 image updated!');
    }
    setMediaPickerTarget(null);
  };

  const handlePrint = () => {
    const sample = SAMPLE_ORDERS[sampleKey] || SAMPLE_ORDERS.standard;
    printDocument({
      targetRef: printableRef,
      title: `Invoice_${sample.orderId}_${sample.customer.name.replace(/\s+/g, '_')}`,
    });
  };

  const currentSample = SAMPLE_ORDERS[sampleKey] || SAMPLE_ORDERS.standard;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Toolbar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Invoice & Email Templates Studio
                </h1>
                <Badge
                  variant={config.isActive ? 'default' : 'secondary'}
                  className={config.isActive ? 'bg-emerald-600 font-bold' : ''}
                >
                  {config.isActive ? 'Active Engine' : 'Legacy Fallback'}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Customize printable A4 vector invoices, packing slips, and transactional customer emails with real-time live preview.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending || saveMutation.isPending}
            className="text-xs h-9 cursor-pointer gap-1.5 hover:text-destructive"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTestEmailModalOpen(true)}
            className="text-xs h-9 cursor-pointer gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Test Email</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-9 cursor-pointer gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print A4</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => saveMutation.mutate(config)}
            disabled={saveMutation.isPending}
            className="text-xs h-9 font-semibold cursor-pointer gap-1.5 bg-primary shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div
        className={`grid gap-6 transition-all duration-300 ${
          viewMode === 'edit'
            ? 'grid-cols-1 max-w-4xl mx-auto'
            : viewMode === 'preview'
            ? 'grid-cols-1'
            : 'grid-cols-1 lg:grid-cols-12'
        }`}
      >
        {/* Left Column: Form Controls */}
        {viewMode !== 'preview' && (
          <div className={viewMode === 'split' ? 'lg:col-span-5 space-y-5' : 'space-y-5'}>
            {/* Quick Presets Selection Bar */}
            <Card className="shadow-xs border-border/80 overflow-hidden">
              <CardHeader className="p-4 pb-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">
                      Designer Presets
                    </CardTitle>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">1-Click Apply</span>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 grid grid-cols-2 gap-2">
                {Object.values(TEMPLATE_PRESETS).map((preset) => {
                  const isSelected = config.preset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                          : 'border-border/70 hover:bg-muted/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-foreground">{preset.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: preset.branding.primaryColor }}
                        />
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: preset.branding.secondaryColor }}
                        />
                        <span className="text-[10px] text-muted-foreground font-mono ml-1 truncate">
                          {preset.branding.fontFamily.split(',')[0]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Customization Tabs */}
            <Card className="shadow-xs border-border/80">
              <Tabs defaultValue="branding" className="w-full">
                <div className="p-2 border-b bg-muted/20">
                  <TabsList className="grid grid-cols-5 w-full bg-muted/60 h-auto p-1">
                    <TabsTrigger value="branding" className="text-[11px] font-semibold py-1.5">
                      Theme
                    </TabsTrigger>
                    <TabsTrigger value="header" className="text-[11px] font-semibold py-1.5">
                      Header
                    </TabsTrigger>
                    <TabsTrigger value="table" className="text-[11px] font-semibold py-1.5">
                      Items
                    </TabsTrigger>
                    <TabsTrigger value="footer" className="text-[11px] font-semibold py-1.5">
                      Footer
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-[11px] font-semibold py-1.5">
                      Email
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab 1: Theme & Colors */}
                <TabsContent value="branding" className="p-4 sm:p-5 space-y-4 m-0">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-foreground">Enable Dynamic Templates</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Use this customized studio layout for invoices & transactional customer emails.
                      </p>
                    </div>
                    <Switch
                      checked={config.isActive}
                      onCheckedChange={(val) => setConfig((prev) => ({ ...prev, isActive: val }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <ColorPickerInput
                      label="Primary Brand Color"
                      value={config.branding?.primaryColor}
                      onChange={(val) => updateNested('branding', 'primaryColor', val)}
                      description="Used for headers, invoice titles, and total labels."
                    />

                    <ColorPickerInput
                      label="Secondary / Accent Color"
                      value={config.branding?.secondaryColor}
                      onChange={(val) => updateNested('branding', 'secondaryColor', val)}
                      description="Used for badges, highlights, and CTA buttons."
                    />

                    <ColorPickerInput
                      label="Main Text Color"
                      value={config.branding?.textColor || config.branding?.darkColor || '#0f172a'}
                      onChange={(val) => {
                        updateNested('branding', 'textColor', val);
                        updateNested('branding', 'darkColor', val);
                      }}
                      description="Default color for invoice body text and totals."
                    />

                    <ColorPickerInput
                      label="Muted / Subtitle Color"
                      value={config.branding?.mutedTextColor || '#64748b'}
                      onChange={(val) => updateNested('branding', 'mutedTextColor', val)}
                      description="Used for notes, labels, and secondary lines."
                    />

                    <ColorPickerInput
                      label="Light Surface Color"
                      value={config.branding?.lightBgColor || config.branding?.backgroundColor || '#f8fafc'}
                      onChange={(val) => {
                        updateNested('branding', 'lightBgColor', val);
                        updateNested('branding', 'backgroundColor', val);
                      }}
                      description="Background for customer address & summary cards."
                    />

                    <ColorPickerInput
                      label="Border / Divider Color"
                      value={config.branding?.borderColor || '#e2e8f0'}
                      onChange={(val) => updateNested('branding', 'borderColor', val)}
                      description="Used for table lines, card borders, and dividers."
                    />

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-semibold">Typography Font Family</Label>
                      <select
                        value={config.branding?.fontFamily || 'Inter, sans-serif'}
                        onChange={(e) => updateNested('branding', 'fontFamily', e.target.value)}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                      >
                        <option value="Inter, sans-serif">Inter (Modern Clean Sans)</option>
                        <option value="Roboto, sans-serif">Roboto (Clean Neutral)</option>
                        <option value="Georgia, serif">Georgia (Classic Serif)</option>
                        <option value="'Courier New', monospace">Courier New (Monospace)</option>
                        <option value="system-ui, -apple-system, sans-serif">System Default</option>
                      </select>
                    </div>

                    {/* Spacing & Padding Controls */}
                    <div className="sm:col-span-2 space-y-4 pt-2 border-t border-border/70">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                        <Sliders className="h-3.5 w-3.5 text-primary" />
                        <span>Layout Margins, Padding & Dimensions</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">A4 Page Padding</Label>
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {config.branding?.pagePadding !== undefined ? config.branding.pagePadding : 32}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={16}
                            max={56}
                            step={2}
                            value={config.branding?.pagePadding !== undefined ? config.branding.pagePadding : 32}
                            onChange={(e) => updateNested('branding', 'pagePadding', Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Header Bottom Spacing</Label>
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {config.branding?.headerMarginBottom !== undefined ? config.branding.headerMarginBottom : 20}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={10}
                            max={48}
                            step={2}
                            value={config.branding?.headerMarginBottom !== undefined ? config.branding.headerMarginBottom : 20}
                            onChange={(e) => updateNested('branding', 'headerMarginBottom', Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Section & Card Spacing</Label>
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {config.branding?.sectionSpacing !== undefined ? config.branding.sectionSpacing : 16}px
                            </span>
                          </div>
                          <input
                            type="range"
                            min={8}
                            max={36}
                            step={2}
                            value={config.branding?.sectionSpacing !== undefined ? config.branding.sectionSpacing : 16}
                            onChange={(e) => updateNested('branding', 'sectionSpacing', Number(e.target.value))}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold">Box Corner Radius</Label>
                            <span className="text-xs font-mono font-bold text-muted-foreground">
                              {config.branding?.borderRadius || '8px'}
                            </span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                            {['0px', '4px', '8px', '12px', '16px'].map((rad) => (
                              <button
                                key={rad}
                                type="button"
                                onClick={() => updateNested('branding', 'borderRadius', rad)}
                                className={`py-1 text-[11px] font-bold rounded border transition-all cursor-pointer ${
                                  config.branding?.borderRadius === rad
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background hover:bg-muted/60 text-muted-foreground'
                                }`}
                              >
                                {rad === '0px' ? '0' : rad}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 2: Header & Logo */}
                <TabsContent value="header" className="p-4 sm:p-5 space-y-4 m-0">
                  {/* Logo Picker */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-muted/30 border border-border/70">
                    <Label className="text-xs font-bold">Store Logo</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-28 rounded-lg border border-border bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                        {config.header?.logoUrl || clientConfig.logo ? (
                          <img
                            src={config.header?.logoUrl || clientConfig.logo}
                            alt="Logo"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono">No Logo</span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMediaPickerTarget('logo')}
                          className="text-xs h-8 cursor-pointer gap-1.5"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Choose from Media Library</span>
                        </Button>
                        {config.header?.logoUrl && (
                          <button
                            type="button"
                            onClick={() => updateNested('header', 'logoUrl', '')}
                            className="text-[11px] text-muted-foreground hover:text-destructive text-left cursor-pointer"
                          >
                            Clear custom logo (use tenant default)
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Logo Height (px)</Label>
                        <Input
                          type="number"
                          min={25}
                          max={100}
                          value={config.header?.logoHeight || 50}
                          onChange={(e) => updateNested('header', 'logoHeight', Number(e.target.value))}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Alignment</Label>
                        <select
                          value={config.header?.logoPlacement || 'left'}
                          onChange={(e) => updateNested('header', 'logoPlacement', e.target.value)}
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="left">Left Aligned</option>
                          <option value="center">Center Aligned</option>
                          <option value="right">Right Aligned</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Document Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Document Title</Label>
                      <Input
                        value={config.header?.documentTitle || 'INVOICE'}
                        onChange={(e) => updateNested('header', 'documentTitle', e.target.value)}
                        placeholder="INVOICE"
                        className="h-9 text-xs uppercase font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Document Tagline / Subtitle</Label>
                      <Input
                        value={config.header?.documentSubtitle || ''}
                        onChange={(e) => updateNested('header', 'documentSubtitle', e.target.value)}
                        placeholder="Sales & Order Receipt"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Header Accents & Watermark */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Header Gradient Accent Bar</Label>
                        <p className="text-[11px] text-muted-foreground">Top decorative gradient bar.</p>
                      </div>
                      <Switch
                        checked={config.header?.showHeaderAccent !== false}
                        onCheckedChange={(val) => updateNested('header', 'showHeaderAccent', val)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Background Watermark</Label>
                        <p className="text-[11px] text-muted-foreground">Subtle angled watermark across the A4 page.</p>
                      </div>
                      <Switch
                        checked={config.header?.showWatermark === true}
                        onCheckedChange={(val) => updateNested('header', 'showWatermark', val)}
                      />
                    </div>

                    {config.header?.showWatermark && (
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-xs font-semibold">Watermark Text</Label>
                        <Input
                          value={config.header?.watermarkText || 'PAID'}
                          onChange={(e) => updateNested('header', 'watermarkText', e.target.value)}
                          placeholder="PAID / ORIGINAL / COPY"
                          className="h-8 text-xs font-mono uppercase font-bold"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 3: Line Items Table */}
                <TabsContent value="table" className="p-4 sm:p-5 space-y-4 m-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Currency Symbol</Label>
                      <Input
                        value={config.table?.currencySymbol || '৳'}
                        onChange={(e) => updateNested('table', 'currencySymbol', e.target.value)}
                        placeholder="৳ or $ or €"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Item Column Title</Label>
                      <Input
                        value={config.table?.itemHeader || 'Item Description'}
                        onChange={(e) => updateNested('table', 'itemHeader', e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* Toggle Switches */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Display SKU Column</Label>
                        <p className="text-[11px] text-muted-foreground">Shows product SKU code in table.</p>
                      </div>
                      <Switch
                        checked={config.table?.showSku !== false}
                        onCheckedChange={(val) => updateNested('table', 'showSku', val)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Display Variant Badges</Label>
                        <p className="text-[11px] text-muted-foreground">Shows color / size variants under item name.</p>
                      </div>
                      <Switch
                        checked={config.table?.showVariantBadge !== false}
                        onCheckedChange={(val) => updateNested('table', 'showVariantBadge', val)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Display Unit Price Column</Label>
                        <p className="text-[11px] text-muted-foreground">Shows individual item unit rate.</p>
                      </div>
                      <Switch
                        checked={config.table?.showUnitPrice !== false}
                        onCheckedChange={(val) => updateNested('table', 'showUnitPrice', val)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Zebra Striped Rows</Label>
                        <p className="text-[11px] text-muted-foreground">Alternates row background colors.</p>
                      </div>
                      <Switch
                        checked={config.table?.zebraStripes === true}
                        onCheckedChange={(val) => updateNested('table', 'zebraStripes', val)}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Footer, Terms & Signatures */}
                <TabsContent value="footer" className="p-4 sm:p-5 space-y-4 m-0">
                  {/* Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Notes & Customer Remarks</Label>
                      <Switch
                        checked={config.footer?.showNotes !== false}
                        onCheckedChange={(val) => updateNested('footer', 'showNotes', val)}
                      />
                    </div>
                    {config.footer?.showNotes !== false && (
                      <Textarea
                        value={config.footer?.notes || ''}
                        onChange={(e) => updateNested('footer', 'notes', e.target.value)}
                        placeholder="Thank you for shopping with {{brandName}}! For any inquiries, please contact {{supportEmail}}."
                        rows={2}
                        className="text-xs"
                      />
                    )}
                  </div>

                  {/* Terms */}
                  <div className="space-y-2 pt-2 border-t border-border/70">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Terms & Conditions</Label>
                      <Switch
                        checked={config.footer?.showTerms !== false}
                        onCheckedChange={(val) => updateNested('footer', 'showTerms', val)}
                      />
                    </div>
                    {config.footer?.showTerms !== false && (
                      <Textarea
                        value={config.footer?.termsAndConditions || ''}
                        onChange={(e) => updateNested('footer', 'termsAndConditions', e.target.value)}
                        placeholder="1. Goods once sold can be exchanged within 7 days..."
                        rows={3}
                        className="text-xs"
                      />
                    )}
                  </div>

                  {/* Signatures */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Dual Signature Blocks</Label>
                        <p className="text-[11px] text-muted-foreground">Shows recipient & management signature lines.</p>
                      </div>
                      <Switch
                        checked={config.footer?.showSignatures !== false}
                        onCheckedChange={(val) => updateNested('footer', 'showSignatures', val)}
                      />
                    </div>

                    {config.footer?.showSignatures !== false && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Signature 1 */}
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/70 space-y-2 text-xs">
                          <span className="font-bold block">Left Signature Block</span>
                          <Input
                            placeholder="Label (e.g. Customer Signature)"
                            value={config.footer?.signature1Name || ''}
                            onChange={(e) => updateNested('footer', 'signature1Name', e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Title (e.g. Received by)"
                            value={config.footer?.signature1Title || ''}
                            onChange={(e) => updateNested('footer', 'signature1Title', e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMediaPickerTarget('sig1')}
                            className="w-full text-xs h-7 gap-1"
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>{config.footer?.signature1Image ? 'Change Image' : 'Upload Signature'}</span>
                          </Button>
                        </div>

                        {/* Signature 2 */}
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/70 space-y-2 text-xs">
                          <span className="font-bold block">Right Signature Block</span>
                          <Input
                            placeholder="Label (e.g. Authorized Signatory)"
                            value={config.footer?.signature2Name || ''}
                            onChange={(e) => updateNested('footer', 'signature2Name', e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Input
                            placeholder="Title (e.g. For Store Management)"
                            value={config.footer?.signature2Title || ''}
                            onChange={(e) => updateNested('footer', 'signature2Title', e.target.value)}
                            className="h-8 text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setMediaPickerTarget('sig2')}
                            className="w-full text-xs h-7 gap-1"
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>{config.footer?.signature2Image ? 'Change Image' : 'Upload Signature'}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* QR Code & Bottom notice */}
                  <div className="space-y-3 pt-2 border-t border-border/70">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-semibold">Verification QR Code</Label>
                        <p className="text-[11px] text-muted-foreground">Prints scannable order receipt QR code.</p>
                      </div>
                      <Switch
                        checked={config.footer?.showQrCode === true}
                        onCheckedChange={(val) => updateNested('footer', 'showQrCode', val)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Bottom Copyright / Notice</Label>
                      <Input
                        value={config.footer?.bottomNotice || ''}
                        onChange={(e) => updateNested('footer', 'bottomNotice', e.target.value)}
                        placeholder="{{brandName}} • All Rights Reserved"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 5: Transactional Customer Email */}
                <TabsContent value="email" className="p-4 sm:p-5 space-y-4 m-0">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Email Subject Line Template</Label>
                    <Input
                      value={config.email?.subject || ''}
                      onChange={(e) => updateNested('email', 'subject', e.target.value)}
                      placeholder="Invoice for Order {{orderId}} - {{brandName}}"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ColorPickerInput
                      label="Header Banner Background"
                      value={config.email?.bannerBg}
                      onChange={(val) => updateNested('email', 'bannerBg', val)}
                    />

                    <ColorPickerInput
                      label="Call-To-Action Button Color"
                      value={config.email?.buttonColor}
                      onChange={(val) => updateNested('email', 'buttonColor', val)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Customer Greeting Text</Label>
                    <Input
                      value={config.email?.greeting || ''}
                      onChange={(e) => updateNested('email', 'greeting', e.target.value)}
                      placeholder="Dear {{customerName}}, thank you for shopping with {{brandName}}!"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Order Status Message</Label>
                    <Textarea
                      value={config.email?.orderStatusMessage || ''}
                      onChange={(e) => updateNested('email', 'orderStatusMessage', e.target.value)}
                      placeholder="Your order {{orderId}} has been placed and is being processed."
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">CTA Button Text</Label>
                      <Input
                        value={config.email?.buttonText || 'View Order Online'}
                        onChange={(e) => updateNested('email', 'buttonText', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Footer Support Text</Label>
                      <Input
                        value={config.email?.footerText || ''}
                        onChange={(e) => updateNested('email', 'footerText', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Dynamic Token Chips & Custom CSS Collapsible */}
            <DynamicTokenChips />

            <Card className="shadow-xs border-border/80">
              <CardHeader className="p-3.5 pb-2 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">
                    Advanced Custom CSS Override
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <Textarea
                  value={config.customCss || ''}
                  onChange={(e) => setConfig((prev) => ({ ...prev, customCss: e.target.value }))}
                  placeholder="/* Optional CSS rules injected into invoice HTML */
.printable-invoice-paper { ... }"
                  rows={3}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Right Column: Live Interactive Canvas */}
        {viewMode !== 'edit' && (
          <div className={viewMode === 'split' ? 'lg:col-span-7 space-y-4' : 'space-y-4'}>
            <Card className="shadow-md border-border/80 overflow-hidden sticky top-4">
              {/* Preview Canvas Control Bar */}
              <div className="p-3 bg-muted/40 border-b flex items-center justify-between flex-wrap gap-2">
                {/* Format Switcher */}
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted border border-border/60">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('invoice')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      previewTab === 'invoice'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span>A4 Printable Invoice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewTab('email')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      previewTab === 'email'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 text-purple-500" />
                    <span>Customer Email</span>
                  </button>
                </div>

                {/* Sample Order Switcher & Zoom */}
                <div className="flex items-center gap-2">
                  <select
                    value={sampleKey}
                    onChange={(e) => setSampleKey(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs font-semibold"
                  >
                    <option value="standard">Sample Order #10284 (2 Items, Paid)</option>
                    <option value="multiItem">Sample Order #10285 (3 Items, COD)</option>
                  </select>

                  {previewTab === 'invoice' && (
                    <div className="hidden sm:flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setZoomScale((prev) => Math.max(0.65, prev - 0.08))}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-mono text-muted-foreground w-10 text-center">
                        {Math.round(zoomScale * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomScale((prev) => Math.min(1.15, prev + 0.08))}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Canvas Viewport */}
              <div className="p-4 sm:p-6 bg-slate-100/90 dark:bg-zinc-950/80 max-h-[85vh] overflow-y-auto flex items-center justify-center">
                {previewTab === 'invoice' ? (
                  <div
                    style={{
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s ease',
                      width: '100%',
                      maxWidth: '850px',
                    }}
                  >
                    <InvoicePaperPreview
                      config={config}
                      order={currentSample}
                      tenant={clientConfig}
                      paperRef={printableRef}
                    />
                  </div>
                ) : (
                  <EmailPreviewCard
                    config={config}
                    order={currentSample}
                    tenant={clientConfig}
                  />
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        open={Boolean(mediaPickerTarget)}
        onOpenChange={(open) => !open && setMediaPickerTarget(null)}
        onSelect={handleMediaSelect}
        multiple={false}
        title={
          mediaPickerTarget === 'logo'
            ? 'Select Store Logo'
            : 'Select Official Signature Image'
        }
      />

      {/* Send Test Email Modal */}
      <SendTestEmailModal
        open={testEmailModalOpen}
        onOpenChange={setTestEmailModalOpen}
        templateConfig={config}
      />

      {/* Floating View Switcher on bottom */}
      <StudioFloatingViewSwitcher
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </div>
  );
}

export default TemplatesPage;