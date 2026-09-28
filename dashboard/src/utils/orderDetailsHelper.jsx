import { Badge } from "@/components/ui/badge";
import { clientConfig } from "@/clientConfig";

// Check if an order is an In-Store order based on order number prefix, type, or customer email.
export const checkIsInStoreOrder = (order) => {
  if (!order) return false;
  const orderNum = String(order.orderNumber || "").toUpperCase();
  const type = String(order.orderType || "").toLowerCase();
  const email = String(order.billingInfo?.email || order.customer?.email || "").toLowerCase();
  return orderNum.startsWith("IS") || type === "instore" || email.includes("instore@");
};

// Safely extract billing info according to schema from order
export const getBillingInfo = (order) => {
  if (!order) return { fullName: '', phone: '', email: '', address: '', thana: '', district: 'Dhaka', zip: '' };
  const raw = order.billingInfo || order.customer || {};
  return {
    fullName: raw.fullName || raw.name || order.customerName || '',
    phone: raw.phone || order.phone || '',
    email: raw.email || order.email || '',
    address: raw.address || raw.street || '',
    thana: raw.thana || '',
    district: raw.district || raw.city || 'Dhaka',
    zip: raw.zip || raw.postcode || '',
  };
};

// Safely extract shipping info according to schema from order
export const getShippingInfo = (order) => {
  if (!order) return { fullName: '', phone: '', address: '', thana: '', district: 'Dhaka', zip: '' };
  const raw = order.shippingInfo || order.billingInfo || order.customer || {};
  return {
    fullName: raw.fullName || raw.name || order.customerName || '',
    phone: raw.phone || order.phone || '',
    address: raw.address || raw.street || '',
    thana: raw.thana || '',
    district: raw.district || raw.city || 'Dhaka',
    zip: raw.zip || raw.postcode || '',
  };
};

// Format address parts into a clean display string
export const formatFullAddress = (info) => {
  if (!info) return '';
  const parts = [
    info.address || info.street,
    info.thana,
    info.district || info.city,
    info.zip ? `Zip: ${info.zip}` : '',
  ].filter(Boolean);
  return parts.join(', ');
};

// Format raw payment method value into a clean display label.
export const getPaymentMethodLabel = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower === "cash") return "Cash";
  if (lower === "card") return "Card";
  if (lower === "bank") return "Bank";
  if (lower === "bkash") return "bKash";
  if (lower === "nagad") return "Nagad";
  if (lower === "rocket") return "Rocket";
  if (lower === "cod") return "Cash on Delivery (COD)";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Resolve the initial payment method dropdown value based on store type and raw method.
export const getInitialPaymentMethod = (order, isInStore) => {
  const rawMethod = String(order?.paymentMethod || "").toLowerCase();
  if (isInStore) {
    if (rawMethod.includes("card")) return "card";
    if (rawMethod.includes("bank")) return "bank";
    if (rawMethod.includes("bkash")) return "bkash";
    if (rawMethod.includes("nagad")) return "nagad";
    if (rawMethod.includes("rocket")) return "rocket";
    return "cash";
  }
  if (rawMethod.includes("bkash")) return "bkash";
  if (rawMethod.includes("nagad")) return "nagad";
  if (rawMethod.includes("bank")) return "bank";
  return "cod";
};

// Resolve the initial paid amount for an order snapshot.
export const getInitialPaidAmount = (order, initMethod) => {
  const totalVal = order?.totals?.total ?? order?.totalAmount ?? 0;
  const rawPaid = order?.paymentDetails?.paidAmount ?? order?.paidAmount;
  if (rawPaid !== undefined && rawPaid !== null) {
    return Number(rawPaid);
  }
  if (initMethod === "cash") {
    return totalVal;
  }
  return 0;
};

// Extract phone number from payment details or embedded string.
export const extractPaymentPhone = (order) => {
  const phoneVal = order?.paymentDetails?.paymentPhone || order?.paymentPhone || "";
  if (phoneVal) {
    return phoneVal.replace(/^\+880?/, "");
  }
  const match = String(order?.paymentMethod || "").match(/\+880?(\d+)/);
  return match ? match[1] : "";
};

