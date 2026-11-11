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
const SER_RE = /\{SER(X)?(?::(\d{1,2}))?\}/i;
const TOKEN_RE = /\{(YYYY|YY|MM|MX|DD|SEQX?(?::\d{1,2})?|SERX?(?::\d{1,2})?)\}/gi;

const readToken = (re, text) => {
  const m = re.exec(text || '');
  return m ? { hex: Boolean(m[1]), width: Number(m[2] || 1) } : null;
};
const capacity = ({ hex, width }) => (hex ? 16 : 10) ** width - 1;
const pad = (value, hex, width) => (hex ? value.toString(16).toUpperCase() : String(value)).padStart(Number(width || 1), '0');

// Same split as the backend: with a serial, the number runs to its last value (999 / FFF) then the serial steps up
const splitCount = (format, count) => {
  const ser = readToken(SER_RE, format);
  if (!ser) return { serial: null, number: count };
  const perSerial = capacity(readToken(SEQ_RE, format) || { hex: false, width: 1 });
  return { serial: Math.floor((count - 1) / perSerial) + 1, number: ((count - 1) % perSerial) + 1 };
};

// Same rules the backend applies, so mistakes show before saving
const validateFormat = (format) => {
  const value = String(format || '').trim();
  if (!value) return null;
  if (value.length > 40) return 'Longer than 40 characters';
  const literal = value.replace(TOKEN_RE, '');
  if (/[{}]/.test(literal)) return 'Unknown token';
  if (!/^[A-Za-z0-9\-_/.]*$/.test(literal)) return 'Only letters, digits and - _ / .';
  if ((value.match(/\{SEQX?(?::\d{1,2})?\}/gi) || []).length !== 1) return 'Needs exactly one {SEQ} or {SEQX}';
  const seqWidth = readToken(SEQ_RE, value).width;
  if (seqWidth < 1 || seqWidth > 10) return 'Number digits must be 1-10';
  const serials = value.match(/\{SERX?(?::\d{1,2})?\}/gi) || [];
  if (serials.length > 1) return 'Only one {SER} or {SERX}';
  if (serials.length && ![1, 2].includes(readToken(SER_RE, value).width)) return 'Serial digits must be 1 or 2';
  return null;
};

// Preview in Bangladesh time, matching the backend
const previewFormat = (format, count = 1) => {
  const { serial, number } = splitCount(format, count);
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
    .replace(SEQ_RE, (_, hex, width) => pad(number, hex, width))
    .replace(SER_RE, (_, hex, width) => pad(serial ?? 1, hex, width));
};

const selectClass =
  'h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

// Digit / type pickers that rewrite the {SEQ} and {SER} tokens, so nobody has to type ":3" by hand
const SerialControls = ({ value, onChange }) => {
  const seq = readToken(SEQ_RE, value);
  const ser = readToken(SER_RE, value);
  if (!seq) return null;

  const setSeq = (next) => onChange(value.replace(SEQ_RE, `{SEQ${next.hex ? 'X' : ''}:${next.width}}`));
  const setSer = (next) => {
    if (!next) return onChange(value.replace(SER_RE, ''));
    const token = `{SER${next.hex ? 'X' : ''}:${next.width}}`;
    // A new serial goes right in front of the number
    return onChange(ser ? value.replace(SER_RE, token) : value.replace(SEQ_RE, (m) => token + m));
  };

  const lastNumber = pad(capacity(seq), seq.hex, seq.width);
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-md bg-muted/30 px-2.5 py-2">
      <label className="space-y-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Number</span>
        <select className={selectClass} value={seq.hex ? 'hex' : 'dec'} onChange={(e) => setSeq({ ...seq, hex: e.target.value === 'hex' })}>
          <option value="dec">Decimal</option>
          <option value="hex">Hex</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Digits</span>
        <select className={selectClass} value={seq.width} onChange={(e) => setSeq({ ...seq, width: Number(e.target.value) })}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Serial</span>
        <select
          className={selectClass}
          value={ser ? (ser.hex ? 'hex' : 'dec') : 'none'}
          onChange={(e) => setSer(e.target.value === 'none' ? null : { hex: e.target.value === 'hex', width: ser?.width || 1 })}
        >
          <option value="none">None</option>
          <option value="dec">Decimal (1-9)</option>
          <option value="hex">Hex (1-F)</option>
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Serial digits</span>
        <select className={selectClass} disabled={!ser} value={ser?.width || 1} onChange={(e) => setSer({ ...ser, width: Number(e.target.value) })}>
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </label>
      <span className="pb-1.5 text-[11px] text-muted-foreground">
        {ser ? (
          <>After <span className="font-mono">{previewFormat(value, capacity(seq))}</span> comes <span className="font-mono text-foreground">{previewFormat(value, capacity(seq) + 1)}</span></>
        ) : (
          <>After {lastNumber} the number grows a digit</>
        )}
      </span>
    </div>
  );
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
      {!error && <SerialControls value={value} onChange={onChange} />}
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
          (Oct = A, Nov = B, Dec = C) and {'{SEQX}'} counts the number in hex. Pick the number's digits below; add a serial
          ({'{SER}'} 1-9 or {'{SERX}'} 1-F) and when the number is full (999) the serial steps up and the number restarts at 001. Leave a field empty to keep the
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
