import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Save, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  const dirty = [...enabled].sort().join() !== [...(data?.enabledCouriers || [])].sort().join();

  const toggle = (key, on) =>
    setEnabled((prev) => (on ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)));

  const save = () =>
    update.mutate(enabled, {
      onSuccess: () => toast.success('Courier settings saved'),
      onError: (err) => toast.error(err?.response?.data?.message || 'Could not save courier settings'),
    });

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
                onCheckedChange={(on) => toggle(c.key, on)}
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={save} disabled={!dirty || update.isPending}>
              <Save className="size-4" /> {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
