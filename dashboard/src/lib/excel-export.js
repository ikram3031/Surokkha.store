import JSZip from 'jszip';

// Escapes special characters for XML strings in OpenXML Excel worksheets
const escapeXml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Escapes values for standard RFC-4180 CSV compliance
export const escapeCsvCell = (str) => {
  if (str === null || str === undefined) return '';
  const s = String(str);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

// Generates serialized CSV string from column names and row objects
export const generateCsvString = (columns, rows) => {
  const header = columns.join(',');
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvCell(row[col] ?? '')).join(',')
  );
  return [header, ...dataLines].join('\r\n');
};

// Helper to trigger browser download for any blob
export const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Triggers browser download for CSV file with UTF-8 BOM
export const exportToCsv = (filename, columns, rows) => {
  const csvContent = generateCsvString(columns, rows);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};

// Converts zero-based column index to Excel column letters
const indexToColumnLetters = (index) => {
  let num = index + 1;
  let str = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    str = String.fromCharCode(65 + remainder) + str;
    num = Math.floor((num - 1) / 26);
  }
  return str;
};

// Builds a genuine OpenXML .xlsx spreadsheet Blob using JSZip
export const generateXlsxBlob = async (sheetName = 'MetaCatalog', columns = [], rows = []) => {
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  zip.folder('_rels').file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  const xl = zip.folder('xl');

  xl.folder('_rels').file(
    'workbook.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  const safeSheetName = escapeXml(sheetName.slice(0, 31).replace(/[\\/?*[\]]/g, ''));
  xl.file(
    'workbook.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheetName || 'MetaCatalog'}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  xl.file(
    'styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color rgb="0F172A"/><name val="Segoe UI"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFF"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="0F172A"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
  </cellXfs>
</styleSheet>`
  );

  let sheetRowsXml = '';

  sheetRowsXml += '<row r="1">';
  columns.forEach((col, cIdx) => {
    const cellRef = `${indexToColumnLetters(cIdx)}1`;
    sheetRowsXml += `<c r="${cellRef}" t="inlineStr" s="1"><is><t>${escapeXml(col)}</t></is></c>`;
  });
  sheetRowsXml += '</row>';

  rows.forEach((row, rIdx) => {
    const rowNum = rIdx + 2;
    sheetRowsXml += `<row r="${rowNum}">`;
    columns.forEach((col, cIdx) => {
      const cellRef = `${indexToColumnLetters(cIdx)}${rowNum}`;
      const val = row[col];
      if (val !== null && val !== undefined && val !== '') {
        const numVal = Number(val);
        const isNumeric = typeof val === 'number' || (!isNaN(numVal) && !String(val).startsWith('0') && String(val).trim() !== '' && !String(val).includes(' '));
        if (isNumeric && !['id', 'sku', 'item_group_id', 'gtin'].includes(col)) {
          sheetRowsXml += `<c r="${cellRef}"><v>${numVal}</v></c>`;
        } else {
          sheetRowsXml += `<c r="${cellRef}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(val)}</t></is></c>`;
        }
      }
    });
    sheetRowsXml += '</row>';
  });

  xl.folder('worksheets').file(
    'sheet1.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRowsXml}</sheetData>
</worksheet>`
  );

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
};

// Triggers browser download for Excel .xlsx file
export const exportToXlsx = async (filename, sheetName, columns, rows) => {
  const blob = await generateXlsxBlob(sheetName, columns, rows);
  triggerBlobDownload(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
};

// Packages and downloads both Store and Shop catalog files in a single zip archive
export const downloadDualSiteZip = async ({
  zipFilename = 'meta_catalogs_dual_storefronts.zip',
  storeRows = [],
  shopRows = [],
  columns = [],
  format = 'csv',
  storeName = 'surokkha_store',
  shopName = 'surokkha_shop',
  dateStr = new Date().toISOString().slice(0, 10),
}) => {
  const zip = new JSZip();

  if (format === 'xlsx') {
    const storeBlob = await generateXlsxBlob('StoreCatalog', columns, storeRows);
    const shopBlob = await generateXlsxBlob('ShopCatalog', columns, shopRows);
    zip.file(`meta_catalog_${storeName}_${dateStr}.xlsx`, storeBlob);
    zip.file(`meta_catalog_${shopName}_${dateStr}.xlsx`, shopBlob);
  } else {
    const storeCsv = generateCsvString(columns, storeRows);
    const shopCsv = generateCsvString(columns, shopRows);
    zip.file(`meta_catalog_${storeName}_${dateStr}.csv`, '\uFEFF' + storeCsv);
    zip.file(`meta_catalog_${shopName}_${dateStr}.csv`, '\uFEFF' + shopCsv);
  }

  const readme = `=======================================================
META COMMERCE MANAGER DUAL-SITE CATALOG FEEDS
Date: ${dateStr}
=======================================================

1. SUROKKHA STORE CATALOG:
   - Target Storefront: https://surokkha.store
   - Meta Pixel ID: 1840805450442709
   - File: meta_catalog_${storeName}_${dateStr}.${format}
   - Scheduled Feed URL: https://api.surokkha.store/api/v1/products/feed/meta-catalog-store.csv

2. SUROKKHA SHOP CATALOG:
   - Target Storefront: https://surokkha.shop
   - Meta Pixel ID: 1565104865301894
   - File: meta_catalog_${shopName}_${dateStr}.${format}
   - Scheduled Feed URL: https://api.surokkha.store/api/v1/products/feed/meta-catalog-shop.csv

INSTRUCTIONS FOR META COMMERCE MANAGER:
1. Log in to Meta Commerce Manager (business.facebook.com/commerce).
2. Select your catalog and navigate to "Data Sources" -> "Data Feeds".
3. Choose "Upload File" (upload the respective CSV) or "Scheduled Feed" (enter the Feed URL).
4. Save and allow Meta to import products.
`;
  zip.file('README_META_CATALOGS.txt', readme);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(zipBlob, zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`);
};