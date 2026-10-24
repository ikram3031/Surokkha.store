import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  DollarSign,
  Calendar,
  FileText,
  Search,
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
import { usePayments } from '@/hooks/use-payments';
import { usePaymentTypes } from '@/hooks/use-payment-types';
import { useMembers } from '@/hooks/use-members';
import { useSystemUsers } from '@/hooks/use-users';
import { toast } from 'sonner';

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const AddNewPaymentPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const { allPayments = [], createPayment, updatePayment, isCreating, isUpdating } = usePayments();
  const { allPaymentTypes = [] } = usePaymentTypes();
  const { data: membersResponse } = useMembers({ limit: 50 });
  const { data: usersResponse } = useSystemUsers({ limit: 50 });

  const membersList = membersResponse?.data || [];
  const usersList = usersResponse?.data || [];

  const defaultMethods = ['bKash', 'Nagad', 'Cash', 'Card', 'Bank Transfer', 'COD'];
  const availableMethods = React.useMemo(() => {
    const customNames = allPaymentTypes
      .filter((t) => t.status === 'Active')
      .map((t) => t.name.trim())
      .filter(Boolean);
    const combined = Array.from(new Set([...defaultMethods, ...customNames]));
    if (formData.paymentMethod && !combined.includes(formData.paymentMethod)) {
      combined.push(formData.paymentMethod);
    }
    return combined;
  }, [allPaymentTypes, formData.paymentMethod]);

  const [customerSelectionType, setCustomerSelectionType] = useState('manual');
  const [formData, setFormData] = useState({
    customerName: '',
    invoiceId: '',
    amount: '',
    paidAmount: '',
    paymentMethod: 'bKash',
    trxId: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'Completed',
    notes: '',
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (editId && allPayments.length > 0) {
      const existing = allPayments.find((p) => p.id === editId || p.invoiceId === editId);
      if (existing) {
        setFormData({
          customerName: existing.customerName || '',
          invoiceId: existing.invoiceId || '',
          amount: existing.amount !== undefined ? String(existing.amount) : '',
          paidAmount: existing.paidAmount !== undefined ? String(existing.paidAmount) : '',
          paymentMethod: existing.paymentMethod || existing.method || 'bKash',
          trxId: existing.trxId || '',
          date: existing.date || new Date().toISOString().slice(0, 10),
          status: existing.status || 'Completed',
          notes: existing.notes || '',
        });
      }
    }
  }, [editId, allPayments]);

  const amountNum = Number(formData.amount) || 0;
  const paidAmountNum = Number(formData.paidAmount !== '' ? formData.paidAmount : formData.amount) || 0;

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'amount' && prev.paidAmount === '') {
        updated.paidAmount = value;
      }
      return updated;
    });
  };

  const handleSelectExistingUser = (userId) => {
    const selectedUser = usersList.find((u) => u.id === userId);
    if (selectedUser) {
      setFormData((prev) => ({
        ...prev,
        customerName: selectedUser.name || selectedUser.email,
      }));
      return;
    }
    const selectedMember = membersList.find((m) => m.id === userId);
    if (selectedMember) {
      setFormData((prev) => ({
        ...prev,
        customerName: selectedMember.name || selectedMember.phone,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      toast.error('Customer / Payer name is required');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const payload = {
      customerName: formData.customerName.trim(),
      invoiceId: formData.invoiceId.trim() || `INV-${Date.now().toString().slice(-6)}`,
      amount: amountNum,
      totalAmount: amountNum,
      paidAmount: paidAmountNum,
      paymentMethod: formData.paymentMethod,
      method: formData.paymentMethod,
      trxId: formData.trxId.trim(),
      date: formData.date,
      status: formData.status,
      notes: formData.notes.trim(),
    };

    try {
      if (editId) {
        await updatePayment({ id: editId, ...payload });
      } else {
        await createPayment(payload);
      }
      navigate('/dashboard/accounts/payments');
    } catch {
      toast.error('Failed to save payment record');
    }
  };

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/accounts/payments')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {editId ? 'Edit Payment Record' : t('accounts.add_new_payment', 'Add New Payment')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Record manual customer settlements, POS transactions, or gateway collections.
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
                <User className="w-4 h-4 text-primary" />
                Customer & Reference Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex gap-4 border-b pb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerSelectionType('manual')}
                  className={`font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
                    customerSelectionType === 'manual'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Manual Customer Entry
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerSelectionType('existing')}
                  className={`font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
                    customerSelectionType === 'existing'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Select Existing Member / User
                </button>
              </div>

              {customerSelectionType === 'existing' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Select Customer / Member / System User
                  </label>
                  <Select onValueChange={handleSelectExistingUser}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Search or select registered customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {membersList.length > 0 && (
                        <>
                          <SelectItem value="group-members" disabled className="font-bold text-[11px] text-muted-foreground">
                            -- Customer Directory --
                          </SelectItem>
                          {membersList.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name || 'Unnamed Member'} ({m.phone || m.email || m.did})
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {usersList.length > 0 && (
                        <>
                          <SelectItem value="group-users" disabled className="font-bold text-[11px] text-muted-foreground">
                            -- System Users --
                          </SelectItem>
                          {usersList.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.role} - {u.email})
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {membersList.length === 0 && usersList.length === 0 && (
                        <SelectItem value="none" disabled>
                          No registered members or users found.
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Customer / Payer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Nadia Rahman"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Invoice / Order ID Ref
                  </label>
                  <Input
                    placeholder="e.g. INV-2026-089"
                    value={formData.invoiceId}
                    onChange={(e) => handleInputChange('invoiceId', e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount & Method */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                Payment Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Order / Bill Amount (৳) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="text-xs font-semibold font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Received / Paid Amount (৳)
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Payment Method</label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => handleInputChange('paymentMethod', v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMethods.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Transaction ID (TrxID)</label>
                  <Input
                    placeholder="e.g. TRX9928374"
                    value={formData.trxId}
                    onChange={(e) => handleInputChange('trxId', e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Payment Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="text-xs"
                  />
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
                    <SelectItem value="Completed">Completed (Paid)</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Notes / Remarks</label>
                <Textarea
                  placeholder="Additional notes, POS counter info, or bank slip reference..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="text-xs min-h-[70px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Receipt Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="border-border/70 shadow-sm sticky top-20 bg-muted/10">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Payment Receipt Preview</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[11px]">Customer / Payer:</span>
                <span className="font-bold text-foreground text-sm line-clamp-1">
                  {formData.customerName || 'Customer Name'}
                </span>
                <span className="text-muted-foreground font-mono text-[11px] block">
                  {formData.invoiceId || 'INV-AUTO-GENERATED'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-bold text-foreground font-mono">{formatCurrency(amountNum)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Collected Amount:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">{formatCurrency(paidAmountNum)}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-muted-foreground text-[11px]">
                <div className="flex justify-between">
                  <span>Method:</span>
                  <Badge variant="outline" className="text-[10px]">{formData.paymentMethod}</Badge>
                </div>
                {formData.trxId && (
                  <div className="flex justify-between">
                    <span>Trx ID:</span>
                    <span className="font-mono text-foreground">{formData.trxId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment Date:</span>
                  <span className="font-medium text-foreground">{formData.date}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span>Status:</span>
                  <Badge variant="outline" className="text-[10px]">{formData.status}</Badge>
                </div>
              </div>

              <div className="pt-3 border-t space-y-2">
                <Button
                  type="submit"
                  className="w-full text-xs gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isCreating || isUpdating}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isCreating || isUpdating ? 'Saving...' : editId ? 'Update Payment' : 'Save Payment Record'}</span>
                </Button>
                <Button
                  type="button"
                  variant="cancel"
                  onClick={() => navigate('/dashboard/accounts/payments')}
                  className="w-full text-xs"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default AddNewPaymentPage;
