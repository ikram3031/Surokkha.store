import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  MapPin,
  ShieldCheck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Edit3,
  Save,
  KeyRound,
  Trash2,
  RefreshCw,
  ExternalLink,
  Plus,
  Search,
  Truck,
  DollarSign,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { formatDate, formatDateTime } from '@/utils/dateHelper';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/error-handler';

// Helper to format currency
const formatBDT = (amount = 0) => `৳${Number(amount || 0).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Dedicated Customer Profile Page
export const MemberDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('orders');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [copiedDid, setCopiedDid] = useState(false);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Customer',
    active: true,
  });

  // Edit addresses state
  const [isEditingAddresses, setIsEditingAddresses] = useState(false);
  const [billingForm, setBillingForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Bangladesh',
  });
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Bangladesh',
  });

  // Password change state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete member state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManageSecurity = ['owner', 'admin', 'manager', 'administrator', 'super_admin'].includes(
    (user?.role || '').toLowerCase()
  );

  // Fetch complete member profile data
  const {
    data: memberResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['member-details', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/v1/members/${id}`);
      return res.data?.data || null;
    },
    enabled: Boolean(id),
  });

  const member = memberResponse;

  // Initialize edit forms when member data loads
  useMemo(() => {
    if (member) {
      setEditForm({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || 'Customer',
        active: member.active !== false,
      });

      const bAddr = member.billingAddress || {};
      setBillingForm({
        firstName: bAddr.firstName || '',
        lastName: bAddr.lastName || '',
        phone: bAddr.phone || member.phone || '',
        address1: bAddr.address1 || '',
        address2: bAddr.address2 || '',
        city: bAddr.city || '',
        state: bAddr.state || '',
        postcode: bAddr.postcode || '',
        country: bAddr.country || 'Bangladesh',
      });

      const sAddr = member.shippingAddress || {};
      setShippingForm({
        firstName: sAddr.firstName || '',
        lastName: sAddr.lastName || '',
        phone: sAddr.phone || member.phone || '',
        address1: sAddr.address1 || '',
        address2: sAddr.address2 || '',
        city: sAddr.city || '',
        state: sAddr.state || '',
        postcode: sAddr.postcode || '',
        country: sAddr.country || 'Bangladesh',
      });
    }
  }, [member]);

  // Copy DID to clipboard
  const handleCopyDid = async () => {
    if (!member?.did) return;
    try {
      await navigator.clipboard.writeText(member.did);
      setCopiedDid(true);
      toast.success('DID copied to clipboard');
      setTimeout(() => setCopiedDid(false), 2000);
    } catch {
      toast.error('Failed to copy DID');
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await apiClient.put(`/api/v1/members/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Customer profile updated successfully');
      setIsEditingProfile(false);
      setIsEditingAddresses(false);
      queryClient.invalidateQueries({ queryKey: ['member-details', id] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Failed to update customer profile'));
    },
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    updateProfileMutation.mutate(editForm);
  };

  const handleSaveAddresses = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      billingAddress: billingForm,
      shippingAddress: shippingForm,
    });
  };

  const handleCopyBillingToShipping = () => {
    setShippingForm({ ...billingForm });
    toast.info('Billing address copied to shipping address');
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsChangingPassword(true);
    try {
      await apiClient.post(`/api/v1/members/${id}/change-password`, { newPassword });
      toast.success('Password updated successfully');
      setPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update password'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Delete member handler
  const handleDeleteMember = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/v1/members/${id}`);
      toast.success(`Customer ${member?.name || ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard/members');
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete customer'));
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // Order stats calculations
  const ordersList = useMemo(() => member?.orderList || [], [member]);

  const orderStats = useMemo(() => {
    const total = ordersList.length;
    const nonCancelled = ordersList.filter((o) => o.status !== 'cancelled');
    const completed = ordersList.filter((o) => ['delivered', 'completed'].includes((o.status || '').toLowerCase()));
    const pending = ordersList.filter((o) => ['pending', 'processing', 'confirmed'].includes((o.status || '').toLowerCase()));
    const cancelled = ordersList.filter((o) => (o.status || '').toLowerCase() === 'cancelled');

    const totalSpent = nonCancelled.reduce((sum, o) => sum + Number(o.totals?.total || 0), 0);
    const aov = nonCancelled.length > 0 ? totalSpent / nonCancelled.length : 0;
    const fulfillmentRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
      total,
      totalSpent,
      aov,
      completedCount: completed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      fulfillmentRate,
    };
  }, [ordersList]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return ordersList.filter((order) => {
      const orderNum = (order.orderNumber || order._id || '').toLowerCase();
      const matchesSearch = !orderSearchQuery || orderNum.includes(orderSearchQuery.toLowerCase().trim());
      const matchesStatus = orderStatusFilter === 'all' || (order.status || '').toLowerCase() === orderStatusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [ordersList, orderSearchQuery, orderStatusFilter]);

  // Customer segment determination
  const customerSegment = useMemo(() => {
    if (orderStats.totalSpent > 15000 || orderStats.total >= 5) return 'VIP';
    if (orderStats.total > 1) return 'Returning';
    return 'New';
  }, [orderStats]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard/members')}
            className="h-9 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="h-6 w-48 bg-muted animate-pulse rounded-md" />
        </div>

        <div className="h-44 bg-card border rounded-2xl p-6 animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-full" />
            <div className="space-y-2">
              <div className="h-5 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-card border rounded-xl p-4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !member) {
    return (
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Customer Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'The requested customer profile could not be retrieved.'}
          </p>
        </div>
        <Button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard/members')} className="mt-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Members
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* 1. Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard/members')}
            className="h-8 px-2 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Members
          </Button>
          <span>/</span>
          <span className="font-semibold text-foreground truncate max-w-[220px]">
            {member.name || 'Customer Profile'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh profile data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-primary' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard/orders/new')}
            className="h-8 text-xs flex items-center gap-1.5 cursor-pointer bg-primary/5 hover:bg-primary/10 border-primary/30 text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Order</span>
          </Button>

          {canManageSecurity && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(true)}
              className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Change Password</span>
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Customer Card */}
      <Card className="border-border/70 shadow-sm overflow-hidden bg-gradient-to-r from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-xs shrink-0">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {(member.name || 'C').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {member.name}
                  </h1>

                  <Badge
                    variant={member.active !== false ? 'default' : 'secondary'}
                    className={
                      member.active !== false
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground'
                    }
                  >
                    {member.active !== false ? 'Active Account' : 'Inactive'}
                  </Badge>

                  <Badge
                    variant="outline"
                    className={`font-semibold text-xs ${
                      customerSegment === 'VIP'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : customerSegment === 'Returning'
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/30'
                    }`}
                  >
                    {customerSegment} Customer
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {member.did && (
                    <button
                      type="button"
                      onClick={handleCopyDid}
                      className="inline-flex items-center gap-1 font-mono bg-muted/60 hover:bg-muted px-2 py-0.5 rounded text-[11px] border border-border/50 text-foreground cursor-pointer transition-colors"
                      title="Click to copy DID"
                    >
                      <span>DID: {member.did}</span>
                      {copiedDid ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1 hover:text-primary hover:underline"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>{member.email}</span>
                    </a>
                  )}

                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="inline-flex items-center gap-1 hover:text-primary hover:underline font-mono"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{member.phone}</span>
                    </a>
                  )}

                  <div className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Joined {formatDate(member.createdAt || member.joinedDate || Date.now())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
              <Button
                variant={isEditingProfile ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setActiveTab('profile');
                  setIsEditingProfile(true);
                }}
                className="h-9 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Key Financial & Customer KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Lifetime Spend */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lifetime Spend
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatBDT(orderStats.totalSpent)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold">{orderStats.completedCount} orders</span> delivered
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Total Orders */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Orders
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {orderStats.total}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
              <span className="text-amber-600">{orderStats.pendingCount} pending</span>
              <span>•</span>
              <span className="text-destructive">{orderStats.cancelledCount} cancelled</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Average Order Value */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Average Order Value
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatBDT(orderStats.aov)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Per successful order</p>
          </CardContent>
        </Card>

        {/* KPI 4: Fulfillment Rate */}
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Delivery Success
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {orderStats.fulfillmentRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {orderStats.cancelledCount === 0 ? 'Zero return / cancellations' : `${orderStats.cancelledCount} cancelled orders`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 4. Interactive Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="orders" className="gap-2 text-xs">
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Order History ({ordersList.length})</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 text-xs">
            <User className="h-3.5 w-3.5" />
            <span>Customer Info</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2 text-xs">
            <MapPin className="h-3.5 w-3.5" />
            <span>Saved Addresses</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Account & Security</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ORDER HISTORY */}
        <TabsContent value="orders" className="space-y-4">
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Orders Timeline</CardTitle>
                  <CardDescription className="text-xs">
                    All completed, pending, and past store orders placed by this customer.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search order #..."
                      className="pl-8 h-8 text-xs font-mono"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                    />
                  </div>

                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {filteredOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[160px]">Order Number</TableHead>
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Items / Summary</TableHead>
                      <TableHead className="w-[120px]">Payment</TableHead>
                      <TableHead className="w-[110px]">Status</TableHead>
                      <TableHead className="w-[120px] text-right">Total</TableHead>
                      <TableHead className="w-[80px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((ord) => {
                      const orderId = ord._id || ord.id || ord.orderNumber;
                      const itemCount = ord.items?.length || ord.products?.length || 1;
                      const status = (ord.status || 'pending').toLowerCase();

                      return (
                        <TableRow key={orderId} className="hover:bg-muted/40">
                          <TableCell className="font-mono font-bold text-xs">
                            <Link
                              to={`/dashboard/orders/${orderId}`}
                              className="text-primary hover:underline flex items-center gap-1.5"
                            >
                              <span>#{ord.orderNumber || orderId}</span>
                              {ord.inStore && (
                                <Badge variant="secondary" className="text-[9px] px-1 py-0">
                                  In-Store
                                </Badge>
                              )}
                            </Link>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(ord.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs max-w-[280px]">
                            <div className="truncate text-foreground font-medium">
                              {ord.items?.[0]?.name || ord.items?.[0]?.productName || `${itemCount} item(s)`}
                              {itemCount > 1 && (
                                <span className="text-muted-foreground ml-1 font-normal">
                                  +{itemCount - 1} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground capitalize">
                            {ord.paymentMethod || ord.paymentInfo?.method || 'COD'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[10px] capitalize font-semibold ${
                                status === 'delivered' || status === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : status === 'cancelled'
                                  ? 'bg-destructive/15 text-destructive border-destructive/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            {formatBDT(ord.totals?.total || ord.totalAmount || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              render={
                                <Link to={`/dashboard/orders/${orderId}`} />
                              }
                              className="h-7 px-2 text-xs text-primary cursor-pointer hover:bg-primary/10"
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">No orders matching criteria</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {orderSearchQuery || orderStatusFilter !== 'all'
                        ? 'Try clearing the search or status filter.'
                        : 'This customer has not placed any orders yet.'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/dashboard/orders/new')}
                    className="mt-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Create First Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PROFILE & CONTACT DETAILS */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Personal & Contact Information</CardTitle>
                  <CardDescription className="text-xs">
                    Manage customer name, contact details, account status, and role.
                  </CardDescription>
                </div>
                {!isEditingProfile ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Information</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingProfile(false)}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditingProfile || updateProfileMutation.isPending}
                      className="text-xs"
                      placeholder="Customer Name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email Address</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditingProfile || updateProfileMutation.isPending}
                      className="text-xs"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Phone Number <span className="text-muted-foreground font-normal">(Format: +8801XXXXXXXXX)</span>
                    </label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditingProfile || updateProfileMutation.isPending}
                      className="text-xs font-mono"
                      placeholder="+8801700000000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Account Status</label>
                    <Select
                      value={editForm.active ? 'active' : 'inactive'}
                      onValueChange={(val) => setEditForm((prev) => ({ ...prev, active: val === 'active' }))}
                      disabled={!isEditingProfile || updateProfileMutation.isPending}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (Can Login & Place Orders)</SelectItem>
                        <SelectItem value="inactive">Inactive / Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="pt-4 border-t flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(false)}
                      disabled={updateProfileMutation.isPending}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateProfileMutation.isPending}
                      className="text-xs bg-primary text-primary-foreground font-semibold flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: SAVED ADDRESSES */}
        <TabsContent value="addresses" className="space-y-4">
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Customer Address Book</CardTitle>
                  <CardDescription className="text-xs">
                    Default billing and shipping destination addresses for checkout and order fulfillment.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingAddresses ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAddresses(true)}
                      className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Addresses</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyBillingToShipping}
                        className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
                        title="Copy all billing address fields to shipping address"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy Billing to Shipping</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingAddresses(false)}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <form onSubmit={handleSaveAddresses} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Billing Address Box */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Billing Address</h4>
                        <p className="text-[11px] text-muted-foreground">Invoice & billing contact</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">First Name</label>
                        <Input
                          value={billingForm.firstName}
                          onChange={(e) => setBillingForm((p) => ({ ...p, firstName: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="First Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Last Name</label>
                        <Input
                          value={billingForm.lastName}
                          onChange={(e) => setBillingForm((p) => ({ ...p, lastName: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Address Line 1</label>
                      <Input
                        value={billingForm.address1}
                        onChange={(e) => setBillingForm((p) => ({ ...p, address1: e.target.value }))}
                        disabled={!isEditingAddresses}
                        className="h-8 text-xs"
                        placeholder="House, Road, Area"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">City / District</label>
                        <Input
                          value={billingForm.city}
                          onChange={(e) => setBillingForm((p) => ({ ...p, city: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="e.g. Dhaka"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">State / Div</label>
                        <Input
                          value={billingForm.state}
                          onChange={(e) => setBillingForm((p) => ({ ...p, state: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="e.g. Dhaka"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Postcode</label>
                        <Input
                          value={billingForm.postcode}
                          onChange={(e) => setBillingForm((p) => ({ ...p, postcode: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="1200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address Box */}
                  <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Shipping Address</h4>
                        <p className="text-[11px] text-muted-foreground">Product delivery destination</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">First Name</label>
                        <Input
                          value={shippingForm.firstName}
                          onChange={(e) => setShippingForm((p) => ({ ...p, firstName: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="First Name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Last Name</label>
                        <Input
                          value={shippingForm.lastName}
                          onChange={(e) => setShippingForm((p) => ({ ...p, lastName: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="Last Name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Address Line 1</label>
                      <Input
                        value={shippingForm.address1}
                        onChange={(e) => setShippingForm((p) => ({ ...p, address1: e.target.value }))}
                        disabled={!isEditingAddresses}
                        className="h-8 text-xs"
                        placeholder="House, Road, Area"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">City / District</label>
                        <Input
                          value={shippingForm.city}
                          onChange={(e) => setShippingForm((p) => ({ ...p, city: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="e.g. Dhaka"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">State / Div</label>
                        <Input
                          value={shippingForm.state}
                          onChange={(e) => setShippingForm((p) => ({ ...p, state: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="e.g. Dhaka"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">Postcode</label>
                        <Input
                          value={shippingForm.postcode}
                          onChange={(e) => setShippingForm((p) => ({ ...p, postcode: e.target.value }))}
                          disabled={!isEditingAddresses}
                          className="h-8 text-xs"
                          placeholder="1200"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isEditingAddresses && (
                  <div className="pt-2 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAddresses(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateProfileMutation.isPending}
                      className="text-xs bg-primary text-primary-foreground font-semibold flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Addresses'}</span>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: ACCOUNT & SECURITY */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  <span>Password & Authentication</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Reset customer password or send recovery credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  As an administrator, you can manually set a new password for this customer account if they are locked out or requesting password assistance.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasswordModalOpen(true)}
                  disabled={!canManageSecurity}
                  className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  <span>Set New Password</span>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span>Account Metadata</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  System timestamps and identity tokens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Customer Mongo ID:</span>
                  <span className="font-mono text-foreground select-all">{member._id || member.id}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">DID Identifier:</span>
                  <span className="font-mono text-foreground select-all">{member.did || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Registration Date:</span>
                  <span className="text-foreground">
                    {formatDateTime(member.createdAt || member.joinedDate || Date.now())}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="text-foreground">
                    {member.updatedAt ? formatDateTime(member.updatedAt) : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Change Password Dialog */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span>Change Password</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Set a new login password for <strong>{member.name}</strong> ({member.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">New Password</label>
              <Input
                type="password"
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Confirm Password</label>
              <Input
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPasswordModalOpen(false)}
                disabled={isChangingPassword}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isChangingPassword || !newPassword}
                className="text-xs bg-primary text-primary-foreground font-semibold"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteMember}
        isDeleting={isDeleting}
        title="Delete Customer Profile"
        description={`Are you sure you want to delete customer ${member.name}? This action is permanent and cannot be undone.`}
      />
    </div>
  );
};

export default MemberDetails;