// Format a clean phone number with +880 prefix after stripping leading zeros.
export const formatPhoneNumber = (rawPhone) => {
  const cleanPhone = String(rawPhone || "").replace(/\D/g, "");
  if (!cleanPhone) return "";
  if (cleanPhone.startsWith("880")) return `+${cleanPhone}`;
  if (cleanPhone.startsWith("0")) return `+88${cleanPhone}`;
  return `+880${cleanPhone}`;
};

// Sanitize order fulfillment status string to match backend schema enums strictly.
export const getBackendStatus = (fullStatus) => {
  const s = String(fullStatus || "").toLowerCase();
  if (s === "shipped") return "shipped";
  if (s === "cancelled") return "cancelled";
  if (s === "completed") return "completed";
  return "processing";
};

// Calculate remaining pending balance from net total and paid amount.
export const calculatePendingAmount = (total, paidAmount) =>
  Math.max(0, Number(total || 0) - Number(paidAmount || 0));

// Determine payment status preview string based on total, paid amounts, and method.
export const calculatePaymentStatus = (total, paidAmount, paymentMethod = "") => {
  const paid = Number(paidAmount || 0);
  const netTotal = Number(total || 0);
  const method = String(paymentMethod || "").toLowerCase();
  const isMfs = ["bkash", "nagad", "rocket"].some(m => method.includes(m));

  if (paid >= netTotal && netTotal > 0) return "Paid";
  if (paid > 0 || isMfs) return "Partial";
  return "Pending";
};

// Render payment status badge based on payment status string.
export const getPaymentBadge = (status) => {
  switch (String(status).toLowerCase()) {
    case "paid":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs">Paid</Badge>;
    case "partial":
      return <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 hover:bg-amber-500/30 dark:text-amber-400 px-3 py-1 text-xs font-semibold">Partial</Badge>;
    case "pending":
    default:
      return <Badge variant="secondary" className="bg-rose-500/20 text-rose-600 hover:bg-rose-500/30 dark:text-rose-400 px-3 py-1 text-xs">Pending</Badge>;
  }
};

// Render order fulfillment status badge based on status string.
export const getFulfillmentBadge = (status) => {
  switch (String(status).toLowerCase()) {
    case "shipped":
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 px-3 py-1 text-xs">Shipped</Badge>;
    case "processing":
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 hover:bg-blue-500/30 dark:text-blue-400 px-3 py-1 text-xs">Processing</Badge>;
    case "cancelled":
      return <Badge variant="destructive" className="px-3 py-1 text-xs">Cancelled</Badge>;
    case "completed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs">Completed</Badge>;
    default:
      return <Badge variant="outline" className="px-3 py-1 text-xs">{status}</Badge>;
  }
};

// Return available payment method options based on whether order is In-Store or Website.
export const resolvePaymentOptions = (isInStore) => {
  if (isInStore) {
    if (clientConfig?.inStorePaymentMethods && Array.isArray(clientConfig.inStorePaymentMethods)) {
      return clientConfig.inStorePaymentMethods;
    }
    return [
      { value: "cash", label: "Cash" },
      { value: "card", label: "Card" },
      { value: "bank", label: "Bank" },
      { value: "bkash", label: "bKash" },
      { value: "nagad", label: "Nagad" },
    ];
  }
  return [
    { value: "cod", label: "Cash on Delivery (COD)" },
    { value: "bkash", label: "bKash" },
    { value: "nagad", label: "Nagad" },
    { value: "bank", label: "Bank Transfer" },
  ];
};

// Map raw order items into editable cart items while retaining productDid and concentration.
export const mapOrderItemsToCart = (items = []) =>
  (items || []).map((item, idx) => {
    const idKey = item.size ? `${idx}__${item.size}` : `${idx}`;
    return {
      id: idKey,
      name: item.name,
      price: item.unitPrice ?? item.price ?? 0,
      quantity: item.quantity,
      image: item.image || "",
      sku: item.sku || "",
      size: item.size || "",
      concentration: item.concentration || "",
      productDid: item.productDid || "",
    };
  });

