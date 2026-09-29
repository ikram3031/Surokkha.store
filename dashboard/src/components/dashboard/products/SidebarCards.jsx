import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UploadCloud, X, Tag, Check, Layers, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const COMMON_TAG_SUGGESTIONS = [
  "featured",
  "new-arrival",
  "best-seller",
  "popular",
  "sale",
  "trending",
  "luxury",
  "exclusive",
  "summer",
  "winter",
  "spring",
  "autumn",
  "oud",
  "woody",
  "floral",
  "fresh",
  "sweet",
  "oriental",
  "citrus",
  "amber",
  "gourmand",
  "spicy",
  "leather",
  "vanilla",
  "musk",
];

export const SidebarCards = ({
  isActive,
  setIsActive,
  imagePreview,
  mainImageError,
  fileInputRef,
  handleImageSelect,
  removeUploadedImage,
  galleryImages,
  galleryInputRef,
  handleGalleryImageSelect,
  removeGalleryImage,
  categorySlugs = [],
  setCategorySlugs,
  categorySlug,
  setCategorySlug,
  categories = [],
  brandSlugs = [],
  setBrandSlugs,
  parentBrandSlug,
  setParentBrandSlug,
  brandSlug,
  setBrandSlug,
  parentBrands = [],
  childBrands = [],
  brands = [],
  season,
  setSeason,
  tags = [],
  setTags,
  clientConfig,
  getFullPreviewUrl,
}) => {
  // Normalize Category & Brand Multi-select state
  const selectedCategorySlugs = useMemo(() => {
    if (Array.isArray(categorySlugs) && categorySlugs.length > 0) {
      return categorySlugs;
    }
    if (categorySlug && typeof categorySlug === "string" && categorySlug !== "__none__") {
      return [categorySlug];
    }
    return [];
  }, [categorySlugs, categorySlug]);

  const selectedBrandSlugs = useMemo(() => {
    if (Array.isArray(brandSlugs) && brandSlugs.length > 0) {
      return brandSlugs;
    }
    const list = [];
    if (brandSlug && typeof brandSlug === "string" && brandSlug !== "__none__") {
      list.push(brandSlug);
    }
    if (parentBrandSlug && typeof parentBrandSlug === "string" && parentBrandSlug !== "__none__" && !list.includes(parentBrandSlug)) {
      list.push(parentBrandSlug);
    }
    return list;
  }, [brandSlugs, brandSlug, parentBrandSlug]);

  // Dropdown & Search state
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  const [brandSearch, setBrandSearch] = useState("");
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef(null);

  const [tagInput, setTagInput] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef(null);

  const handleAddTag = (rawText) => {
    if (!rawText || !rawText.trim()) return;

    // Split by comma so multi-tags or pasted strings become individual tags
    const incoming = rawText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const current = Array.isArray(tags) ? [...tags] : [];
    let added = false;

    incoming.forEach((t) => {
      if (!current.includes(t)) {
        current.push(t);
        added = true;
      }
    });

    if (added) {
      setTags(current);
    }
    setTagInput("");
    setIsTagDropdownOpen(false);
  };

  const handleRemoveTag = (tagToRemove) => {
    const current = Array.isArray(tags) ? tags : [];
    setTags(current.filter((t) => t !== tagToRemove));
  };

  const filteredTagSuggestions = useMemo(() => {
    const search = tagInput.trim().toLowerCase();
    if (!search) return [];
    const current = Array.isArray(tags) ? tags : [];
    return COMMON_TAG_SUGGESTIONS.filter(
      (item) => item.toLowerCase().includes(search) && !current.includes(item)
    );
  }, [tagInput, tags]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target)
      ) {
        setIsTagDropdownOpen(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(e.target)
      ) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCategoryLabel = (catIdentifier) => {
    const found = categories.find(
      (c) =>
        c.did === catIdentifier ||
        c.slug === catIdentifier ||
        c._id === catIdentifier ||
        String(c._id) === String(catIdentifier) ||
        c.id === catIdentifier
    );
    if (!found) return catIdentifier;
    if (found.parent) {
      const pName =
        typeof found.parent === "object"
          ? found.parent.name
          : categories.find(
              (c) =>
                c.did === found.parent ||
                c.id === found.parent ||
                c._id === found.parent ||
                String(c._id) === String(found.parent)
            )?.name;
      return pName ? `${pName} › ${found.name}` : found.name;
    }
    return found.name;
  };

  const getBrandLabel = (brandIdentifier) => {
    const allBrandList = brands.length > 0 ? brands : [...parentBrands, ...childBrands];
    const found = allBrandList.find(
      (b) =>
        b.did === brandIdentifier ||
        b.slug === brandIdentifier ||
        b._id === brandIdentifier ||
        String(b._id) === String(brandIdentifier) ||
        (b.slug && b.slug.toLowerCase() === String(brandIdentifier).toLowerCase()) ||
        b.id === brandIdentifier
    );
    if (!found) return brandIdentifier;
    if (found.parent) {
      const pName =
        typeof found.parent === "object"
          ? found.parent.name
          : allBrandList.find(
              (b) =>
                b.did === found.parent ||
                b.id === found.parent ||
                b._id === found.parent ||
                String(b._id) === String(found.parent)
            )?.name;
      return pName ? `${pName} › ${found.name}` : found.name;
    }
    return found.name;
  };

  const handleToggleCategory = (catIdentifier) => {
    if (!catIdentifier || catIdentifier === "__none__") return;
    const current = selectedCategorySlugs;
    if (current.includes(catIdentifier)) {
      const updated = current.filter((c) => c !== catIdentifier);
      if (setCategorySlugs) setCategorySlugs(updated);
      else if (setCategorySlug) setCategorySlug(updated[0] || "");
    } else {
      const updated = [...current, catIdentifier];
      if (setCategorySlugs) setCategorySlugs(updated);
      else if (setCategorySlug) setCategorySlug(updated[0] || "");
    }
  };

  const handleRemoveCategory = (catIdentifier) => {
    const updated = selectedCategorySlugs.filter((c) => c !== catIdentifier);
    if (setCategorySlugs) setCategorySlugs(updated);
    else if (setCategorySlug) setCategorySlug(updated[0] || "");
  };

  const handleToggleBrand = (brandIdentifier) => {
    if (!brandIdentifier || brandIdentifier === "__none__") return;
    const current = selectedBrandSlugs;
    if (current.includes(brandIdentifier)) {
      const updated = current.filter((b) => b !== brandIdentifier);
      if (setBrandSlugs) setBrandSlugs(updated);
      else if (setBrandSlug) setBrandSlug(updated[0] || "");
    } else {
      const updated = [...current, brandIdentifier];
      if (setBrandSlugs) setBrandSlugs(updated);
      else if (setBrandSlug) setBrandSlug(updated[0] || "");
    }
  };

  const handleRemoveBrand = (brandIdentifier) => {
    const updated = selectedBrandSlugs.filter((b) => b !== brandIdentifier);
    if (setBrandSlugs) setBrandSlugs(updated);
    else if (setBrandSlug) setBrandSlug(updated[0] || "");
  };

  // Filtered categories tree for search/dropdown
  const filteredCategoriesList = useMemo(() => {
    const rootCats = categories.filter((c) => !c.parent);
    const subCats = categories.filter((c) => !!c.parent);
    const result = [];
    const search = categorySearch.trim().toLowerCase();

    rootCats.forEach((root) => {
      const rootVal = root.did || root.slug || String(root._id);
      const children = subCats.filter((sub) => {
        const p = sub.parent;
        const pId = typeof p === "object" && p !== null ? p.did || p._id || p.id : p;
        return (
          pId === root.did ||
          pId === root.id ||
          pId === root._id ||
          pId === root.slug ||
          String(pId) === String(root._id)
        );
      });

      const rootMatches = !search || root.name.toLowerCase().includes(search);
      const matchingChildren = children.filter((c) => !search || c.name.toLowerCase().includes(search));

      if (rootMatches || matchingChildren.length > 0) {
        result.push({ ...root, isChild: false, val: rootVal });
        (search && !rootMatches ? matchingChildren : children).forEach((child) => {
          result.push({
            ...child,
            isChild: true,
            val: child.did || child.slug || String(child._id),
          });
        });
      }
    });

    const renderedVals = new Set(result.map((r) => r.val));
    categories.forEach((cat) => {
      const val = cat.did || cat.slug || String(cat._id);
      if (!renderedVals.has(val) && (!search || cat.name.toLowerCase().includes(search))) {
        result.push({ ...cat, isChild: !!cat.parent, val });
      }
    });

    return result;
  }, [categories, categorySearch]);

  // Filtered brands tree for search/dropdown
  const filteredBrandsList = useMemo(() => {
    const allBrandList = brands.length > 0 ? brands : [...parentBrands, ...childBrands];
    const rootBrands = allBrandList.filter((b) => !b.parent);
    const subBrands = allBrandList.filter((b) => !!b.parent);
    const result = [];
    const search = brandSearch.trim().toLowerCase();

    rootBrands.forEach((root) => {
      const rootVal = root.did || root.slug || String(root._id);
      const children = subBrands.filter((sub) => {
        const p = sub.parent;
        const pId = typeof p === "object" && p !== null ? p.did || p._id || p.id : p;
        return (
          pId === root.did ||
          pId === root.id ||
          pId === root._id ||
          pId === root.slug ||
          String(pId) === String(root._id)
        );
      });

      const rootMatches = !search || root.name.toLowerCase().includes(search);
      const matchingChildren = children.filter((c) => !search || c.name.toLowerCase().includes(search));

      if (rootMatches || matchingChildren.length > 0) {
        result.push({ ...root, isChild: false, val: rootVal });
        (search && !rootMatches ? matchingChildren : children).forEach((child) => {
          result.push({
            ...child,
            isChild: true,
            val: child.did || child.slug || String(child._id),
          });
        });
      }
    });

    const renderedVals = new Set(result.map((r) => r.val));
    allBrandList.forEach((brand) => {
      const val = brand.did || brand.slug || String(brand._id);
      if (!renderedVals.has(val) && (!search || brand.name.toLowerCase().includes(search))) {
        result.push({ ...brand, isChild: !!brand.parent, val });
      }
    });

    return result;
  }, [brands, parentBrands, childBrands, brandSearch]);

  return (
    <div className="space-y-6">
      {/* 1. Status Card (Boolean isActive Switch) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">
          Status
        </h3>
        <div className="flex items-center justify-between pt-1">
          <div>
            <label className="text-xs font-semibold block text-foreground">
              {isActive ? "🟢 Active / Published" : "⚪ Inactive / Draft"}
            </label>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isActive
                ? "Product is visible on public store."
                : "Product is hidden from customer catalog."}
            </p>
          </div>
          <Switch
            checked={Boolean(isActive)}
            onCheckedChange={(checked) => setIsActive(checked)}
          />
        </div>
      </div>

      {/* 2. Featured Image Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold border-b pb-2 text-foreground">
          Featured Image *
        </h3>

        {!imagePreview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
              mainImageError
                ? "border-destructive bg-destructive/5 text-destructive"
                : "border-border/80 hover:border-primary/50 hover:bg-muted/10"
            }`}
          >
            <UploadCloud
              className={`h-8 w-8 mb-1.5 ${
                mainImageError ? "text-destructive" : "text-muted-foreground"
              }`}
            />
            <span className="text-xs font-semibold block text-foreground">
              Upload Main Image
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              PNG, JPG, WEBP up to 2MB
            </span>
            {mainImageError && (
              <p className="text-[11px] font-semibold text-destructive mt-2">
                {mainImageError}
              </p>
            )}
          </div>
        ) : (
          <div className="relative rounded-lg border overflow-hidden group bg-muted/10">
            <img
              src={
                imagePreview.startsWith("blob:") ||
                imagePreview.startsWith("http")
                  ? imagePreview
                  : getFullPreviewUrl(imagePreview)
              }
              alt="Featured preview"
              className="w-full h-44 object-cover"
            />
            <button
              type="button"
              onClick={removeUploadedImage}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-sm hover:bg-destructive/90 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* 3. Gallery Images Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h3 className="text-sm font-bold text-foreground">
            Product Gallery ({galleryImages.length}/5)
          </h3>
          {galleryImages.length < 5 && (
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              + Add Image
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {galleryImages.map((img) => (
            <div
              key={img.id}
              className="relative rounded-lg border bg-muted/10 overflow-hidden group aspect-square flex items-center justify-center"
            >
              <img
                src={
                  img.preview.startsWith("http") ||
                  img.preview.startsWith("blob:")
                    ? img.preview
                    : getFullPreviewUrl(img.preview)
                }
                alt="Gallery preview"
                className="object-cover w-full h-full"
              />
              <button
                type="button"
                onClick={() => removeGalleryImage(img.id)}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90 transition-colors"
                title="Remove gallery image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {galleryImages.length < 5 && (
            <div
              onClick={() => galleryInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all aspect-square min-h-[70px]"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[9px] font-semibold text-muted-foreground mt-0.5">
                Add
              </span>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={galleryInputRef}
          onChange={handleGalleryImageSelect}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {/* 4. Categories Card (Multi-Select + Search) */}
      {clientConfig?.features?.category !== false && clientConfig?.features?.categories !== false && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Categories</h3>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {selectedCategorySlugs.length} selected
            </span>
          </div>

          {/* Category Search & Dropdown Picker */}
          <div className="relative" ref={categoryDropdownRef}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Search & Add Categories
              </label>
              <div className="relative">
                <Input
                  placeholder="Search or click to select categories..."
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setIsCategoryDropdownOpen(true);
                  }}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  className="h-9 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dropdown Options */}
            {isCategoryDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-popover shadow-lg py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                {filteredCategoriesList.length > 0 ? (
                  filteredCategoriesList.map((cat) => {
                    const val = cat.did || cat.slug || String(cat._id);
                    const isSelected = selectedCategorySlugs.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleToggleCategory(val)}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted/50"
                        } ${cat.isChild ? "pl-7 text-[11px]" : "font-medium"}`}
                      >
                        <span className="truncate">
                          {cat.isChild ? `└─ ${cat.name}` : `📁 ${cat.name}`}
                        </span>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                    No matching categories found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Category Chips */}
          {selectedCategorySlugs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedCategorySlugs.map((slug) => (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 shadow-xs animate-in fade-in"
                >
                  📁 {getCategoryLabel(slug)}
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(slug)}
                    className="hover:text-destructive transition-colors p-0.5 rounded-full cursor-pointer"
                    title="Remove category"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              No categories selected yet. Click above to select multiple categories.
            </p>
          )}
        </div>
      )}

      {/* 5. Brands Card (Multi-Select + Search) */}
      {clientConfig?.features?.brand !== false && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">Brands</h3>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {selectedBrandSlugs.length} selected
            </span>
          </div>

          {/* Brand Search & Dropdown Picker */}
          <div className="relative" ref={brandDropdownRef}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Search & Add Brands
              </label>
              <div className="relative">
                <Input
                  placeholder="Search or click to select brands..."
                  value={brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    setIsBrandDropdownOpen(true);
                  }}
                  onFocus={() => setIsBrandDropdownOpen(true)}
                  className="h-9 pr-8"
                />
                <button
                  type="button"
                  onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dropdown Options */}
            {isBrandDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-popover shadow-lg py-1.5 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
                {filteredBrandsList.length > 0 ? (
                  filteredBrandsList.map((b) => {
                    const val = b.did || b.slug || String(b._id);
                    const isSelected = selectedBrandSlugs.includes(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleToggleBrand(val)}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-secondary text-secondary-foreground font-semibold"
                            : "text-foreground hover:bg-muted/50"
                        } ${b.isChild ? "pl-7 text-[11px]" : "font-medium"}`}
                      >
                        <span className="truncate">
                          {b.isChild ? `└─ ${b.name}` : `🏷️ ${b.name}`}
                        </span>
                        {isSelected ? (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-40 hover:opacity-100" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                    No matching brands found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Brand Chips */}
          {selectedBrandSlugs.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedBrandSlugs.map((slug) => (
                <span
                  key={slug}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border shadow-xs animate-in fade-in"
                >
                  🏷️ {getBrandLabel(slug)}
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(slug)}
                    className="hover:text-destructive transition-colors p-0.5 rounded-full cursor-pointer"
                    title="Remove brand"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              No brands selected yet. Click above to select multiple brands.
            </p>
          )}
        </div>
      )}

      {/* 6. Season Card (Multi-Select) */}
      {clientConfig?.features?.season !== false && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-foreground">Season</h3>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {(() => {
                const list = Array.isArray(season)
                  ? season
                  : typeof season === "string" && season.trim()
                  ? season.split(",").map((s) => s.trim()).filter(Boolean)
                  : ["All-Season"];
                return `${list.length} selected`;
              })()}
            </span>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Select Seasons
            </label>
            <div className="flex flex-wrap gap-2">
              {["All-Season", "Summer", "Winter", "Spring", "Autumn"].map((s) => {
                const currentList = Array.isArray(season)
                  ? season
                  : typeof season === "string" && season.trim()
                  ? season.split(",").map((item) => item.trim()).filter(Boolean)
                  : ["All-Season"];
                const isSelected = currentList.includes(s);

                const toggleSeason = () => {
                  let updated;
                  if (s === "All-Season") {
                    updated = ["All-Season"];
                  } else {
                    const withoutAll = currentList.filter((item) => item !== "All-Season");
                    if (withoutAll.includes(s)) {
                      updated = withoutAll.filter((item) => item !== s);
                      if (updated.length === 0) updated = ["All-Season"];
                    } else {
                      updated = [...withoutAll, s];
                    }
                  }
                  setSeason(updated);
                };

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={toggleSeason}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. Tags Card (Chip UI + Search & Add Dropdown) */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground">Tags</h3>
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {Array.isArray(tags) ? tags.length : 0} tags
          </span>
        </div>

        {/* Tag Input & Search Dropdown */}
        <div className="relative" ref={tagDropdownRef}>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Search or Add Tag
            </label>
            <Input
              placeholder="Search or type tag and press Enter / comma..."
              value={tagInput}
              onChange={(e) => {
                const val = e.target.value;
                if (val.includes(",")) {
                  handleAddTag(val);
                } else {
                  setTagInput(val);
                  setIsTagDropdownOpen(true);
                }
              }}
              onFocus={() => {
                if (tagInput.trim()) setIsTagDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              className="h-9"
            />
          </div>

          {/* Autocomplete / Add dropdown */}
          {isTagDropdownOpen && tagInput.trim() && (
            <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-popover shadow-lg py-1 max-h-52 overflow-y-auto animate-in fade-in slide-in-from-top-1">
              {/* Option 1: Add what user typed */}
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-primary hover:bg-muted/50 flex items-center gap-2 cursor-pointer transition-colors border-b"
              >
                <Plus className="h-3.5 w-3.5" />
                Add "{tagInput.trim()}"
              </button>

              {/* Suggestions */}
              {filteredTagSuggestions.length > 0 && (
                <div className="py-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground px-3 py-1 block">
                    Matching Tags
                  </span>
                  {filteredTagSuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleAddTag(sug)}
                      className="w-full px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted/50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span>#{sug}</span>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Tags Chips */}
        {Array.isArray(tags) && tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border shadow-xs animate-in fade-in"
              >
                #{t}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-destructive transition-colors p-0.5 rounded-full cursor-pointer"
                  title={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            No tags added yet. Type a tag and press Enter or comma.
          </p>
        )}
      </div>
    </div>
  );
};


