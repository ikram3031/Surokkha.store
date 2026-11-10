import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const API = '/api/v1/settings/business';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Owner-only business settings: where new incoming webmail is forwarded
const BusinessSettingsPage = () => {
  const queryClient = useQueryClient();
  const [forwardEmails, setForwardEmails] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: async () => (await apiClient.get(API)).data?.data || {},
  });

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
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Building2 className="h-7 w-7 text-primary" />
          Business Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Settings only the store Owner can change.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending || isLoading} className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold">
            <Save className="h-4 w-4" />
            <span>Save Business Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessSettingsPage;
