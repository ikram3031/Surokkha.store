import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MediaPickerModal } from '@/components/dashboard/media-picker-modal';
import { apiClient, resolveImageUrl } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

const EMPTY = {
  banner: { isActive: false, imageUrl: '', text: '', link: '' },
  newUserFreeDelivery: { isActive: false, minOrderAmount: 500 },
};

// Dashboard > Promotions > Promo: the promotional banner and preset offers for both storefronts
export default function PromoPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['promo-settings'],
    queryFn: async () => (await apiClient.get('/api/v1/promo')).data?.data,
  });

  useEffect(() => {
    if (data) {
      setForm({
        banner: { ...EMPTY.banner, ...data.banner },
        newUserFreeDelivery: { ...EMPTY.newUserFreeDelivery, ...data.newUserFreeDelivery },
      });
    }
  }, [data]);

  const setBanner = (patch) => setForm((f) => ({ ...f, banner: { ...f.banner, ...patch } }));
  const setNufd = (patch) => setForm((f) => ({ ...f, newUserFreeDelivery: { ...f.newUserFreeDelivery, ...patch } }));

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.put('/api/v1/promo', {
        ...form,
        newUserFreeDelivery: { ...form.newUserFreeDelivery, minOrderAmount: Number(form.newUserFreeDelivery.minOrderAmount) || 0 },
      });
      await queryClient.invalidateQueries({ queryKey: ['promo-settings'] });
      toast.success('Promo saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save promo'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promo</h2>
          <p className="text-sm text-muted-foreground mt-1">Promotional banner and preset offers for surokkha.shop and surokkhastore.shop.</p>
        </div>
        <Button onClick={save} disabled={saving} className="shadow cursor-pointer">
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      {/* Promotional banner */}
      <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Promo banner</h3>
            <p className="text-sm text-muted-foreground">Shown at the top of the home page while it is on.</p>
          </div>
          <Switch checked={form.banner.isActive} onCheckedChange={(v) => setBanner({ isActive: v })} />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Banner image</p>
          {form.banner.imageUrl ? (
            <div className="relative w-full max-w-xl">
              <img src={resolveImageUrl(form.banner.imageUrl)} alt="" className="w-full rounded-lg border object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 cursor-pointer"
                onClick={() => setBanner({ imageUrl: '' })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)} className="cursor-pointer">
            <ImagePlus className="mr-2 h-4 w-4" />
            {form.banner.imageUrl ? 'Change image' : 'Choose image'}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Banner text</p>
          <Textarea
            rows={3}
            value={form.banner.text}
            onChange={(e) => setBanner({ text: e.target.value })}
            placeholder="e.g. রেজিস্টার করুন, প্রথম অর্ডারে ফ্রি ডেলিভারি!"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Link (optional)</p>
          <Input value={form.banner.link} onChange={(e) => setBanner({ link: e.target.value })} placeholder="/account" />
        </div>
      </div>

      {/* Preset offers */}
      <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold">Preset offers</h3>
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">New customer: first delivery free</p>
              <p className="text-sm text-muted-foreground">
                A customer who registers and verifies their email by code gets free delivery on their first order.
              </p>
            </div>
            <Switch checked={form.newUserFreeDelivery.isActive} onCheckedChange={(v) => setNufd({ isActive: v })} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm">Minimum order (৳)</span>
            <Input
              type="number"
              min={0}
              className="w-32"
              value={form.newUserFreeDelivery.minOrderAmount}
              onChange={(e) => setNufd({ minOrderAmount: e.target.value })}
            />
          </div>
        </div>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(url) => setBanner({ imageUrl: Array.isArray(url) ? url[0] : url })}
        multiple={false}
        title="Select promo banner"
      />
    </div>
  );
}
