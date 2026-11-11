import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Hash, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const API = '/api/v1/settings/business';

const SEQ_RE = /\{SEQ(X)?(?::(\d{1,2}))?\}/i;
const TOKEN_RE = /\{(YYYY|YY|MM|MX|DD|SEQX?(?::\d{1,2})?)\}/gi;

// Same rules the backend applies, so mistakes show before saving
const validateFormat = (format) => {
  const value = String(format || '').trim();
  if (!value) return null;
  if (value.length > 40) return 'Longer than 40 characters';
  const literal = value.replace(TOKEN_RE, '');
  if (/[{}]/.test(literal)) return 'Unknown token';
  if (!/^[A-Za-z0-9\-_/.]*$/.test(literal)) return 'Only letters, digits and - _ / .';
  if ((value.match(/\{SEQX?(?::\d{1,2})?\}/gi) || []).length !== 1) return 'Needs exactly one {SEQ} or {SEQX}';
  return null;
};

// Preview in Bangladesh time, matching the backend
const previewFormat = (format, seq = 1) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value])
  );
  return String(format || '')
    .trim()
    .replace(/\{(YYYY|YY|MM|MX|DD)\}/gi, (_, t) => ({
      YYYY: parts.year,
      YY: parts.year.slice(-2),
      MM: parts.month,
      MX: Number(parts.month).toString(16).toUpperCase(),
      DD: parts.day,
    })[t.toUpperCase()])
    .replace(SEQ_RE, (_, hex, width) => (hex ? seq.toString(16).toUpperCase() : String(seq)).padStart(Number(width || 1), '0'));
};

// One row: format input, token buttons that insert at the cursor, and a preview of the next IDs
const FormatRow = ({ type, value, tokens, onChange }) => {
  const inputRef = useRef(null);
  const error = validateFormat(value);

  const insertToken = (token) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground">{type.label}</label>
        <span className="text-[11px] text-muted-foreground">
          {value.trim()
            ? error
              ? <span className="text-destructive">{error}</span>
              : <>Next: <span className="font-mono font-medium text-foreground">{previewFormat(value, 1)}</span>, {previewFormat(value, 2)}</>
            : 'Built-in numbering'}
        </span>
      </div>
      <Input
        ref={inputRef}
        value={value}
        placeholder={`e.g. ${type.example}`}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
      />
      <div className="flex flex-wrap gap-1.5">
        {tokens.map((t) => (
          <button
            key={t.token}
            type="button"
            title={t.label}
            onClick={() => insertToken(t.token)}
            className="rounded border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted cursor-pointer"
          >
            {t.token}
          </button>
        ))}
      </div>
    </div>
  );
};

// Business Settings card: the ID format for orders, purchases, payments and bills
const IdFormatsCard = ({ data, isLoading }) => {
  const queryClient = useQueryClient();
  const types = data?.idTypes || [];
  const tokens = data?.idTokens || [];
  const [formats, setFormats] = useState({});

  useEffect(() => {
    if (data) setFormats(data.idFormats || {});
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (idFormats) => (await apiClient.put(API, { idFormats })).data,
    onSuccess: () => {
      toast.success('ID formats saved');
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save ID formats'),
  });

  const handleSave = () => {
    const bad = types.find((t) => validateFormat(formats[t.key]));
    if (bad) {
      toast.error(`${bad.label}: ${validateFormat(formats[bad.key])}`);
      return;
    }
    saveMutation.mutate(formats);
  };

  return (
    <Card className="border-border/60 shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          ID Formats
        </CardTitle>
        <CardDescription className="text-xs">
          How new IDs are numbered. Click a token to add it. The serial restarts whenever the date part changes
          (daily with {'{DD}'}, monthly with {'{MM}'}/{'{MX}'}, yearly with {'{YY}'}). {'{MX}'} writes the month in hex
          (Oct = A, Nov = B, Dec = C) and {'{SEQX}'} counts the serial in hex (… 9, A … F, 10). Leave a field empty to keep the
          built-in numbering. Existing IDs never change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 lg:grid-cols-2">
          {types.map((type) => (
            <FormatRow
              key={type.key}
              type={type}
              tokens={tokens}
              value={formats[type.key] || ''}
              onChange={(v) => setFormats((prev) => ({ ...prev, [type.key]: v }))}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading}
            className="w-full sm:w-auto cursor-pointer flex items-center gap-2 font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>Save ID Formats</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IdFormatsCard;
