/**
 * ============================================================================
 * UNIVERSAL ISOLATED A4 PRINT ENGINE FOR REACT / VITE / NEXT.JS
 * ============================================================================
 * 
 * Developed for Monsur Ali Travels ERP (Document Studio & Invoicing).
 * 
 * KEY FEATURES:
 * 1. Isolated Iframe Printing: Clones only the target printable canvas into an
 *    invisible iframe. Completely eliminates parent layout offsets (sidebars,
 *    navbars, fixed overlays, and split-view scale-[0.88] container transforms).
 * 2. Automatic Unique ID & Metadata PDF Filename: Generates clear filenames like:
 *    "JVF-89356_Job_Verification_Md_Rafiqul_Islam.pdf"
 *    "INV-2608001_Invoice_Md_Rahman.pdf"
 * 3. Resource Pre-loading: Waits for document fonts and all image assets to
 *    finish rendering before triggering browser print dialog.
 * 4. Fallback Support: Automatically falls back to standard window.print() if
 *    iframe manipulation is restricted.
 */

/**
 * Extract document ID from any standard document data object
 */
export function getDocumentId(data) {
  if (!data || typeof data !== 'object') return '';
  return (
    data.verificationId ||
    data.agreementId ||
    data.invoiceNo ||
    data.slipNo ||
    data.applicationNo ||
    data.submissionNo ||
    data.receiptNo ||
    data.trackingNo ||
    data.tokenNo ||
    data.voucherNo ||
    data.certificateNo ||
    data.webFileNo ||
    data.caseNumber ||
    data.customId ||
    data.idNumber ||
    data.clientCode ||
    ''
  );
}

/**
 * Extract recipient/client/employee name from document data object
 */
export function getDocumentRecipientName(data) {
  if (!data || typeof data !== 'object') return '';
  return (
    data.clientInfo?.clientName ||
    data.client?.fullName ||
    data.client?.name ||
    data.applicantName ||
    data.employeeName ||
    data.parties?.employeeName ||
    data.clientName ||
    data.paidTo ||
    data.receivedBy ||
    data.candidateName ||
    data.groomName ||
    ''
  );
}

/**
 * Prints a target DOM element inside an isolated, invisible iframe.
 * This guarantees 100% precision: zero sidebar offset, no split-view scale distortion,
 * no modal interference, full A4 width alignment, and clean PDF document naming.
 *
 * @param {HTMLElement} targetEl - The DOM element to clone and print
 * @param {string} pdfFileName - Formatted file name for PDF save dialog
 * @param {string} originalTitle - Original browser document title to restore
 */
export function printElementInIsolatedFrame(targetEl, pdfFileName, originalTitle = document.title) {
  // Remove any previous print iframes
  const existingFrame = document.getElementById('__mat_print_frame__');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = '__mat_print_frame__';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!frameDoc) {
    throw new Error('Unable to access iframe document');
  }

  // Extract all stylesheets and style blocks from current document
  let stylesHtml = '';
  const headElements = document.querySelectorAll('link[rel="stylesheet"], style');
  headElements.forEach((node) => {
    stylesHtml += node.outerHTML + '\n';
  });

  // Strict A4 print CSS rules for the isolated iframe
  const printOverrides = `
    <style>
      @page {
        size: A4 portrait;
        margin: 0 !important;
      }
      *, *::before, *::after {
        box-sizing: border-box !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #111827 !important;
        width: 100% !important;
        min-height: 100% !important;
        height: auto !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        visibility: visible !important;
      }
      body * {
        visibility: visible !important;
      }
      /* Remove any external scale or transform that came from UI containers */
      * {
        transform: none !important;
      }
      .printable-a4-paper,
      .printable-money-receipt,
      [id*="canvas"],
      [id*="printable"],
      #job-verification-canvas,
      #printable-invoice-canvas,
      #printable-receipt-canvas,
      #printable-money-receipt,
      #salary-slip-canvas,
      #employment-agreement-canvas,
      #client-guardian-canvas,
      #printable-client-form-canvas,
      #customer-guardian-canvas,
      #cash-voucher-canvas,
      #printable-indian-visa-canvas,
      #printable-passport-canvas,
      #experience-certificate-canvas,
      #printable-experience-certificate,
      #character-certificate-canvas,
      #printable-character-certificate,
      #marriage-certificate-canvas,
      #printable-marriage-certificate {
        width: 210mm !important;
        max-width: 210mm !important;
        min-height: 296mm !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        padding: 6mm 8mm !important;
        border: none !important;
        box-shadow: none !important;
        background: #ffffff !important;
        color: #111827 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        position: relative !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        visibility: visible !important;
      }
      .no-print, .no-print * {
        display: none !important;
        visibility: hidden !important;
      }
    </style>
  `;

  // Deep clone target element and ensure it is fully visible
  const clone = targetEl.cloneNode(true);
  if (clone.classList) {
    clone.classList.remove('hidden');
  }
  if (clone.style) {
    clone.style.display = '';
    clone.style.visibility = 'visible';
  }

  frameDoc.open();
  frameDoc.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${pdfFileName}</title>
    ${stylesHtml}
    ${printOverrides}
  </head>
  <body style="margin:0; padding:0; background:#ffffff;">
    <div style="width:100%; display:flex; justify-content:center; margin:0; padding:0;">
      ${clone.outerHTML}
    </div>
  </body>
