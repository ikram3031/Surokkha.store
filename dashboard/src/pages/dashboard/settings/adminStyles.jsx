import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

const AdminStylesPage = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState({
    primaryColor: '#0f172a',
    secondaryColor: '#475569',
    accentColor: '#0284c7',
    backgroundColor: '#f8fafc',
    sidebarColor: '#ffffff',
    textColor: '#0f172a',
    fontFamily: 'Plus Jakarta Sans',
    borderRadius: 8
  });
  
  const type = 'Admin'; // Or Stoorefr for storefront, here Admin.

  useEffect(() => {
    fetchStyle();
  }, []);

  const fetchStyle = async () => {
    try {
      const response = await api.get('/styles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        const adminStyle = response.data.data.find(s => s.type === type);
        if (adminStyle && adminStyle.theme) {
          setTheme(adminStyle.theme);
        }
      }
    } catch (error) {
      toast.error('Failed to load styles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/styles/${type}`, { theme }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.status === 'success') {
        toast.success('Styles updated successfully');
        // Apply theme variables directly or via context
        document.documentElement.style.setProperty('--theme-bg', theme.backgroundColor);
        document.documentElement.style.setProperty('--theme-sidebar', theme.sidebarColor);
      }
    } catch (error) {
      toast.error('Failed to update styles');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTheme(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin & Dashboard Styles</CardTitle>
          <CardDescription>Update the theme colors and layout styles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <Input type="color" name="primaryColor" value={theme.primaryColor} onChange={handleChange} className="w-12 h-10 p-1" />
                <Input type="text" name="primaryColor" value={theme.primaryColor} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Background Color</Label>
              <div className="flex gap-2">
                <Input type="color" name="backgroundColor" value={theme.backgroundColor} onChange={handleChange} className="w-12 h-10 p-1" />
                <Input type="text" name="backgroundColor" value={theme.backgroundColor} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sidebar Color</Label>
              <div className="flex gap-2">
                <Input type="color" name="sidebarColor" value={theme.sidebarColor} onChange={handleChange} className="w-12 h-10 p-1" />
                <Input type="text" name="sidebarColor" value={theme.sidebarColor} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                <Input type="color" name="textColor" value={theme.textColor} onChange={handleChange} className="w-12 h-10 p-1" />
                <Input type="text" name="textColor" value={theme.textColor} onChange={handleChange} />
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Styles
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStylesPage;
