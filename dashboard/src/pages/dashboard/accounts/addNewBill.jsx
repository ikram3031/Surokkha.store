import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Building,
  CreditCard,
  Calendar,
  FileText,
  User,
  DollarSign,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useBillings } from '@/hooks/use-billings';
import { useBillTypes } from '@/hooks/use-bill-types';
import { usePaymentTypes } from '@/hooks/use-payment-types';
import { useInvestors } from '@/hooks/use-investors';
import { toast } from 'sonner';

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const AddNewBillPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { allBillings = [], createBilling, updateBilling, isCreating, isUpdating } = useBillings();
  const { allBillTypes = [], addBillType } = useBillTypes();
  const { allPaymentTypes = [] } = usePaymentTypes();
  const { allInvestors = [] } = useInvestors();

  const defaultBillingMethods = ['Bank Transfer', 'Cash', 'Card', 'bKash', 'Nagad', 'Cheque', 'Other'];
  const availableBillingMethods = React.useMemo(() => {
    const customNames = allPaymentTypes
      .filter((t) => t.status === 'Active')
      .map((t) => t.name.trim())
      .filter(Boolean);
    const combined = Array.from(new Set([...defaultBillingMethods, ...customNames]));
    return combined;
  }, [allPaymentTypes]);

  const [formData, setFormData] = useState({
    title: '',
    billType: '',
    investorId: '',
    vendor: '',
    billingPhone: '',
    billingEmail: '',
    totalAmount: '',
    paidAmount: '',
    billingDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    billingMethod: 'Bank Transfer',
    status: 'Pending',
    notes: '',
  });

  const [newTypeModalOpen, setNewTypeModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDesc, setNewTypeDesc] = useState('');

  // Set default bill type when bill types load
  useEffect(() => {
    if (!formData.billType && allBillTypes.length > 0 && !editId) {
      setFormData((prev) => ({
        ...prev,
        billType: allBillTypes[0].name,
      }));
    }
  }, [allBillTypes, editId, formData.billType]);

  // Pre-fill form if editing
  useEffect(() => {
    if (editId && allBillings.length > 0) {
      const existing = allBillings.find((b) => b.id === editId || b.did === editId);
      if (existing) {
        setFormData({
          title: existing.title || '',
          billType: existing.billType || (allBillTypes[0]?.name || ''),
          investorId: existing.investorId || '',
          vendor: existing.vendor || existing.customerName || '',
          billingPhone: existing.billingPhone || '',
          billingEmail: existing.billingEmail || '',
          totalAmount: existing.totalAmount !== undefined ? String(existing.totalAmount) : '',
          paidAmount: existing.paidAmount !== undefined ? String(existing.paidAmount) : '',
          billingDate: existing.billingDate || existing.date || new Date().toISOString().slice(0, 10),
          dueDate: existing.dueDate || '',
          billingMethod: existing.billingMethod || 'Bank Transfer',
          status: existing.status || 'Pending',
          notes: existing.notes || '',
        });
      }
    }
  }, [editId, allBillings]);

  // Derived calculation
  const totalAmountNum = Number(formData.totalAmount) || 0;
  const paidAmountNum = Number(formData.paidAmount) || 0;
  const pendingAmountNum = Math.max(0, totalAmountNum - paidAmountNum);

  const handleInvestorSelect = (invId) => {
    if (invId === 'none' || !invId) {
      setFormData((prev) => ({ ...prev, investorId: '' }));
      return;
    }
    const inv = allInvestors.find((i) => i.id === invId);
    if (inv) {
      setFormData((prev) => ({
        ...prev,
        investorId: inv.id,
        vendor: inv.name || prev.vendor,
        billingPhone: inv.phone || prev.billingPhone,
        billingEmail: inv.email || prev.billingEmail,
        title: prev.title || `Investment Return - ${inv.name}`,
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'totalAmount' || field === 'paidAmount') {
        const t = field === 'totalAmount' ? Number(value) || 0 : Number(prev.totalAmount) || 0;
        const p = field === 'paidAmount' ? Number(value) || 0 : Number(prev.paidAmount) || 0;
        if (p >= t && t > 0) updated.status = 'Paid';
        else if (p > 0) updated.status = 'Partial';
        else updated.status = 'Pending';
      }
      return updated;
    });
  };

  const handleCreateNewType = async () => {
    if (!newTypeName.trim()) return;
    try {
      await addBillType({ name: newTypeName, description: newTypeDesc });
      setFormData((prev) => ({ ...prev, billType: newTypeName.trim() }));
      setNewTypeName('');
      setNewTypeDesc('');
      setNewTypeModalOpen(false);
    } catch {
      toast.error('Failed to create bill type');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a bill title / payee');
      return;
    }
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      toast.error('Please enter a valid bill amount');
      return;
    }

    const selectedType = allBillTypes.find((t) => t.name === formData.billType);
    const billTypeId = selectedType ? selectedType.id : null;

    const payload = {
      title: formData.title.trim(),
      billType: formData.billType,
      billTypeId: billTypeId,
      investorId: formData.investorId || null,
      vendor: formData.vendor.trim() || formData.title.trim(),
      customerName: formData.vendor.trim() || formData.title.trim(),
      billingPhone: formData.billingPhone.trim(),
      billingEmail: formData.billingEmail.trim(),
      totalAmount: totalAmountNum,
      amount: totalAmountNum,
      paidAmount: paidAmountNum,
      pendingAmount: pendingAmountNum,
      billingDate: formData.billingDate,
      dueDate: formData.dueDate || formData.billingDate,
      billingMethod: formData.billingMethod,
      status: formData.status.toLowerCase(),
      notes: formData.notes.trim(),
    };

    try {
      if (editId) {
        await updateBilling({ id: editId, ...payload });
      } else {
        await createBilling(payload);
      }
      navigate('/dashboard/accounts/bills');
    } catch {
      toast.error('Failed to save bill record');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/accounts/bills')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {editId ? 'Edit Bill Record' : t('accounts.add_new_bill', 'Add New Bill')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record invoices, utilities, rent, vendor bills, and operational expenses.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Section (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Bill Information & Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Bill Title / Reference <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Tejgaon Warehouse Monthly Rent - July"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground">
                      Bill Category / Type <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewTypeModalOpen(true)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-3 h-3" /> Add Category
                    </button>
                  </div>
                  <Select
                    value={formData.billType}
                    onValueChange={(v) => handleInputChange('billType', v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select Bill Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {allBillTypes.length > 0 ? (
                        allBillTypes.map((bt) => (
                          <SelectItem key={bt.id} value={bt.name}>
                            {bt.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No categories found. Click Add Category.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Associated Investor (shows prominently for Investment Return or if investors exist) */}
                {formData.billType === 'Investment Return' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Associated Investor
                    </label>
                    <Select
                      value={formData.investorId || 'none'}
                      onValueChange={handleInvestorSelect}
                    >
                      <SelectTrigger className="text-xs border-purple-500/40 bg-purple-500/5">
                        <SelectValue placeholder="Select Investor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Manual Payee</SelectItem>
                        {allInvestors.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.name} ({inv.did}) - Due: {formatCurrency(inv.remainingDue || 0)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Vendor / Payee Name
                    </label>
                    <Input
                      placeholder="e.g. Green Valley Real Estate Ltd"
                      value={formData.vendor}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                      className="text-xs"
                    />
                  </div>
                )}
              </div>

              {formData.billType === 'Investment Return' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Investor / Payee Display Name
                  </label>
                  <Input
                    placeholder="e.g. John Doe"
                    value={formData.vendor}
                    onChange={(e) => handleInputChange('vendor', e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Vendor Phone</label>
                  <Input
                    placeholder="e.g. 01711-XXXXXX"
                    value={formData.billingPhone}
                    onChange={(e) => handleInputChange('billingPhone', e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Vendor Email</label>
                  <Input
                    type="email"
                    placeholder="e.g. billing@vendor.com"
                    value={formData.billingEmail}
                    onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financials & Dates */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Billing Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Total Amount (৳) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formData.totalAmount}
                    onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                    className="text-xs font-semibold font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Paid Amount (৳)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formData.paidAmount}
                    onChange={(e) => handleInputChange('paidAmount', e.target.value)}
                    className="text-xs font-semibold font-mono text-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Calculated Pending (৳)
                  </label>
                  <Input
                    type="text"
                    value={formatCurrency(pendingAmountNum)}
                    readOnly
                    className="text-xs font-semibold font-mono bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Billing Date</label>
                  <Input
                    type="date"
                    value={formData.billingDate}
                    onChange={(e) => handleInputChange('billingDate', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Payment Method</label>
                  <Select
                    value={formData.billingMethod}
                    onValueChange={(v) => handleInputChange('billingMethod', v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBillingMethods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Status</label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleInputChange('status', v)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Notes / Remarks</label>
                <Textarea
                  placeholder="Additional invoice remarks, check numbers, or payment terms..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="text-xs min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Preview & Action Section (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-border/70 shadow-sm sticky top-20 bg-muted/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Bill Summary Preview</span>
                <Receipt className="w-4 h-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[11px]">Payee / Title:</span>
                <span className="font-bold text-foreground text-sm line-clamp-1">
                  {formData.title || 'Untitled Bill'}
                </span>
                <Badge variant="outline" className="text-[10px] mt-1 bg-card">
                  {formData.billType}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-card border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Total Incurred:</span>
                  <span className="font-bold text-foreground font-mono">{formatCurrency(totalAmountNum)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Paid Amount:</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatCurrency(paidAmountNum)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-muted-foreground">Outstanding Due:</span>
                  <span className="font-bold text-amber-600 font-mono">{formatCurrency(pendingAmountNum)}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-muted-foreground text-[11px]">
                <div className="flex justify-between">
                  <span>Billing Date:</span>
                  <span className="font-medium text-foreground">{formData.billingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span className="font-medium text-foreground">{formData.dueDate || 'Immediate'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium text-foreground">{formData.billingMethod}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Status:</span>
                  <Badge variant="outline" className="text-[10px]">{formData.status}</Badge>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <Button
                  type="submit"
                  className="w-full text-xs gap-1.5 shadow-sm"
                  disabled={isCreating || isUpdating}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isCreating || isUpdating ? 'Saving...' : editId ? 'Update Bill' : 'Save Bill Record'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/accounts/bills')}
                  className="w-full text-xs"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Inline Add Bill Type Modal */}
      <Dialog open={newTypeModalOpen} onOpenChange={setNewTypeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Add New Bill Category
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Category Name</label>
              <Input
                placeholder="e.g. Legal & Compliance Fees"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Description</label>
              <Input
                placeholder="Brief purpose of this category..."
                value={newTypeDesc}
                onChange={(e) => setNewTypeDesc(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewTypeModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateNewType} disabled={!newTypeName.trim()}>
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewBillPage;
