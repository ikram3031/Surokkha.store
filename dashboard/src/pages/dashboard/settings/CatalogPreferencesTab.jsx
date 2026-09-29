import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sliders } from 'lucide-react';

export default function CatalogPreferencesTab() {
  return (
    <Card className="border shadow-xs w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sliders className="h-5 w-5 text-blue-500" />
          Catalog Display Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 rounded-lg border border-dashed border-border bg-muted/20">
          <Sliders className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold text-foreground">Coming Soon</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Automated sorting rules, default collection displays, and layout presets will be available in an upcoming update.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
