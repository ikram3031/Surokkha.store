import { config as defaultClientConfig } from '../../config/index.js';

// Default template preset styles
export const DEFAULT_TEMPLATE_PRESETS = {
  modern: {
    branding: {
      primaryColor: '#0f172a',
      secondaryColor: '#475569',
      accentColor: '#0284c7',
      backgroundColor: '#f8fafc',
      cardBackground: '#ffffff',
      textColor: '#0f172a',
      mutedTextColor: '#64748b',
      borderColor: '#e2e8f0',
      fontFamily: 'Plus Jakarta Sans',
      borderRadius: 8,
    },
    header: {
      logoHeight: 44,
      logoPlacement: 'left',
      headerTitle: 'INVOICE',
      headerSubtitle: 'Official Sales Receipt & Tax Document',
      showWatermark: false,
      watermarkText: 'PAID',
    },
    table: {
      showSku: false,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: true,
      currencySymbol: '৳',
    },
    footer: {
      notesTitle: 'Special Notes',
      notesContent: 'Thank you for shopping with us! For any support or inquiries, please contact our helpline.',
      termsTitle: 'Terms & Conditions',
      termsContent: '1. Goods once sold can be exchanged within 7 days with original invoice.\n2. In case of transit damage, report within 24 hours.',
      showSignatureSection: true,
      authorizedSignText: 'Authorized Signature & Seal',
      signImageUrl: '',
      showQrCode: true,
      qrCodePosition: 'footer',
      supportPhone: '',
      supportEmail: '',
      supportAddress: '',
    },
    email: {
      subjectTemplate: '{{brandName}}: Order Confirmation #{{orderId}}',
      preheaderText: 'Thank you for your order! Here is your official invoice.',
      headerBannerBg: '#0f172a',
      headerTextColor: '#ffffff',
      ctaButtonText: 'View & Download Invoice',
      ctaButtonColor: '#0284c7',
      customerGreeting: 'Hello {{customerName}}, thank you for shopping with us!',
      emailFooterText: 'If you have any questions, reply directly to this email or call our support team.',
    },
  },
  minimalist: {
    branding: {
      primaryColor: '#18181b',
      secondaryColor: '#71717a',
      accentColor: '#18181b',
      backgroundColor: '#ffffff',
      cardBackground: '#ffffff',
      textColor: '#18181b',
      mutedTextColor: '#71717a',
      borderColor: '#e4e4e7',
      fontFamily: 'Inter',
      borderRadius: 0,
    },
    header: {
      logoHeight: 40,
      logoPlacement: 'left',
      headerTitle: 'INVOICE',
      headerSubtitle: 'Sales Memo',
      showWatermark: false,
      watermarkText: 'PAID',
    },
    table: {
      showSku: true,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: false,
      currencySymbol: '৳',
    },
    footer: {
      notesTitle: 'Notes',
      notesContent: 'Thank you for your business.',
      termsTitle: 'Terms',
      termsContent: 'Standard 7-day replacement policy applies.',
      showSignatureSection: true,
      authorizedSignText: 'Authorized Signatory',
      signImageUrl: '',
      showQrCode: true,
      qrCodePosition: 'footer',
      supportPhone: '',
      supportEmail: '',
      supportAddress: '',
    },
    email: {
      subjectTemplate: '{{brandName}} Invoice #{{orderId}}',
      preheaderText: 'Your invoice is ready.',
      headerBannerBg: '#18181b',
      headerTextColor: '#ffffff',
      ctaButtonText: 'View Invoice',
      ctaButtonColor: '#18181b',
      customerGreeting: 'Hello {{customerName}},',
      emailFooterText: 'Thank you for choosing {{brandName}}.',
    },
  },
  classic: {
    branding: {
      primaryColor: '#1e3a5f',
      secondaryColor: '#475569',
      accentColor: '#b8860b',
      backgroundColor: '#fdfbf7',
      cardBackground: '#ffffff',
      textColor: '#1e293b',
      mutedTextColor: '#64748b',
      borderColor: '#e2d9cc',
      fontFamily: 'Georgia',
      borderRadius: 4,
    },
    header: {
      logoHeight: 48,
      logoPlacement: 'center',
      headerTitle: 'TAX INVOICE',
      headerSubtitle: 'Authentic Retail & Commercial Voucher',
      showWatermark: true,
      watermarkText: 'ORIGINAL',
    },
    table: {
      showSku: false,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: true,
      currencySymbol: '৳',
    },
    footer: {
      notesTitle: 'Customer Care & Notice',
      notesContent: 'We appreciate your patronage. Please preserve this original voucher for warranty and claims.',
      termsTitle: 'Terms of Sale',
      termsContent: '1. Exchange within 7 days with intact tags and invoice.\n2. Warranty services require proof of purchase.',
      showSignatureSection: true,
      authorizedSignText: 'Authorized Representative & Seal',
      signImageUrl: '',
      showQrCode: true,
      qrCodePosition: 'footer',
      supportPhone: '',
      supportEmail: '',
      supportAddress: '',
    },
    email: {
      subjectTemplate: '{{brandName}} Order Invoice #{{orderId}}',
      preheaderText: 'Thank you for your purchase with {{brandName}}.',
      headerBannerBg: '#1e3a5f',
      headerTextColor: '#ffffff',
      ctaButtonText: 'Download Official Invoice',
      ctaButtonColor: '#b8860b',
      customerGreeting: 'Dear {{customerName}},',
      emailFooterText: 'For customer service inquiries, contact us at {{supportEmail}}.',
    },
  },
  bold: {
    branding: {
      primaryColor: '#09090b',
      secondaryColor: '#3f3f46',
      accentColor: '#e11d48',
      backgroundColor: '#f4f4f5',
      cardBackground: '#ffffff',
      textColor: '#09090b',
      mutedTextColor: '#71717a',
      borderColor: '#d4d4d8',
      fontFamily: 'Plus Jakarta Sans',
      borderRadius: 12,
    },
    header: {
      logoHeight: 46,
      logoPlacement: 'left',
      headerTitle: 'INVOICE / RECEIPT',
      headerSubtitle: 'Direct Store Order Summary',
      showWatermark: false,
      watermarkText: 'PAID',
    },
    table: {
      showSku: true,
      showVariantBadge: true,
      showUnitPrice: true,
      zebraStripes: true,
      currencySymbol: '৳',
    },
    footer: {
      notesTitle: 'Important Remarks',
      notesContent: 'Check items upon delivery. Direct return allowed on courier receipt.',
      termsTitle: 'Policies & Warranty',
      termsContent: '1. Defective items replaced within 48h.\n2. No cash refunds once delivery accepted.',
      showSignatureSection: true,
      authorizedSignText: 'Store Manager',
      signImageUrl: '',
      showQrCode: true,
      qrCodePosition: 'footer',
      supportPhone: '',
      supportEmail: '',
      supportAddress: '',
    },
    email: {
      subjectTemplate: '🚀 Order Confirmed: #{{orderId}} - {{brandName}}',
      preheaderText: 'Your order has been received and is being processed.',
      headerBannerBg: '#09090b',
      headerTextColor: '#ffffff',
      ctaButtonText: 'Track & View Invoice',
      ctaButtonColor: '#e11d48',
      customerGreeting: 'Hey {{customerName}}, you have great taste!',
      emailFooterText: 'Questions? Ping our support on {{supportPhone}}.',
    },
  },
};

