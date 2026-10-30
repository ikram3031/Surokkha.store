import { useState } from 'react';
import { Check, Reply, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader, TabBar, ToneBadge } from '@/components/dashboard/blog/blog-ui';
import { comments as seed } from './data';

// Comment moderation queue
const BlogComments = () => {
  const [items, setItems] = useState(seed);
  const [tab, setTab] = useState('pending');
  const [selected, setSelected] = useState([]);

  const count = (status) => items.filter((c) => c.status === status).length;
  const tabs = [
    { value: 'pending', label: 'Pending', count: count('pending') },
    { value: 'approved', label: 'Approved', count: count('approved') },
    { value: 'spam', label: 'Spam', count: count('spam') },
  ];
  const visible = items.filter((c) => c.status === tab);

  const setStatus = (id, status) => setItems((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  const remove = (id) => setItems((prev) => prev.filter((c) => c.id !== id));
  const toggle = (id, checked) => setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  return (
    <div className="space-y-6">
      <PageHeader title="Comments" description="Moderate reader discussions." />

      <Card className="!gap-0 !py-0">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />
        <div className="divide-y">
          {visible.map((c) => (
            <div key={c.id} className="flex flex-wrap gap-3 p-4 sm:flex-nowrap">
              <Checkbox className="mt-1" checked={selected.includes(c.id)} onCheckedChange={(v) => toggle(c.id, v)} aria-label={`Select comment by ${c.name}`} />
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">{c.name.charAt(0).toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <b>{c.name}</b>
                  {c.status === 'spam' && <ToneBadge tone="red">Possible spam</ToneBadge>}
                  <span className="text-xs text-muted-foreground">{[c.email, c.when].filter(Boolean).join(' · ')}</span>
                </div>
                <p className="mt-1 text-sm">{c.body}</p>
                {c.post && <p className="mt-1 text-xs text-muted-foreground">On: <span className="text-primary">{c.post}</span></p>}
              </div>
              <div className="flex shrink-0 items-start gap-1">
                {c.status !== 'approved' && c.status !== 'spam' && (
                  <Button variant="outline" onClick={() => setStatus(c.id, 'approved')}><Check />Approve</Button>
                )}
                {c.status !== 'spam' && <Button variant="outline"><Reply />Reply</Button>}
                {c.status === 'pending' && <Button variant="destructive" onClick={() => setStatus(c.id, 'spam')}><ShieldAlert />Spam</Button>}
                <Button variant="cancel" size="icon" title="Delete" onClick={() => remove(c.id)}><Trash2 /></Button>
              </div>
            </div>
          ))}
          {visible.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">Nothing in this queue.</p>}
        </div>
      </Card>
    </div>
  );
};

export default BlogComments;
