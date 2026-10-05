import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useOrder } from "@/hooks/use-orders";
import { useAuth } from "@/lib/auth-context";
import { useProducts } from "@/hooks/use-products";
import { useCategories, useBrands } from "@/lib/category-cache";
import { apiClient, baseURL } from "@/lib/api-client";
import { logActivity } from "@/lib/activity-logger";
import { toast } from "sonner";
import { clientConfig } from "@/clientConfig";
import PathaoCourierCard from "@/components/dashboard/orders/PathaoCourierCard";
import { SendOrderInvoiceModal } from "@/components/dashboard/orders/SendOrderInvoiceModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  ArrowLeft,
  Calendar,
  Eye,
  Edit,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Check,
  Plus,
  Minus,
  Trash2,
  Layers,
  ShoppingBag,
  Search,
  X,
  Tag,
  FileText,
  PhoneCall,
  Copy,
} from "lucide-react";

import { effectivePrice, formatBDT } from "@/utils/orderHelper";
import {
  checkIsInStoreOrder,
  getInitialPaymentMethod,
  getInitialPaidAmount,
  extractPaymentPhone,
  calculatePendingAmount,
  calculatePaymentStatus,
  getPaymentBadge,
  getFulfillmentBadge,
  resolvePaymentOptions,
  mapOrderItemsToCart,
  buildUpdatePayload,
  getPaymentMethodLabel,
  getBillingInfo,
  getShippingInfo,
  getWhatsAppLink,
  WhatsAppIcon,
  handleCopyText,
} from "@/utils/orderDetailsHelper";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from '@/utils/dateHelper';

