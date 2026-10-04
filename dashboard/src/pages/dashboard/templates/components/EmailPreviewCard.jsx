import React, { useState } from 'react';
import { Smartphone, Monitor, Mail, ExternalLink, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Interpolate template tokens in string
const interpolate = (templateStr, data) => {
  if (!templateStr || typeof templateStr !== 'string') return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, key) => {
    return data[key] !== undefined && data[key] !== null ? String(data[key]) : match;
  });
};

export function EmailPreviewCard({
  config = {},
  order = {},
  tenant = {},
}) {
  const [deviceMode, setDeviceMode] = useState('desktop'); // 'desktop' | 'mobile'

  const branding = config.branding || {};
  const header = config.header || {};
  const email = config.email || {};
  const table = config.table || {};

  const primaryColor = branding.primaryColor || '#0f172a';
  const secondaryColor = branding.secondaryColor || '#0d9488';
  const logoUrl = header.logoUrl || tenant.logoUrl || tenant.logo || '';
  const logoHeight = Math.min(header.logoHeight || 45, 55);

  const bannerBg = email.bannerBg || primaryColor;
  const buttonColor = email.buttonColor || secondaryColor;
  const buttonText = email.buttonText || 'View Order Status';
  const currencySymbol = table.currencySymbol || '৳';

  const customer = order.customer || {};
  const items = order.items || [];

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

  const greeting = interpolate(
    email.greeting || 'Dear {{customerName}}, thank you for shopping with {{brandName}}!',
    tokenData
  );

  const statusMessage = interpolate(
    email.orderStatusMessage || 'Your order {{orderId}} has been successfully placed and is now being processed.',
    tokenData
  );

  const footerText = interpolate(
    email.footerText || 'If you have questions about your order, simply reply to this email or reach us at {{supportEmail}}.',
    tokenData
  );

  const formatMoney = (val) => `${currencySymbol} ${Number(val || 0).toLocaleString()}`;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Device Switcher Header */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border border-border/80">
        <button
          type="button"
          onClick={() => setDeviceMode('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            deviceMode === 'desktop'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
          <span>Desktop Inbox</span>
        </button>
        <button
          type="button"
          onClick={() => setDeviceMode('mobile')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            deviceMode === 'mobile'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Mobile Phone</span>
        </button>
      </div>

      {/* Email Client Shell */}
      <div
        className={`transition-all duration-300 rounded-xl overflow-hidden border border-border/80 shadow-2xl bg-zinc-100 dark:bg-zinc-900 ${
          deviceMode === 'mobile' ? 'max-w-[390px] w-full' : 'max-w-[620px] w-full'
        }`}
      >
        {/* Fake Email Header Bar */}
        <div className="bg-muted/80 px-4 py-2.5 border-b border-border/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {email.subject ? interpolate(email.subject, tokenData) : `Order Confirmed: ${tokenData.orderId}`}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">From: {tenant.supportEmail || 'store@flexivia.online'}</span>
        </div>

        {/* Email Body Canvas */}
        <div className="p-4 sm:p-6 bg-slate-50 text-slate-800">
          <div className="bg-white rounded-xl shadow-md border border-slate-200/80 overflow-hidden text-left">
            {/* Brand Header Banner */}
            <div
              className="p-6 text-center text-white"
              style={{ backgroundColor: bannerBg }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={tenant.brandName || 'Brand Logo'}
                  style={{ height: `${logoHeight}px`, maxHeight: '55px', objectFit: 'contain' }}
                  className="mx-auto mb-2"
                />
              ) : (
                <h2 className="text-xl font-black tracking-tight text-white mb-1">
                  {tenant.brandName || 'FLEXIVIA'}
                </h2>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-xs text-white mt-1">
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Order Confirmation {tokenData.orderId}</span>
              </div>
            </div>

            {/* Email Main Content */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{greeting}</h3>
                <p className="text-slate-600 leading-relaxed">{statusMessage}</p>
              </div>

              {/* Order Info Card */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Order ID</span>
                  <span className="font-mono font-bold text-slate-800">{tokenData.orderId}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Placed On</span>
                  <span className="font-medium text-slate-700">{tokenData.orderDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment</span>
                  <span className="font-semibold text-slate-800">{order.paymentMethod || 'bKash'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Address</span>
                  <span className="text-slate-700 truncate block">{customer.address || 'Banani, Dhaka'}</span>
                </div>
              </div>

              {/* Items Summary Table */}
              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Order Summary
                </span>
                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Qty: {item.quantity} {item.variant ? `• ${item.variant}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {formatMoney(item.total || item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{formatMoney(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge</span>
                  <span>{formatMoney(order.deliveryCharge)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>Total Amount</span>
                  <span style={{ color: primaryColor }}>{formatMoney(order.totalAmount)}</span>
                </div>
              </div>

              {/* CTA Action Button */}
              <div className="pt-2 text-center">
                <a
                  href={`https://${tenant.domain || 'flexivia.online'}/orders/${order.orderId || '10284'}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold text-white shadow-md transition-all hover:opacity-95"
                  style={{ backgroundColor: buttonColor }}
                >
                  <span>{buttonText}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Customer Support Footer */}
              <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 leading-relaxed">
                <p>{footerText}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  © {new Date().getFullYear()} {tenant.brandName || 'Flexivia'}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailPreviewCard;
