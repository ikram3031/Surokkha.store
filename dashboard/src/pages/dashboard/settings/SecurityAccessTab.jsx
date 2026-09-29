import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

// Displays security and access policy configuration status for the store
const SecurityAccessTab = () => {
  return (
    <Card className="border shadow-xs w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-500" />
          Security & Access Policy
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-3 rounded-lg border border-dashed border-border bg-muted/20">
          <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
          <h3 className="font-semibold text-foreground">Coming Soon</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Advanced multi-tenant security policies and audit governance configurations will be accessible here.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityAccessTab;