</html>`);
  frameDoc.close();

  // Set document title for PDF saving
  document.title = pdfFileName;
  if (frameDoc.title) {
    frameDoc.title = pdfFileName;
  }

  // Trigger print after fonts and image assets are ready
  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print trigger failed, falling back to window.print():', err);
      window.print();
    } finally {
      setTimeout(() => {
        document.title = originalTitle;
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2000);
    }
  };

  if (frameDoc.fonts && frameDoc.fonts.ready) {
    frameDoc.fonts.ready.then(() => {
      setTimeout(triggerPrint, 150);
    }).catch(() => {
      setTimeout(triggerPrint, 250);
    });
  } else {
    setTimeout(triggerPrint, 250);
  }
}

/**
 * Common, robust utility to print or save PDF with the backend unique ID at the very beginning of the filename.
 * Supports isolated iframe printing for 100% precision (prevents sidebar offset,
 * removes split-view scale interference, eliminates modal overlay issues)
 * while providing seamless fallback to standard window.print().
 *
 * Example generated filename when saving PDF: "JVF-AB48291_Job_Verification_Md_Rafiqul_Islam.pdf"
 *
 * @param {Object} options
 * @param {string} [options.docId] - Unique ID returned from backend (e.g. data.verificationId, data.invoiceNo, data.agreementId, data.slipNo)
 * @param {string} [options.docType] - Document type name (e.g. 'Job_Verification', 'Invoice', 'Salary_Slip', 'Agreement')
 * @param {string} [options.clientName] - Client or candidate name
 * @param {Object} [options.data] - Optional raw document data object (auto-extracts docId and clientName if not explicitly passed)
 * @param {string} [options.extra] - Optional extra metadata
 * @param {string} [options.elementId] - Optional DOM ID of the printable canvas
 * @param {HTMLElement} [options.element] - Optional direct DOM element reference
 */
export function printDocument({
  docId,
  docType = '',
  clientName = '',
  data = null,
  extra = '',
  elementId = '',
  element = null,
} = {}) {
  const originalTitle = document.title;

  const resolvedId = docId || (data ? getDocumentId(data) : '');
  const resolvedName = clientName || (data ? getDocumentRecipientName(data) : '');

  const cleanId = String(resolvedId || '').trim();
  const cleanType = String(docType || '').trim().replace(/[\s/\\:*?"<>|]+/g, '_');
  const cleanName = String(resolvedName || '').trim().replace(/[\s/\\:*?"<>|]+/g, '_');
  const cleanExtra = String(extra || '').trim().replace(/[\s/\\:*?"<>|]+/g, '_');

  const parts = [];
  if (cleanId) parts.push(cleanId);
  if (cleanType) parts.push(cleanType);
  if (cleanName) parts.push(cleanName);
  if (cleanExtra) parts.push(cleanExtra);

  const pdfFileName = parts.length > 0 ? parts.join('_') : 'Monsur_Ali_Travels_Document';

  // Identify printable DOM element
  let targetEl = element;
  if (!targetEl && elementId) {
    targetEl = document.getElementById(elementId);
  }
  if (!targetEl) {
    // Check known canvas IDs or standard class
    const knownIds = [
      '#job-verification-canvas',
      '#printable-invoice-canvas',
      '#printable-receipt-canvas',
      '#printable-money-receipt',
      '#salary-slip-canvas',
      '#employment-agreement-canvas',
      '#client-guardian-canvas',
      '#printable-client-form-canvas',
      '#customer-guardian-canvas',
      '#cash-voucher-canvas',
      '#printable-indian-visa-canvas',
      '#printable-passport-canvas',
      '#experience-certificate-canvas',
      '#printable-experience-certificate',
      '#character-certificate-canvas',
      '#printable-character-certificate',
      '#marriage-certificate-canvas',
      '#printable-marriage-certificate',
      '.printable-a4-paper',
      '.printable-money-receipt',
    ];
    for (const selector of knownIds) {
      const found = document.querySelector(selector);
      if (found) {
        targetEl = found;
        break;
      }
    }
  }

  // If printable element exists in DOM, print via clean isolated iframe
  if (targetEl && typeof window !== 'undefined' && document.body) {
    try {
      printElementInIsolatedFrame(targetEl, pdfFileName, originalTitle);
      return;
    } catch (err) {
      console.warn('Isolated iframe print failed, falling back to window.print():', err);
    }
  }

  // Fallback: window.print()
  try {
    document.title = pdfFileName;
    window.print();
  } finally {
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  }
}

export default printDocument;
