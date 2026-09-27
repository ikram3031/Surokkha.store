import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/use-products";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useCategories, useBrands } from "@/lib/category-cache";
import { clientConfig } from "@/clientConfig";
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
} from "lucide-react";

import { effectivePrice, formatBDT } from "@/utils/orderHelper";
import { resolvePaymentOptions, getPaymentMethodLabel } from "@/utils/orderDetailsHelper";

// Renders the modal dialog for selecting product variant and quantity before adding to cart
const ProductAddDialog = ({
  product,
  onClose,
  onAddToCart,
}) => {
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

// Main container component creating a POS manual/in-store sale order
const NewInStoreOrderPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const hasBrand = clientConfig?.features?.brand !== false && clientConfig?.features?.brands !== false;

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

  const [cart, setCart] = useState([]);
  const [dialogProduct, setDialogProduct] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [discount, setDiscount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentOptions = useMemo(() => resolvePaymentOptions(true), []);

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

  const discountAmount = useMemo(() => {
    const num = Number(discount);
    if (isNaN(num) || num < 0) return 0;
    return Math.min(num, subtotal);
  }, [discount, subtotal]);

  const finalTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount],
  );

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isEmailInvalid = Boolean(customerEmail.trim() && !isValidEmail(customerEmail.trim()));

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error(t("orders.cart_empty", "Cart is empty. Add at least one product."));
      return;
    }
    if (!customerName.trim()) {
      toast.error(t("common.required", "Customer Name is required."));
      return;
    }
    if (customerPhone.trim().length !== 10) {
      toast.error("Please enter a valid 10-digit Phone Number.");
      return;
    }
    if (customerEmail.trim() && !isValidEmail(customerEmail.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const fullPaymentMethod = getPaymentMethodLabel(paymentMethod);

      const billingInfo = {
        fullName: customerName.trim() || "Walk-in Customer",
        phone: `+880${customerPhone.trim()}`,
        email: customerEmail.trim() || "",
        address: customerAddress.trim() || "In-Store",
        thana: "Dhaka",
        district: "Dhaka",
        zip: "1000",
      };

      const orderPayload = {
        orderType: "instore",
        status: "completed",
        paymentMethod: fullPaymentMethod,
        billingInfo: billingInfo,
        shippingInfo: billingInfo,
        giftWrap: false,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          size: item.size,
          concentration: "",
        })),
        subtotal,
        discountTotalAmount: discountAmount,
        shippingFee: 0,
        tax: 0,
        total: finalTotal,
        paidAmount: finalTotal,
        paymentStatus: "paid",
        createdBy: user?.did || "staff",
      };

      const orderResponse = await apiClient.post(
        "/api/v1/orders/new-order",
        orderPayload,
      );
      const order = orderResponse.data.data;
      const orderId = order.id || order._id;
      const orderNumber = order.orderNumber;

      await apiClient.post("/api/v1/payments", {
        orderId,
        paymentMethod: fullPaymentMethod,
        paymentPhone: "",
        totalAmount: finalTotal,
        paidAmount: finalTotal,
        pendingAmount: 0,
        amount: finalTotal,
        paymentStatus: "paid",
        status: "paid",
      });

      const invoiceUrl = `https://${clientConfig?.domain || 'decantrebd.com'}/invoice/${orderNumber}`;
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
        customerName: customerName.trim() || "Walk-in Customer",
        customerEmail: customerEmail.trim() || "",
        customerPhone: `+880${customerPhone.trim()}`,
        customerAddress: customerAddress.trim() || "In-Store",
        subtotalAmount: subtotal,
        discountAmount: discountAmount,
        totalAmount: finalTotal,
        paymentMethod: fullPaymentMethod,
        paymentPhone: "",
        items: invoiceItems,
      });

      toast.success(
        t("orders.order_created_success", "In-store order created successfully."),
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.join(", ") ||
        t("common.error", "Failed to create order.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadInvoice = () => {
    if (!completedOrder) return;
    window.open(completedOrder.invoiceUrl, "_blank");
  };

  const closeCompletedDialog = () => {
    setCompletedOrder(null);
  };

  return (
    <div className="flex-1 space-y-0 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-3 mb-6">
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
            {t("nav.new_in_store_order", "New In-Store Order")}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("orders.pos_title", "Walk-in counter sale — order ID prefixed with")}{" "}
            <span className="font-mono font-semibold text-primary">S</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t("nav.products", "Product Catalogue")}
            </h3>

            <div className="flex gap-2 mb-3">
              <Select
                value={categoryFilter}
                onValueChange={(v) => setCategoryFilter(v ?? "All")}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder={t("products.category", "Category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">{t("common.all", "All Categories")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.did} value={cat.slug || cat.did}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasBrand && (
                <Select
                  value={brandFilter}
                  onValueChange={(v) => setBrandFilter(v ?? "All")}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder={t("products.brand", "Brand")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t("common.all", "All Brands")}</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.did} value={brand.slug || brand.did}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.search_products", "Search products by name or SKU...")}
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{t("common.no_data", "No products found")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                {products.map((product) => {
                  const inCart = cart.filter((c) =>
                    c.id.startsWith(product.id),
                  );
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
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
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

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {product.sku}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-sm font-semibold text-primary">
                            {isVariant
                              ? `${formatBDT(displayPrice)}`
                              : formatBDT(displayPrice)}
                          </span>
                          {isVariant && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0 gap-0.5"
                            >
                              <Layers className="h-2.5 w-2.5" />{" "}
                              {product.variants?.length ?? 0} {t("products.attributes_variations", "sizes")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        {cartQty > 0 && (
                          <span className="text-[10px] font-semibold text-primary">
                            ×{cartQty}
                          </span>
                        )}
                        <button
                          disabled={isOutOfStock}
                          onClick={() =>
                            !isOutOfStock && setDialogProduct(product)
                          }
                          className={`
                            h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer
                            ${
                              isOutOfStock
                                ? "bg-muted cursor-not-allowed text-muted-foreground"
                                : "bg-primary text-primary-foreground hover:bg-primary/80 active:scale-95 shadow-sm"
                            }
                          `}
                          title={isOutOfStock ? t("products.out_of_stock", "Out of Stock") : t("orders.add_to_cart", "Add to cart")}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-base mb-3">{t("orders.customer_info", "Customer Info")}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t("orders.customer_name", "Customer Name")} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={t("orders.customer", "Walk-in Customer")}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t("common.phone", "Phone Number")} <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center h-8 w-full rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 overflow-hidden">
                  <span className="bg-muted/50 h-full flex items-center px-2.5 text-sm text-muted-foreground border-r border-input select-none font-medium">
                    +880
                  </span>
                  <input
                    type="text"
                    className="flex-1 h-full bg-transparent px-2.5 text-base md:text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="1XXXXXXXXX"
                    maxLength={10}
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setCustomerPhone(val);
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground block">
                    {t("common.email", "Email")} ({t("common.optional", "Optional")})
                  </label>
                  {isEmailInvalid && (
                    <span className="text-[11px] text-destructive font-medium">
                      Invalid email address
                    </span>
                  )}
                </div>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={isEmailInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t("common.address", "Address")}
                </label>
                <Input
                  placeholder={t("orders.shipping_address", "Customer Address")}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              {t("orders.cart_items", "Cart")}
              {cart.length > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {cart.reduce((s, c) => s + c.quantity, 0)} {t("orders.items", "items")}
                </Badge>
              )}
            </h3>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{t("orders.cart_empty", "No items added yet")}</p>
                <p className="text-xs mt-1">{t("orders.select_product", "Click + on a product to add it")}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
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
                      <p className="text-xs font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBDT(item.price)} × {item.quantity} ={" "}
                        <span className="font-semibold text-foreground">
                          {formatBDT(item.price * item.quantity)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="h-6 w-6 rounded border border-border flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="h-6 w-6 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{t("common.subtotal", "Subtotal")}</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-xs text-muted-foreground font-medium">{t("common.discount", "Discount")} (৳)</span>
                  <div className="w-28">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={discount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setDiscount(val);
                      }}
                      className="h-8 text-xs text-right font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>{t("common.discount", "Discount Applied")}</span>
                    <span>- {formatBDT(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-border">
                  <span>{t("common.total", "Total")}</span>
                  <span className="text-primary">{formatBDT(finalTotal)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              {t("orders.payment_method", "Payment Method")}
            </h3>
            <div className="space-y-3">
              <Select
                value={paymentMethod}
                onValueChange={(v) => {
                  setPaymentMethod(v ?? "cash");
                }}
              >
                <SelectTrigger className="h-8 w-full cursor-pointer">
                  <SelectValue placeholder={t("orders.payment_method", "Select Payment Method")}>
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
          </div>

          <div className="bg-muted/50 border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{t("orders.payment_method", "Payment")}:</span>{" "}
                <span className="font-medium">{getPaymentMethodLabel(paymentMethod)}</span>
              </p>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-semibold">
                {t("orders.status_paid", "Paid")} ({t("orders.in_store", "In-Store")})
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("orders.order_id", "Order ID prefix")}:{" "}
              <span className="font-mono font-semibold text-primary">
                IS
              </span>{" "}
              (e.g. <span className="font-mono text-primary">IS26080001</span>)
            </p>
          </div>

          <Button
            className="w-full h-12 text-base font-semibold cursor-pointer"
            onClick={handleSubmit}
            disabled={isSubmitting || cart.length === 0}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
                {t("common.creating", "Creating Order...")}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                {t("orders.create_order", "Confirm & Create Order")}
              </>
            )}
          </Button>
        </div>
      </div>

      <ProductAddDialog
        product={dialogProduct}
        onClose={() => setDialogProduct(null)}
        onAddToCart={addToCart}
      />

      <Dialog
        open={Boolean(completedOrder)}
        onOpenChange={(open) => {
          if (!open) closeCompletedDialog();
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="text-base font-semibold leading-snug">
              {t("orders.order_created_success", "Order Completed")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("orders.order_created_success", "In-store order has been created. Invoice generation is ready.")}
            </DialogDescription>
          </DialogHeader>

          {completedOrder && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border bg-muted p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("orders.order_id", "Order ID")}
                    </p>
                    <p className="font-semibold">
                      {completedOrder.orderNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("common.total", "Total")}
                    </p>
                    <p className="font-semibold text-primary">
                      {formatBDT(completedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("orders.customer", "Customer")}
                    </p>
                    <p>{completedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("orders.payment_method", "Payment")}
                    </p>
                    <p className="font-medium">{getPaymentMethodLabel(completedOrder.paymentMethod)}</p>
                  </div>
                  {completedOrder.customerEmail ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {t("common.email", "Email")}
                      </p>
                      <p>{completedOrder.customerEmail}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("common.phone", "Phone")}
                    </p>
                    <p>{completedOrder.customerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-medium">{t("orders.print_invoice", "Invoice")}</p>
                <p className="text-xs text-muted-foreground">
                  The invoice is generated and ready to download or print.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="default"
                  className="w-full cursor-pointer"
                  onClick={handleDownloadInvoice}
                >
                  {t("orders.print_invoice", "Download / Print Invoice")}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="secondary" onClick={closeCompletedDialog} className="cursor-pointer">
              {t("common.close", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewInStoreOrderPage;