// Build the sanitized request payload for updating an order.
export const buildUpdatePayload = ({
  orderStatus,
  paymentMethod,
  paidAmount,
  paymentPhone,
  isDigitalPayment,
  billingInfo,
  shippingInfo,
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  customerCity,
  customerThana,
  customerDistrict,
  customerZip,
  isInStoreOrder,
  cart,
  subtotal,
  shippingFee,
  discountAmount,
  couponCode,
  total,
  user,
}) => {
  const finalBilling = billingInfo || {
    fullName: customerName?.trim() || (isInStoreOrder ? 'Walk-in Customer' : ''),
    phone: formatPhoneNumber(customerPhone),
    email: customerEmail?.trim() || '',
    address: customerAddress?.trim() || (isInStoreOrder ? 'In-Store' : 'Delivery Address'),
    thana: customerThana || '',
    district: customerDistrict || customerCity || 'Dhaka',
    zip: customerZip || '',
  };

  const finalShipping = isInStoreOrder
    ? { ...finalBilling }
    : (shippingInfo || {
        fullName: finalBilling.fullName,
        phone: finalBilling.phone,
        address: finalBilling.address,
        thana: finalBilling.thana,
        district: finalBilling.district,
        zip: finalBilling.zip,
      });

  const formattedPaymentPhone = !isInStoreOrder && isDigitalPayment && paymentPhone ? formatPhoneNumber(paymentPhone) : "";

  let fullPaymentMethod = getPaymentMethodLabel(paymentMethod);
  if (!isInStoreOrder && isDigitalPayment && formattedPaymentPhone) {
    fullPaymentMethod = `${fullPaymentMethod} (${formattedPaymentPhone})`;
  }

  const normalizedBilling = {
    fullName: finalBilling.fullName?.trim() || (isInStoreOrder ? 'Walk-in Customer' : ''),
    phone: formatPhoneNumber(finalBilling.phone),
    email: finalBilling.email?.trim() || '',
    address: finalBilling.address?.trim() || (isInStoreOrder ? 'In-Store' : 'Delivery Address'),
    thana: finalBilling.thana?.trim() || '',
    district: finalBilling.district?.trim() || 'Dhaka',
    zip: finalBilling.zip?.trim() || '',
  };

  const normalizedShipping = {
    fullName: finalShipping.fullName?.trim() || normalizedBilling.fullName,
    phone: formatPhoneNumber(finalShipping.phone || normalizedBilling.phone),
    address: finalShipping.address?.trim() || normalizedBilling.address,
    thana: finalShipping.thana?.trim() || normalizedBilling.thana,
    district: finalShipping.district?.trim() || normalizedBilling.district,
    zip: finalShipping.zip?.trim() || normalizedBilling.zip,
  };

  return {
    status: getBackendStatus(orderStatus),
    paymentMethod: fullPaymentMethod,
    paidAmount: isInStoreOrder ? Number(total || 0) : Number(paidAmount || 0),
    paymentPhone: formattedPaymentPhone,
    billingInfo: normalizedBilling,
    shippingInfo: normalizedShipping,
    customer: {
      ...normalizedBilling,
      giftWrap: false,
    },
    items: cart.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      size: item.size,
      concentration: item.concentration || "",
      productDid: item.productDid || "",
    })),
    totals: {
      subtotal,
      shippingFee,
      tax: 0,
      total,
    },
    discountTotalAmount: discountAmount,
    couponCode: couponCode ? String(couponCode).trim().toUpperCase() : undefined,
    shippingTotalAmount: shippingFee,
    updatedBy: user?.did || user?.id || user?._id || undefined,
  };
};

// Generates direct WhatsApp chat URL with proper country code normalization
export const getWhatsAppLink = (rawPhone, text = "") => {
  if (!rawPhone) return "";
  let digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) {
    // already starts with 880
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = `880${digits}`;
  }
  const baseUrl = `https://wa.me/${digits}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
};

// Renders the official WhatsApp brand icon SVG
export const WhatsAppIcon = ({ className = "h-3.5 w-3.5", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
    {...props}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);
