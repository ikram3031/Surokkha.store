const fs = require('fs');
const path = require('path');

function fixRouter(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find where children: starts for /dashboard
    const dashboardMatch = content.match(/{\s*path:\s*'\/dashboard',\s*element:\s*<DashboardLayout \/>,\s*errorElement:\s*<RouteErrorElement \/>,\s*children:\s*\[([\s\S]+?)\s*],\s*},/);
    if (!dashboardMatch) {
        console.log("Could not find dashboard routes block in", filePath);
        return;
    }
    
    const childrenBlock = dashboardMatch[1];
    const newContent = content.replace(/export const router = createBrowserRouter\(\[/, \
const dashboardRoutes = [
\
];

export const router = createBrowserRouter([\);

    const finalContent = newContent
        .replace(dashboardMatch[0], \{
    path: '/dashboard',
    element: <DashboardLayout />,
    errorElement: <RouteErrorElement />,
    children: dashboardRoutes,
  },\)
        .replace(/{\s*path:\s*'\/admin',\s*element:\s*<AdminLayout \/>,\s*errorElement:\s*<RouteErrorElement \/>,\s*children:\s*\[[\s\S]*?\]\s*}/, \{
    path: '/admin',
    element: <AdminLayout />,
    errorElement: <RouteErrorElement />,
    children: dashboardRoutes,
  }\);
    
    fs.writeFileSync(filePath, finalContent);
    console.log("Fixed router.jsx in", filePath);
}

function fixSidebar(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/"\/dashboard/g, '"/admin');
    content = content.replace(/'\/dashboard/g, "'/admin");
    content = content.replace(/\\/dashboard/g, "\/admin");
    fs.writeFileSync(filePath, content);
    console.log("Fixed admin-sidebar.jsx in", filePath);
}

const repos = ['d:/Surokkha.store', 'D:/mtEcomWhite'];

repos.forEach(repo => {
    fixRouter(path.join(repo, 'dashboard/src/router.jsx'));
    fixSidebar(path.join(repo, 'dashboard/src/components/dashboard/admin-sidebar.jsx'));
});
