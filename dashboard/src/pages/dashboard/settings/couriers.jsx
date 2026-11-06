import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useCourierProviders, useUpdateCourierProviders } from '@/hooks/use-couriers';

// Owner picks which courier integrations are active for the store
export default function CouriersSettingsPage() {
  const { data, isLoading } = useCourierProviders();
  const update = useUpdateCourierProviders();
  const [enabled, setEnabled] = useState([]);

  useEffect(() => {
    if (data?.enabledCouriers) setEnabled(data.enabledCouriers);
  }, [data]);

  const couriers = data?.couriers || [];

  const save = (next) =>
    update.mutate(next, {
      onSuccess: () => toast.success('Courier settings saved'),
      onError: (err) => {
        setEnabled(data?.enabledCouriers || []);
        toast.error(err?.response?.data?.message || 'Could not save courier settings');
      },
    });

  // Saves right away so the switch never shows "Active" for an unsaved change
  const toggle = (key, on) => {
    const next = on ? [...new Set([...enabled, key])] : enabled.filter((k) => k !== key);
    setEnabled(next);
    save(next);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="size-5" /> Couriers
          </CardTitle>
          <CardDescription>
            Choose which couriers are active. A disabled courier can't take new dispatches; orders already sent keep syncing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {couriers.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  {c.name}
                                    {enabled.includes(c.key) && <Badge>Active</Badge>}
                </div>
                {c.settingsPath && (
                  <Link to={c.settingsPath} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                    <Settings2 className="size-3" /> API credentials
                  </Link>
                )}
              </div>
              <Switch
                checked={enabled.includes(c.key)}
                disabled={update.isPending}
                onCheckedChange={(on) => toggle(c.key, on)}
              />
            </div>
          ))}
          {update.isPending && <p className="text-xs text-muted-foreground">Saving…</p>}
        </CardContent>
      </Card>
    </div>
  );
}
