import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/use-products";
import { useItems } from "@/hooks/use-items";
import { apiClient, baseURL, getApiBaseUrl } from "@/lib/api-client";
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
  Boxes,
  X,
  Layers,
  Tag,
  Mail,
} from "lucide-react";
import { SendOrderInvoiceModal } from "@/components/dashboard/orders/SendOrderInvoiceModal";

import { effectivePrice, formatBDT } from "@/utils/orderHelper";
import { resolvePaymentOptions, getPaymentMethodLabel } from "@/utils/orderDetailsHelper";
import { DistrictCombobox, ThanaCombobox } from "@/components/orders/LocationCombobox";
import { useCustomerSearch, formatPhoneForOrderInput } from "@/hooks/use-customers";
import {
  CustomerSuggestionsDropdown,
  SelectedCustomerBanner,
} from "@/components/orders/CustomerLookup";
import { CartPriceInput, CustomItemDialog } from "@/components/orders/CartLineEditors";

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

    const rawId = product.id || product._id || "";
    const isItem = product.itemType === "item" || product.entityType === "item";

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
      productId: !isItem ? rawId : "",
      itemId: isItem ? rawId : "",
      itemType: isItem ? "item" : "product",
      productDid: product.did || product.sku || "",
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
                        ${hasNoStock
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

  const [catalogType, setCatalogType] = useState("products"); // "products" | "items"
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

  const { data: itemsResponse, isLoading: itemsLoading } = useItems({
    search: searchQuery || undefined,
    category: categoryFilter !== "All" ? categoryFilter : undefined,
    brand: brandFilter !== "All" ? brandFilter : undefined,
    limit: 50,
  });
  const items = Array.isArray(itemsResponse?.data)
    ? itemsResponse.data
    : [];

  const [cart, setCart] = useState([]);
  const [dialogProduct, setDialogProduct] = useState(null);
  const [customItemOpen, setCustomItemOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);

  const [discount, setDiscount] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerDistrict, setCustomerDistrict] = useState("Dhaka");
  const [customerThana, setCustomerThana] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeLookupField, setActiveLookupField] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLookupQuery =
    activeLookupField === "phone"
      ? customerPhone
      : activeLookupField === "email"
      ? customerEmail
      : activeLookupField === "name"
      ? customerName
      : "";

  const { customers: matchedCustomers, isLoading: isSearchingCustomers } = useCustomerSearch(
    activeLookupQuery,
    Boolean(activeLookupField)
  );

  const handleSelectCustomer = useCallback((c) => {
    if (!c) return;
    setSelectedCustomer(c);
    const fullName = c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ");
    if (fullName) setCustomerName(fullName);
    if (c.phone) setCustomerPhone(formatPhoneForOrderInput(c.phone, 10));
    if (c.email) setCustomerEmail(c.email);
    if (c.address) setCustomerAddress(c.address);
    if (c.district) setCustomerDistrict(c.district);
    if (c.thana !== undefined) setCustomerThana(c.thana || "");
    setActiveLookupField(null);
    toast.success(`Auto-filled customer: ${fullName || c.phone}`);
  }, []);

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

  const updatePrice = useCallback((id, price) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, price } : c)));
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

  // Empty input means fully paid (typical walk-in sale).
  const paidValue = useMemo(() => {
    if (paidAmount === "") return finalTotal;
    return Math.min(finalTotal, Math.max(0, Number(paidAmount) || 0));
  }, [paidAmount, finalTotal]);

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
      toast.error("Please enter a valid Phone Number.");
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
        thana: customerThana.trim() || "Dhaka",
        district: customerDistrict.trim() || "Dhaka",
        zip: "1000",
      };

      const orderPayload = {
        orderType: "instore",
        status: "completed",
        paymentMethod: fullPaymentMethod,
        orderNotes: orderNotes.trim(),
        billingInfo: billingInfo,
        shippingInfo: billingInfo,
        giftWrap: false,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          size: item.size || "",
          concentration: item.concentration || "",
          productId: item.productId || "",
          itemId: item.itemId || "",
          itemType: item.itemType || "product",
          productDid: item.productDid || "",
          sku: item.sku || "",
          image: item.image || "",
        })),
        subtotal,
        discountTotalAmount: discountAmount,
        shippingFee: 0,
        tax: 0,
        total: finalTotal,
        // Backend syncs the payment record from this amount; no separate payment POST needed.
        paidAmount: paidValue,
        createdBy: user?.did || "staff",
      };

      const orderResponse = await apiClient.post(
        "/api/v1/orders/new-order",
        orderPayload,
      );
      const order = orderResponse.data.data;
      const orderNumber = order.orderNumber;

      const invoiceUrl = `https://${clientConfig?.domain || 'example.com'}/invoice/${orderNumber}`;
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
        customerDistrict: customerDistrict.trim() || "Dhaka",
        customerThana: customerThana.trim() || "",
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
    setCustomerAddress("");
    setCustomerDistrict("Dhaka");
    setCustomerThana("");
    setOrderNotes("");
    setSelectedCustomer(null);
    setDiscount("");
    setPaidAmount("");
  };

  return (
    <div className="page-container flex-1 space-y-0 p-4 md:p-8 pt-6">
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
            <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b">
              <div className="flex items-center gap-2">
                {catalogType === "products" ? (
                  <Package className="h-5 w-5 text-primary" />
                ) : (
                  <Boxes className="h-5 w-5 text-primary" />
                )}
                <h3 className="font-semibold text-lg">
                  {catalogType === "products"
                    ? t("nav.products", "Product Catalogue")
                    : t("nav.items", "Item Catalogue")}
                </h3>
              </div>

              <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
                <button
                  type="button"
                  onClick={() => setCatalogType("products")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${catalogType === "products"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Products</span>
                  {products.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                      {products.length}
                    </Badge>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogType("items")}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${catalogType === "items"
                      ? "bg-background text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Boxes className="h-3.5 w-3.5" />
                  <span>Items</span>
                  {items.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 ml-1">
                      {items.length}
                    </Badge>
                  )}
                </button>
              </div>
            </div>

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
                placeholder={catalogType === "products" ? t("products.search_products", "Search products by name or SKU...") : "Search items by name or SKU..."}
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

            {catalogType === "products" ? (
              productsLoading ? (
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
                              ${isOutOfStock
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
              )
            ) : (
              itemsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-24 rounded-lg bg-muted animate-pulse"
                    />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Boxes className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {items.map((item) => {
                    const inCart = cart.filter((c) =>
                      c.id.startsWith(item.id),
                    );
                    const cartQty = inCart.reduce((s, c) => s + c.quantity, 0);
                    const isOutOfStock = item.status === "Out of Stock" || item.stockStatus === "outofstock";
                    const isVariant = item.type === "variant" && (item.variants?.length ?? 0) > 0;
                    const displayPrice = isVariant
                      ? Math.min(
                        ...(item.variants || []).map((v) =>
                          effectivePrice(v.price, v.offerPrice ?? null),
                        ),
                      )
                      : effectivePrice(item.price, item.offerPrice ?? null);

                    return (
                      <div
                        key={item.id}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border bg-background transition-all
                          ${isOutOfStock ? "opacity-50" : "hover:border-primary/40 hover:shadow-sm"}
                          ${cartQty > 0 ? "border-primary/50 bg-primary/3" : "border-border"}
                        `}
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Boxes className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.sku}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-semibold text-primary">
                              {isVariant
                                ? `${formatBDT(displayPrice)}`
                                : formatBDT(displayPrice)}
                            </span>
                            {isVariant ? (
                              <Badge
                                variant="secondary"
                                className="text-[10px] px-1 py-0 gap-0.5"
                              >
                                <Layers className="h-2.5 w-2.5" />{" "}
                                {item.variants?.length ?? 0} {t("products.attributes_variations", "sizes")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 border-border/60 text-muted-foreground"
                              >
                                Item
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
                              !isOutOfStock && setDialogProduct({ ...item, itemType: "item" })
                            }
                            className={`
                              h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer
                              ${isOutOfStock
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
              )
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-base mb-3">{t("orders.customer_info", "Customer Info")}</h3>
            <div className="space-y-3">
              {selectedCustomer && (
                <SelectedCustomerBanner
                  customer={selectedCustomer}
                  currentValues={{
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail,
                    address: customerAddress,
                    district: customerDistrict,
                    thana: customerThana,
                  }}
                  onClear={() => setSelectedCustomer(null)}
                  phoneLength={10}
                />
              )}

              <div className="relative">
                <label className="text-xs text-muted-foreground mb-1 block">
                  {t("orders.customer_name", "Customer Name")} <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder={t("orders.customer", "Walk-in Customer")}
                  value={customerName}
                  onFocus={() => setActiveLookupField("name")}
                  onBlur={() =>
                    setTimeout(
                      () => setActiveLookupField((prev) => (prev === "name" ? null : prev)),
                      200
                    )
                  }
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setActiveLookupField("name");
                  }}
                />
                <CustomerSuggestionsDropdown
                  customers={matchedCustomers}
                  isLoading={isSearchingCustomers}
                  open={activeLookupField === "name"}
                  onSelect={handleSelectCustomer}
                />
              </div>

              <div className="relative">
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
                    onFocus={() => setActiveLookupField("phone")}
                    onBlur={() =>
                      setTimeout(
                        () => setActiveLookupField((prev) => (prev === "phone" ? null : prev)),
                        200
                      )
                    }
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setCustomerPhone(val);
                      setActiveLookupField("phone");
                    }}
                  />
                </div>
                <CustomerSuggestionsDropdown
                  customers={matchedCustomers}
                  isLoading={isSearchingCustomers}
                  open={activeLookupField === "phone"}
                  onSelect={handleSelectCustomer}
                />
              </div>

              <div className="relative">
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
                  onFocus={() => setActiveLookupField("email")}
                  onBlur={() =>
                    setTimeout(
                      () => setActiveLookupField((prev) => (prev === "email" ? null : prev)),
                      200
                    )
                  }
                  onChange={(e) => {
                    setCustomerEmail(e.target.value);
                    setActiveLookupField("email");
                  }}
                  className={isEmailInvalid ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                <CustomerSuggestionsDropdown
                  customers={matchedCustomers}
                  isLoading={isSearchingCustomers}
                  open={activeLookupField === "email"}
                  onSelect={handleSelectCustomer}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t("orders.district", "District")}
                  </label>
                  <DistrictCombobox
                    value={customerDistrict}
                    onChange={(val) => {
                      setCustomerDistrict(val);
                      setCustomerThana("");
                    }}
                    placeholder={t("orders.select_district", "Select district...")}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {t("orders.thana", "Thana / Area")}
                  </label>
                  <ThanaCombobox
                    district={customerDistrict}
                    value={customerThana}
                    onChange={(val) => setCustomerThana(val)}
                    placeholder={t("orders.select_thana", "Select thana / area...")}
                  />
                </div>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-7 gap-1 text-xs cursor-pointer ${cart.length > 0 ? "" : "ml-auto"}`}
                onClick={() => setCustomItemOpen(true)}
              >
                <Plus className="h-3 w-3" />
                {t("orders.extra_item", "Extra item")}
              </Button>
            </h3>
            <CustomItemDialog open={customItemOpen} onClose={() => setCustomItemOpen(false)} onAdd={addToCart} />

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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-medium truncate">
                          {item.name}
                        </p>
                        {item.itemType === "item" && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-normal">
                            Item
                          </Badge>
                        )}
                        {item.itemType === "custom" && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                            Extra
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <CartPriceInput value={item.price} onChange={(price) => updatePrice(item.id, price)} />
                        <span>× {item.quantity} =</span>
                        <span className="font-semibold text-foreground">
                          {formatBDT(item.price * item.quantity)}
                        </span>
                      </div>
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

                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-xs text-muted-foreground font-medium">Paid Amount (৳)</span>
                  <div className="w-28">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder={String(finalTotal)}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value.replace(/\D/g, ""))}
                      className="h-8 text-xs text-right font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Remaining Pending</span>
                  <span className={`font-bold ${finalTotal - paidValue > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {formatBDT(Math.max(0, finalTotal - paidValue))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-2">
            <label htmlFor="order-notes" className="font-semibold text-base block">
              {t("orders.order_notes", "Order Notes")}
            </label>
            <textarea
              id="order-notes"
              rows={2}
              maxLength={1000}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. Call before delivery"
              className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition resize-y"
            />
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
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {t("orders.district", "Location")}
                    </p>
                    <p className="font-medium text-foreground">
                      {completedOrder.customerDistrict}{completedOrder.customerThana ? ` (${completedOrder.customerThana})` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-medium">{t("orders.print_invoice", "Invoice")}</p>
                <p className="text-xs text-muted-foreground">
                  The invoice is generated and ready to download or print.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <Button
                  variant="default"
                  className="w-full cursor-pointer"
                  onClick={handleDownloadInvoice}
                >
                  {t("orders.print_invoice", "Download / Print Invoice")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full cursor-pointer gap-1.5"
                  onClick={() => setSendEmailModalOpen(true)}
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {t("orders.send_invoice_email", "Send via Email")}
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
            address: completedOrder.customerAddress,
            district: completedOrder.customerDistrict,
            thana: completedOrder.customerThana,
          },
        } : null)}
      />
    </div>
  );
};

export default NewInStoreOrderPage;