// Interpolates string with context tokens
export const interpolateTokens = (templateString, tokens = {}) => {
  if (!templateString || typeof templateString !== 'string') return '';
  return templateString.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return tokens[key] !== undefined ? String(tokens[key]) : match;
  });
};

export const compileA4InvoiceHtml = (
  arg1 = {},
  maybeTemplateConfig,
  maybeClientConfig,
  maybeIsPrintView
) => {
  let templateConfig, order, clientConfig, isPrintView;
  if (arg1 && (arg1.order !== undefined || arg1.templateConfig !== undefined)) {
    templateConfig = arg1.templateConfig || {};
    order = arg1.order || {};
    clientConfig = arg1.clientConfig || defaultClientConfig || {};
    isPrintView = arg1.isPrintView || false;
  } else {
    order = arg1 || {};
    templateConfig = maybeTemplateConfig || {};
    clientConfig = maybeClientConfig || defaultClientConfig || {};
    isPrintView = maybeIsPrintView || false;
  }

  const mergedConfig = {
    ...DEFAULT_TEMPLATE_PRESETS.modern,
    ...templateConfig,
    branding: { ...DEFAULT_TEMPLATE_PRESETS.modern.branding, ...(templateConfig.branding || {}) },
    header: { ...DEFAULT_TEMPLATE_PRESETS.modern.header, ...(templateConfig.header || {}) },
    table: { ...DEFAULT_TEMPLATE_PRESETS.modern.table, ...(templateConfig.table || {}) },
    footer: { ...DEFAULT_TEMPLATE_PRESETS.modern.footer, ...(templateConfig.footer || {}) },
  };

  const { branding, header, table, footer, customCss } = mergedConfig;

  const brandName = clientConfig.brandName || 'Flexivia';
  const logoUrl = header.logoUrl || clientConfig.logoUrl || '';
  const storeAddress = footer.supportAddress || clientConfig.contact?.address || clientConfig.address || 'Dhaka, Bangladesh';
  const storePhone = footer.supportPhone || clientConfig.contact?.phone || clientConfig.phone || '+8801700000000';
  const storeEmail = footer.supportEmail || clientConfig.contact?.supportEmail || clientConfig.supportEmail || 'info@plexivia.online';
  const currency = table.currencySymbol || '৳';

  const orderId = order.orderId || order.orderNumber || order.formattedOrderId || order.id || order._id || 'INV-0000';
  const orderDate = order.orderDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString());
  const customerName = order.customerName || order.customer?.name || order.billing?.name || order.shipping?.name || 'Valued Customer';
  const customerPhone = order.customerPhone || order.customer?.phone || order.billing?.phone || order.shipping?.phone || '';
  const customerAddress = order.customerAddress || order.customer?.address || order.billing?.address || order.shipping?.address || '';
  const customerEmail = order.customerEmail || order.customer?.email || order.billing?.email || order.shipping?.email || '';

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || order.subtotalAmount || 0);
  const shippingFee = Number(order.shippingFee || order.deliveryCharge || 0);
  const discountAmount = Number(order.discountAmount || order.discount || 0);
  const totalAmount = Number(order.totalAmount || order.total || (subtotal + shippingFee - discountAmount));
  const paymentMethod = order.paymentMethod || 'Cash on Delivery';
  const paymentStatus = (order.paymentStatus || 'unpaid').toUpperCase();

  const tokens = {
    orderId,
    customerName,
    customerPhone,
    customerAddress,
    customerEmail,
    brandName,
    subtotal: `${currency}${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    shippingFee: `${currency}${shippingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    discountAmount: `${currency}${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    totalAmount: `${currency}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    paymentMethod,
    paymentStatus,
    orderDate,
    supportPhone: storePhone,
    supportEmail: storeEmail,
    supportAddress: storeAddress,
  };

  const renderedNotes = interpolateTokens(footer.notesContent || '', tokens);
  const renderedTerms = interpolateTokens(footer.termsContent || '', tokens);

  // Minimum rows balancing to preserve strict A4 single-page height
  const MIN_ROWS = 3;
  const processedItems = [...items];
  while (processedItems.length < MIN_ROWS) {
    processedItems.push({ isEmptyPlaceholder: true });
  }

  const itemsRows = processedItems
    .map((item, idx) => {
      if (item.isEmptyPlaceholder) {
        return `
          <tr style="border-bottom: 1px solid ${branding.borderColor}; min-height: 38px;">
            <td style="padding: 10px 14px; font-size: 13px; color: ${branding.mutedTextColor};">—</td>
            <td style="padding: 10px 14px; font-size: 13px; text-align: center; color: ${branding.mutedTextColor};">—</td>
            ${table.showUnitPrice ? `<td style="padding: 10px 14px; font-size: 13px; text-align: right; color: ${branding.mutedTextColor};">—</td>` : ''}
            <td style="padding: 10px 14px; font-size: 13px; text-align: right; color: ${branding.mutedTextColor};">—</td>
          </tr>
        `;
      }

      const name = item.productName || item.name || item.title || 'Product';
      const variant = table.showVariantBadge && (item.variantName || item.size || item.color)
        ? `<div style="font-size: 11px; color: ${branding.accentColor}; font-weight: 600; margin-top: 2px;">✦ ${item.variantName || `${item.size || ''} ${item.color || ''}`.trim()}</div>`
        : '';
      const skuBadge = table.showSku && item.sku ? `<div style="font-size: 10.5px; color: ${branding.mutedTextColor};">SKU: ${item.sku}</div>` : '';
      const qty = Number(item.quantity || item.qty || 1);
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const itemTotal = Number(item.subtotal || item.total || qty * unitPrice);

      const isEven = idx % 2 === 1;
      const rowBg = table.zebraStripes && isEven ? `background-color: ${branding.backgroundColor};` : 'background-color: #ffffff;';

      return `
        <tr style="${rowBg} border-bottom: 1px solid ${branding.borderColor};">
          <td style="padding: 10px 14px; font-size: 13px; color: ${branding.textColor}; font-weight: 500;">
            ${name}
            ${variant}
            ${skuBadge}
          </td>
          <td style="padding: 10px 14px; font-size: 13px; color: ${branding.mutedTextColor}; text-align: center;">
            ${qty}
          </td>
          ${table.showUnitPrice ? `
            <td style="padding: 10px 14px; font-size: 13px; color: ${branding.mutedTextColor}; text-align: right;">
              ${currency}${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </td>
          ` : ''}
          <td style="padding: 10px 14px; font-size: 13px; color: ${branding.primaryColor}; font-weight: 700; text-align: right;">
            ${currency}${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${orderId} - ${brandName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0 !important;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      margin: 0;
      padding: 0;
    }
    html, body {
      background-color: ${branding.backgroundColor};
      color: ${branding.textColor};
      font-family: ${branding.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 16px;
    }
    .invoice-wrapper {
      max-width: 850px;
      min-height: 1050px;
      margin: 0 auto;
      background: ${branding.cardBackground};
      border: 1px solid ${branding.borderColor};
      border-radius: ${branding.borderRadius}px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      position: relative;
    }
    .invoice-header {
      padding: 28px 32px;
      background: ${branding.backgroundColor};
      border-bottom: 1px solid ${branding.borderColor};
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-logo-container {
      display: flex;
      flex-direction: column;
      align-items: ${header.logoPlacement === 'center' ? 'center' : header.logoPlacement === 'right' ? 'flex-end' : 'flex-start'};
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: ${branding.primaryColor};
      letter-spacing: -0.02em;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h2 {
      font-size: 18px;
      font-weight: 800;
      color: ${branding.primaryColor};
      letter-spacing: 0.05em;
    }
    .invoice-meta p {
      font-size: 12px;
      color: ${branding.mutedTextColor};
      margin-top: 3px;
    }
    .status-pill {
      display: inline-block;
      padding: 2px 8px;
      font-size: 10.5px;
      font-weight: 700;
      border-radius: 9999px;
      background-color: ${paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7'};
      color: ${paymentStatus === 'PAID' ? '#15803d' : '#b45309'};
      margin-top: 4px;
    }
    .invoice-body {
      padding: 28px 32px;
      flex-grow: 1;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }
    .info-box h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${branding.accentColor};
      margin-bottom: 6px;
      font-weight: 700;
    }
    .info-box p {
      font-size: 13px;
      color: ${branding.textColor};
      line-height: 1.5;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: ${branding.backgroundColor};
      padding: 10px 14px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${branding.primaryColor};
      font-weight: 700;
      text-align: left;
      border-bottom: 2px solid ${branding.borderColor};
    }
    .totals-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 20px;
    }
    .notes-section {
      flex: 1;
      max-width: 55%;
      font-size: 12px;
      color: ${branding.mutedTextColor};
      background: ${branding.backgroundColor};
      padding: 14px;
      border-radius: ${branding.borderRadius}px;
      border: 1px dashed ${branding.borderColor};
    }
    .notes-section h4 {
      font-size: 11px;
      font-weight: 700;
      color: ${branding.primaryColor};
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .totals-table {
      width: 260px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 13px;
      color: ${branding.mutedTextColor};
    }
    .totals-row.grand-total {
      border-top: 2px solid ${branding.primaryColor};
      padding-top: 8px;
      margin-top: 6px;
      font-size: 16px;
      font-weight: 800;
      color: ${branding.primaryColor};
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 20px;
      margin-top: 10px;
      border-top: 1px solid ${branding.borderColor};
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px dashed ${branding.mutedTextColor};
      margin-top: 40px;
      padding-top: 4px;
      font-size: 11px;
      color: ${branding.mutedTextColor};
    }
    .invoice-footer {
      padding: 16px 32px;
      background: ${branding.backgroundColor};
      border-top: 1px solid ${branding.borderColor};
      font-size: 11.5px;
      color: ${branding.mutedTextColor};
      text-align: center;
    }
    .watermark {
      position: absolute;
      top: 45%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 110px;
      font-weight: 900;
      color: ${branding.primaryColor};
      opacity: 0.04;
      pointer-events: none;
      user-select: none;
      letter-spacing: 0.1em;
    }
    .no-print {
      text-align: center;
      margin-bottom: 14px;
    }
    .print-btn {
      display: inline-block;
      padding: 9px 18px;
      background: ${branding.primaryColor};
      color: #ffffff;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .invoice-wrapper {
        border: none !important;
        box-shadow: none !important;
        max-width: 210mm !important;
        width: 210mm !important;
        min-height: 296mm !important;
        border-radius: 0 !important;
        padding: 6mm 8mm !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
    ${customCss || ''}
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()" class="print-btn">Print / Save as PDF</button>
  </div>
  <div class="invoice-wrapper" id="printable-invoice-canvas">
    ${header.showWatermark ? `<div class="watermark">${header.watermarkText || 'PAID'}</div>` : ''}
    <div>
      <div class="invoice-header">
        <div class="brand-logo-container">
          ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: ${header.logoHeight || 44}px; width: auto; margin-bottom: 6px;" />` : `<div class="brand-title">${brandName}</div>`}
          <p style="font-size: 11.5px; color: ${branding.mutedTextColor};">${storeAddress}</p>
        </div>
        <div class="invoice-meta">
          <h2>${header.headerTitle || 'INVOICE'}</h2>
          <p><strong>Order #:</strong> ${orderId}</p>
          <p><strong>Date:</strong> ${orderDate}</p>
          <div><span class="status-pill">${paymentStatus}</span></div>
        </div>
      </div>
      <div class="invoice-body">
        <div class="info-grid">
          <div class="info-box">
            <h3>Billed To</h3>
            <p><strong>${customerName}</strong></p>
            ${customerPhone ? `<p>Phone: ${customerPhone}</p>` : ''}
            ${customerAddress ? `<p>Address: ${customerAddress}</p>` : ''}
            ${customerEmail ? `<p>Email: ${customerEmail}</p>` : ''}
          </div>
          <div class="info-box" style="text-align: right;">
            <h3>Sold By</h3>
            <p><strong>${brandName}</strong></p>
            <p>${storeAddress}</p>
            <p>Phone: ${storePhone}</p>
            <p>Email: ${storeEmail}</p>
          </div>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th style="text-align: center;">Qty</th>
              ${table.showUnitPrice ? `<th style="text-align: right;">Unit Price</th>` : ''}
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <div class="totals-wrapper">
          <div class="notes-section">
            <h4>${footer.notesTitle || 'Notes'}</h4>
            <p style="white-space: pre-line; line-height: 1.4;">${renderedNotes || 'Thank you for shopping with us.'}</p>
            ${renderedTerms ? `
              <h4 style="margin-top: 8px;">${footer.termsTitle || 'Terms'}</h4>
              <p style="white-space: pre-line; line-height: 1.4;">${renderedTerms}</p>
            ` : ''}
          </div>
          <div class="totals-table">
            <div class="totals-row">
              <span>Subtotal</span>
              <span>${currency}${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="totals-row">
              <span>Shipping Fee</span>
              <span>${currency}${shippingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            ${discountAmount > 0 ? `
              <div class="totals-row" style="color: #16a34a; font-weight: 600;">
                <span>Discount</span>
                <span>-${currency}${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            ` : ''}
            <div class="totals-row grand-total">
              <span>Grand Total</span>
              <span>${currency}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div>
      ${footer.showSignatureSection ? `
        <div class="signature-section" style="padding: 16px 32px;">
          <div class="signature-box">
            <div class="signature-line">Customer Signature</div>
          </div>
          <div class="signature-box">
            ${footer.signImageUrl ? `<img src="${footer.signImageUrl}" alt="Signature" style="max-height: 38px; margin-bottom: -15px;" />` : ''}
            <div class="signature-line">${footer.authorizedSignText || 'Authorized Signature & Seal'}</div>
          </div>
        </div>
      ` : ''}
      <div class="invoice-footer">
        <p>${brandName} • Support: ${storeEmail} | ${storePhone}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

// Compiles and returns Gmail/Outlook-safe transactional email HTML
export const compileTransactionalEmailHtml = (
  arg1 = {},
  maybeTemplateConfig,
  maybeClientConfig
) => {
  let templateConfig, order, clientConfig;
  if (arg1 && (arg1.order !== undefined || arg1.templateConfig !== undefined)) {
    templateConfig = arg1.templateConfig || {};
    order = arg1.order || {};
    clientConfig = arg1.clientConfig || defaultClientConfig || {};
  } else {
    order = arg1 || {};
    templateConfig = maybeTemplateConfig || {};
    clientConfig = maybeClientConfig || defaultClientConfig || {};
  }

  const mergedConfig = {
    ...DEFAULT_TEMPLATE_PRESETS.modern,
    ...templateConfig,
    branding: { ...DEFAULT_TEMPLATE_PRESETS.modern.branding, ...(templateConfig.branding || {}) },
    header: { ...DEFAULT_TEMPLATE_PRESETS.modern.header, ...(templateConfig.header || {}) },
    table: { ...DEFAULT_TEMPLATE_PRESETS.modern.table, ...(templateConfig.table || {}) },
    footer: { ...DEFAULT_TEMPLATE_PRESETS.modern.footer, ...(templateConfig.footer || {}) },
    email: { ...DEFAULT_TEMPLATE_PRESETS.modern.email, ...(templateConfig.email || {}) },
  };

  const { branding, header, table, footer, email } = mergedConfig;

  const brandName = clientConfig.brandName || 'Flexivia';
  const logoUrl = header.logoUrl || clientConfig.logoUrl || '';
  const storePhone = footer.supportPhone || clientConfig.contact?.phone || clientConfig.phone || '+8801700000000';
  const storeEmail = footer.supportEmail || clientConfig.contact?.supportEmail || clientConfig.supportEmail || 'info@plexivia.online';
  const currency = table.currencySymbol || '৳';

  const orderId = order.orderId || order.orderNumber || order.formattedOrderId || order.id || order._id || 'INV-0000';
  const orderDate = order.orderDate || (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString());
  const customerName = order.customerName || order.customer?.name || order.billing?.name || order.shipping?.name || 'Valued Customer';
  const customerPhone = order.customerPhone || order.customer?.phone || order.billing?.phone || order.shipping?.phone || '';
  const customerAddress = order.customerAddress || order.customer?.address || order.billing?.address || order.shipping?.address || '';
  const customerEmail = order.customerEmail || order.customer?.email || order.billing?.email || order.shipping?.email || '';

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal || order.subtotalAmount || 0);
  const shippingFee = Number(order.shippingFee || order.deliveryCharge || 0);
  const discountAmount = Number(order.discountAmount || order.discount || 0);
  const totalAmount = Number(order.totalAmount || order.total || (subtotal + shippingFee - discountAmount));
  const paymentMethod = order.paymentMethod || 'Cash on Delivery';

  const tokens = {
    orderId,
    customerName,
    customerPhone,
    customerAddress,
    brandName,
    subtotal: `${currency}${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    shippingFee: `${currency}${shippingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    discountAmount: `${currency}${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    totalAmount: `${currency}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    paymentMethod,
    orderDate,
    supportPhone: storePhone,
    supportEmail: storeEmail,
  };

  const greeting = interpolateTokens(email.customerGreeting || 'Hello {{customerName}}, thank you for shopping with us!', tokens);
  const footerText = interpolateTokens(email.emailFooterText || 'If you have any questions, reply to this email.', tokens);
  const invoiceDownloadUrl = `${clientConfig.apiBaseUrl || 'https://api.plexivia.online'}/api/v1/orders/${orderId}/invoice`;

  const itemsRows = items
    .map((item) => {
      const name = item.productName || item.name || item.title || 'Product';
      const variant = item.variantName ? `<span style="font-size: 11px; color: ${branding.accentColor};"> (${item.variantName})</span>` : '';
      const qty = Number(item.quantity || item.qty || 1);
      const unitPrice = Number(item.unitPrice || item.price || 0);
      const itemTotal = Number(item.subtotal || item.total || qty * unitPrice);

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-family: sans-serif;">
            <strong>${name}</strong>${variant}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #64748b; text-align: center; font-family: sans-serif;">
            ${qty}
          </td>
          <td style="padding: 10px 12px; font-size: 13px; color: #1e293b; font-weight: 700; text-align: right; font-family: sans-serif;">
            ${currency}${itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${brandName} Order Confirmation</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${email.headerBannerBg || branding.primaryColor}; padding: 24px 32px; text-align: center;">
              ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: 44px; width: auto; margin-bottom: 8px;" />` : `<h1 style="margin: 0; color: ${email.headerTextColor || '#ffffff'}; font-size: 24px; font-weight: 800;">${brandName}</h1>`}
              <p style="margin: 4px 0 0 0; color: #cbd5e1; font-size: 12px;">Order Confirmation #${orderId}</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #0f172a; font-weight: 600;">${greeting}</p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #475569; line-height: 1.5;">Your order has been placed successfully and is being prepared for shipment.</p>
              
              <!-- Order Summary Table -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: left;">Item</th>
                    <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: center;">Qty</th>
                    <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; color: #475569; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td width="60%"></td>
                  <td width="40%">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Subtotal:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1e293b; text-align: right;">${currency}${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Shipping:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1e293b; text-align: right;">${currency}${shippingFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      ${discountAmount > 0 ? `
                        <tr>
                          <td style="padding: 4px 0; font-size: 13px; color: #16a34a;">Discount:</td>
                          <td style="padding: 4px 0; font-size: 13px; color: #16a34a; text-align: right;">-${currency}${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0 0 0; font-size: 15px; font-weight: 800; color: ${branding.primaryColor}; border-top: 2px solid #e2e8f0;">Grand Total:</td>
                        <td style="padding: 8px 0 0 0; font-size: 15px; font-weight: 800; color: ${branding.primaryColor}; text-align: right; border-top: 2px solid #e2e8f0;">${currency}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action CTA Button -->
              <div style="text-align: center; margin: 32px 0 16px 0;">
                <a href="${invoiceDownloadUrl}" style="display: inline-block; background-color: ${email.ctaButtonColor || branding.accentColor}; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">${email.ctaButtonText || 'View & Download Invoice'}</a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">${footerText}</p>
              <p style="margin: 0; font-size: 11px;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

