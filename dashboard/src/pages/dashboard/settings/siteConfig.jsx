import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ConfirmDeleteDialog } from '@/components/ui/confirm-delete-dialog';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { applyConfigOverrides } from '@/clientConfig';

const API = '/api/v1/settings/site-config';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (base, override) => {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    result[key] = isPlainObject(value) && isPlainObject(base?.[key]) ? deepMerge(base[key], value) : value;
  }
  return result;
};

const setAt = (obj, path, value) => {
  const [key, ...rest] = path;
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[key] = rest.length ? setAt(obj?.[key] ?? {}, rest, value) : value;
  return copy;
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// "supportEmail" -> "Support Email", "--sidebar-primary" -> "Sidebar Primary"
export const humanize = (key) =>
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

const COLOR_RE = /^\s*(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(.*\))\s*$/i;
const isColorValue = (v) => typeof v === 'string' && COLOR_RE.test(v);

// Any CSS colour (oklch, hsl, …) -> #rrggbb by painting one canvas pixel; alpha is dropped
const toHex = (color) => {
  try {
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#000';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return '#000000';
  }
};

// Text field for a colour, with a live swatch that opens the colour picker
const ColorInput = ({ value, onChange }) => {
  const shown = isColorValue(value) ? value : 'transparent';
  return (
    <div className="flex items-center gap-2">
      <label
        className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border shadow-xs bg-[repeating-conic-gradient(#ccc_0_25%,#fff_0_50%)] bg-size-[10px_10px]"
        title="Pick a colour"
      >
        <span className="absolute inset-0" style={{ background: shown }} />
        <input
          type="color"
          value={toHex(shown)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm font-mono" />
    </div>
  );
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
  } else if (isColorValue(baseValue)) {
    control = <ColorInput value={value} onChange={(v) => onChange(path, v)} />;
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

export const countChanges = (value, base) => {
  if (isPlainObject(base)) return Object.keys(base).reduce((n, k) => n + countChanges(value?.[k], base[k]), 0);
  return same(value, base) ? 0 : 1;
};

// Loads config.json + saved overrides and tracks the edits made in the dashboard
export const useSiteConfigEditor = () => {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['site-config'],
    queryFn: async () => (await apiClient.get(API)).data?.data || { base: {}, overrides: {} },
  });

  const base = useMemo(() => data?.base || {}, [data]);
  useEffect(() => {
    if (data) setValues(deepMerge(data.base || {}, data.overrides || {}));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (config) => (await apiClient.put(API, { config })).data,
    onSuccess: (res) => {
      queryClient.setQueryData(['site-config'], res.data);
      applyConfigOverrides(res.data?.overrides || {});
      setResetOpen(false);
      toast.success('Site config saved. Reload the page to see it everywhere.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save site config'),
  });

  const handleChange = (path, value) => setValues((prev) => setAt(prev || {}, path, value));

  // Each site's own block (sites.shop / sites.store) first, then values shared by both sites:
  // "General" holds the top-level scalars; every other nested object becomes its own section
  const sections = useMemo(() => {
    const list = Object.entries(base.sites || {})
      .filter(([, v]) => isPlainObject(v))
      .map(([site, siteBase]) => ({ key: `${site}-site`, title: `${humanize(site)} Site`, path: ['sites', site], baseValue: siteBase }));
    const entries = Object.entries(base).filter(([key]) => key !== 'sites');
    const general = Object.fromEntries(entries.filter(([, v]) => !isPlainObject(v)));
    if (Object.keys(general).length) list.push({ key: '', title: 'General (Shared)', path: [], baseValue: general });
    for (const [key, sectionBase] of entries.filter(([, v]) => isPlainObject(v))) {
      list.push({ key, title: humanize(key), path: [key], baseValue: sectionBase });
    }
    return list;
  }, [base]);

  const saved = data ? deepMerge(base, data.overrides || {}) : null;
  const savedChanges = saved ? countChanges(saved, base) : 0;
  const dirty = values && saved ? !same(values, saved) : false;

  return { values, base, sections, isLoading: isLoading || !values, handleChange, saveMutation, savedChanges, dirty, resetOpen, setResetOpen };
};

const valueAt = (obj, path) => path.reduce((acc, key) => acc?.[key], obj);

// One site config section with its own Save / Reset all actions
export const SiteConfigSectionPanel = ({ editor, section }) => {
  const { values, handleChange, saveMutation, savedChanges, dirty, resetOpen, setResetOpen } = editor;
  const value = section.path.length ? valueAt(values, section.path) : values;
  const changes = countChanges(value, section.baseValue);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {changes} value{changes === 1 ? '' : 's'} in this section differ from config.json{dirty ? ' · unsaved changes' : ''}.
        </p>
        <div className="flex items-center gap-2">
          {savedChanges > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(true)} className="cursor-pointer gap-2">
              <RotateCcw className="h-4 w-4" /> Reset all
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(values)}
            className="cursor-pointer gap-2 font-semibold"
          >
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <FieldGroup path={section.path} value={value} baseValue={section.baseValue} onChange={handleChange} />

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
