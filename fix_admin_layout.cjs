const fs = require('fs');
let c = fs.readFileSync('dashboard/src/layouts/adminLayout.jsx', 'utf8');
c = \import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthGuard } from '@/components/auth-guard';
import { AdminSidebar } from '@/components/dashboard/admin-sidebar';
import { Header } from '@/components/dashboard/header';
import { ClientThemeProvider } from '@/components/clientThemeProvider';
import { ClientSidebarProvider } from '@/components/dashboard/client-sidebar-provider';
import { ClientRouteGuard } from '@/components/clientRouteGuard';
import axios from 'axios';

const AdminLayout = ({ children }) => {
  const [themeStyles, setThemeStyles] = useState(null);

  useEffect(() => {
    // Fetch Admin style settings
    const fetchStyles = async () => {
      try {
        const res = await axios.get('/api/v1/styles');
        if (res.data?.data) {
          const adminStyle = res.data.data.find(s => s.type === 'Admin');
          if (adminStyle) {
            setThemeStyles(adminStyle.styles || {});
          }
        }
      } catch (err) {
        console.error('Error fetching styles:', err);
      }
    };
    fetchStyles();
  }, []);

  const sidebarStyle = themeStyles?.sidebar || { backgroundColor: '#1f2937', color: '#ffffff' };
  const mainStyle = themeStyles?.main || { backgroundColor: '#f3f4f6', color: '#000000' };

  return (
    <AuthGuard>
      <ClientThemeProvider>
        <ClientSidebarProvider>
          <div style={sidebarStyle} className="h-full z-10 flex">
            <AdminSidebar />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden min-w-0 w-full" style={mainStyle}>
            <Header />
            <main className="flex-1 overflow-y-auto min-w-0 p-4 sm:p-6" style={mainStyle}>
              <ClientRouteGuard>
                {children || <Outlet />}
              </ClientRouteGuard>
            </main>
          </div>
        </ClientSidebarProvider>
      </ClientThemeProvider>
    </AuthGuard>
  );
};

export default AdminLayout;
\;
fs.writeFileSync('dashboard/src/layouts/adminLayout.jsx', c);
