import { useMemo, useRef, useState } from "react";
import { FileJson, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// Fields the product form understands; anything else in the JSON is listed as ignored
const KNOWN_KEYS = new Set([
  "name", "slug", "sku", "type", "price", "offerPrice", "isActive", "stockStatus",
  "description", "longDescription", "benefits", "sections", "bn", "tags",
  "categories", "category", "brand", "brands", "season", "metaData", "variants",
  "imageUrl", "thumbnailUrl", "images", "stockItem", "stockQty", "extraStock",
]);

const short = (v, n = 90) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

const slugOf = (c) => (typeof c === "object" && c !== null ? c.slug || c.did || c._id : String(c));

// Reads pasted JSON and lists what the form will receive, so mistakes show before anything is filled
const buildPreview = (raw, categories) => {
  if (!raw.trim()) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { error: `JSON পড়া যায়নি: ${err.message}` };
  }
  if (Array.isArray(data)) data = data[0];
  if (!data || typeof data !== "object") return { error: "JSON-এ একটা product object থাকতে হবে।" };

  const rows = [];
  const warnings = [];
  const add = (label, value) => {
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return;
    rows.push({ label, value });
  };

  add("Name", data.name);
  add("Slug", data.slug);
  add("SKU", data.sku);
  add("Product type", data.type === "variant" ? "Variable" : data.type === "simple" ? "Simple" : data.type);
  if (data.type === "simple") {
    add("Regular price", data.price);
    add("Offer price", data.offerPrice);
    const p = Number(data.price);
    const o = Number(data.offerPrice);
    if (p && o) add("Discount", `${Math.round(((p - o) / p) * 1000) / 10}%`);
    if (!p) warnings.push("Regular price নেই বা সংখ্যা না।");
    if (o && p && o >= p) warnings.push("Offer price, regular price-এর চেয়ে কম হওয়া উচিত।");
  }
  if (data.type === "variant") add("Variants", `${(data.variants || []).length}টা`);
  if (typeof data.isActive === "boolean") add("Status", data.isActive ? "Active" : "Inactive (draft)");
  add("Short description", short(data.description));
  add("Long description", short(data.longDescription));
  add("Benefits", Array.isArray(data.benefits) ? `${data.benefits.length}টা` : undefined);
  add("Sections", Array.isArray(data.sections) && data.sections.length ? `${data.sections.length}টা` : undefined);
  add("Tags", Array.isArray(data.tags) ? data.tags.join(", ") : undefined);

  const cats = (Array.isArray(data.categories) ? data.categories : data.category ? [data.category] : []).map(slugOf);
  if (cats.length) {
    const known = new Set(categories.flatMap((c) => [c.slug, c.did, String(c._id)].filter(Boolean)));
    add("Categories", cats.join(", "));
    const missing = cats.filter((c) => !known.has(c));
    if (missing.length && categories.length) warnings.push(`এই category পাওয়া যায়নি: ${missing.join(", ")}`);
  }

  if (data.bn && typeof data.bn === "object") {
    add("বাংলা নাম", data.bn.name);
    add("ট্যাগলাইন", data.bn.tagline);
    add("প্যাক সাইজ", data.bn.packSize);
    add("বাংলা বর্ণনা", short(data.bn.description));
  }
  add("Meta title", data.metaData?.metaTitle);
  add("Meta description", short(data.metaData?.metaDescription));
  add("Main image", data.imageUrl);

  if (!data.name) warnings.push("Name নেই।");
  if (!data.type) warnings.push("Product type (simple / variant) নেই।");
  if (!data.imageUrl) warnings.push("ছবি নেই: ফর্মে Featured Image আলাদা করে দিতে হবে।");

  const ignored = Object.keys(data).filter((k) => !KNOWN_KEYS.has(k));
  return { data, rows, warnings, ignored };
};

export const ImportJsonDialog = ({ open, onOpenChange, onApply, categories = [] }) => {
  const [raw, setRaw] = useState("");
  const fileRef = useRef(null);
  const preview = useMemo(() => buildPreview(raw, categories), [raw, categories]);

  const loadFile = async (file) => {
    if (!file) return;
    setRaw(await file.text());
  };

  const apply = () => {
    if (!preview?.data) return;
    onApply(preview.data);
    setRaw("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" /> Import product from JSON
          </DialogTitle>
          <DialogDescription>
            JSON পেস্ট করুন বা .json ফাইল দিন। ডান পাশে দেখাবে কী কী ডাটা পাওয়া গেছে। Apply দিলে ফর্মে বসবে, সেভ হবে না।
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 flex-1 overflow-hidden">
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">JSON</span>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="cursor-pointer">
                <Upload className="h-3.5 w-3.5 mr-1.5" /> .json ফাইল
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  loadFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <Textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder='{ "name": "...", "type": "simple", "price": 2200, "offerPrice": 1540 }'
              className="font-mono text-xs flex-1 min-h-[260px] md:min-h-[420px] resize-none"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            <span className="text-xs font-semibold text-muted-foreground">Preview</span>
            <div className="flex-1 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm min-h-[200px]">
              {!preview && <p className="text-muted-foreground">JSON দিলে এখানে দেখাবে।</p>}
              {preview?.error && <p className="text-destructive">{preview.error}</p>}
              {preview?.data && (
                <div className="space-y-3">
                  {preview.warnings.length > 0 && (
                    <ul className="space-y-1 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400">
                      {preview.warnings.map((w) => (
                        <li key={w} className="flex gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {w}
                        </li>
                      ))}
                    </ul>
                  )}
                  <dl className="divide-y divide-border">
                    {preview.rows.map((r) => (
                      <div key={r.label} className="grid grid-cols-[130px_1fr] gap-2 py-1.5">
                        <dt className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {r.label}
                        </dt>
                        <dd className="text-xs break-words">{String(r.value)}</dd>
                      </div>
                    ))}
                  </dl>
                  {preview.ignored.length > 0 && (
                    <p className="text-xs text-muted-foreground">বাদ যাবে (ফর্মে নেই): {preview.ignored.join(", ")}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button type="button" onClick={apply} disabled={!preview?.data} className="cursor-pointer">
            Apply to form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
