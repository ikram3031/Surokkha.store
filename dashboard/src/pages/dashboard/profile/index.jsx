import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Globe, Check, Edit2, Camera, UserCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/utils/dateHelper';

export default function UserProfile() {
  const { t } = useTranslation();
  const { user, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Try to parse out first/last name if the backend only has 'name'
  const nameParts = (user?.name || '').split(' ');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    email: '',
    avatar: ''
  });

  // Re-sync form if user changes from auth context
  useEffect(() => {
    if (user) {
      const parts = (user.name || '').split(' ');
      setFormData({
        firstName: user.firstName || parts[0] || '',
        lastName: user.lastName || parts.slice(1).join(' ') || '',
        phone: user.phone || '',
        address: user.address || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiClient.put('/api/v1/users/me', formData);
      
      if (res.data?.status === 'success' && res.data.data) {
        setUser(res.data.data);
        toast.success(t('profile.update_success', 'Profile updated successfully'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || t('profile.update_error', 'Failed to update profile'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('images', file);

    try {
      const uploadRes = await apiClient.post('/api/v1/images/upload', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (uploadRes.data?.data?.[0]?.url) {
        const imageUrl = uploadRes.data.data[0].url;
        setFormData(prev => ({ ...prev, avatar: imageUrl }));
        
        // Immediately save the new avatar
        await apiClient.put('/api/v1/users/me', { 
          firstName: formData.firstName,
          lastName: formData.lastName,
          avatar: imageUrl,
          phone: formData.phone,
          address: formData.address
        });
        
        setUser({ ...user, avatar: imageUrl });
        toast.success(t('profile.avatar_success', 'Profile picture updated'));
      }
    } catch (err) {
      toast.error(t('profile.upload_error', 'Failed to upload image'));
    }
  };

  const initials = (user?.name || 'U').substring(0, 2).toUpperCase();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 lg:p-8 pt-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">
          {t('nav.profile', 'User Profile')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN: Profile Card */}
        <div className="md:col-span-1 lg:col-span-1 flex flex-col gap-6">
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-md">
                    <AvatarImage src={user?.avatar} alt={user?.name} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {user?.name || 'Valued Member'}
                  </h3>
                  {user?.role === 'Owner' || user?.role === 'Admin' ? (
                    <Badge variant="default" className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-500/20 px-1.5 py-0">Pro</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                  {user?.role || 'User'}
                </p>
              </div>

              {/* Stats - Optional/Visual only as requested */}
              <div className="grid grid-cols-3 gap-2 mt-6 p-3 bg-muted/40 rounded-xl border border-border/40">
                <div className="text-center">
                  <div className="font-bold text-foreground">184</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Post</div>
                </div>
                <div className="text-center border-x border-border/60">
                  <div className="font-bold text-foreground">32</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Projects</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-foreground">4.5K</div>
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">Members</div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-foreground/70" />
                  <span className="truncate">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-foreground/70" />
                  <span>{user?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-foreground/70 mt-0.5" />
                  <span className="leading-snug">{user?.address || 'Canada'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 shrink-0 text-foreground/70" />
                  <a href={clientConfig?.storefrontUrl || (clientConfig?.domain ? `https://${clientConfig.domain}` : 'https://example.com')} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">{clientConfig?.storefrontUrl || (clientConfig?.domain ? `https://${clientConfig.domain}` : 'https://example.com')}</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Edit Form / Feed */}
        <div className="md:col-span-2 lg:col-span-3 flex flex-col gap-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle className="text-lg">{isEditing ? 'Edit Profile' : 'Personal Information'}</CardTitle>
                <CardDescription>
                  Update your personal details here. Email address cannot be changed.
                </CardDescription>
              </div>
              <Button 
                variant={isEditing ? "outline" : "default"} 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)}
                className="shrink-0"
              >
                {isEditing ? 'Cancel' : <><Edit2 className="w-4 h-4 mr-2"/> Edit Profile</>}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing} 
                      required
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing} 
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input 
                      value={formData.email}
                      disabled={true} 
                      className="bg-muted text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing} 
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing} 
                      className="bg-muted/30"
                      placeholder="e.g. 123 Main St, City, Country"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Activity Placeholder matching the screenshot loosely */}
          {!isEditing && (
            <Card className="border-border/60 shadow-sm flex-1">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg">Latest Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs font-medium text-muted-foreground h-8">View All</Button>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative border-l border-border/60 ml-3 space-y-8 pb-4">
                  
                  <div className="relative pl-6">
                    <div className="absolute -left-2.5 top-0.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-primary/60"></span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        System Login <Badge variant="outline" className="text-[10px] py-0 px-1.5">Latest</Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">Logged into dashboard securely.</p>
                      <span className="text-xs text-muted-foreground font-medium opacity-70 mt-2 block">
                        {formatDateTime(Date.now())}
                      </span>
                    </div>
                  </div>

                  <div className="relative pl-6">
                    <div className="absolute -left-2.5 top-0.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/40"></span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Account Verification</h4>
                      <p className="text-xs text-muted-foreground mt-1">Successfully verified email address and secured account.</p>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
