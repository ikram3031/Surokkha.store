import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const textareaClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const trim = (v) => String(v || "").trim();

export const normalizeBenefits = (list) =>
  Array.isArray(list)
    ? list.map((b) =>
        typeof b === "object" && b !== null
          ? { title: b.title || b.name || "", description: b.description || b.desc || "" }
          : { title: String(b), description: "" }
      )
    : [];

export const normalizeSections = (list) =>
  Array.isArray(list)
    ? list.map((s) =>
        typeof s === "object" && s !== null
          ? { heading: s.heading || s.title || "", content: s.content || s.description || "" }
          : { heading: String(s), content: "" }
      )
    : [];

export const benefitsPayload = (list) =>
  (list || [])
    .map((b) => ({ title: trim(b.title), description: trim(b.description) }))
    .filter((b) => b.title);

export const sectionsPayload = (list) =>
  (list || [])
    .map((s) => ({ heading: trim(s.heading), content: trim(s.content) }))
    .filter((s) => s.heading || s.content);

// Editable list of { title, description } rows
export const BenefitsEditor = ({ label, rows, onChange, titlePlaceholder, descPlaceholder }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...(rows || []), { title: "", description: "" }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Add
      </Button>
    </div>
    {(rows || []).map((b, i) => (
      <div key={i} className="flex gap-2 items-start">
        <div className="flex-1 grid gap-2 sm:grid-cols-[1fr_2fr]">
          <Input
            placeholder={titlePlaceholder}
            value={b.title}
            onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)))}
          />
          <Input
            placeholder={descPlaceholder}
            value={b.description}
            onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, description: e.target.value } : r)))}
          />
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ))}
  </div>
);

// Editable list of { heading, content } rows
export const SectionsEditor = ({ label, rows, onChange, headingPlaceholder, contentPlaceholder }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between">
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onChange([...(rows || []), { heading: "", content: "" }])}
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Add
      </Button>
    </div>
    {(rows || []).map((s, i) => (
      <div key={i} className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <Input
            placeholder={headingPlaceholder}
            value={s.heading}
            onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, heading: e.target.value } : r)))}
          />
          <textarea
            rows={2}
            placeholder={contentPlaceholder}
            value={s.content}
            onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, content: e.target.value } : r)))}
            className={textareaClass}
          />
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ))}
  </div>
);

// English benefits and content sections shown on the product page
export const ProductContentCard = ({ benefits, setBenefits, sections, setSections }) => (
  <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
    <div className="border-b pb-2">
      <h3 className="text-sm font-bold text-foreground">Benefits &amp; Sections (English)</h3>
      <p className="text-[11px] text-muted-foreground mt-0.5">Shown on the product page below the description.</p>
    </div>
    <BenefitsEditor
      label="Benefits"
      rows={benefits}
      onChange={setBenefits}
      titlePlaceholder="Title"
      descPlaceholder="Description"
    />
    <SectionsEditor
      label="Sections"
      rows={sections}
      onChange={setSections}
      headingPlaceholder="Heading"
      contentPlaceholder="Content"
    />
  </div>
);
