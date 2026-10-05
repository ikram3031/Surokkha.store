import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, LayoutDashboard, Settings } from 'lucide-react';
import axios from 'axios';

const AdminLayout = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      <div className="flex h-screen w-full overflow-hidden">
        {/* Admin Sidebar */}
        <aside 
          className="w-64 flex flex-col transition-all duration-300"
          style={sidebarStyle}
        >
          <div className="p-4 flex items-center border-b border-white/10">
            <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
          </div>
          <nav className="flex-1 py-4 space-y-1">
            <Link 
              to="/dashboard"
              className="flex items-center px-4 py-2 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Back to Dashboard</span>
            </Link>
            <Link 
              to="/admin"
              className="flex items-center px-4 py-2 hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              <span>Overview</span>
            </Link>
            <Link 
              to="/admin/styles"
              className="flex items-center px-4 py-2 hover:bg-white/10 transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              <span>Styles Configuration</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main 
          className="flex-1 overflow-y-auto"
          style={mainStyle}
        >
          <div className="p-6 h-full min-w-0 w-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default AdminLayout;
