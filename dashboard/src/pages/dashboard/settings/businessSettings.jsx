import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, Image, Hash, LifeBuoy, Mail, SlidersHorizontal, Settings2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { InpageSectionNav } from '@/components/ui/inpage-section-nav';
import SlotCard from '@/components/cms/SlotCard';
import IdFormatsCard from '@/components/settings/IdFormatsCard';
import PlexiviaSupportCard from '@/components/settings/PlexiviaSupportCard';
import { apiClient } from '@/lib/api-client';
import { useCmsAssets } from '@/lib/use-cms-assets';
import { toast } from 'sonner';
import { useSiteConfigEditor, SiteConfigSectionPanel, countChanges } from './siteConfig';

const DASHBOARD_LOGO_SLOT = { key: 'dashboard-logo', label: 'Dashboard Logo', filename: 'dashboard-logo.webp', recommendedSize: '500x200' };

const API = '/api/v1/settings/business';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_PREFIX = 'site-';

const DashboardLogoPanel = () => {
  const cms = useCmsAssets();
  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Dashboard Logo</CardTitle>
        <CardDescription className="text-xs">
          Shown in the dashboard sidebar, header and login page. Leave empty to use the default Surokkha logo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-sm">
          <SlotCard slot={DASHBOARD_LOGO_SLOT} currentAsset={cms.findAsset(DASHBOARD_LOGO_SLOT)} cms={cms} />
        </div>
      </CardContent>
      <ConfirmDeleteDialog
        open={Boolean(cms.deleteTarget)}
        onOpenChange={(open) => { if (!open) cms.setDeleteTarget(null); }}
        title="Delete the dashboard logo?"
        description="The dashboard will go back to the default Surokkha logo."
        isDeleting={cms.deleteMutation.isPending}
        onConfirm={() => {
          if (!cms.deleteTarget) return;
          cms.deleteMutation.mutate(cms.deleteTarget, {
            onSuccess: () => window.dispatchEvent(new CustomEvent('brand-logo-updated', { detail: { timestamp: Date.now() } })),
          });
        }}
      />
    </Card>
  );
};

const WebmailForwardPanel = ({ data, isLoading }) => {
  const queryClient = useQueryClient();
  const [forwardEmails, setForwardEmails] = useState('');

  useEffect(() => {
    if (data) setForwardEmails((data.webmailForwardEmails || []).join(', '));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (list) => (await apiClient.put(API, { webmailForwardEmails: list })).data,
    onSuccess: () => {
      toast.success('Business settings saved');
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save business settings'),
  });

  const handleSave = (e) => {
    e.preventDefault();
    const list = forwardEmails.split(',').map((addr) => addr.trim()).filter(Boolean);
    const invalid = list.filter((addr) => !EMAIL_RE.test(addr));
    if (invalid.length) {
      toast.error(`Invalid email: ${invalid.join(', ')}`);
      return;
    }
    saveMutation.mutate(list);
  };

  return (
    <form onSubmit={handleSave}>
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Forward Incoming Webmail</CardTitle>
          <CardDescription className="text-xs">
            Every new email that arrives in the Webmail inbox
            {data?.webmailMailbox ? <> (<span className="font-medium text-foreground">{data.webmailMailbox}</span>)</> : null}
            {' '}is forwarded to these addresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Forward To</label>
          <Input
            placeholder="e.g. owner@gmail.com, manager@gmail.com"
            value={forwardEmails}
            onChange={(e) => setForwardEmails(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-[11px] text-muted-foreground">
            Separate several addresses with commas. Leave empty to turn forwarding off. The Webmail mailbox itself cannot be used.
          </p>
          <div className="flex justify-end pt-3">
            <Button type="submit" disabled={saveMutation.isPending || isLoading} className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold">
              <Save className="h-4 w-4" />
              <span>Save</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

// One settings page: business settings and every site config section, picked from an in-page menu (?tab=)
const BusinessSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => (await apiClient.get(API)).data?.data || {},
  });
  const siteConfig = useSiteConfigEditor();

  const businessSections = [
    { id: 'logo', label: 'Dashboard Logo', icon: Image, group: 'Business' },
    { id: 'id-formats', label: 'ID Formats', icon: Hash, group: 'Business' },
    { id: 'webmail', label: 'Webmail Forwarding', icon: Mail, group: 'Business' },
    { id: 'support', label: 'Plexivia Support', icon: LifeBuoy, group: 'Business' },
  ];
  const siteSections = siteConfig.sections.map((s) => {
    const value = s.path.length ? s.path.reduce((acc, k) => acc?.[k], siteConfig.values) : siteConfig.values;
    const changes = siteConfig.values ? countChanges(value, s.baseValue) : 0;
    return { id: `${SITE_PREFIX}${s.key || 'general'}`, label: s.title, icon: s.key ? Settings2 : SlidersHorizontal, group: 'Site Config', badge: changes || null, section: s };
  });
  const sections = [...businessSections, ...siteSections];

  const requested = searchParams.get('tab');
  const waitingForSite = Boolean(requested?.startsWith(SITE_PREFIX)) && siteConfig.isLoading;
  const active = sections.find((s) => s.id === requested) || (waitingForSite ? { id: requested } : sections[0]);
  const setActive = (id) => setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('tab', id); return next; }, { replace: true });

  let panel;
  if (waitingForSite) panel = <p className="text-sm text-muted-foreground">Loading…</p>;
  else if (active.id === 'logo') panel = <DashboardLogoPanel />;
  else if (active.id === 'id-formats') panel = <IdFormatsCard data={data} isLoading={isLoading} />;
  else if (active.id === 'webmail') panel = <WebmailForwardPanel data={data} isLoading={isLoading} />;
  else if (active.id === 'support') panel = <PlexiviaSupportCard />;
  else if (active.section) {
    panel = (
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{active.label}</CardTitle>
          <CardDescription className="text-xs">
            Values from config.json. Anything you don&apos;t change here keeps using config.json.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SiteConfigSectionPanel editor={siteConfig} section={active.section} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-primary" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Business settings and site config. Only the store Owner can change these.</p>
      </div>

      <InpageSectionNav sections={sections} activeId={active.id} onChange={setActive}>
        {panel}
      </InpageSectionNav>
    </div>
  );
};

export default BusinessSettingsPage;
