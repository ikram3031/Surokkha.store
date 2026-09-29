// Formats numeric currency value into BDT string representation
const formatCurrency = (val) => {
  return typeof val === 'number' ? `৳${val.toLocaleString()}` : (val || '৳0');
};

// Exports an array of objects to a CSV file securely with UTF-8 BOM
export const exportToCsv = (data, filename = 'export.csv') => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [];
  csvRows.push(headers.join(','));

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      
      const strVal = String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n') || strVal.includes('\r')) {
        return `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    });
    csvRows.push(values.join(','));
  }

  const bom = '\uFEFF';
  const csvString = bom + csvRows.join('\r\n');

  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// Exports specific report tab data to CSV with formatted currency and clean headers
export const exportReportToCsv = (tabKey, reportData, customFilename) => {
  if (!reportData) return;

  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = customFilename || `report_${tabKey}_${dateStamp}.csv`;
  let rows = [];

  if (tabKey === 'sales' || tabKey === 'timeline') {
    const list = Array.isArray(reportData) ? reportData : [];
    rows = list.map((item) => ({
      Date: item._id || item.date || '',
      'Orders Count': item.ordersCount ?? 0,
      'Gross Sales': formatCurrency(item.grossSales),
      Discounts: formatCurrency(item.discount),
      'Net Sales': formatCurrency(item.netSales),
    }));
  } else if (tabKey === 'products') {
    const list = Array.isArray(reportData) ? reportData : [];
    rows = list.map((item) => ({
      'Product Name': item._id || item.name || 'Unknown',
      SKU: item.sku || 'N/A',
      'Units Sold': item.unitsSold ?? 0,
      Revenue: formatCurrency(item.revenue),
    }));
  } else if (tabKey === 'payments') {
    const list = Array.isArray(reportData) ? reportData : [];
    rows = list.map((item) => ({
      'Payment Method': String(item._id || item.paymentMethod || 'Unknown').toUpperCase(),
      Transactions: item.transactionCount ?? 0,
      'Total Amount': formatCurrency(item.totalAmount),
      'Paid Amount': formatCurrency(item.paidAmount),
    }));
  } else if (tabKey === 'inventory') {
    const list = Array.isArray(reportData) ? reportData : (reportData?.alerts || []);
    rows = list.map((item) => ({
      'Product Name': item.name || item.title || item._id || 'Unknown',
      SKU: item.sku || 'N/A',
      Type: item.type || 'Standard',
      'Current Stock': item.stock ?? 0,
      Status: item.status || (item.stock === 0 ? 'Out of Stock' : 'Low Stock'),
    }));
  } else if (Array.isArray(reportData) && reportData.length > 0) {
    rows = reportData;
  }

  if (rows.length > 0) {
    exportToCsv(rows, filename);
  }
};
