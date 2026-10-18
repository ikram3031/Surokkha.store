import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Upload, Trash2, BadgeCheck, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getApiBaseUrl } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

const TIMEZONES = [
  { value: 'Asia/Dhaka', label: '(GMT+6) Dhaka' },
  { value: 'Asia/Kolkata', label: '(GMT+5:30) Kolkata' },
  { value: 'Asia/Dubai', label: '(GMT+4) Dubai' },
  { value: 'Asia/Riyadh', label: '(GMT+3) Riyadh' },
  { value: 'Europe/London', label: '(GMT+0) London' },
  { value: 'America/New_York', label: '(GMT-5) New York' },
  { value: 'Asia/Singapore', label: '(GMT+8) Singapore' },
  { value: 'Asia/Kuala_Lumpur', label: '(GMT+8) Kuala Lumpur' },
];

const WEEK_STARTS = [
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour' },
  { value: '24h', label: '24-hour' },
];

const BANNER_DISMISS_KEY = 'profile-shared-banner-dismissed';

// Form fields derived from the signed-in user; older accounts only have `name`, so split it
const toFormState = (user) => {
  const nameParts = (user?.name || '').trim().split(/\s+/);
  return {
    firstName: user?.firstName || nameParts[0] || '',
    lastName: user?.lastName || nameParts.slice(1).join(' ') || '',
    preferredName: user?.preferredName || '',
    username: user?.username || '',
    phone: user?.phone || '',
    website: (user?.website || '').replace(/^https?:\/\//, ''),
    timezone: user?.preferences?.timezone || 'Asia/Dhaka',
    weekStart: user?.preferences?.weekStart || 'saturday',
    language: user?.preferences?.language || 'en',
    timeFormat: user?.preferences?.timeFormat || '12h',
  };
};

// Relative /uploads paths are served by the API host
const resolveAvatarUrl = (url) => {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  return `${(getApiBaseUrl() || '').replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
};

const readBannerDismissed = () => {
  try {
    return localStorage.getItem(BANNER_DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

const FieldLabel = ({ children, hint }) => (
  <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
    {children}
    {hint && (
      <span title={hint} className="text-muted-foreground cursor-help">
        <Info className="h-3 w-3" />
      </span>
    )}
  </label>
);

const Section = ({ title, description, children }) => (
  <section className="space-y-4">
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
    {children}
  </section>
);

export default function UserProfile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(() => toFormState(user));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(readBannerDismissed);

  // Load the full profile (the stored login user may not carry the newer fields)
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get('/api/v1/users/me')
      .then((res) => {
        const profile = res.data?.data;
        if (!cancelled && profile) {
          updateUser(profile);
          setFormData(toFormState(profile));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Runs once on mount; updateUser is stable for the page's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initialState = useMemo(() => toFormState(user), [user]);
  const isDirty = JSON.stringify(initialState) !== JSON.stringify(formData);

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const dismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, '1');
    } catch {
      // Dismissal just won't be remembered next visit
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      toast.error(t('profile.first_name_required', 'First name is required'));
      return;
    }
    setIsSaving(true);
    try {
      const website = formData.website.trim();
      const res = await apiClient.put('/api/v1/users/me', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferredName: formData.preferredName,
        username: formData.username,
        phone: formData.phone,
        website: website ? `https://${website.replace(/^https?:\/\//, '')}` : '',
        preferences: {
          timezone: formData.timezone,
          weekStart: formData.weekStart,
          language: formData.language,
          timeFormat: formData.timeFormat,
        },
      });
      const saved = res.data?.data;
      if (saved) {
        updateUser(saved);
        setFormData(toFormState(saved));
      }
      toast.success(t('profile.update_success', 'Profile updated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.update_error', 'Failed to update profile')));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) {
      toast.error(t('profile.avatar_type', 'Use a PNG, JPEG, GIF or WebP image'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('profile.avatar_size', 'Image must be under 10MB'));
      return;
    }

    const upload = new FormData();
    upload.append('avatar', file);
    setIsUploading(true);
    try {
      const res = await apiClient.post('/api/v1/users/me/avatar', upload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data) updateUser({ avatar: res.data.data.avatar });
      toast.success(t('profile.avatar_success', 'Profile picture updated'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.upload_error', 'Failed to upload image')));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsUploading(true);
    try {
      await apiClient.put('/api/v1/users/me', { avatar: '' });
      updateUser({ avatar: '' });
      toast.success(t('profile.avatar_removed', 'Profile picture removed'));
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('profile.update_error', 'Failed to update profile')));
    } finally {
      setIsUploading(false);
    }
  };

  const displayName = user?.preferredName || user?.firstName || user?.name || '';
  const initials = (displayName || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="flex-1 space-y-5 p-4 md:p-8 pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('profile.title', 'Profile')}</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
          {t('profile.subtitle', 'Manage the identity and regional details shared across your workspace.')}
        </p>
      </div>

      {!bannerDismissed && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{t('profile.shared_title', 'Profile updates are shared')}</p>
            <p className="text-[11px] text-muted-foreground">
              {t('profile.shared_desc', 'Changes sync to mentions, approvals and the people directory across the dashboard.')}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={dismissBanner} className="h-7 text-xs cursor-pointer">
            <X className="h-3.5 w-3.5" />
            {t('common.dismiss', 'Dismiss')}
          </Button>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-xl border bg-card shadow-sm">
        <div className="space-y-7 p-4 sm:p-6">
          {/* Profile picture */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarImage src={resolveAvatarUrl(user?.avatar)} alt={displayName} className="object-cover" />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">{t('profile.picture', 'Profile Picture')}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('profile.picture_hint', 'We support PNGs, JPEGs and GIFs under 10MB')}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="h-7 gap-1.5 text-xs cursor-pointer"
                >
                  {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {t('profile.upload', 'Upload')}
                </Button>
                {user?.avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleAvatarRemove}
                    disabled={isUploading}
                    className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer"
                    aria-label={t('profile.remove_picture', 'Remove picture')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
          </div>

          <div className="border-t" />

          <Section
            title={t('profile.basic_details', 'Basic Details')}
            description={t('profile.basic_details_desc', 'Keep your contact and identity fields current.')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel>{t('profile.first_name', 'First Name')}</FieldLabel>
                <Input value={formData.firstName} onChange={(e) => setField('firstName', e.target.value)} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>{t('profile.last_name', 'Last Name')}</FieldLabel>
                <Input
                  value={formData.lastName}
                  placeholder={t('common.optional', 'Optional')}
                  onChange={(e) => setField('lastName', e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <FieldLabel hint={t('profile.email_hint', 'Ask an Owner or Admin to change your sign-in email')}>
                    {t('profile.primary_email', 'Primary Email Address')}
                  </FieldLabel>
                  <Badge variant="outline" className="h-4 gap-0.5 px-1.5 text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                    <BadgeCheck className="h-2.5 w-2.5" />
                    {t('profile.verified', 'Verified')}
                  </Badge>
                </div>
                <Input value={user?.email || ''} readOnly disabled className="text-xs" />
                <p className="text-[11px] text-muted-foreground">
                  {t('profile.email_desc', 'Used for sign-in, recovery and workspace notices.')}
                </p>
              </div>
              <div className="space-y-1.5">
                <FieldLabel hint={t('profile.preferred_hint', 'Shown instead of your first name around the dashboard')}>
                  {t('profile.preferred_name', 'Preferred Name')}
                </FieldLabel>
                <Input
                  value={formData.preferredName}
                  placeholder={formData.firstName}
                  onChange={(e) => setField('preferredName', e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <FieldLabel hint={t('profile.username_hint', '3-30 letters, numbers, dots, dashes or underscores')}>
                  {t('profile.username', 'Username')}
                </FieldLabel>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                  <Input
                    value={formData.username}
                    onChange={(e) => setField('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="text-xs pl-6"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <FieldLabel hint={t('profile.role_hint', 'Roles are assigned by an Owner or Admin')}>
                  {t('profile.role', 'Role')}
                </FieldLabel>
                <Select value={user?.role || ''} disabled>
                  <SelectTrigger className="text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.role && <SelectItem value={user.role}>{user.role}</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <FieldLabel>{t('profile.phone', 'Phone Number')}</FieldLabel>
                <Input
                  value={formData.phone}
                  placeholder="01XXXXXXXXX"
                  onChange={(e) => setField('phone', e.target.value)}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('profile.phone_desc', 'Used only for urgent verification and recovery.')}
                </p>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>{t('profile.website', 'Website')}</FieldLabel>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-muted px-2.5 text-xs text-muted-foreground">
                    https://
                  </span>
                  <Input
                    value={formData.website}
                    placeholder="example.com"
                    onChange={(e) => setField('website', e.target.value.replace(/^https?:\/\//, ''))}
                    className="text-xs rounded-l-none"
                  />
                </div>
              </div>
            </div>
          </Section>

          <div className="border-t" />

          <Section
            title={t('profile.regional', 'Regional Preferences')}
            description={t('profile.regional_desc', 'Choose how times and scheduling fields appear.')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PreferenceSelect
                label={t('profile.timezone', 'Preferred Timezone')}
                value={formData.timezone}
                options={TIMEZONES}
                onChange={(v) => setField('timezone', v)}
              />
              <PreferenceSelect
                label={t('profile.week_start', 'Start Week On')}
                value={formData.weekStart}
                options={WEEK_STARTS}
                onChange={(v) => setField('weekStart', v)}
              />
              <PreferenceSelect
                label={t('profile.language', 'Language')}
                value={formData.language}
                options={LANGUAGES}
                onChange={(v) => setField('language', v)}
              />
              <PreferenceSelect
                label={t('profile.time_format', 'Time Format')}
                value={formData.timeFormat}
                options={TIME_FORMATS}
                onChange={(v) => setField('timeFormat', v)}
              />
            </div>
          </Section>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t bg-muted/30 px-4 sm:px-6 py-3 rounded-b-xl">
          <p className="text-[11px] text-muted-foreground">
            {t('profile.save_hint', 'Save once to update your profile everywhere in the dashboard.')}
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="cancel"
              size="sm"
              onClick={() => setFormData(initialState)}
              disabled={!isDirty || isSaving}
              className="text-xs cursor-pointer"
            >
              {t('common.reset', 'Reset')}
            </Button>
            <Button type="submit" size="sm" disabled={!isDirty || isSaving} className="text-xs gap-1.5 cursor-pointer">
              {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('profile.save_changes', 'Save Changes')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

const PreferenceSelect = ({ label, value, options, onChange }) => (
  <div className="space-y-1.5">
    <FieldLabel>{label}</FieldLabel>
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger className="text-xs w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);