const ProductAddDialog = ({ product, onClose, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isVariant = product.type === "variant" && (product?.variants?.length ?? 0) > 0;
  const simplePrice = effectivePrice(product.price, product.offerPrice ?? null);
  const variantPrice = selectedVariant
    ? effectivePrice(selectedVariant.price, selectedVariant.offerPrice ?? null)
    : null;

  const displayPrice = isVariant ? variantPrice : simplePrice;
  const lineTotal = displayPrice != null ? displayPrice * quantity : null;
  const canAdd = isVariant ? selectedVariant !== null : true;

  const handleAdd = () => {
    if (!canAdd || displayPrice === null) return;
    const cartKey = isVariant ? `${product.id}__${selectedVariant.size}` : product.id;

    onAddToCart({
      id: cartKey,
      name: isVariant ? `${product.name} (${selectedVariant.size})` : product.name,
      price: displayPrice,
      quantity,
      image: product.image,
      sku: isVariant ? selectedVariant.sku || product.sku : product.sku,
      size: isVariant ? selectedVariant.size : "",
      concentration: product.concentration || "",
      productDid: product.did || product.id || "",
    });

    setSelectedVariant(null);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={product !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-snug pr-6">
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isVariant ? "Select a size / variation to add to order" : "Confirm quantity to add"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 -mt-1">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs text-muted-foreground">{product.sku}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                {isVariant ? <><Layers className="h-2.5 w-2.5" /> Variable</> : <><Tag className="h-2.5 w-2.5" /> Simple</>}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {product.category}
              </Badge>
            </div>
          </div>
        </div>

        {!isVariant && clientConfig?.stockManagement?.simpleProduct !== false && (
          <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{formatBDT(simplePrice)}</p>
              {product.offerPrice != null && product.offerPrice < product.price && (
                <p className="text-xs text-muted-foreground line-through">{formatBDT(product.price)}</p>
              )}
            </div>
            <Badge variant={(product.stock ?? 0) > 0 ? "secondary" : "destructive"} className="text-xs">
              {(product.stock ?? 0) > 0 ? `${product.stock} in stock` : "Out of Stock"}
            </Badge>
          </div>
        )}

        {isVariant && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Select Size / Variation
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {[...(product.variants || [])]
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .map((v) => {
                  const vPrice = effectivePrice(v.price, v.offerPrice ?? null);
                  const isSelected = selectedVariant?.size === v.size;
                  const manageVarStock = clientConfig?.stockManagement?.variableProduct !== false;
                  const hasNoStock = manageVarStock && (v.stockQuantity === 0 || v.stock === 0);

                  return (
                    <button
                      key={v.size}
                      type="button"
                      disabled={hasNoStock}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (hasNoStock) return;
                        setSelectedVariant(isSelected ? null : v);
                      }}
                      className={`
                        w-full flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm transition-all
                        ${
                          hasNoStock
                            ? "opacity-50 cursor-not-allowed border-border bg-muted/20"
                            : isSelected
                            ? "border-primary bg-primary/8 ring-1 ring-primary/30 cursor-pointer"
                            : "border-border bg-background hover:border-primary/60 hover:bg-primary/5 cursor-pointer"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                          h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${hasNoStock ? "border-muted-foreground/30 bg-muted/40" : isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}
                        `}
                        >
                          {isSelected && !hasNoStock && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <span className="font-medium">{v.size}</span>
                        {hasNoStock && (
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1.5 py-0 font-medium"
                          >
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatBDT(vPrice)}</p>
                        {v.offerPrice != null && v.offerPrice < v.price && (
                          <p className="text-[10px] text-muted-foreground line-through">{formatBDT(v.price)}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Quantity</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button onClick={() => setQuantity((q) => q + 1)} className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {lineTotal !== null && (
            <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2">
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-base font-bold text-primary">{formatBDT(lineTotal)}</p>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button disabled={!canAdd} onClick={handleAdd} className="gap-2">
            <ShoppingBag className="h-4 w-4" /> Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const startInEditMode = searchParams.get("edit") === "true";

  const { user } = useAuth();
  const { data: order, isLoading: orderLoading, isError: orderError } = useOrder(id);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [billingName, setBillingName] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingThana, setBillingThana] = useState("");
  const [billingDistrict, setBillingDistrict] = useState("Dhaka");
  const [billingZip, setBillingZip] = useState("");

  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingThana, setShippingThana] = useState("");
  const [shippingDistrict, setShippingDistrict] = useState("Dhaka");
  const [shippingZip, setShippingZip] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(true);

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentPhone, setPaymentPhone] = useState("");

  const [orderStatus, setOrderStatus] = useState("Processing");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [cart, setCart] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [dialogProduct, setDialogProduct] = useState(null);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    search: searchQuery || undefined,
    category: categoryFilter !== "All" ? categoryFilter : undefined,
    brand: brandFilter !== "All" ? brandFilter : undefined,
  });
  const products = Array.isArray(productsResponse?.data) ? productsResponse.data : [];

  const isInStoreOrder = useMemo(() => checkIsInStoreOrder(order), [order]);

  useEffect(() => {
    if (order) {
      const bInfo = getBillingInfo(order);
      const sInfo = getShippingInfo(order);

      setBillingName(bInfo.fullName);
      setBillingPhone(bInfo.phone.replace(/^\+880?/, ""));
      setBillingEmail(bInfo.email);
      setBillingAddress(bInfo.address);
      setBillingThana(bInfo.thana);
      setBillingDistrict(bInfo.district || "Dhaka");
      setBillingZip(bInfo.zip);

      setShippingName(sInfo.fullName || bInfo.fullName);
      setShippingPhone((sInfo.phone || bInfo.phone).replace(/^\+880?/, ""));
      setShippingAddress(sInfo.address || bInfo.address);
      setShippingThana(sInfo.thana || bInfo.thana);
      setShippingDistrict(sInfo.district || bInfo.district || "Dhaka");
      setShippingZip(sInfo.zip || bInfo.zip);

      const isSame =
        !sInfo.address ||
        (sInfo.address === bInfo.address &&
          sInfo.district === bInfo.district &&
          sInfo.thana === bInfo.thana &&
          sInfo.fullName === bInfo.fullName &&
          sInfo.phone === bInfo.phone);
      setSameAsBilling(isSame);

      const initMethod = getInitialPaymentMethod(order, isInStoreOrder);
      setPaymentMethod(initMethod);

      const statusMap = {
        shipped: "Shipped",
        completed: "Completed",
        cancelled: "Cancelled",
        fake: "Fake",
        processing: "Processing",
      };
      const curStatus = String(order.status || order.orderStatus || "").toLowerCase();
      setOrderStatus(statusMap[curStatus] || "Processing");

      setDiscountAmount(order.discountTotalAmount || 0);
      setShippingFee(order.totals?.shippingFee ?? order.shippingTotalAmount ?? 0);
      setPaidAmount(getInitialPaidAmount(order, initMethod));
      setPaymentPhone(extractPaymentPhone(order));
      setCart(mapOrderItemsToCart(order.items));

      if (startInEditMode) {
        setIsEditMode(true);
      }
    }
  }, [order, startInEditMode, isInStoreOrder]);

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.name === item.name && c.size === item.size);
      if (existing) {
        return prev.map((c) =>
          c.name === item.name && c.size === item.size
            ? { ...c, quantity: c.quantity + item.quantity }
            : c,
        );
      }
      return [...prev, item];
    });
    toast.success(`${item.name} added to cart`);
  }, []);

  const updateQty = useCallback((id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const total = useMemo(
    () => Math.max(0, subtotal + shippingFee - discountAmount),
    [subtotal, shippingFee, discountAmount],
  );

  const calculatedPendingAmount = useMemo(
    () => calculatePendingAmount(total, paidAmount),
    [total, paidAmount],
  );

  const calculatedPaymentStatus = useMemo(
    () => calculatePaymentStatus(total, paidAmount, paymentMethod, orderStatus),
    [paidAmount, total, paymentMethod, orderStatus],
  );

  const isDigitalPayment = useMemo(() => {
    if (isInStoreOrder) return false;
    const m = paymentMethod.toLowerCase();
    return m === "bkash" || m === "nagad" || m === "rocket" || m === "bank";
  }, [isInStoreOrder, paymentMethod]);

  const paymentOptions = useMemo(
    () => resolvePaymentOptions(isInStoreOrder),
    [isInStoreOrder],
  );

  // Opens the printable invoice endpoint in a new browser tab
  const handleOpenInvoice = () => {
    const apiBase = (baseURL || getApiBaseUrl() || 'https://admin.surokkha.store').replace(/\/$/, '');
    const orderIdentifier = order?._id || order?.id || order?.did || order?.orderNumber || id;
    window.open(`${apiBase}/api/v1/orders/${orderIdentifier}/invoice`, '_blank', 'noopener,noreferrer');
  };

  // Saves edits made to the current order
  const handleSave = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty. Add at least one product.");
      return;
    }
    if (!billingName.trim()) {
      toast.error(isInStoreOrder ? "Customer Name is required." : "Billing Full Name is required.");
      return;
    }
    if (billingPhone.replace(/\D/g, "").length < 9) {
      toast.error("Please enter a valid Phone Number.");
      return;
    }

    if (!isInStoreOrder && !sameAsBilling) {
      if (!shippingName.trim()) {
        toast.error("Shipping Recipient Name is required.");
        return;
      }
      if (shippingPhone.replace(/\D/g, "").length < 9) {
        toast.error("Please enter a valid Shipping Phone Number.");
        return;
      }
      if (!shippingAddress.trim()) {
        toast.error("Shipping Address is required.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const billingPayload = {
        fullName: billingName,
        phone: billingPhone,
        email: billingEmail,
        address: billingAddress,
        thana: billingThana,
        district: billingDistrict,
        zip: billingZip,
      };

      const shippingPayload = isInStoreOrder || sameAsBilling
        ? {
            fullName: billingName,
            phone: billingPhone,
            address: billingAddress,
            thana: billingThana,
            district: billingDistrict,
            zip: billingZip,
          }
        : {
            fullName: shippingName,
            phone: shippingPhone,
            address: shippingAddress,
            thana: shippingThana,
            district: shippingDistrict,
            zip: shippingZip,
          };

      const orderPayload = buildUpdatePayload({
        orderStatus,
        paymentMethod,
        paidAmount,
        paymentPhone,
        isDigitalPayment,
        billingInfo: billingPayload,
        shippingInfo: shippingPayload,
        isInStoreOrder,
        cart,
        subtotal,
        shippingFee,
        discountAmount,
        couponCode: order?.couponCode || undefined,
        total,
        user,
      });

      await apiClient.put(`/api/v1/orders/${id}`, orderPayload);
      logActivity({
        type: 'updated',
        description: `Order #${order.orderNumber || id} updated (status: "${orderStatus}") by "${user?.name || 'Admin'}"`,
      });
      toast.success("Order updated successfully");
      queryClient.invalidateQueries(["order", id]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["activity-logs"]);
      setIsEditMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderLoading) {
    return (
      <div className="flex-1 p-8 space-y-4">
        <div className="h-10 w-1/3 bg-muted animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-muted animate-pulse rounded-xl" />
          <div className="h-96 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="flex-1 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">Order Not Found</h2>
        <p className="text-muted-foreground">The order you are looking for does not exist or failed to load.</p>
        <Button onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Button>
      </div>
    );
  }

  const effectiveTotal = order.totals?.total ?? order.totalAmount ?? 0;
  const effectivePaid = order.paymentDetails?.paidAmount ?? order.paidAmount ?? (order.paymentStatus === "Paid" ? effectiveTotal : 0);
  const effectivePending = calculatePendingAmount(effectiveTotal, effectivePaid);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard/orders")}
            className="h-9 w-9 border-border/80 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Order {order.orderNumber}
              </h2>
              <div className="flex items-center gap-1.5 flex-wrap">
                {getFulfillmentBadge(order.status || order.orderStatus || "")}
                {getPaymentBadge(order.paymentStatus || (effectivePending === 0 && effectiveTotal > 0 ? "Paid" : effectivePaid > 0 ? "Partial" : "Pending"))}
                {order.couponCode && (
                  <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono font-bold text-xs py-1 px-2.5">
                    <Tag className="h-3 w-3 text-emerald-500" />
                    Coupon: {order.couponCode}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Placed on {formatDateTime(order.createdAt || order.date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button variant="outline" className="gap-1.5" onClick={() => setIsEditMode(false)}>
                <Eye className="h-4 w-4" /> View Details
              </Button>
              <Button className="gap-1.5 shadow-sm" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-1 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <PathaoCourierCard
                order={order}
                triggerOnly
                triggerButtonVariant="outline"
                triggerButtonClassName="h-9 text-xs bg-background shadow-sm"
              />
              <Button variant="outline" className="gap-1.5 shadow-sm bg-background cursor-pointer" onClick={handleOpenInvoice}>
                <FileText className="h-4 w-4 text-muted-foreground" /> Print Invoice
              </Button>
              <Button variant="outline" className="gap-1.5 shadow-sm bg-background cursor-pointer" onClick={() => setSendEmailModalOpen(true)}>
                <Mail className="h-4 w-4 text-muted-foreground" /> Send via Email
              </Button>
              <Button className="gap-1.5 shadow-sm cursor-pointer" onClick={() => setIsEditMode(true)}>
                <Edit className="h-4 w-4" /> Edit Order
              </Button>
            </div>
          )}
        </div>
      </div>

      {!isEditMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border/80 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/60 bg-muted/20">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> Order Items
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Product</th>
                      <th className="px-6 py-3 font-semibold text-center">Size</th>
                      <th className="px-6 py-3 font-semibold text-center">Quantity</th>
                      <th className="px-6 py-3 font-semibold text-right">Price</th>
                      <th className="px-6 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <tr key={index} className="hover:bg-muted/10">
                          <td className="px-6 py-4 font-medium">{item.name}</td>
                          <td className="px-6 py-4 text-center">
                            {item.size ? (
                              <Badge variant="outline" className="border-primary/30 text-primary font-medium">
                                {item.size}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatBDT(item.unitPrice ?? item.price ?? 0)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-primary">
                            {formatBDT(((item.unitPrice ?? item.price ?? 0) * item.quantity))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          No items in this order.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-base border-b pb-3">Payment Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-medium text-foreground">{formatBDT(order.totals?.subtotal ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span className="font-medium text-foreground">{formatBDT(order.totals?.shippingFee ?? order.shippingTotalAmount ?? 0)}</span>
                </div>
                {order.couponCode ? (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium py-1.5 px-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Tag className="h-3.5 w-3.5 text-emerald-500" />
                      Coupon Applied (<span className="font-mono uppercase font-bold">{order.couponCode}</span>)
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      -{formatBDT(order.discountTotalAmount || order.totals?.discount || 0)}
                    </span>
                  </div>
                ) : order.discountTotalAmount ? (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Discount</span>
                    <span>-{formatBDT(order.discountTotalAmount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-base font-bold pt-3 border-t border-border/85">
                  <span>Total Amount</span>
                  <span className="text-primary">{formatBDT(effectiveTotal)}</span>
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-muted-foreground font-medium">Paid Amount</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatBDT(effectivePaid)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Remaining Pending</span>
                  <span className={`font-bold ${effectivePending > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"}`}>
                    {formatBDT(effectivePending)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isInStoreOrder ? (
              <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Customer Info
                  </h3>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    In-Store
                  </Badge>
                </div>
                <div className="space-y-3.5 text-sm">
                  <div className="flex items-start gap-2.5">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Customer Name</span>
                      <span className="font-medium text-foreground">
                        {order.billingInfo?.fullName || order.customer?.fullName || order.customerName || "Walk-in Customer"}
                      </span>
                    </div>
                  </div>
                  {(order.billingInfo?.phone || order.customer?.phone) && (
                    <div className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Phone</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`tel:${order.billingInfo?.phone || order.customer?.phone}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {order.billingInfo?.phone || order.customer?.phone}
                          </a>
                          <a
                            href={`tel:${order.billingInfo?.phone || order.customer?.phone}`}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-105 shrink-0"
                            title="Call Customer"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                            title="Copy Phone Number"
                            onClick={() => handleCopyText(order.billingInfo?.phone || order.customer?.phone, 'Phone number')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={getWhatsAppLink(order.billingInfo?.phone || order.customer?.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 shrink-0"
                            title="Message on WhatsApp"
                          >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                  {(order.billingInfo?.email || order.customer?.email) && (
                    <div className="flex items-start gap-2.5">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Email</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <a
                            href={`mailto:${order.billingInfo?.email || order.customer?.email}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {order.billingInfo?.email || order.customer?.email}
                          </a>
                          <a
                            href={`mailto:${order.billingInfo?.email || order.customer?.email}`}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all hover:scale-105 shrink-0"
                            title="Send Email"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                            title="Copy Email"
                            onClick={() => handleCopyText(order.billingInfo?.email || order.customer?.email, 'Email')}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Billing Address Card */}
                <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Billing Address
                    </h3>
                    <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground font-normal">
                      Billing
                    </Badge>
                  </div>
                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-start gap-2.5">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Customer Name</span>
                        <span className="font-semibold text-foreground">
                          {order.billingInfo?.fullName || order.customer?.fullName || order.customerName || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Phone</span>
                        {order.billingInfo?.phone || order.customer?.phone ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`tel:${order.billingInfo?.phone || order.customer?.phone}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {order.billingInfo?.phone || order.customer?.phone}
                            </a>
                            <a
                              href={`tel:${order.billingInfo?.phone || order.customer?.phone}`}
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-105 shrink-0"
                              title="Call Customer"
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                              title="Copy Phone Number"
                              onClick={() => handleCopyText(order.billingInfo?.phone || order.customer?.phone, 'Phone number')}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={getWhatsAppLink(order.billingInfo?.phone || order.customer?.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 shrink-0"
                              title="Message on WhatsApp"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">N/A</span>
                        )}
                      </div>
                    </div>
                    {(order.billingInfo?.email || order.customer?.email) && (
                      <div className="flex items-start gap-2.5">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs text-muted-foreground block">Email</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`mailto:${order.billingInfo?.email || order.customer?.email}`}
                              className="font-medium text-foreground hover:underline"
                            >
                              {order.billingInfo?.email || order.customer?.email}
                            </a>
                            <a
                              href={`mailto:${order.billingInfo?.email || order.customer?.email}`}
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 transition-all hover:scale-105 shrink-0"
                              title="Send Email"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                              title="Copy Email"
                              onClick={() => handleCopyText(order.billingInfo?.email || order.customer?.email, 'Email')}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Address</span>
                        <span className="font-medium text-foreground leading-snug block">
                          {order.billingInfo?.address || order.customer?.address || "N/A"}
                        </span>
                        {(order.billingInfo?.thana || order.billingInfo?.district || order.billingInfo?.zip || order.customer?.thana || order.customer?.district || order.customer?.city || order.customer?.zip) && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                            {(order.billingInfo?.thana || order.customer?.thana) && (
                              <span>Thana: {order.billingInfo?.thana || order.customer?.thana}</span>
                            )}
                            {(order.billingInfo?.thana || order.customer?.thana) && (order.billingInfo?.district || order.customer?.district || order.customer?.city) && <span>•</span>}
                            {(order.billingInfo?.district || order.customer?.district || order.customer?.city) && (
                              <span>District: {order.billingInfo?.district || order.customer?.district || order.customer?.city}</span>
                            )}
                            {(order.billingInfo?.zip || order.customer?.zip) && <span>•</span>}
                            {(order.billingInfo?.zip || order.customer?.zip) && (
                              <span>Zip: {order.billingInfo?.zip || order.customer?.zip}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address Card */}
                <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" /> Shipping Address
                    </h3>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0 text-primary bg-primary/10 border-primary/20">
                      Delivery
                    </Badge>
                  </div>
                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-start gap-2.5">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Recipient Name</span>
                        <span className="font-semibold text-foreground">
                          {order.shippingInfo?.fullName || order.billingInfo?.fullName || order.customer?.fullName || order.customerName || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Phone</span>
                        {order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`tel:${order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone}`}
                              className="font-semibold text-primary hover:underline"
                            >
                              {order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone}
                            </a>
                            <a
                              href={`tel:${order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone}`}
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-all hover:scale-105 shrink-0"
                              title="Call Customer"
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-all hover:scale-105 shrink-0 cursor-pointer"
                              title="Copy Phone Number"
                              onClick={() => handleCopyText(order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone, 'Phone number')}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <a
                              href={getWhatsAppLink(order.shippingInfo?.phone || order.billingInfo?.phone || order.customer?.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all hover:scale-105 shrink-0"
                              title="Message on WhatsApp"
                            >
                              <WhatsAppIcon className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="font-medium text-foreground">N/A</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Delivery Address</span>
                        <span className="font-medium text-foreground leading-snug block">
                          {order.shippingInfo?.address || order.billingInfo?.address || order.customer?.address || "N/A"}
                        </span>
                        {(order.shippingInfo?.thana || order.shippingInfo?.district || order.shippingInfo?.zip || order.billingInfo?.thana || order.billingInfo?.district || order.billingInfo?.zip) && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                            {(order.shippingInfo?.thana || order.billingInfo?.thana) && (
                              <span>Thana: {order.shippingInfo?.thana || order.billingInfo?.thana}</span>
                            )}
                            {(order.shippingInfo?.thana || order.billingInfo?.thana) && (order.shippingInfo?.district || order.shippingInfo?.city || order.billingInfo?.district) && <span>•</span>}
                            {(order.shippingInfo?.district || order.shippingInfo?.city || order.billingInfo?.district) && (
                              <span>District: {order.shippingInfo?.district || order.shippingInfo?.city || order.billingInfo?.district}</span>
                            )}
                            {(order.shippingInfo?.zip || order.billingInfo?.zip) && <span>•</span>}
                            {(order.shippingInfo?.zip || order.billingInfo?.zip) && (
                              <span>Zip: {order.shippingInfo?.zip || order.billingInfo?.zip}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 pt-1 border-t border-border/60">
                      <Truck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-muted-foreground block">Shipping Method</span>
                        <span className="font-medium text-foreground">
                          {(order.totals?.shippingFee ?? order.shippingTotalAmount) === 0 ? "Free Shipping" : "Flat Rate Delivery"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pathao Courier Dispatch & Tracking Card */}
                <PathaoCourierCard order={order} />
              </>
            )}

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-3">
                <CreditCard className="h-4 w-4 text-primary" /> Method Details
              </h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Payment Method</span>
                  <span className="font-semibold text-foreground capitalize flex items-center gap-1.5 mt-0.5">
                    <CreditCard className="h-4 w-4 text-primary" />
                    {order.paymentMethod || "N/A"}
                  </span>
                </div>
                {(paymentPhone || (order.paymentMethod || "").includes("+880")) && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Payment Account / Phone</span>
                    <span className="font-semibold text-primary flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-4 w-4 text-primary" />
                      {paymentPhone ? `+880${paymentPhone}` : (order.paymentMethod.match(/\+880?\d+/)?.[0] || "N/A")}
                    </span>
                  </div>
                )}
                {order.couponCode && (
                  <div>
                    <span className="text-xs text-muted-foreground block">Applied Coupon</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <Tag className="h-4 w-4 text-emerald-500" />
                      {order.couponCode}
                      {(order.discountTotalAmount || 0) > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">
                          (-{formatBDT(order.discountTotalAmount)} discount)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground block">Shipping Type</span>
                  <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Truck className="h-4 w-4 text-primary" />
                    {(order.totals?.shippingFee ?? order.shippingTotalAmount) === 0 ? "Free Shipping / In-Store" : "Flat Rate Delivery"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4 animate-in fade-in duration-300">
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Product Catalogue
              </h3>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    className="pl-8 h-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {products.map((product) => {
                    const inCart = cart.filter((c) => c.name === product.name);
                    const cartQty = inCart.reduce((s, c) => s + c.quantity, 0);
                    const isOutOfStock = product.status === "Out of Stock";
                    const isVariant = product.type === "variant";
                    const displayPrice = isVariant
                      ? Math.min(
                          ...(product.variants || []).map((v) =>
                            effectivePrice(v.price, v.offerPrice ?? null),
                          ),
                        )
                      : effectivePrice(product.price, product.offerPrice ?? null);

                    return (
                      <div
                        key={product.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border bg-background transition-all
                          ${isOutOfStock ? "opacity-50" : "hover:border-primary/40 hover:shadow-sm"}
                          ${cartQty > 0 ? "border-primary/50 bg-primary/3" : "border-border"}
                        `}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative border border-border/60">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs md:text-sm leading-tight truncate">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">{product.sku}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs md:text-sm font-semibold text-primary">
                              {isVariant ? `from ${formatBDT(displayPrice)}` : formatBDT(displayPrice)}
                            </span>
                            {isVariant && (
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 gap-0.5 scale-90 origin-left">
                                <Layers className="h-2 w-2" /> {product.variants?.length ?? 0} sizes
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                          {cartQty > 0 && (
                            <span className="text-[9px] font-semibold text-primary">×{cartQty}</span>
                          )}
                          <button
                            disabled={isOutOfStock}
                            onClick={() => !isOutOfStock && setDialogProduct(product)}
                            className={`
                              h-7 w-7 rounded-lg flex items-center justify-center transition-all
                              ${isOutOfStock ? "bg-muted cursor-not-allowed text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/80 active:scale-95 shadow-sm"}
                            `}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 animate-in fade-in duration-300">
            {isInStoreOrder ? (
              <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> In-Store Customer Details
                  </h3>
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    In-Store
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-0.5 block">Customer Name</label>
                    <Input placeholder="Walk-in Customer" value={billingName} onChange={(e) => setBillingName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-0.5 block">Phone Number</label>
                    <div className="flex items-center h-9 w-full rounded-lg border border-input bg-transparent overflow-hidden">
                      <span className="bg-muted/50 h-full flex items-center px-2 text-xs text-muted-foreground border-r font-medium">+880</span>
                      <input
                        type="text"
                        className="flex-1 h-full bg-transparent px-2 text-xs outline-none"
                        placeholder="1XXXXXXXXX"
                        maxLength={11}
                        value={billingPhone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.startsWith("0")) val = val.slice(1);
                          setBillingPhone(val.slice(0, 10));
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-0.5 block">Email</label>
                    <Input placeholder="email@example.com" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Billing Address Edit Form */}
                <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Billing Address
                    </h3>
                    <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground font-normal">
                      Billing
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground mb-0.5 block">Full Name *</label>
                      <Input placeholder="Full Name" value={billingName} onChange={(e) => setBillingName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Phone Number *</label>
                      <div className="flex items-center h-9 w-full rounded-lg border border-input bg-transparent overflow-hidden">
                        <span className="bg-muted/50 h-full flex items-center px-2 text-xs text-muted-foreground border-r font-medium">+880</span>
                        <input
                          type="text"
                          className="flex-1 h-full bg-transparent px-2 text-xs outline-none"
                          placeholder="1XXXXXXXXX"
                          maxLength={11}
                          value={billingPhone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.startsWith("0")) val = val.slice(1);
                            setBillingPhone(val.slice(0, 10));
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Email Address</label>
                      <Input placeholder="email@example.com" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground mb-0.5 block">Street Address *</label>
                      <Input placeholder="Street address details" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">Thana</label>
                      <Input placeholder="Thana" value={billingThana} onChange={(e) => setBillingThana(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-0.5 block">District / City *</label>
                      <Input placeholder="District" value={billingDistrict} onChange={(e) => setBillingDistrict(e.target.value)} />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs text-muted-foreground mb-0.5 block">Postal Code / Zip</label>
                      <Input placeholder="Zip Code" value={billingZip} onChange={(e) => setBillingZip(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Shipping Address Edit Form */}
                <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" /> Shipping Address
                    </h3>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs select-none">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => setSameAsBilling(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <span className="text-muted-foreground font-medium">Same as billing</span>
                    </label>
                  </div>

                  {!sameAsBilling ? (
                    <div className="grid grid-cols-2 gap-2 text-sm pt-1">
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-0.5 block">Recipient Full Name *</label>
                        <Input placeholder="Recipient Name" value={shippingName} onChange={(e) => setShippingName(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-0.5 block">Contact Phone Number *</label>
                        <div className="flex items-center h-9 w-full rounded-lg border border-input bg-transparent overflow-hidden">
                          <span className="bg-muted/50 h-full flex items-center px-2 text-xs text-muted-foreground border-r font-medium">+880</span>
                          <input
                            type="text"
                            className="flex-1 h-full bg-transparent px-2 text-xs outline-none"
                            placeholder="1XXXXXXXXX"
                            maxLength={11}
                            value={shippingPhone}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, "");
                              if (val.startsWith("0")) val = val.slice(1);
                              setShippingPhone(val.slice(0, 10));
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-0.5 block">Shipping Address *</label>
                        <Input placeholder="Street address details" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-0.5 block">Thana</label>
                        <Input placeholder="Thana" value={shippingThana} onChange={(e) => setShippingThana(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-0.5 block">District / City *</label>
                        <Input placeholder="District" value={shippingDistrict} onChange={(e) => setShippingDistrict(e.target.value)} />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-muted-foreground mb-0.5 block">Postal Code / Zip</label>
                        <Input placeholder="Zip Code" value={shippingZip} onChange={(e) => setShippingZip(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border border-dashed flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Delivery address is same as billing address.</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2 border-b pb-2">
                Order Items Cart
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs px-2 py-0">
                    {cart.reduce((s, c) => s + c.quantity, 0)} items
                  </Badge>
                )}
              </h3>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No items in the order cart</p>
                  <p className="text-[10px] mt-1">Select from the catalogue to add items</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 border-b pb-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-[11px] font-semibold text-foreground truncate max-w-[160px]">{item.name}</p>
                          {item.size ? (
                            <Badge variant="outline" className="text-[8px] border-primary/20 text-primary py-0 px-1 h-3.5 flex items-center font-medium">
                              {item.size}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {formatBDT(item.price)} × {item.quantity} = <span className="font-semibold text-foreground">{formatBDT(item.price * item.quantity)}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, -1)} className="h-5 w-5 rounded border flex items-center justify-center hover:bg-muted transition-colors">
                          <Minus className="h-2 w-2" />
                        </button>
                        <span className="w-4 text-center text-[10px] font-semibold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="h-5 w-5 rounded border flex items-center justify-center hover:bg-muted transition-colors">
                          <Plus className="h-2 w-2" />
                        </button>
                        <button onClick={() => removeFromCart(item.id)} className="h-5 w-5 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-0.5">
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <div className="mt-4 pt-1 space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">{formatBDT(subtotal)}</span>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <span className="text-muted-foreground">Shipping Fee</span>
                    <div className="flex justify-end">
                      <Input type="number" className="w-24 text-right h-7 px-2 text-xs" value={shippingFee} min={0} onChange={(e) => setShippingFee(Number(e.target.value || 0))} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 items-center gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-muted-foreground">Discount</span>
                      {order?.couponCode && (
                        <Badge variant="outline" className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-1.5 py-0">
                          <Tag className="h-2.5 w-2.5 mr-0.5" />
                          {order.couponCode}
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Input type="number" className="w-24 text-right h-7 px-2 text-xs" value={discountAmount} min={0} onChange={(e) => setDiscountAmount(Number(e.target.value || 0))} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm md:text-base font-bold mt-2 pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatBDT(total)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-base flex items-center gap-2 border-b pb-2">Order & Payment Update</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-muted-foreground mb-1 block">Status</label>
                  <Select value={orderStatus} onValueChange={(val) => setOrderStatus(val ?? "Processing")}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                      <SelectItem value="Fake" className="text-destructive font-medium">Fake</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val ?? (isInStoreOrder ? "cash" : "cod"))}>
                    <SelectTrigger className="w-full h-8">
                      <SelectValue placeholder="Select Payment Method">
                        {(val) => getPaymentMethodLabel(val || paymentMethod)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {paymentOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isDigitalPayment && (
                  <div className="col-span-2">
                    <label className="text-muted-foreground mb-1 block">Payment Phone / Account No.</label>
                    <div className="flex items-center h-8 w-full rounded-lg border border-input bg-transparent overflow-hidden">
                      <span className="bg-muted/50 h-full flex items-center px-2 text-xs text-muted-foreground border-r font-medium">+880</span>
                      <input
                        type="text"
                        className="flex-1 h-full bg-transparent px-2 text-xs outline-none"
                        placeholder="1XXXXXXXXX"
                        maxLength={11}
                        value={paymentPhone}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, "");
                          if (val.startsWith("0")) val = val.slice(1);
                          setPaymentPhone(val.slice(0, 10));
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="col-span-2 space-y-2 pt-2 border-t border-border">
                  <div className="grid grid-cols-2 items-center gap-2">
                    <label className="text-xs font-semibold text-foreground">Paid Amount (৳)</label>
                    <Input
                      type="number"
                      className="h-8 text-right font-medium text-xs"
                      min={0}
                      max={total}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value || 0))}
                    />
                  </div>

                  <div className="bg-muted/40 rounded-lg p-2.5 space-y-1.5 border border-border/60">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Paid Amount:</span>
                      <span className="font-semibold text-emerald-600">{formatBDT(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Remaining Pending:</span>
                      <span className={`font-bold ${calculatedPendingAmount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                        {formatBDT(calculatedPendingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                      <span className="text-muted-foreground">Payment Status:</span>
                      {getPaymentBadge(calculatedPaymentStatus)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProductAddDialog product={dialogProduct} onClose={() => setDialogProduct(null)} onAddToCart={addToCart} />

      <SendOrderInvoiceModal
        open={sendEmailModalOpen}
        onOpenChange={setSendEmailModalOpen}
        order={order}
      />
    </div>
  );
};

export default OrderDetailsPage;
