import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { hasMenuAccess } from '@/lib/rbac';
import { ACCESS_GROUPS, ROLE_DEFAULT_GROUPS } from '@/config/accessGroups';

// YYYY-MM-DD of a date in Bangladesh time, for the date input
const toBdDay = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

// A group the role already includes shows as locked on; the role itself is never edited here
const roleIncludes = (role, group) =>
  (ROLE_DEFAULT_GROUPS[role] || []).includes(group.key) || group.menus.every((menu) => hasMenuAccess(role, menu));

// Owner-only editor for the main menus a user gets on top of their role
export function UserAccessDialog({ open, onOpenChange, user, onSuccess }) {
  const [selected, setSelected] = useState([]);
  const [dataFrom, setDataFrom] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSelected(Array.isArray(user.extraMenus) ? user.extraMenus : []);
    setDataFrom(toBdDay(user.dataAccessFrom));
  }, [user]);

  const role = user?.role;
  const toggle = (key, checked) =>
    setSelected((list) => (checked ? [...new Set([...list, key])] : list.filter((k) => k !== key)));

  const accountsOn = ACCESS_GROUPS.some((g) => g.key === 'accounts' && (roleIncludes(role, g) || selected.includes('accounts')));

  const handleSave = async () => {
    setSaving(true);
    try {
      const extraMenus = selected.filter((key) => {
        const group = ACCESS_GROUPS.find((g) => g.key === key);
        return group && !roleIncludes(role, group);
      });
      // An empty date is left to the server, which stamps today the first time Accounts is given
      await apiClient.put(`/api/v1/users/${user.id}`, { extraMenus, ...(dataFrom ? { dataAccessFrom: dataFrom } : {}) });
      toast.success('Menu access updated.');
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update menu access.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Menu Access</DialogTitle>
          <DialogDescription>
            {user?.name} ({role}) keeps everything their role allows. Tick extra main menus to give them more; each one includes all of its sub-menus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2 pt-2 max-h-[55vh] overflow-y-auto">
          {ACCESS_GROUPS.map((group) => {
            const locked = roleIncludes(role, group);
            const checked = locked || selected.includes(group.key);
            return (
              <label
                key={group.key}
                className={`flex items-start gap-3 rounded-md border p-3 ${locked ? 'bg-muted/50 cursor-default' : 'cursor-pointer hover:bg-muted/40'}`}
              >
                <Checkbox
                  checked={checked}
                  disabled={locked}
                  onCheckedChange={(value) => toggle(group.key, Boolean(value))}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {group.label}
                    {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </span>
                  <span className="block text-xs text-muted-foreground">{locked ? 'Included in role' : group.description}</span>
                </span>
              </label>
            );
          })}
        </div>

        {accountsOn && (
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold">Accounts data visible from</label>
            <Input type="date" value={dataFrom} onChange={(e) => setDataFrom(e.target.value)} className="w-auto" />
            <p className="text-xs text-muted-foreground">
              Bills and payments added before this day stay hidden from this user. Left empty, it is set to today when you save.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Access'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
