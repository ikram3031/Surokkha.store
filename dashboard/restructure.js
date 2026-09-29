import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');
const appDir = path.join(srcDir, 'app', '(core)');
const pagesDir = path.join(srcDir, 'pages');
const layoutsDir = path.join(srcDir, 'layouts');

const fileMappings = [
  { from: 'login/page.jsx', to: 'pages/auth/Login.jsx' },
  { from: 'dashboard/layout.jsx', to: 'layouts/DashboardLayout.jsx' },
  { from: 'dashboard/page.jsx', to: 'pages/dashboard/Overview.jsx' },
  { from: 'dashboard/users/page.jsx', to: 'pages/dashboard/Users.jsx' },
  { from: 'dashboard/reports/page.jsx', to: 'pages/dashboard/Reports.jsx' },
  { from: 'dashboard/members/page.jsx', to: 'pages/dashboard/Members.jsx' },
  
  { from: 'dashboard/products/page.jsx', to: 'pages/dashboard/products/ProductsList.jsx' },
  { from: 'dashboard/products/[id]/page.jsx', to: 'pages/dashboard/products/ProductDetails.jsx' },
  { from: 'dashboard/products/new/page.jsx', to: 'pages/dashboard/products/NewProduct.jsx' },
  { from: 'dashboard/products/stock/page.jsx', to: 'pages/dashboard/products/Stock.jsx' },
  { from: 'dashboard/products/coupons/page.jsx', to: 'pages/dashboard/products/Coupons.jsx' },
  { from: 'dashboard/products/categories/page.jsx', to: 'pages/dashboard/products/Categories.jsx' },
  { from: 'dashboard/products/brands/page.jsx', to: 'pages/dashboard/products/Brands.jsx' },
  { from: 'dashboard/products/attributes/page.jsx', to: 'pages/dashboard/products/Attributes.jsx' },
  
  { from: 'dashboard/orders/page.jsx', to: 'pages/dashboard/orders/OrdersList.jsx' },
  { from: 'dashboard/orders/[id]/page.jsx', to: 'pages/dashboard/orders/OrderDetails.jsx' },
  { from: 'dashboard/orders/new/page.jsx', to: 'pages/dashboard/orders/NewOrder.jsx' },
  
  { from: 'dashboard/billing/page.jsx', to: 'pages/dashboard/billing/BillingOverview.jsx' },
  { from: 'dashboard/billing/payments/page.jsx', to: 'pages/dashboard/billing/Payments.jsx' },
  { from: 'dashboard/billing/billings/page.jsx', to: 'pages/dashboard/billing/Billings.jsx' }
];

// Create directories
const dirsToCreate = [
  layoutsDir,
  path.join(pagesDir, 'auth'),
  path.join(pagesDir, 'dashboard', 'products'),
  path.join(pagesDir, 'dashboard', 'orders'),
  path.join(pagesDir, 'dashboard', 'billing')
];

dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Move files
fileMappings.forEach(mapping => {
  const fromPath = path.join(appDir, mapping.from);
  const toPath = path.join(srcDir, mapping.to);
  
  if (fs.existsSync(fromPath)) {
    let content = fs.readFileSync(fromPath, 'utf8');
    
    // Auto-convert default export functions to arrow functions 
    const regex = /export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\((.*?)\)\s*\{/;
    const match = content.match(regex);
    if (match) {
        const compName = match[1];
        content = content.replace(regex, `const ${compName} = ($2) => {`);
        content += `\nexport default ${compName};\n`;
    }
    
    fs.writeFileSync(toPath, content);
    console.log(`Moved: ${mapping.from} -> ${mapping.to}`);
  } else {
    console.warn(`File not found: ${fromPath}`);
  }
});

// Delete src/app directory recursively
if (fs.existsSync(path.join(srcDir, 'app'))) {
  fs.rmSync(path.join(srcDir, 'app'), { recursive: true, force: true });
  console.log('Removed src/app directory.');
}

console.log('Restructure complete.');
