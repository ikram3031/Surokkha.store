import { Input } from "@/components/ui/input";

export const SEOOverviewCard = ({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold border-b pb-2 text-foreground">
        Search Engine Optimization (SEO)
      </h3>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-muted-foreground block">
          Meta Title
        </label>
        <Input
          placeholder="e.g. Buy Premium Oud Imperial Perfume Online"
          value={metaTitle || ""}
          onChange={(e) => setMetaTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-muted-foreground block">
          Meta Description
        </label>
        <textarea
          rows={3}
          placeholder="Brief summary of the product for search engine results..."
          value={metaDescription || ""}
          onChange={(e) => setMetaDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
};
