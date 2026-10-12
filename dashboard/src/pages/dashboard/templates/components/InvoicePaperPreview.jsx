import React from 'react';
import { PrintablePaper } from '@/lib/print-engine/PrintablePaper';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';
import invoiceLogo from '@/assets/invoice_logo.png';

// Interpolate template tokens in string
const interpolate = (templateStr, data) => {
  if (!templateStr || typeof templateStr !== 'string') return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
};

export function InvoicePaperPreview({
  config = {},
  order = {},
  tenant = {},
  paperRef,
}) {
  const branding = config.branding || {};
  const header = config.header || {};
  const table = config.table || {};
  const footer = config.footer || {};

  const primaryColor = branding.primaryColor || '#0f172a';
  const secondaryColor = branding.secondaryColor || '#0d9488';
  const darkColor = branding.darkColor || branding.textColor || '#0f172a';
  const lightBgColor = branding.lightBgColor || branding.backgroundColor || '#f8fafc';
  const borderColor = branding.borderColor || '#e2e8f0';
  const mutedTextColor = branding.mutedTextColor || '#64748b';
  const fontFamily = branding.fontFamily || 'Inter, sans-serif';
  const borderRadius = typeof branding.borderRadius === 'number' ? `${branding.borderRadius}px` : (branding.borderRadius || '4px');

  // Dynamic Spacing & Padding
  const pagePadding = branding.pagePadding !== undefined ? `${branding.pagePadding}px` : '32px';
  const pageMargin = branding.pageMargin !== undefined ? `${branding.pageMargin}px` : '0px';
  const tableCellPadding = branding.tableCellPadding !== undefined ? `${branding.tableCellPadding}px` : '10px';
  const headerMarginBottom = branding.headerMarginBottom !== undefined ? `${branding.headerMarginBottom}px` : '20px';
  const sectionSpacing = branding.sectionSpacing !== undefined ? `${branding.sectionSpacing}px` : '16px';

  const logoUrl = header.logoUrl || tenant.logoUrl || tenant.logo || invoiceLogo;
  const logoHeight = header.logoHeight || 75;
  const logoPlacement = header.logoPlacement || 'left';
  const documentTitle = header.documentTitle || 'INVOICE';
  const documentSubtitle = header.documentSubtitle || tenant.brandName || 'Order Receipt';
  const showHeaderAccent = header.showHeaderAccent !== false;
  const showWatermark = header.showWatermark === true;
  const watermarkText = header.watermarkText || 'PAID';

  const currencySymbol = table.currencySymbol || '৳';
  const showSku = table.showSku !== false;
  const showVariantBadge = table.showVariantBadge !== false;
  const showUnitPrice = table.showUnitPrice !== false;
  const zebraStripes = table.zebraStripes === true;

  const showNotes = footer.showNotes !== false;
  const showTerms = footer.showTerms !== false;
  const showSignatures = footer.showSignatures !== false;
  const showQrCode = footer.showQrCode === true;

  const customer = order.customer || {};
  const items = order.items || [];

  // Build token dataset for interpolation
  const tokenData = {
    orderId: order.formattedOrderId || `#${order.orderId || '1001'}`,
    customerName: customer.name || 'Customer Name',
    customerPhone: customer.phone || 'N/A',
    customerEmail: customer.email || 'N/A',
    customerAddress: customer.address || 'N/A',
    totalAmount: `${currencySymbol} ${Number(order.totalAmount || 0).toLocaleString()}`,
    subtotal: `${currencySymbol} ${Number(order.subtotal || 0).toLocaleString()}`,
    discount: `${currencySymbol} ${Number(order.discount || 0).toLocaleString()}`,
    deliveryCharge: `${currencySymbol} ${Number(order.deliveryCharge || 0).toLocaleString()}`,
    paidAmount: `${currencySymbol} ${Number(order.paidAmount || 0).toLocaleString()}`,
    dueAmount: `${currencySymbol} ${Number(order.dueAmount || 0).toLocaleString()}`,
    paymentMethod: order.paymentMethod || 'Cash On Delivery',
    orderDate: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '04 Oct, 2026',
    orderStatus: order.orderStatus || 'Processing',
    brandName: tenant.brandName || 'Flexivia',
    supportEmail: tenant.supportEmail || 'support@flexivia.online',
    supportPhone: tenant.phone || tenant.supportPhone || '+880 1800-000000',
    domain: tenant.domain || 'flexivia.online',
  };

  const interpolatedNotes = interpolate(
    footer.notes || 'Thank you for shopping with {{brandName}}! For any inquiries, please contact {{supportEmail}}.',
    tokenData
  );

  const interpolatedTerms = interpolate(
    footer.termsAndConditions || '1. Goods once sold can be exchanged within 7 days with original invoice tag.\n2. Warranty claims require this printed invoice receipt.\n3. Delivery charges are non-refundable on returned packages.',
    tokenData
  );

  const interpolatedFooter = interpolate(
    footer.bottomNotice || '{{brandName}} • All Rights Reserved • System Generated Invoice',
    tokenData
  );

  const formatMoney = (val) => `${currencySymbol} ${Number(val || 0).toLocaleString()}`;

  return (
    <div className="w-full flex justify-center preview-container" style={{ fontFamily }}>
      <div
        ref={paperRef}
        id="printable-invoice-paper"
        className="w-full max-w-[820px] bg-white text-slate-900 shadow-xl rounded-sm relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0"
        style={{
          minHeight: '1080px',
          padding: pagePadding,
          margin: pageMargin,
          borderColor: borderColor,
          borderWidth: '1px',
          borderStyle: 'solid',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: darkColor,
        }}
      >
        {/* Custom CSS Injection if specified */}
        {config.customCss && <style>{config.customCss}</style>}

        {/* Optional Watermark Overlay */}
        {showWatermark && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
            style={{ opacity: 0.045, transform: 'rotate(-30deg)' }}
          >
            <span className="text-8xl sm:text-9xl font-black tracking-widest uppercase text-slate-900">
              {watermarkText}
            </span>
          </div>
        )}

        {/* Top Header Section */}
        <div className="relative z-10" style={{ marginBottom: headerMarginBottom }}>
          {showHeaderAccent && (
            <div
              className="h-2 w-full mb-5 rounded-t-sm transition-all"
              style={{
                background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                borderRadius: `${borderRadius} ${borderRadius} 0 0`,
              }}
            />
          )}

          {/* Header row with logo and title */}
          <div
            className={`flex flex-col sm:flex-row gap-6 pb-5 ${
              logoPlacement === 'center'
                ? 'items-center text-center'
                : logoPlacement === 'right'
                ? 'items-start sm:flex-row-reverse justify-between'
                : 'items-start justify-between'
            }`}
            style={{ borderBottom: `1px solid ${borderColor}` }}
          >
            {/* Logo and store basic info */}
            <div className={`space-y-2 ${logoPlacement === 'center' ? 'flex flex-col items-center' : ''}`}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={tenant.brandName || 'Store Logo'}
                  style={{ height: `${logoHeight}px`, maxHeight: '110px', maxWidth: '360px', objectFit: 'contain' }}
                  className="w-auto block"
                />
              ) : (
                <div
                  className="px-3.5 py-2 font-black text-lg tracking-tight rounded-md inline-block"
                  style={{ backgroundColor: primaryColor, color: '#ffffff' }}
                >
                  {tenant.brandName || 'STORE BRAND'}
                </div>
              )}

              <div className="text-xs leading-relaxed max-w-xs" style={{ color: mutedTextColor }}>
                <p className="font-bold" style={{ color: darkColor }}>{tenant.brandName || 'Flexivia Store'}</p>
                {tenant.phone && <p>Hotline: {tenant.phone}</p>}
                {tenant.supportEmail && <p>Email: {tenant.supportEmail}</p>}
                {tenant.address && <p>{tenant.address}</p>}
              </div>
            </div>

            {/* Document Title & Invoice Details */}
            <div className={`space-y-1 ${logoPlacement === 'center' ? 'text-center' : 'text-left sm:text-right'}`}>
              <h1
                className="text-2xl sm:text-3xl font-black tracking-tight uppercase"
                style={{ color: primaryColor }}
              >
                {documentTitle}
              </h1>
              {documentSubtitle && (
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: mutedTextColor }}>
                  {documentSubtitle}
                </p>
              )}

              <div className="pt-2 space-y-1 text-xs">
                <div className="flex items-center gap-2 justify-start sm:justify-end">
                  <span className="font-medium" style={{ color: mutedTextColor }}>Invoice No:</span>
                  <span className="font-mono font-bold" style={{ color: darkColor }}>{tokenData.orderId}</span>
                </div>
                <div className="flex items-center gap-2 justify-start sm:justify-end">
                  <span className="font-medium" style={{ color: mutedTextColor }}>Date:</span>
                  <span className="font-medium">{tokenData.orderDate}</span>
                </div>
                <div className="flex items-center gap-2 justify-start sm:justify-end pt-1">
                  <span
                    className="px-2.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider text-white shadow-xs"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {order.paymentStatus || 'PAID'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing & Shipping Details Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs"
            style={{ borderBottom: `1px solid ${borderColor}`, marginBottom: sectionSpacing }}
          >
            {/* Bill To */}
            <div
              className="p-3.5 rounded-lg"
              style={{
                backgroundColor: lightBgColor,
                borderRadius,
                borderColor: borderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: mutedTextColor }}>
                Billed To (Customer)
              </span>
              <p className="font-bold text-sm" style={{ color: darkColor }}>{customer.name || 'Customer Name'}</p>
              <p className="mt-0.5">{customer.phone || '+880 1712-345678'}</p>
              {customer.email && <p style={{ color: mutedTextColor }}>{customer.email}</p>}
              <p className="mt-1 leading-snug">
                {[customer.address, customer.city, customer.district, customer.postalCode]
                  .filter(Boolean)
                  .join(', ') || 'Dhaka, Bangladesh'}
              </p>
            </div>

            {/* Order & Payment Summary */}
            <div
              className="p-3.5 rounded-lg flex flex-col justify-between"
              style={{
                backgroundColor: lightBgColor,
                borderRadius,
                borderColor: borderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: mutedTextColor }}>
                  Payment Details
                </span>
                <div className="grid grid-cols-2 gap-y-1 text-xs">
                  <span style={{ color: mutedTextColor }}>Method:</span>
                  <span className="font-semibold">{order.paymentMethod || 'bKash Online'}</span>
                  <span style={{ color: mutedTextColor }}>Order Status:</span>
                  <span className="font-semibold">{order.orderStatus || 'Processing'}</span>
                  <span style={{ color: mutedTextColor }}>Currency:</span>
                  <span className="font-mono font-bold">{currencySymbol} (BDT)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-2 overflow-x-auto" style={{ marginBottom: sectionSpacing }}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  style={{
                    backgroundColor: primaryColor,
                    color: '#ffffff',
                  }}
                >
                  <th
                    className="font-semibold uppercase tracking-wider text-[11px] rounded-l-sm"
                    style={{ padding: `${tableCellPadding} 14px` }}
                  >
                    {table.itemHeader || 'Item Description'}
                  </th>
                  {showSku && (
                    <th
                      className="font-semibold uppercase tracking-wider text-[11px] text-center"
                      style={{ padding: `${tableCellPadding} 10px` }}
                    >
                      SKU
                    </th>
                  )}
                  {showUnitPrice && (
                    <th
                      className="font-semibold uppercase tracking-wider text-[11px] text-right"
                      style={{ padding: `${tableCellPadding} 14px` }}
                    >
                      {table.priceHeader || 'Unit Price'}
                    </th>
                  )}
                  <th
                    className="font-semibold uppercase tracking-wider text-[11px] text-center"
                    style={{ padding: `${tableCellPadding} 10px` }}
                  >
                    {table.qtyHeader || 'Qty'}
                  </th>
                  <th
                    className="font-semibold uppercase tracking-wider text-[11px] text-right rounded-r-sm"
                    style={{ padding: `${tableCellPadding} 14px` }}
                  >
                    {table.totalHeader || 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={zebraStripes && idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-transparent'}
                    style={{ borderBottom: `1px solid ${borderColor}` }}
                  >
                    <td style={{ padding: `${tableCellPadding} 14px` }}>
                      <div className="font-semibold" style={{ color: darkColor }}>{item.name}</div>
                      {showVariantBadge && item.variant && (
                        <span
                          className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] font-medium rounded"
                          style={{
                            color: secondaryColor,
                            backgroundColor: lightBgColor,
                            borderColor: borderColor,
                            borderWidth: '1px',
                            borderStyle: 'solid',
                          }}
                        >
                          {item.variant}
                        </span>
                      )}
                    </td>
                    {showSku && (
                      <td
                        className="text-center font-mono text-[11px]"
                        style={{ padding: `${tableCellPadding} 10px`, color: mutedTextColor }}
                      >
                        {item.sku || '—'}
                      </td>
                    )}
                    {showUnitPrice && (
                      <td
                        className="text-right font-medium"
                        style={{ padding: `${tableCellPadding} 14px` }}
                      >
                        {formatMoney(item.price)}
                      </td>
                    )}
                    <td
                      className="text-center font-bold"
                      style={{ padding: `${tableCellPadding} 10px`, color: darkColor }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className="text-right font-bold"
                      style={{ padding: `${tableCellPadding} 14px`, color: primaryColor }}
                    >
                      {formatMoney(item.total || item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes Split Section */}
          <div
            className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2 pb-5"
            style={{ borderBottom: `1px solid ${borderColor}` }}
          >
            {/* Left: Notes & QR code */}
            <div className="sm:col-span-7 space-y-3">
              {showNotes && interpolatedNotes && (
                <div
                  className="p-3 rounded-lg text-xs"
                  style={{
                    backgroundColor: lightBgColor,
                    borderRadius,
                    borderColor: borderColor,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                  }}
                >
                  <span className="font-bold block mb-0.5 text-[11px] uppercase tracking-wide" style={{ color: darkColor }}>
                    Notes & Remarks
                  </span>
                  <p className="whitespace-pre-line leading-relaxed" style={{ color: mutedTextColor }}>{interpolatedNotes}</p>
                </div>
              )}

              {showQrCode && (
                <div className="flex items-center gap-2.5 text-xs pt-1" style={{ color: mutedTextColor }}>
                  <div
                    className="h-10 w-10 p-1 rounded bg-white flex items-center justify-center shrink-0"
                    style={{ borderColor: borderColor, borderWidth: '1px', borderStyle: 'solid' }}
                  >
                    <QrCode className="h-8 w-8 text-slate-800" />
                  </div>
                  <div>
                    <span className="font-bold block text-[11px]" style={{ color: darkColor }}>Scan for Online Receipt</span>
                    <span className="text-[10px]" style={{ color: mutedTextColor }}>Order verification & tracking</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Calculations / Financial Totals Box */}
            <div className="sm:col-span-5">
              <div
                className="p-3.5 rounded-lg space-y-2 text-xs"
                style={{
                  backgroundColor: lightBgColor,
                  borderRadius,
                  borderColor: borderColor,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                <div className="flex justify-between" style={{ color: mutedTextColor }}>
                  <span>Subtotal</span>
                  <span className="font-medium" style={{ color: darkColor }}>{formatMoney(order.subtotal)}</span>
                </div>

                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span>-{formatMoney(order.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between" style={{ color: mutedTextColor }}>
                  <span>Delivery Charge</span>
                  <span className="font-medium" style={{ color: darkColor }}>{formatMoney(order.deliveryCharge)}</span>
                </div>

                {Number(order.tax) > 0 && (
                  <div className="flex justify-between" style={{ color: mutedTextColor }}>
                    <span>Tax / VAT</span>
                    <span className="font-medium" style={{ color: darkColor }}>{formatMoney(order.tax)}</span>
                  </div>
                )}

                <div
                  className="flex justify-between pt-2 font-black text-sm"
                  style={{ color: primaryColor, borderTop: `2px solid ${borderColor}` }}
                >
                  <span>Grand Total</span>
                  <span>{formatMoney(order.totalAmount)}</span>
                </div>

                {Number(order.paidAmount) > 0 && (
                  <div className="flex justify-between text-xs pt-1">
                    <span style={{ color: mutedTextColor }}>Paid Amount</span>
                    <span className="font-semibold text-emerald-700">{formatMoney(order.paidAmount)}</span>
                  </div>
                )}

                {Number(order.dueAmount) > 0 && (
                  <div className="flex justify-between text-xs text-rose-700 font-bold pt-0.5">
                    <span>Due / COD</span>
                    <span>{formatMoney(order.dueAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Terms, Signatures & Copyright */}
        <div className="relative z-10 pt-3 space-y-4 text-xs">
          {/* Terms & Conditions */}
          {showTerms && interpolatedTerms && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: mutedTextColor }}>
                Terms & Conditions
              </span>
              <p className="text-[11px] whitespace-pre-line leading-relaxed" style={{ color: mutedTextColor }}>
                {interpolatedTerms}
              </p>
            </div>
          )}

          {/* Signatures Row */}
          {showSignatures && (
            <div className="grid grid-cols-2 gap-8 pt-5 pb-2">
              {/* Signatory 1 */}
              <div className="flex flex-col items-center text-center">
                {footer.signature1Image ? (
                  <img
                    src={footer.signature1Image}
                    alt="Signature"
                    className="h-10 max-h-10 w-auto object-contain mb-1"
                  />
                ) : (
                  <div className="h-10 w-32 border-b border-dashed mb-1" style={{ borderColor: mutedTextColor }} />
                )}
                <span className="font-bold text-[11px]" style={{ color: darkColor }}>
                  {footer.signature1Name || 'Customer Signature'}
                </span>
                <span className="text-[10px]" style={{ color: mutedTextColor }}>
                  {footer.signature1Title || 'Received by'}
                </span>
              </div>

              {/* Signatory 2 */}
              <div className="flex flex-col items-center text-center">
                {footer.signature2Image ? (
                  <img
                    src={footer.signature2Image}
                    alt="Signature"
                    className="h-10 max-h-10 w-auto object-contain mb-1"
                  />
                ) : (
                  <div className="h-10 w-32 border-b border-dashed mb-1" style={{ borderColor: mutedTextColor }} />
                )}
                <span className="font-bold text-[11px]" style={{ color: darkColor }}>
                  {footer.signature2Name || tenant.brandName || 'Authorized Signatory'}
                </span>
                <span className="text-[10px]" style={{ color: mutedTextColor }}>
                  {footer.signature2Title || 'For Store Management'}
                </span>
              </div>
            </div>
          )}

          {/* System Footer Notice */}
          <div
            className="pt-3 text-center text-[10px] flex items-center justify-between"
            style={{ borderTop: `1px solid ${borderColor}`, color: mutedTextColor }}
          >
            <span>{interpolatedFooter}</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Verified Document</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoicePaperPreview;
