import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { apiClient } from '@/lib/api-client';
import { applyConfigOverrides } from '@/clientConfig';
import { toast } from 'sonner';

const API = '/api/v1/settings/site-config';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (base, override) => {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    result[key] = isPlainObject(value) && isPlainObject(base?.[key]) ? deepMerge(base[key], value) : value;
  }
  return result;
};

const getAt = (obj, path) => path.reduce((cur, key) => (cur == null ? undefined : cur[key]), obj);

const setAt = (obj, path, value) => {
  const [key, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[key] = rest.length ? setAt(obj?.[key] ?? {}, rest, value) : value;
  return copy;
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// "supportEmail" -> "Support Email", "--sidebar-primary" -> "Sidebar Primary"
const humanize = (key) =>
  String(key)
    .replace(/^-+/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Comma separated list; keeps the typed text and parses it when the field loses focus
const ArrayInput = ({ value, baseValue, onChange }) => {
  const [text, setText] = useState((value || []).join(', '));
  useEffect(() => setText((value || []).join(', ')), [value]);
  const numeric = Array.isArray(baseValue) && baseValue.length > 0 && baseValue.every((v) => typeof v === 'number');
  const commit = () => {
    const list = text.split(',').map((s) => s.trim()).filter(Boolean);
    onChange(numeric ? list.map(Number).filter((n) => !Number.isNaN(n)) : list);
  };
  return <Input value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} className="h-9 text-sm" />;
};

const Field = ({ name, path, value, baseValue, onChange }) => {
  const changed = !same(value, baseValue);
  let control;
  if (typeof baseValue === 'boolean') {
    control = <Switch checked={Boolean(value)} onCheckedChange={(v) => onChange(path, Boolean(v))} />;
  } else if (typeof baseValue === 'number') {
    control = (
      <Input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(path, e.target.value === '' ? baseValue : Number(e.target.value))}
        className="h-9 text-sm"
      />
    );
  } else if (Array.isArray(baseValue)) {
    control = <ArrayInput value={value} baseValue={baseValue} onChange={(v) => onChange(path, v)} />;
  } else {
    control = <Input value={value ?? ''} onChange={(e) => onChange(path, e.target.value)} className="h-9 text-sm" />;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 min-h-5">
        <label className="text-xs font-semibold text-foreground truncate" title={path.join('.')}>
          {humanize(name)}
        </label>
        {changed && (
          <button
            type="button"
            onClick={() => onChange(path, baseValue)}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline cursor-pointer shrink-0"
            title={`config.json: ${JSON.stringify(baseValue)}`}
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
      {control}
    </div>
  );
};

// Renders the scalar fields of an object, then each nested object as its own block
const FieldGroup = ({ path, value, baseValue, onChange }) => {
  const entries = Object.entries(baseValue || {});
  const scalars = entries.filter(([, v]) => !isPlainObject(v));
  const objects = entries.filter(([, v]) => isPlainObject(v));
  return (
    <div className="space-y-5">
      {scalars.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scalars.map(([key, base]) => (
            <Field key={key} name={key} path={[...path, key]} value={value?.[key]} baseValue={base} onChange={onChange} />
          ))}
        </div>
      )}
      {objects.map(([key, base]) => (
        <div key={key} className="rounded-lg border border-border/60 p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{humanize(key)}</h4>
          <FieldGroup path={[...path, key]} value={value?.[key]} baseValue={base} onChange={onChange} />
        </div>
      ))}
    </div>
  );
};

const countChanges = (value, base) => {
  if (isPlainObject(base)) return Object.keys(base).reduce((n, k) => n + countChanges(value?.[k], base[k]), 0);
  return same(value, base) ? 0 : 1;
};

const Section = ({ title, path, value, baseValue, onChange, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  const changes = countChanges(value, baseValue);
  return (
    <Card className="border-border/60 shadow-xs py-0 gap-0">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center justify-between gap-3 px-6 py-4 text-left cursor-pointer">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">{title}</span>
          {changes > 0 && <Badge variant="secondary" className="text-[11px]">{changes} changed</Badge>}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <CardContent className="pb-6 pt-1">
          <FieldGroup path={path} value={value} baseValue={baseValue} onChange={onChange} />
        </CardContent>
      )}
    </Card>
  );
};

// Owner-only: edit config.json values from the dashboard; anything not changed here comes from config.json
const SITE_LABELS = { shop: 'Shop', store: 'Store' };

const SiteConfigPage = ({ site = 'shop' }) => {
  const siteLabel = SITE_LABELS[site] || 'Shop';
  const queryClient = useQueryClient();
  const [values, setValues] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => (await apiClient.get(API)).data?.data || { base: {}, overrides: {} },
  });

  const base = data?.base || {};
  useEffect(() => {
    if (data) setValues(deepMerge(data.base || {}, data.overrides || {}));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (config) => (await apiClient.put(API, { config })).data,
    onSuccess: (res) => {
      applyConfigOverrides(res.data?.overrides || {});
      queryClient.setQueryData(['site-config'], res.data);
      setResetOpen(false);
      toast.success('Site config saved. Reload the page to see it everywhere.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save site config'),
  });

  const handleChange = (path, value) => setValues((prev) => setAt(prev || {}, path, value));

  // This site's own block (sites.shop / sites.store) first; everything else is shared by both sites
  const { siteBase, generalBase, sections } = useMemo(() => {
    const entries = Object.entries(base).filter(([key]) => key !== 'sites');
    return {
      siteBase: base.sites?.[site] || null,
      generalBase: Object.fromEntries(entries.filter(([, v]) => !isPlainObject(v))),
      sections: entries.filter(([, v]) => isPlainObject(v)),
    };
  }, [base, site]);

  const totalChanges = values ? countChanges(values, base) : 0;
  const savedChanges = data ? countChanges(deepMerge(base, data.overrides || {}), base) : 0;
  const dirty = values && data ? !same(values, deepMerge(base, data.overrides || {})) : false;

  return (
    <div className="page-container flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <SlidersHorizontal className="h-7 w-7 text-primary" />
            Site Config — {siteLabel}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Change the values from config.json. Anything you don&apos;t change here keeps using config.json.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedChanges > 0 && (
            <Button type="button" variant="outline" onClick={() => setResetOpen(true)} className="cursor-pointer gap-2">
              <RotateCcw className="h-4 w-4" /> Reset all
            </Button>
          )}
          <Button
            type="button"
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(values)}
            className="cursor-pointer gap-2 font-semibold"
          >
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {isLoading || !values ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {totalChanges} value{totalChanges === 1 ? '' : 's'} differ from config.json{dirty ? ' (unsaved changes)' : ''}.
          </p>
          {siteBase && (
            <Section title={`${siteLabel} Site`} path={['sites', site]} value={values.sites?.[site]} baseValue={siteBase} onChange={handleChange} defaultOpen />
          )}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-foreground">Shared by Shop and Store</h3>
            <p className="text-xs text-muted-foreground">These values are the same on both sites; changing them here changes both.</p>
          </div>
          <Section title="General" path={[]} value={values} baseValue={generalBase} onChange={handleChange} />
          {sections.map(([key, sectionBase]) => (
            <Section key={key} title={humanize(key)} path={[key]} value={values[key]} baseValue={sectionBase} onChange={handleChange} />
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all site config?"
        description="Every value goes back to config.json."
        isDeleting={saveMutation.isPending}
        onConfirm={() => saveMutation.mutate({})}
      />
    </div>
  );
};

export default SiteConfigPage;
