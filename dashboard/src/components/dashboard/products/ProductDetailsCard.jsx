import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";

export const ProductDetailsCard = ({
  name,
  handleNameChange,
  slug,
  setSlug,
  slugManual,
  setSlugManual,
  sku,
  setSku,
  description,
  setDescription,
}) => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <h3 className="text-sm font-bold border-b pb-2.5 text-foreground">
        Product Details
      </h3>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold block text-foreground">
          Name *
        </label>
        <Input
          required
          placeholder="e.g. Oud Imperial Perfume"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold block text-foreground">
            Slug *
          </label>
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground underline cursor-pointer"
            onClick={() => setSlugManual(!slugManual)}
          >
            {slugManual ? "Auto-generate" : "Edit manually"}
          </button>
        </div>
        <Input
          required
          placeholder="oud-imperial-perfume"
          value={slug}
          onChange={(e) => {
            setSlugManual(true);
            const val = e.target.value
              .toLowerCase()
              .replace(/[^\w\s-]/g, "")
              .replace(/[\s_]+/g, "-")
              .replace(/-+/g, "-");
            setSlug(val);
          }}
          onBlur={() => {
            setSlug((prev) =>
              prev
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, "")
                .replace(/[\s_]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-+|-+$/g, "")
            );
          }}
          disabled={!slugManual}
          className={!slugManual ? "opacity-60 cursor-not-allowed" : ""}
        />
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold block text-foreground">
          SKU
        </label>
        <Input
          placeholder="e.g. OUD-IMP-100"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
        />
      </div>

      <div className="space-y-2.5">
        <label className="text-xs font-semibold block text-foreground">
          Description *
        </label>
        <RichTextEditor
          placeholder="Write a description for this product..."
          value={description}
          onChange={(val) => setDescription(val)}
        />
        <p className="text-[10px] text-muted-foreground">
          Set a description to the product for better visibility.
        </p>
      </div>
    </div>
  );
};
