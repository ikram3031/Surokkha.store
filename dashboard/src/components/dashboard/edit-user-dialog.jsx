import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

// Edit a system user's name, email, phone and role (own role stays locked, mirroring the backend rules)
export function EditUserDialog({ open, onOpenChange, user, currentUser, onSuccess }) {
  const isOwner = currentUser?.role === 'Owner';
  const isSelf = user?.id === currentUser?.id;
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', role: user.role || '' });
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() };
      if (!isSelf && form.role && form.role !== user.role) payload.role = form.role;
      await apiClient.put(`/api/v1/users/${user.id}`, payload);
      toast.success('User updated.');
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update user.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update this user's details. Changing the role signs them out of all sessions.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Name</label>
            <Input value={form.name} onChange={set('name')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Email</label>
            <Input type="email" value={form.email} onChange={set('email')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Phone</label>
            <Input value={form.phone} onChange={set('phone')} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Role</label>
            <Select value={form.role} onValueChange={(val) => setForm((f) => ({ ...f, role: val ?? f.role }))} disabled={isSelf}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {isOwner && <SelectItem value="Owner">Owner</SelectItem>}
                {isOwner && <SelectItem value="Admin">Admin</SelectItem>}
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Marketing Expert">Marketing Expert</SelectItem>
                {!['Owner', 'Admin', 'Manager', 'Marketing Expert'].includes(user?.role) && user?.role && (
                  <SelectItem value={user.role}>{user.role}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
