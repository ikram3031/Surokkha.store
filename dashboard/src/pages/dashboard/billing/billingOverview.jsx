import { Link } from 'react-router-dom';
import { CreditCard, FileText, ArrowRight, CheckCircle2, Clock, XCircle, DollarSign, Receipt } from 'lucide-react';
import { useBillings } from '@/hooks/use-billings';
import { usePayments } from '@/hooks/use-payments';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Renders the overview hub for bills, invoices, and payment transactions
const BillingPage = () => {
  const { summary: billingsSummary, isLoading: isLoadingBillings } = useBillings();
  const { summary: paymentsSummary, isLoading: isLoadingPayments } = usePayments();

  const totalBilled = billingsSummary?.totalBilled ?? 0;
  const totalBillsCount = billingsSummary?.count ?? 0;
  const totalCollected = paymentsSummary?.totalCollected ?? 0;
  const totalPaymentsCount = paymentsSummary?.count ?? 0;

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your bills, invoices, and payment transactions</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Billed</p>
              {isLoadingBillings ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold tracking-tight mt-0.5">৳{totalBilled.toLocaleString()}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bills Count</p>
              {isLoadingBillings ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold tracking-tight mt-0.5">{totalBillsCount}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Total Collected</p>
              {isLoadingPayments ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold tracking-tight text-emerald-600 mt-0.5">৳{totalCollected.toLocaleString()}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Payments Count</p>
              {isLoadingPayments ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold tracking-tight mt-0.5">{totalPaymentsCount}</p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Link to="/dashboard/billing/billings" className="block group">
          <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Bills & Invoices</h2>
              <p className="text-sm text-muted-foreground mb-4">View and manage all customer invoices and billing records</p>
            </div>
            <div className="flex gap-3 text-xs pt-2 border-t">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Paid
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Pending
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3.5 w-3.5" /> Failed
              </span>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/billing/payments" className="block group">
          <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-violet-500" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-semibold mb-1">Payment Transactions</h2>
              <p className="text-sm text-muted-foreground mb-4">Track all incoming payments via Cash, Card, bKash, and Nagad</p>
            </div>
            <div className="flex gap-3 text-xs pt-2 border-t">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Pending
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <XCircle className="h-3.5 w-3.5" /> Failed
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default BillingPage;
