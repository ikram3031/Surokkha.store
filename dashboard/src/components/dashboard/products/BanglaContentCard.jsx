import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";

const textareaClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Turns a saved product's `bn` object into editable form state
export const bnFormFromProduct = (bn) => {
  const src = bn && typeof bn === "object" ? bn : {};
  const specs = Array.isArray(src.specifications)
    ? src.specifications.map((s) => ({ key: s?.key || s?.label || s?.name || "", value: s?.value ?? "" }))
    : src.specifications && typeof src.specifications === "object"
    ? Object.entries(src.specifications).map(([key, value]) => ({ key, value: String(value ?? "") }))
    : [];
  const benefits = Array.isArray(src.benefits)
    ? src.benefits.map((b) =>
        typeof b === "object" && b !== null
          ? { title: b.title || b.name || "", description: b.description || b.desc || "" }
          : { title: String(b), description: "" }
      )
    : [];
  return {
    ...src,
    name: src.name || src.title || "",
    tagline: src.tagline || "",
    description: src.description || src.shortDescription || "",
    longDescription: src.longDescription || "",
    packSize: src.packSize || "",
    packageContents: src.packageContents || "",
    benefits,
    specifications: specs,
  };
};

// Builds the `bn` payload, keeping any other keys already stored on the product
export const bnPayloadFromForm = (form) => {
  const trim = (v) => String(v || "").trim();
  return {
    ...form,
    name: trim(form.name),
    tagline: trim(form.tagline),
    description: trim(form.description),
    longDescription: trim(form.longDescription),
    packSize: trim(form.packSize),
    packageContents: trim(form.packageContents),
    benefits: (form.benefits || [])
      .map((b) => ({ title: trim(b.title), description: trim(b.description) }))
      .filter((b) => b.title),
    specifications: (form.specifications || [])
      .map((s) => ({ key: trim(s.key), value: trim(s.value) }))
      .filter((s) => s.key && s.value),
  };
};

export const BanglaContentCard = ({ bn, setBn }) => {
  const set = (field, value) => setBn((prev) => ({ ...prev, [field]: value }));
  const updateRow = (field, index, key, value) =>
    setBn((prev) => ({
      ...prev,
      [field]: prev[field].map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  const addRow = (field, row) => setBn((prev) => ({ ...prev, [field]: [...(prev[field] || []), row] }));
  const removeRow = (field, index) =>
    setBn((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-sm font-bold text-foreground">বাংলা কনটেন্ট (Bangla Content)</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Shown on the storefront when the language is Bangla. Empty fields fall back to English.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground block">প্রোডাক্টের নাম</label>
          <Input placeholder="যেমন: আল্ট্রা থিন কনডম" value={bn.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground block">ট্যাগলাইন</label>
          <Input placeholder="ছোট এক লাইনের বর্ণনা" value={bn.tagline} onChange={(e) => set("tagline", e.target.value)} />
        </div>
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground block">প্যাক সাইজ</label>
          <Input placeholder="যেমন: ১০ পিস / বক্স" value={bn.packSize} onChange={(e) => set("packSize", e.target.value)} />
        </div>
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-muted-foreground block">প্যাকেজে যা আছে</label>
          <Input
            placeholder="যেমন: ১টি বক্সে ১০টি কনডম"
            value={bn.packageContents}
            onChange={(e) => set("packageContents", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-muted-foreground block">সংক্ষিপ্ত বর্ণনা</label>
        <textarea
          rows={3}
          placeholder="প্রোডাক্টের সংক্ষিপ্ত বর্ণনা..."
          value={bn.description}
          onChange={(e) => set("description", e.target.value)}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold text-muted-foreground block">বিস্তারিত বর্ণনা</label>
        <RichTextEditor
          placeholder="প্রোডাক্টের বিস্তারিত বর্ণনা লিখুন..."
          value={bn.longDescription}
          onChange={(val) => set("longDescription", val)}
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground">সুবিধাসমূহ (Benefits)</label>
          <Button type="button" variant="secondary" size="sm" onClick={() => addRow("benefits", { title: "", description: "" })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        {bn.benefits.map((b, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_2fr]">
              <Input placeholder="শিরোনাম" value={b.title} onChange={(e) => updateRow("benefits", i, "title", e.target.value)} />
              <Input placeholder="বর্ণনা" value={b.description} onChange={(e) => updateRow("benefits", i, "description", e.target.value)} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow("benefits", i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground">স্পেসিফিকেশন</label>
          <Button type="button" variant="secondary" size="sm" onClick={() => addRow("specifications", { key: "", value: "" })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
        {bn.specifications.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <div className="flex-1 grid gap-2 grid-cols-2">
              <Input placeholder="যেমন: উপাদান" value={s.key} onChange={(e) => updateRow("specifications", i, "key", e.target.value)} />
              <Input placeholder="যেমন: প্রাকৃতিক ল্যাটেক্স" value={s.value} onChange={(e) => updateRow("specifications", i, "value", e.target.value)} />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeRow("specifications", i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
