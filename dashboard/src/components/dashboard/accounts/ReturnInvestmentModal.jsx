import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CornerDownLeft,
  Landmark,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useInvestors } from '@/hooks/use-investors';
import { useInvestments } from '@/hooks/use-investments';
import { toast } from 'sonner';

const formatCurrency = (val) => {
  const n = Number(val) || 0;
  return `৳${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const ReturnInvestmentModal = ({
  open,
  onOpenChange,
  defaultInvestorId = '',
  defaultInvestmentId = '',
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { allInvestors = [] } = useInvestors();
  const { allInvestments = [], recordReturn } = useInvestments();

  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('all');
  const [returnAmount, setReturnAmount] = useState('');
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [createBill, setCreateBill] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set defaults when opening modal
  useEffect(() => {
    if (open) {
      if (defaultInvestmentId) {
        const inv = allInvestments.find((i) => i.id === defaultInvestmentId || i.did === defaultInvestmentId);
        if (inv) {
          setSelectedInvestorId(inv.investorId);
          setSelectedInvestmentId(inv.id);
          const due = Math.max(0, (Number(inv.takenAmount) || 0) - (Number(inv.returnedAmount) || 0));
          if (due > 0) {
            setReturnAmount(String(due));
          }
        } else {
          setSelectedInvestorId(defaultInvestorId || (allInvestors[0]?.id || ''));
          setSelectedInvestmentId('all');
        }
      } else if (defaultInvestorId) {
        setSelectedInvestorId(defaultInvestorId);
        setSelectedInvestmentId('all');
      } else if (allInvestors.length > 0 && !selectedInvestorId) {
        setSelectedInvestorId(allInvestors[0].id);
        setSelectedInvestmentId('all');
      }

      setReturnDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod('Bank Transfer');
      setCreateBill(true);
      setNotes('');
    }
  }, [open, defaultInvestorId, defaultInvestmentId, allInvestments, allInvestors]);

  // Selected Investor Object
  const currentInvestor = useMemo(() => {
    return allInvestors.find((i) => i.id === selectedInvestorId || i.did === selectedInvestorId) || null;
  }, [allInvestors, selectedInvestorId]);

  // Active investments for this investor
  const investorInvestments = useMemo(() => {
    if (!selectedInvestorId) return [];
    return allInvestments.filter((inv) => inv.investorId === selectedInvestorId);
  }, [allInvestments, selectedInvestorId]);

  // Investor portfolio aggregate metrics
  const investorMetrics = useMemo(() => {
    let taken = 0;
    let returned = 0;
    investorInvestments.forEach((inv) => {
      taken += Number(inv.takenAmount) || 0;
      returned += Number(inv.returnedAmount) || 0;
    });

    // If investor object has totalInvested/totalReturned and no list items, fallback
    if (investorInvestments.length === 0 && currentInvestor) {
      taken = Number(currentInvestor.totalInvested) || 0;
      returned = Number(currentInvestor.totalReturned) || 0;
    }

    const due = Math.max(0, taken - returned);
    return { taken, returned, due };
  }, [investorInvestments, currentInvestor]);

  // Selected specific investment tranche metrics
  const specificInvestment = useMemo(() => {
    if (!selectedInvestmentId || selectedInvestmentId === 'all') return null;
    return investorInvestments.find((i) => i.id === selectedInvestmentId || i.did === selectedInvestmentId);
  }, [investorInvestments, selectedInvestmentId]);

  const targetMaxDue = specificInvestment
    ? Math.max(0, (Number(specificInvestment.takenAmount) || 0) - (Number(specificInvestment.returnedAmount) || 0))
    : investorMetrics.due;

  // Handle quick percentage fill
  const handleQuickFill = (percent) => {
    const base = targetMaxDue > 0 ? targetMaxDue : investorMetrics.taken;
    const calc = Math.round((base * percent) / 100);
    setReturnAmount(String(calc));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvestorId) {
      toast.error('Please select an investor');
      return;
    }

    const numAmount = Number(returnAmount);
    if (!returnAmount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid return amount greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      await recordReturn({
        investorId: selectedInvestorId,
        investmentId: selectedInvestmentId !== 'all' ? selectedInvestmentId : undefined,
        returnAmount: numAmount,
        returnDate,
        paymentMethod,
        notes: notes.trim(),
        createBill,
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch {
      // Error is handled in hook mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b bg-gradient-to-r from-emerald-500/10 via-background to-purple-500/10">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CornerDownLeft className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {t('accounts.return_investment_title', 'Return Capital to Investor')}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {t('accounts.return_investment_desc', 'Pay back principal or dividend capital to investors and synchronize accounts billing.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* 1. Investor Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center justify-between">
              <span>Select Investor / Stakeholder <span className="text-red-500">*</span></span>
              {currentInvestor && (
                <span className="text-[11px] text-muted-foreground font-normal">
                  {currentInvestor.phone || currentInvestor.email}
                </span>
              )}
            </label>
            <Select
              value={selectedInvestorId}
              onValueChange={(id) => {
                setSelectedInvestorId(id);
                setSelectedInvestmentId('all');
                setReturnAmount('');
              }}
            >
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Choose an investor..." />
              </SelectTrigger>
              <SelectContent>
                {allInvestors.map((inv) => {
                  const invTaken = Number(inv.totalInvested) || 0;
                  const invReturned = Number(inv.totalReturned) || 0;
                  const invDue = Math.max(0, invTaken - invReturned);
                  return (
                    <SelectItem key={inv.id} value={inv.id}>
                      <span className="font-medium">{inv.name}</span>
                      <span className="text-muted-foreground ml-2 text-[11px]">
                        (Due: {formatCurrency(invDue)})
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Investor Financial Status Highlights */}
          {currentInvestor && (
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 border">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                  Total Taken
                </span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {formatCurrency(investorMetrics.taken)}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                  Total Returned
                </span>
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  {formatCurrency(investorMetrics.returned)}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground block font-medium uppercase tracking-wider">
                  Outstanding Due
                </span>
                <span className="text-xs font-bold text-purple-600 font-mono">
                  {formatCurrency(investorMetrics.due)}
                </span>
              </div>
            </div>
          )}

          {/* 3. Specific Tranche Selector (if multiple investments exist) */}
          {investorInvestments.length > 1 && (
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground flex items-center justify-between">
                <span>Target Investment Tranche</span>
                <span className="text-[11px] text-muted-foreground font-normal">
                  {investorInvestments.length} tranches found
                </span>
              </label>
              <Select
                value={selectedInvestmentId}
                onValueChange={(v) => {
                  setSelectedInvestmentId(v);
                  if (v !== 'all') {
                    const found = investorInvestments.find((i) => i.id === v);
                    if (found) {
                      const due = Math.max(0, (Number(found.takenAmount) || 0) - (Number(found.returnedAmount) || 0));
                      if (due > 0) setReturnAmount(String(due));
                    }
                  }
                }}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Apply across all tranches or choose specific..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    ⚡ Auto-distribute across active tranches (Oldest First)
                  </SelectItem>
                  {investorInvestments.map((inv) => {
                    const due = Math.max(0, (Number(inv.takenAmount) || 0) - (Number(inv.returnedAmount) || 0));
                    return (
                      <SelectItem key={inv.id} value={inv.id}>
                        Ref: {inv.id.slice(-6)} | Taken: {formatCurrency(inv.takenAmount)} | Due: {formatCurrency(due)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 4. Return Amount & Quick Fill */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-foreground">
                Repayment Amount (৳) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill(25)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill(50)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted hover:bg-muted/80 text-foreground transition-all cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill(100)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-600 hover:bg-purple-500/25 transition-all cursor-pointer"
                >
                  Full Due
                </button>
              </div>
            </div>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="0.00"
              value={returnAmount}
              onChange={(e) => setReturnAmount(e.target.value)}
              className="text-sm font-bold font-mono text-emerald-600 h-9"
              required
            />
            {Number(returnAmount) > targetMaxDue && targetMaxDue > 0 && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Entered amount exceeds current outstanding balance ({formatCurrency(targetMaxDue)}).
              </p>
            )}
          </div>

          {/* 5. Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Return / Payment Date</label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Payment Method</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="bKash">bKash</SelectItem>
                  <SelectItem value="Nagad">Nagad</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 6. Sync with Accounts Billing Checkbox */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="create-bill-checkbox"
                checked={createBill}
                onCheckedChange={(checked) => setCreateBill(Boolean(checked))}
              />
              <label
                htmlFor="create-bill-checkbox"
                className="font-semibold text-foreground cursor-pointer select-none text-xs"
              >
                Log as Bill under <span className="text-emerald-600 font-bold">'Investment Return'</span> Category
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
              Automatically creates a paid bill entry in Accounts so that total company outflow and net business balance stay 100% synchronized.
            </p>
          </div>

          {/* 7. Notes */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Repayment Remarks / Transaction Ref</label>
            <Textarea
              placeholder="e.g. Q3 Principal return via City Bank Transfer Ref #987654..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs min-h-[60px]"
            />
          </div>

          <DialogFooter className="pt-2 border-t flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="cancel"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !selectedInvestorId || !returnAmount}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm cursor-pointer"
            >
              <CornerDownLeft className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Confirm Return Payment'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnInvestmentModal;
