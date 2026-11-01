import { useEffect, useState } from 'react';
import { Palette, Check, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  COLOR_PRESETS,
  RADIUS_OPTIONS,
  applyAppearance,
  isValidColor,
} from '@/lib/appearance';

const DEFAULT_COLOR = COLOR_PRESETS[0].value;
const DEFAULT_RADIUS = RADIUS_OPTIONS[1].value;

// Personal dashboard look: brand colour and corner roundness, applied live and kept for this user's account
export default function AppearanceTab() {
  const { user, updateUser } = useAuth();
  const saved = user?.preferences?.appearance || {};
  const savedColor = saved.primaryColor || '';
  const savedRadius = saved.radius || '';

  const [color, setColor] = useState(savedColor);
  const [radius, setRadius] = useState(savedRadius);
  const [isSaving, setIsSaving] = useState(false);

  const effectiveColor = color || DEFAULT_COLOR;
  const hasChanges = color !== savedColor || radius !== savedRadius;

  useEffect(() => {
    applyAppearance({ primaryColor: color, radius });
  }, [color, radius]);

  useEffect(
    () => () => applyAppearance({ primaryColor: savedColor, radius: savedRadius }),
    [savedColor, savedRadius],
  );

  const save = async () => {
    if (color && !isValidColor(color)) {
      toast.error('Enter the colour as a hex code like #c5a059');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiClient.put('/api/v1/users/me', {
        preferences: { appearance: { primaryColor: color, radius } },
      });
      if (res.data?.data) updateUser(res.data.data);
      toast.success('Appearance saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save appearance');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setColor('');
    setRadius('');
  };

  return (
    <Card className="border shadow-xs w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Palette className="h-5 w-5 text-pink-500" />
          Appearance
        </CardTitle>
        <CardDescription>
          Pick your own colour and corner style. It changes the whole dashboard right away and stays with your account whenever you log in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Brand colour</h3>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((preset) => {
              const active = effectiveColor.toLowerCase() === preset.value.toLowerCase();
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  title={preset.name}
                  aria-label={preset.name}
                  aria-pressed={active}
                  className="flex size-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105 cursor-pointer"
                  style={{ backgroundColor: preset.value, borderColor: active ? 'var(--foreground)' : 'transparent' }}
                >
                  {active && <Check className="size-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValidColor(effectiveColor) ? effectiveColor : DEFAULT_COLOR}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
              aria-label="Custom colour"
            />
            <Input
              value={color}
              placeholder={DEFAULT_COLOR}
              onChange={(e) => setColor(e.target.value.trim())}
              className="h-9 w-32 font-mono text-xs"
              maxLength={7}
            />
            {color && !isValidColor(color) && <span className="text-xs text-destructive">Use a hex code like #c5a059</span>}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Corner style</h3>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((option) => {
              const active = (radius || DEFAULT_RADIUS) === option.value;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRadius(option.value)}
                  aria-pressed={active}
                  className={`flex w-24 flex-col items-center gap-2 border p-3 text-xs font-medium transition-colors cursor-pointer ${
                    active ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                  style={{ borderRadius: option.value }}
                >
                  <span
                    className="h-7 w-12 border-2 border-primary/60"
                    style={{ borderRadius: option.value }}
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Preview</h3>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
            <Button size="sm">Primary button</Button>
            <Button size="sm" variant="outline">Outline</Button>
            <Badge>Badge</Badge>
            <Input placeholder="Input field" className="h-8 w-40 text-xs" readOnly />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={isSaving || !hasChanges} className="gap-2">
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Save appearance
          </Button>
          <Button variant="outline" onClick={reset} disabled={isSaving || (!color && !radius)} className="gap-2">
            <RotateCcw className="size-4" />
            Reset to default
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
