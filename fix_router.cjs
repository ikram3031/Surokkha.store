const fs = require('fs');
let c = fs.readFileSync('dashboard/src/router.jsx', 'utf8');
let s = c.indexOf('path: \'/dashboard\'');
let start = c.indexOf('children: [', s) + 10;
let brackets = 1;
let end = start + 1;
while(brackets > 0 && end < c.length){
    if(c[end] === '[') brackets++;
    if(c[end] === ']') brackets--;
    end++;
}
let dashBlock = c.substring(start+1, end-1);
let newC = c.replace('export const router = createBrowserRouter([', 'const dashboardRoutes = [' + dashBlock + '];\n\nexport const router = createBrowserRouter([');
newC = newC.substring(0, start) + 'dashboardRoutes' + c.substring(end);
newC = newC.replace(/path: '\/admin',[\s\S]*?children: \[[\s\S]*?    \]/, 'path: \'/admin\',\n    element: <AdminLayout />,\n    errorElement: <RouteErrorElement />,\n    children: dashboardRoutes');
fs.writeFileSync('dashboard/src/router.jsx', newC);
