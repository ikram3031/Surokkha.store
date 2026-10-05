import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/use-products";
import { apiClient, baseURL, getApiBaseUrl } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useCategories, useBrands } from "@/lib/category-cache";
import { toast } from "sonner";
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
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  Package,
  X,
  Layers,
  Tag,
  Truck,
  FileText,
  Percent,
  CircleDollarSign,
  ChevronDown,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

import { effectivePrice, formatBDT } from "@/utils/orderHelper";
import { clientConfig } from "@/clientConfig";
import { resolvePaymentOptions, getPaymentMethodLabel } from "@/utils/orderDetailsHelper";
import { DISTRICTS, DISTRICT_THANAS } from "@/data/districts";
import { SendOrderInvoiceModal } from "@/components/dashboard/orders/SendOrderInvoiceModal";

// Modal dialog for selecting product variation & quantity
const ProductAddDialog = ({ product, onClose, onAddToCart }) => {
  const { t } = useTranslation();
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

    const cartKey = isVariant
      ? `${product.id}__${selectedVariant.size}`
      : product.id;

    onAddToCart({
      id: cartKey,
      name: isVariant
        ? `${product.name} (${selectedVariant.size})`
        : product.name,
      price: displayPrice,
      quantity,
      image: product.image,
      sku: isVariant ? selectedVariant.sku || product.sku : product.sku,
      size: isVariant ? selectedVariant.size : "",
    });

    setSelectedVariant(null);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog
      open={product !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-snug pr-6">
            {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isVariant
              ? t("products.attributes_variations", "Select a size / variation to add to cart")
              : t("orders.select_product", "Confirm quantity to add")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 -mt-1">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs text-muted-foreground">{product.sku}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 gap-1"
              >
                {isVariant ? (
                  <>
                    <Layers className="h-2.5 w-2.5" /> {t("products.attributes_variations", "Variable")}
                  </>
                ) : (
                  <>
                    <Tag className="h-2.5 w-2.5" /> {t("products.stock_status", "Simple")}
                  </>
                )}
              </Badge>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {product.category}
              </Badge>
            </div>
          </div>
        </div>

        {!isVariant && (
          <div className="bg-muted/50 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{formatBDT(simplePrice)}</p>
              {product.offerPrice != null &&
                product.offerPrice < product.price && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatBDT(product.price)}
                  </p>
                )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium mr-2">{t("products.stock_status", "Stock Status")}</p>
              <Badge
                variant={(product.stock ?? 0) > 0 ? "secondary" : "destructive"}
                className="text-xs"
              >
                {(product.stock ?? 0) > 0 ? `${product.stock} ${t("products.in_stock", "in stock")}` : t("products.out_of_stock", "Out of Stock")}
              </Badge>
            </div>
          </div>
        )}

        {isVariant && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("products.attributes_variations", "Select Size / Variation")}
            </p>
            <div className="grid grid-cols-1 gap-2">
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
                            {t("products.out_of_stock", "Out of Stock")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatBDT(vPrice)}
                        </p>
                        {v.offerPrice != null && v.offerPrice < v.price && (
                          <p className="text-[10px] text-muted-foreground line-through">
                            {formatBDT(v.price)}
                          </p>
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
            <p className="text-sm font-medium">{t("common.quantity", "Quantity")}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          {lineTotal !== null && (
            <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-2">
              <p className="text-sm text-muted-foreground">{t("common.subtotal", "Subtotal")}</p>
              <p className="text-base font-bold text-primary">
                {formatBDT(lineTotal)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton>
          <Button disabled={!canAdd} onClick={handleAdd} className="gap-2 cursor-pointer">
            <ShoppingBag className="h-4 w-4" />
            {t("orders.add_to_cart", "Add to Cart")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main container component for Creating Custom Orders
const NewCustomOrderPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Product Catalogue filters & state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const { data: productsResponse, isLoading: productsLoading } = useProducts({
    search: searchQuery || undefined,
    category: categoryFilter !== "All" ? categoryFilter : undefined,
    brand: brandFilter !== "All" ? brandFilter : undefined,
  });
  const products = Array.isArray(productsResponse?.data)
    ? productsResponse.data
    : [];

  // Cart & Dialog state
  const [cart, setCart] = useState([]);
  const [dialogProduct, setDialogProduct] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer & Billing State (Matching Surokkha Checkout Architecture)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingDistrict, setBillingDistrict] = useState("Dhaka");
  const [billingThana, setBillingThana] = useState("");
  const [isDistrictOpen, setIsDistrictOpen] = useState(false);
  const [isThanaOpen, setIsThanaOpen] = useState(false);

  // Shipping State (Conditional if "Ship to a different address" is checked)
  const [shipToDifferent, setShipToDifferent] = useState(false);
  const [shipRecipientName, setShipRecipientName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [shipAddress, setShipAddress] = useState("");
  const [shipDistrict, setShipDistrict] = useState("Dhaka");
  const [shipThana, setShipThana] = useState("");
  const [isShipDistrictOpen, setIsShipDistrictOpen] = useState(false);
  const [isShipThanaOpen, setIsShipThanaOpen] = useState(false);

  // Order Notes & Payment
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Custom Discount State (Percentage vs Fixed Amount)
  const [discountType, setDiscountType] = useState("fixed"); // 'fixed' or 'percent'
  const [discountValue, setDiscountValue] = useState("");

  const paymentOptions = useMemo(() => resolvePaymentOptions(false), []);

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + item.quantity } : c,
        );
      }
      return [...prev, item];
    });
    toast.success(`${item.name} ${t("orders.add_to_cart", "added to cart")}`);
  }, [t]);

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

  // Auto-calculate Delivery Fee based on active destination district & thana
  const deliveryFee = useMemo(() => {
    if (cart.length === 0) return 0;
    const activeDist = (shipToDifferent ? shipDistrict : billingDistrict).trim().toLowerCase();
    const activeTh = (shipToDifferent ? shipThana : billingThana).trim().toLowerCase();

    if (activeDist === "dhaka") {
      const suburbThanas = ["savar", "ashulia", "dhamrai", "keraniganj", "nawabganj", "dohar"];
      if (suburbThanas.includes(activeTh)) {
        return 90; // Dhaka Suburbs
      }
      return 70; // Inside Dhaka City
    } else if (activeDist === "gazipur" || activeDist === "narayanganj") {
      return 90; // Dhaka Suburbs
    } else if (activeDist) {
      return 120; // Outside Dhaka
    }
    return 70;
  }, [cart.length, shipToDifferent, shipDistrict, shipThana, billingDistrict, billingThana]);

  // Calculate discount amount based on type
  const discountAmount = useMemo(() => {
    const raw = parseFloat(discountValue);
    if (isNaN(raw) || raw <= 0) return 0;

    if (discountType === "percent") {
      const pct = Math.min(100, raw);
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(raw, subtotal);
  }, [discountType, discountValue, subtotal]);

  const finalTotal = useMemo(
    () => Math.max(0, subtotal + deliveryFee - discountAmount),
    [subtotal, deliveryFee, discountAmount],
  );

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isEmailInvalid = Boolean(customerEmail.trim() && !isValidEmail(customerEmail.trim()));

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error(t("orders.cart_empty", "Cart is empty. Add at least one product."));
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer Full Name is required.");
      return;
    }
    if (customerPhone.trim().length < 10) {
      toast.error("Please enter a valid 10-digit Phone Number.");
      return;
    }
    if (customerEmail.trim() && !isValidEmail(customerEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!billingAddress.trim()) {
      toast.error("Billing street address is required.");
      return;
    }
    if (!billingDistrict.trim()) {
      toast.error("Billing District is required.");
      return;
    }

    const subDistricts = ["dhaka", "gazipur", "narayanganj"];
    if (subDistricts.includes(billingDistrict.toLowerCase()) && !billingThana.trim()) {
      toast.error(`Thana is required for ${billingDistrict}.`);
      return;
    }

    if (shipToDifferent) {
      if (!shipRecipientName.trim()) {
        toast.error("Shipping Recipient Name is required.");
        return;
      }
      if (shipPhone.trim().length < 10) {
        toast.error("Shipping Recipient Phone is required.");
        return;
      }
      if (!shipAddress.trim()) {
        toast.error("Shipping Street Address is required.");
        return;
      }
      if (!shipDistrict.trim()) {
        toast.error("Shipping District is required.");
        return;
      }
      if (subDistricts.includes(shipDistrict.toLowerCase()) && !shipThana.trim()) {
        toast.error(`Shipping Thana is required for ${shipDistrict}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const fullPaymentMethod = getPaymentMethodLabel(paymentMethod);

      const billingInfo = {
        fullName: customerName.trim(),
        phone: customerPhone.startsWith("+880") ? customerPhone.trim() : `+880${customerPhone.trim()}`,
        email: customerEmail.trim() || "",
        address: billingAddress.trim(),
        thana: billingThana.trim(),
        district: billingDistrict.trim(),
        zip: "",
      };

      const shippingInfo = shipToDifferent
        ? {
            fullName: shipRecipientName.trim(),
            phone: shipPhone.startsWith("+880") ? shipPhone.trim() : `+880${shipPhone.trim()}`,
            address: shipAddress.trim(),
            thana: shipThana.trim(),
            district: shipDistrict.trim(),
            zip: "",
          }
        : { ...billingInfo };

      const orderPayload = {
        orderType: "custom",
        status: "processing",
        paymentMethod: fullPaymentMethod,
        billingInfo,
        shippingInfo,
        shipToDifferentAddress: shipToDifferent,
        orderNotes: orderNotes.trim(),
        giftWrap: false,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          size: item.size || "",
          concentration: "",
        })),
        subtotal,
        discountTotalAmount: discountAmount,
        shippingFee: deliveryFee,
        shippingTotalAmount: deliveryFee,
        tax: 0,
        total: finalTotal,
        paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
        createdBy: user?.did || "staff",
      };

      const orderResponse = await apiClient.post(
        "/api/v1/orders/new-order",
        orderPayload,
      );

      const order = orderResponse.data.data;
      const orderId = order.id || order._id;
      const orderNumber = order.orderNumber;

      const invoiceUrl = `https://${clientConfig?.domain || 'plexivia.online'}/invoice/${orderNumber}`;
      const invoiceItems = cart.map((item) => ({
        description: item.name,
        price: formatBDT(item.price),
        quantity: item.quantity,
        total: formatBDT(item.price * item.quantity),
      }));

      setCompletedOrder({
        order,
        orderNumber,
        invoiceUrl,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || "",
        customerPhone: billingInfo.phone,
        deliveryAddress: shippingInfo.address,
        district: shippingInfo.district,
        thana: shippingInfo.thana,
        subtotalAmount: subtotal,
        shippingFee: deliveryFee,
        discountAmount,
        totalAmount: finalTotal,
        paymentMethod: fullPaymentMethod,
        items: invoiceItems,
      });

      toast.success(
        t("orders.order_created_success", `Custom order #${orderNumber} created successfully.`),
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.join(", ") ||
        t("common.error", "Failed to create custom order.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!completedOrder) return;
    const apiBase = (baseURL || getApiBaseUrl() || 'https://admin.surokkha.store').replace(/\/$/, '');
    const orderIdentifier = completedOrder?.order?._id || completedOrder?.order?.id || completedOrder?.order?.did || completedOrder?.orderNumber;
    window.open(`${apiBase}/api/v1/orders/${orderIdentifier}/invoice`, '_blank', 'noopener,noreferrer');
  };

  const closeCompletedDialog = () => {
    setCompletedOrder(null);
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setBillingAddress("");
    setBillingThana("");
    setShipRecipientName("");
    setShipPhone("");
    setShipAddress("");
    setShipThana("");
    setShipToDifferent(false);
    setDiscountValue("");
    setOrderNotes("");
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => window.history.back()}
          className="h-9 w-9 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("nav.new_custom_order", "New Custom Order")}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("orders.custom_orders_subtitle", "Create a tailored customer order with automated delivery charge & custom discount")} •{" "}
            <span className="font-mono font-semibold text-primary">CO</span> ID Prefix
          </p>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1 (TOP): PRODUCT SELECTION & CART ITEMS (Matched Fixed Height)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Catalogue (Fixed Height) */}
        <div className="lg:col-span-7 bg-card border rounded-2xl p-5 shadow-xs flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {t("nav.products", "Product Catalogue")}
            </h3>
            <span className="text-xs text-muted-foreground">
              {products.length} {t("products.total", "products available")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 shrink-0">
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v ?? "All")}
            >
              <SelectTrigger className="w-full h-8 text-xs cursor-pointer">
                <SelectValue placeholder={t("products.category", "Category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-xs">{t("common.all", "All Categories")}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.did} value={cat.slug || cat.did} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("products.search_products", "Search by name / SKU...")}
                className="pl-8 h-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Scrollable List */}
          <div className="flex-1 overflow-y-auto pr-1">
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                <Package className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-xs">{t("common.no_data", "No products found")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {products.map((product) => {
                  const inCart = cart.filter((c) => c.id.startsWith(product.id));
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
                        flex items-center gap-2.5 p-2.5 rounded-xl border bg-background transition-all
                        ${isOutOfStock ? "opacity-50" : "hover:border-primary/40 hover:shadow-xs"}
                        ${cartQty > 0 ? "border-primary/50 bg-primary/[0.02]" : "border-border"}
                      `}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative border border-border/50">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs leading-tight truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {product.sku || product.category || "Item"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-primary">
                            {formatBDT(displayPrice)}
                          </span>
                          {isVariant && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 h-4"
                            >
                              <Layers className="h-2 w-2 mr-0.5" />
                              {product.variants?.length ?? 0}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-0.5">
                        {cartQty > 0 && (
                          <span className="text-[10px] font-bold text-primary">
                            ×{cartQty}
                          </span>
                        )}
                        <button
                          disabled={isOutOfStock}
                          onClick={() => !isOutOfStock && setDialogProduct(product)}
                          className={`
                            h-7 w-7 rounded-lg flex items-center justify-center transition-all cursor-pointer
                            ${
                              isOutOfStock
                                ? "bg-muted cursor-not-allowed text-muted-foreground"
                                : "bg-primary text-primary-foreground hover:bg-primary/80 active:scale-95 shadow-xs"
                            }
                          `}
                          title={isOutOfStock ? t("products.out_of_stock", "Out of Stock") : t("orders.add_to_cart", "Add to cart")}
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

        {/* Right Column: Cart Items List (Matched Fixed Height) */}
        <div className="lg:col-span-5 bg-card border rounded-2xl p-5 shadow-xs flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              {t("orders.cart_items", "Cart Items")}
            </h3>
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-xs font-semibold">
                {cart.reduce((s, c) => s + c.quantity, 0)} {t("orders.items", "items")}
              </Badge>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-10">
              <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-medium">{t("orders.cart_empty", "No items added yet")}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {t("orders.select_product", "Click + on any product from catalogue")}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative border border-border/50">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatBDT(item.price)} × {item.quantity} ={" "}
                      <span className="font-bold text-foreground">
                        {formatBDT(item.price * item.quantity)}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="h-6 w-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="h-6 w-6 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="h-6 w-6 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-0.5 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="pt-3 border-t border-border mt-2 shrink-0 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t("common.subtotal", "Cart Subtotal")}:</span>
              <span className="font-bold text-sm text-foreground">{formatBDT(subtotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          SECTION 2 (BOTTOM): CUSTOMER INFORMATION & CHECKOUT SUMMARY
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Surokkha-Style Delivery & Customer Address Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Customer & Billing Address Card */}
          <div className="bg-card border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-border/60 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {t("checkout.billing_title", "Customer & Billing Information")}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Enter customer delivery address matching Surokkha standard
                </p>
              </div>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                Step 1
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Customer Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1">
                  Customer Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Rahat Ahmed"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Phone Number <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center h-9 w-full rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 overflow-hidden">
                  <span className="bg-muted/60 h-full flex items-center px-2.5 text-xs text-muted-foreground border-r border-input font-medium select-none">
                    +880
                  </span>
                  <input
                    type="text"
                    className="flex-1 h-full bg-transparent px-2.5 text-xs outline-none font-mono placeholder:text-muted-foreground"
                    placeholder="1XXXXXXXXX"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setCustomerPhone(val);
                    }}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground block">
                    Email Address ({t("common.optional", "Optional")})
                  </label>
                  {isEmailInvalid && (
                    <span className="text-[10px] text-destructive font-semibold">
                      Invalid email
                    </span>
                  )}
                </div>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={`h-9 text-xs ${isEmailInvalid ? "border-destructive" : ""}`}
                />
              </div>

              {/* Street Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1">
                  Street Address & House / Flat / Road <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="House #, Road #, Area / Landmark..."
                  className="w-full text-xs bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-y"
                />
              </div>

              {/* District Searchable Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground mb-1">
                  District <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Select / search district..."
                    value={billingDistrict}
                    onFocus={() => setIsDistrictOpen(true)}
                    onBlur={() => setTimeout(() => setIsDistrictOpen(false), 200)}
                    onChange={(e) => {
                      setBillingDistrict(e.target.value);
                      setBillingThana("");
                      setIsDistrictOpen(true);
                    }}
                    className="w-full text-xs bg-background border border-input rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    {billingDistrict ? (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setBillingDistrict("");
                          setBillingThana("");
                          setIsDistrictOpen(true);
                        }}
                        className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    )}
                  </div>
                </div>

                {isDistrictOpen && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-xl z-50 py-1 shadow-lg divide-y divide-border/40 scrollbar-thin">
                    {[...DISTRICTS]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .filter((d) => d.name.toLowerCase().includes((billingDistrict || "").toLowerCase()))
                      .map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setBillingDistrict(d.name);
                            setBillingThana("");
                            setIsDistrictOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                        >
                          {d.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Thana Searchable Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground mb-1">
                  Thana / Area{" "}
                  {["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict) && (
                    <span className="text-destructive">*</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required={["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict)}
                    placeholder={
                      ["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict)
                        ? "Select thana..."
                        : "Enter thana / upazila"
                    }
                    value={billingThana}
                    onFocus={() => {
                      if (["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict)) {
                        setIsThanaOpen(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setIsThanaOpen(false), 200)}
                    onChange={(e) => {
                      setBillingThana(e.target.value);
                      if (["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict)) {
                        setIsThanaOpen(true);
                      }
                    }}
                    className="w-full text-xs bg-background border border-input rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                    {billingThana ? (
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setBillingThana("");
                          if (["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict)) {
                            setIsThanaOpen(true);
                          }
                        }}
                        className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : ["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict) ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    ) : null}
                  </div>
                </div>

                {isThanaOpen && ["Dhaka", "Gazipur", "Narayanganj"].includes(billingDistrict) && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-xl z-50 py-1 shadow-lg divide-y divide-border/40 scrollbar-thin">
                    {(DISTRICT_THANAS[billingDistrict] || [])
                      .filter((tItem) =>
                        tItem.name.toLowerCase().includes((billingThana || "").toLowerCase()),
                      )
                      .map((tItem) => (
                        <button
                          key={tItem.name}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setBillingThana(tItem.name);
                            setIsThanaOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                        >
                          {tItem.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ship to Different Address Checkbox Toggle */}
            <div className="pt-3 border-t border-border/50">
              <label className="flex items-center gap-2.5 text-xs text-foreground font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={shipToDifferent}
                  onChange={(e) => setShipToDifferent(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span className="uppercase tracking-wider text-xs">
                  Ship to a different recipient address
                </span>
              </label>
            </div>
          </div>

          {/* Conditional Shipping Address Section */}
          {shipToDifferent && (
            <div className="bg-primary/[0.03] border-2 border-primary/30 rounded-2xl p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="border-b border-primary/20 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2 text-foreground">
                    <Truck className="h-4 w-4 text-primary" />
                    Recipient Shipping Address
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Package will be dispatched directly to this recipient
                  </p>
                </div>
                <span className="text-xs font-semibold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-md">
                  Shipping Info
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Recipient Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Recipient Full Name"
                    value={shipRecipientName}
                    onChange={(e) => setShipRecipientName(e.target.value)}
                    className="h-9 text-xs bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Recipient Phone <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center h-9 w-full rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40 overflow-hidden">
                    <span className="bg-muted/60 h-full flex items-center px-2.5 text-xs text-muted-foreground border-r border-input font-medium select-none">
                      +880
                    </span>
                    <input
                      type="text"
                      className="flex-1 h-full bg-transparent px-2.5 text-xs outline-none font-mono placeholder:text-muted-foreground"
                      placeholder="1XXXXXXXXX"
                      maxLength={10}
                      value={shipPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setShipPhone(val);
                      }}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Shipping Street Address <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={shipAddress}
                    onChange={(e) => setShipAddress(e.target.value)}
                    placeholder="Recipient Street, House #, Flat, Landmark..."
                    className="w-full text-xs bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-y"
                  />
                </div>

                {/* Shipping District */}
                <div className="relative">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Shipping District <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Select shipping district..."
                      value={shipDistrict}
                      onFocus={() => setIsShipDistrictOpen(true)}
                      onBlur={() => setTimeout(() => setIsShipDistrictOpen(false), 200)}
                      onChange={(e) => {
                        setShipDistrict(e.target.value);
                        setShipThana("");
                        setIsShipDistrictOpen(true);
                      }}
                      className="w-full text-xs bg-background border border-input rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition cursor-pointer"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                      {shipDistrict ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShipDistrict("");
                            setShipThana("");
                            setIsShipDistrictOpen(true);
                          }}
                          className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      )}
                    </div>
                  </div>

                  {isShipDistrictOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-xl z-50 py-1 shadow-lg divide-y divide-border/40 scrollbar-thin">
                      {[...DISTRICTS]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .filter((d) => d.name.toLowerCase().includes((shipDistrict || "").toLowerCase()))
                        .map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShipDistrict(d.name);
                              setShipThana("");
                              setIsShipDistrictOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                          >
                            {d.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Shipping Thana */}
                <div className="relative">
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Shipping Thana / Area{" "}
                    {["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict) && (
                      <span className="text-destructive">*</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required={["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict)}
                      placeholder={
                        ["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict)
                          ? "Select thana..."
                          : "Enter thana / upazila"
                      }
                      value={shipThana}
                      onFocus={() => {
                        if (["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict)) {
                          setIsShipThanaOpen(true);
                        }
                      }}
                      onBlur={() => setTimeout(() => setIsShipThanaOpen(false), 200)}
                      onChange={(e) => {
                        setShipThana(e.target.value);
                        if (["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict)) {
                          setIsShipThanaOpen(true);
                        }
                      }}
                      className="w-full text-xs bg-background border border-input rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                      {shipThana ? (
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShipThana("");
                            if (["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict)) {
                              setIsShipThanaOpen(true);
                            }
                          }}
                          className="p-0.5 rounded-full text-muted-foreground hover:text-destructive transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      ) : ["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict) ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      ) : null}
                    </div>
                  </div>

                  {isShipThanaOpen && ["Dhaka", "Gazipur", "Narayanganj"].includes(shipDistrict) && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border border-border rounded-xl z-50 py-1 shadow-lg divide-y divide-border/40 scrollbar-thin">
                      {(DISTRICT_THANAS[shipDistrict] || [])
                        .filter((tItem) =>
                          tItem.name.toLowerCase().includes((shipThana || "").toLowerCase()),
                        )
                        .map((tItem) => (
                          <button
                            key={tItem.name}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setShipThana(tItem.name);
                              setIsShipThanaOpen(false);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-primary/10 hover:text-primary transition cursor-pointer"
                          >
                            {tItem.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Order Special Instructions / Notes
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Optional</span>
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Call before delivery, confidential packaging required..."
              className="w-full text-xs bg-background border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-y"
            />
          </div>
        </div>

        {/* Right Column: Delivery Tier, Custom Discount, Payment & Order Summary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Delivery Tier Card (Auto Calculated) */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                <Truck className="h-4 w-4 text-primary" /> Delivery Charges Tier
              </h4>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                Auto Calculated
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  deliveryFee === 70
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-primary font-bold shadow-xs"
                    : "border-border/60 bg-muted/20 opacity-50"
                }`}
              >
                <p className="text-[11px] font-bold">Inside Dhaka</p>
                <p className="text-xs font-mono font-extrabold mt-0.5">৳70</p>
              </div>

              <div
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  deliveryFee === 90
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-primary font-bold shadow-xs"
                    : "border-border/60 bg-muted/20 opacity-50"
                }`}
              >
                <p className="text-[11px] font-bold">Suburbs</p>
                <p className="text-xs font-mono font-extrabold mt-0.5">৳90</p>
              </div>

              <div
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  deliveryFee === 120
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 text-primary font-bold shadow-xs"
                    : "border-border/60 bg-muted/20 opacity-50"
                }`}
              >
                <p className="text-[11px] font-bold">Outside Dhaka</p>
                <p className="text-xs font-mono font-extrabold mt-0.5">৳120</p>
              </div>
            </div>
          </div>

          {/* Custom Discount Card (Percentage vs Fixed Amount Radio) */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center justify-between text-foreground border-b border-border/60 pb-2">
              <span className="flex items-center gap-1.5">
                <Percent className="h-4 w-4 text-emerald-600" /> Custom Discount
              </span>
              {discountAmount > 0 && (
                <span className="text-xs font-bold text-emerald-600 font-mono">
                  - {formatBDT(discountAmount)}
                </span>
              )}
            </h4>

            {/* Discount Type Radio Selection */}
            <div className="flex items-center gap-4 pt-0.5">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed"
                  checked={discountType === "fixed"}
                  onChange={() => setDiscountType("fixed")}
                  className="text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span>Fixed Amount (৳)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer select-none">
                <input
                  type="radio"
                  name="discountType"
                  value="percent"
                  checked={discountType === "percent"}
                  onChange={() => setDiscountType("percent")}
                  className="text-primary focus:ring-primary accent-primary cursor-pointer"
                />
                <span>Percentage Discount (%)</span>
              </label>
            </div>

            {/* Discount Value Input */}
            <div className="relative mt-1">
              <div className="flex items-center h-9 w-full rounded-lg border border-input bg-transparent overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
                <span className="bg-muted/60 h-full flex items-center px-3 text-xs text-muted-foreground border-r border-input font-bold select-none">
                  {discountType === "percent" ? "%" : "৳"}
                </span>
                <input
                  type="number"
                  min="0"
                  max={discountType === "percent" ? "100" : undefined}
                  step="any"
                  placeholder={discountType === "percent" ? "e.g. 10%" : "e.g. 150"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="flex-1 h-full bg-transparent px-3 text-xs outline-none font-semibold"
                />
                {discountValue && (
                  <button
                    type="button"
                    onClick={() => setDiscountValue("")}
                    className="px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-foreground border-b border-border/60 pb-2">
              <CircleDollarSign className="h-4 w-4 text-primary" /> Payment Method
            </h4>

            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v ?? "cod")}
            >
              <SelectTrigger className="h-9 w-full text-xs cursor-pointer">
                <SelectValue placeholder="Select Payment Method">
                  {(val) => getPaymentMethodLabel(val || paymentMethod)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cod" className="text-xs font-medium">Cash on Delivery (COD)</SelectItem>
                {paymentOptions
                  .filter((opt) => opt.value !== "cod")
                  .map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order Summary & Confirm Action */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/60 pb-2">
              Final Order Summary
            </h4>

            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-foreground">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span className="font-semibold text-foreground">{formatBDT(deliveryFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>
                    Discount {discountType === "percent" ? `(${discountValue}%)` : "(Custom)"}:
                  </span>
                  <span>- {formatBDT(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-foreground pt-2.5 border-t border-border">
                <span>Grand Total:</span>
                <span className="text-primary font-mono text-lg">{formatBDT(finalTotal)}</span>
              </div>
            </div>

            {/* Custom Order ID Info Badge */}
            <div className="bg-muted/50 rounded-xl p-3 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Order ID Prefix:</span>
              <span className="font-mono font-bold text-primary">CO (Custom Order)</span>
            </div>

            {/* Create Order Submit Button */}
            <Button
              className="w-full h-12 text-sm font-bold cursor-pointer mt-2"
              onClick={handleSubmit}
              disabled={isSubmitting || cart.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Creating Custom Order...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Create Custom Order
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Variation Selection Dialog */}
      <ProductAddDialog
        product={dialogProduct}
        onClose={() => setDialogProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Order Completion Dialog */}
      <Dialog
        open={Boolean(completedOrder)}
        onOpenChange={(open) => {
          if (!open) closeCompletedDialog();
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold leading-snug">
              Custom Order Placed Successfully
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Order has been created with custom pricing and delivery charge.
            </DialogDescription>
          </DialogHeader>

          {completedOrder && (
            <div className="space-y-3.5 py-2">
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Order ID
                    </p>
                    <p className="font-mono font-bold text-sm text-primary">
                      {completedOrder.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      Grand Total
                    </p>
                    <p className="font-bold text-base text-primary">
                      {formatBDT(completedOrder.totalAmount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Customer</p>
                    <p className="font-medium truncate">{completedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p>
                    <p className="font-mono">{completedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{completedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivery District</p>
                    <p className="font-medium">{completedOrder.district} {completedOrder.thana ? `(${completedOrder.thana})` : ""}</p>
                  </div>
                </div>

                {completedOrder.discountAmount > 0 && (
                  <div className="pt-2 border-t border-border/60 flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Discount Applied:</span>
                    <span>- {formatBDT(completedOrder.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button
                  variant="default"
                  className="w-full cursor-pointer text-xs font-semibold"
                  onClick={handleDownloadInvoice}
                >
                  Download / Print Invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full cursor-pointer text-xs font-semibold gap-1.5"
                  onClick={() => setSendEmailModalOpen(true)}
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Send via Email
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={closeCompletedDialog} className="cursor-pointer text-xs">
              {t("common.close", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SendOrderInvoiceModal
        open={sendEmailModalOpen}
        onOpenChange={setSendEmailModalOpen}
        order={completedOrder?.order || (completedOrder ? {
          ...completedOrder,
          _id: completedOrder?.order?._id,
          orderNumber: completedOrder?.orderNumber,
          billingInfo: {
            fullName: completedOrder.customerName,
            email: completedOrder.customerEmail,
            phone: completedOrder.customerPhone,
            address: completedOrder.deliveryAddress,
            district: completedOrder.district,
            thana: completedOrder.thana,
          },
        } : null)}
      />
    </div>
  );
};

export default NewCustomOrderPage;
