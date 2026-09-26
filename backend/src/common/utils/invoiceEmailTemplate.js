export const buildInvoiceEmailHtml = ({
  invoiceNumber,
  createdDate,
  dueDate,
  sellerName,
  sellerAddress,
  buyerName,
  buyerAddress,
  buyerEmail,
  paymentMethod,
  paymentReference,
  items,
  subtotal,
  taxes,
  discount,
  total,
  invoiceUrl,
  notes,
  logoUrl,
}) => {
  const finalSellerName = sellerName || "Decantre";
  const finalSellerAddress = sellerAddress || "House 20, Rd 10, Uttara, Dhaka 1230";
  const finalBuyerName = buyerName || "Customer";
  const finalBuyerAddress = buyerAddress || "Customer Address";
  const finalBuyerEmail = buyerEmail || "";
  const finalItems = Array.isArray(items) ? items : [];
  const finalCreatedDate = createdDate || new Date().toLocaleDateString();
  const finalDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const finalPaymentMethod = paymentMethod || "Check";
  const finalPaymentReference = paymentReference || "1000";
  const finalNotes = notes || "Please make payment by the due date. If you have any questions, reply to this email.";

  const itemsHtml = finalItems
    .map(
      (item, index) => `
        <tr class="item${index === finalItems.length - 1 ? " last" : ""}">
          <td>${item.description || "Item"}</td>
          <td style="text-align: center;">${item.quantity ?? 1}</td>
          <td style="text-align: right;">${item.price || ""}</td>
          <td style="text-align: right;">${item.total || item.price || ""}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice ${invoiceNumber}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            background: #f5f7fb;
            color: #555;
          }
          .invoice-box {
            max-width: 800px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
            font-size: 16px;
            line-height: 24px;
            color: #555;
          }
          .invoice-box table {
            width: 100%;
            line-height: inherit;
            text-align: left;
          }
          .invoice-box table td {
            padding: 5px;
            vertical-align: top;
          }
          .invoice-box table tr td:nth-child(2) {
            text-align: right;
          }
          .invoice-box table tr.top table td {
            padding-bottom: 20px;
          }
          .invoice-box table tr.top table td.title {
            font-size: 45px;
            line-height: 45px;
            color: #333;
          }
          .invoice-box table tr.information table td {
            padding-bottom: 40px;
          }
          .invoice-box table tr.heading td {
            background: #eee;
            border-bottom: 1px solid #ddd;
            font-weight: bold;
          }
          .invoice-box table tr.details td {
            padding-bottom: 20px;
          }
          .invoice-box table tr.item td {
            border-bottom: 1px solid #eee;
          }
          .invoice-box table tr.item.last td {
            border-bottom: none;
          }
          .invoice-box table tr.total td:nth-child(2) {
            border-top: 2px solid #eee;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #C5A059;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
          }
          @media only screen and (max-width: 600px) {
            .invoice-box table tr.top table td,
            .invoice-box table tr.information table td {
              width: 100%;
              display: block;
              text-align: center;
            }
            .invoice-box table tr td:nth-child(2) {
              text-align: left;
            }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr class="top">
              <td colspan="2">
                <table>
                  <tr>
                    <td class="title">
                      ${logoUrl ? `<img src="${logoUrl}" style="width: 100%; max-width: 300px;" />` : `<strong>${finalSellerName}</strong>`}
                    </td>
                    <td>
                      Invoice #: ${invoiceNumber}<br />
                      Created: ${finalCreatedDate}<br />
                      Due: ${finalDueDate}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="information">
              <td colspan="2">
                <table>
                  <tr>
                    <td>
                      ${finalSellerName}<br />
                      ${finalSellerAddress}
                    </td>
                    <td>
                      ${finalBuyerName}<br />
                      ${finalBuyerAddress}<br />
                      ${finalBuyerEmail}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="heading">
              <td>Payment Method</td>
              <td>Check #</td>
            </tr>
            <tr class="details">
              <td>${finalPaymentMethod}</td>
              <td>${finalPaymentReference}</td>
            </tr>
            <tr class="heading">
              <td>Item</td>
              <td style="text-align: center;">Qty</td>
              <td style="text-align: right;">Price</td>
              <td style="text-align: right;">Total</td>
            </tr>
            ${itemsHtml}
            <tr class="total">
              <td></td>
              <td></td>
              <td></td>
              <td>Total: ${total}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #666;">${finalNotes}</p>
          <p style="margin-top: 30px; text-align: center;">
            <a href="${invoiceUrl}" style="display: inline-block; padding: 12px 28px; background-color: #C5A059; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-family: sans-serif; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">See & Download Invoice</a>
          </p>
        </div>
      </body>
    </html>
  `;
};
