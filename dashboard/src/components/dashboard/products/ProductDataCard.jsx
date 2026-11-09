import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, UploadCloud, X, Layers, Lock, Package, Image as ImageIcon } from "lucide-react";
import { MediaPickerModal } from "@/components/dashboard/media-picker-modal";
import { ExtraStockRows, StockItemPicker, StockQtyInput } from "@/components/dashboard/inventory/StockItemPicker";

export const ProductDataCard = ({
  productType,
  setProductType,
  price,
  setPrice,
  offerPrice,
  setOfferPrice,
  chargeTax,
  setChargeTax,
  taxRate,
  setTaxRate,
  stockItem = null,
  setStockItem,
  stockQty = 1,
  setStockQty,
  extraStock = [],
  setExtraStock,
  onPickStockItem,
  variants = [],
  attributeGroups = [],
  selectedAttributeGroup,
  setSelectedAttributeGroup,
  addAllPresets,
  addVariant,
  removeVariant,
  updateVariant,
  handleVariantImageSelect,
  onSelectVariantMedia,
  getFullPreviewUrl,
  clientConfig,
}) => {
  const [variantMediaPickerIndex, setVariantMediaPickerIndex] = useState(null);
  const [applySamePrice, setApplySamePrice] = useState(false);
  const [samePrice, setSamePrice] = useState("");
  const [sameOfferPrice, setSameOfferPrice] = useState("");
  // Simple products: "inventory" links a stock item, "custom" tracks no stock
  const [simpleSource, setSimpleSource] = useState(null);
  const source = simpleSource ?? "inventory";

  const handleApplySamePriceToggle = (checked) => {
    setApplySamePrice(checked);
    if (checked) {
      const initialPrice = samePrice || variants[0]?.price || "";
      const initialOffer = sameOfferPrice || variants[0]?.offerPrice || "";
      setSamePrice(initialPrice);
      setSameOfferPrice(initialOffer);

      // Propagate to all existing variants
      variants.forEach((_, index) => {
        updateVariant(index, "price", initialPrice);
        updateVariant(index, "offerPrice", initialOffer);
      });
    }
  };

  const handleGlobalPriceChange = (val) => {
    setSamePrice(val);
    variants.forEach((_, index) => {
      updateVariant(index, "price", val);
    });
  };

  const handleGlobalOfferPriceChange = (val) => {
    setSameOfferPrice(val);
    variants.forEach((_, index) => {
      updateVariant(index, "offerPrice", val);
    });
  };

  const handleAddVariantWithSamePrice = () => {
    addVariant();
    if (applySamePrice && samePrice) {
      setTimeout(() => {
        const lastIdx = variants.length;
        updateVariant(lastIdx, "price", samePrice);
        if (sameOfferPrice) updateVariant(lastIdx, "offerPrice", sameOfferPrice);
      }, 50);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-foreground">Product Data</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Configure pricing, tax, and variation modes for this product.
          </p>
        </div>

        <div className="w-full sm:w-52">
          <Select
            value={productType || "__none__"}
            onValueChange={(val) =>
              setProductType(val === "__none__" ? "" : val)
            }
          >
            <SelectTrigger className="h-9 w-full cursor-pointer bg-background">
              <SelectValue placeholder="Product Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border shadow-md">
              <SelectItem value="__none__">Select Product Type</SelectItem>
              <SelectItem value="simple">Simple Product</SelectItem>
              <SelectItem value="variant">Variable Product</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty State / Unselected Placeholder with Disabled Stock Controls */}
      {(!productType || productType === "__none__") && (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border/80 rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[140px] bg-muted/10">
            <Layers className="h-8 w-8 text-muted-foreground/60 mb-2" />
            <span className="text-xs font-semibold text-foreground block">
              No Product Type Selected
            </span>
            <span className="text-[11px] text-muted-foreground block mt-1 max-w-sm">
              Please choose <strong>Simple Product</strong> or{" "}
              <strong>Variable Product</strong> from the dropdown above to setup
              prices and inventory.
            </span>
          </div>

        </div>
      )}

      {/* Accordion Content: Simple Product */}
      {productType === "simple" && (
        <div className="space-y-5 pt-1 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Base Price (৳) *
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-muted-foreground block">
                Discounted Price (৳)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="chargeTax"
                checked={chargeTax || false}
                onChange={(e) => setChargeTax(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <label
                htmlFor="chargeTax"
                className="text-xs font-semibold text-foreground cursor-pointer"
              >
                Charge tax on this product
              </label>
            </div>

            {chargeTax && (
              <div className="space-y-2.5 max-w-xs pl-6 animate-in fade-in">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Tax Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5 or 7.5"
                  value={taxRate || ""}
                  onChange={(e) => setTaxRate(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Inventory link: an inventory product tracks stock, a custom one doesn't */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">Inventory</h4>
              </div>
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
                {[["inventory", "From inventory"], ["custom", "Custom"]].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSimpleSource(key);
                      if (key === "custom") {
                        setStockItem?.(null);
                        setExtraStock?.([]);
                      }
                    }}
                    className={`rounded-md px-3 py-1 transition-colors cursor-pointer ${
                      source === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {source === "inventory" ? (
              <div className="space-y-1.5">
                <StockItemPicker
                  className="h-9 w-full bg-background sm:w-96"
                  value={stockItem || null}
                  noneLabel="Select inventory item"
                  onChange={(id, piece) => {
                    setStockItem?.(id);
                    if (piece) onPickStockItem?.(piece);
                  }}
                />
                <StockQtyInput stockItemId={stockItem} value={stockQty} onChange={(n) => setStockQty?.(n)} />
                {(stockItem || extraStock.length > 0) && (
                  <div className="pt-1">
                    <ExtraStockRows value={extraStock} onChange={(list) => setExtraStock?.(list)} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Custom product: stock is not tracked.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Accordion Content: Variable Product */}
      {productType === "variant" && (
        <div className="space-y-5 pt-1 animate-in fade-in slide-in-from-top-1">
          {/* Top Variation Toolbar with Alignment & Apply Same Price Control */}
          <div className="bg-muted/20 dark:bg-muted/10 p-4 rounded-xl border border-border/80 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Side: Variation Type and Action Buttons */}
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-foreground block">
                  Variation Type (Attribute Group)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-48 sm:w-56">
                    <Select
                      value={selectedAttributeGroup}
                      onValueChange={(val) => setSelectedAttributeGroup(val || "")}
                    >
                      <SelectTrigger className="h-9 w-full cursor-pointer bg-background">
                        <SelectValue placeholder="Select type (e.g. Size)" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-md">
                        {attributeGroups.map((group) => (
                          <SelectItem key={group.slug} value={group.slug}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedAttributeGroup && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-9 text-xs gap-1 font-semibold"
                      onClick={() => {
                        addAllPresets();
                        if (applySamePrice && samePrice) {
                          setTimeout(() => {
                            variants.forEach((_, idx) => {
                              updateVariant(idx, "price", samePrice);
                              if (sameOfferPrice) updateVariant(idx, "offerPrice", sameOfferPrice);
                            });
                          }, 50);
                        }
                      }}
                    >
                      Add All Presets
                    </Button>
                  )}
                </div>
              </div>

              {/* Right Side: Apply Same Price Checkbox */}
              <div className="flex items-center gap-2 lg:self-end pb-1.5">
                <input
                  type="checkbox"
                  id="applySamePrice"
                  checked={applySamePrice}
                  onChange={(e) => handleApplySamePriceToggle(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
                <label
                  htmlFor="applySamePrice"
                  className="text-xs font-semibold text-foreground cursor-pointer select-none"
                >
                  Apply Same Price
                </label>
              </div>
            </div>

            {/* Same Price Inputs (Visible when checkbox is active) */}
            {applySamePrice && (
              <div className="pt-3 border-t border-border/60 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-primary" />
                      Uniform Base Price (৳) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1200"
                      value={samePrice}
                      onChange={(e) => handleGlobalPriceChange(e.target.value)}
                      className="h-9 bg-background"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-foreground">
                      Uniform Offer Price (৳)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 999"
                      value={sameOfferPrice}
                      onChange={(e) => handleGlobalOfferPriceChange(e.target.value)}
                      className="h-9 bg-background"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  All variation rows below will automatically use this uniform price.
                </p>
              </div>
            )}
          </div>

          {/* Formatted Variation Nested Cards (Distinct Background & Depth) */}
          <div className="space-y-4">
            {variants.map((v, i) => (
              <div
                key={i}
                className="relative rounded-xl border border-border/80 bg-muted/30 dark:bg-muted/15 p-4 shadow-sm space-y-3.5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                {/* Nested Card Header */}
                <div className="flex items-center justify-between border-b border-border/70 pb-2.5 -mx-4 -mt-4 px-4 pt-3 rounded-t-xl bg-muted/50 dark:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Variation #{i + 1} {v.size ? `— ${v.size}` : ""}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length <= 1}
                    title="Remove variation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Row 1: Size & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Size / Option Value *
                    </label>
                    <Input
                      placeholder="e.g. 50ml, Medium, Red"
                      value={v.size}
                      onChange={(e) => updateVariant(i, "size", e.target.value)}
                      className="h-9 bg-background"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      SKU
                    </label>
                    <Input
                      placeholder="e.g. OUD-50ML"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, "sku", e.target.value)}
                      className="h-9 bg-background"
                    />
                  </div>
                </div>

                {/* Row 2: Price & Offer Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-muted-foreground block">
                        Regular Price (৳) *
                      </label>
                      {applySamePrice && (
                        <span className="text-[10px] text-primary flex items-center gap-0.5">
                          <Lock className="h-2.5 w-2.5" /> Uniform
                        </span>
                      )}
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={applySamePrice ? samePrice : v.price}
                      onChange={(e) => updateVariant(i, "price", e.target.value)}
                      disabled={applySamePrice}
                      className={`h-9 bg-background ${
                        applySamePrice ? "opacity-75 cursor-not-allowed bg-muted/40" : ""
                      }`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Offer Price (৳)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={applySamePrice ? sameOfferPrice : v.offerPrice}
                      onChange={(e) =>
                        updateVariant(i, "offerPrice", e.target.value)
                      }
                      disabled={applySamePrice}
                      className={`h-9 bg-background ${
                        applySamePrice ? "opacity-75 cursor-not-allowed bg-muted/40" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Row 3: Inventory link — orders take this variation's pieces from the linked item */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground block">
                    Inventory item
                  </label>
                  <StockItemPicker
                    className="h-9 w-full bg-background sm:w-96"
                    value={v.stockItem || null}
                    onChange={(id) => updateVariant(i, "stockItem", id)}
                    noneLabel="Custom (stock not tracked)"
                  />
                  <StockQtyInput stockItemId={v.stockItem || null} value={v.stockQty || 1} onChange={(n) => updateVariant(i, "stockQty", n)} />
                  {(v.stockItem || (v.extraStock || []).length > 0) && (
                    <div className="pt-1">
                      <ExtraStockRows value={v.extraStock || []} onChange={(list) => updateVariant(i, "extraStock", list)} />
                    </div>
                  )}
                </div>

                {/* Row 4: Image Thumbnail (Conditional on clientConfig) */}
                {clientConfig?.features?.variantImage !== false && (
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Variation Image (Optional)
                    </label>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div
                        className={`relative w-12 h-12 border rounded-lg flex items-center justify-center overflow-hidden group bg-background ${
                          v.imageError
                            ? "border-destructive bg-destructive/10 text-destructive"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {v.imagePreview ? (
                          <>
                            <img
                              src={
                                v.imagePreview.startsWith("http") ||
                                v.imagePreview.startsWith("blob:")
                                  ? v.imagePreview
                                  : getFullPreviewUrl
                                  ? getFullPreviewUrl(v.imagePreview)
                                  : v.imagePreview
                              }
                              alt="variant"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateVariant(i, "imageUrl", "");
                                updateVariant(i, "imageFile", null);
                                updateVariant(i, "imagePreview", "");
                                updateVariant(i, "imageError", "");
                              }}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove image"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setVariantMediaPickerIndex(i)}
                            className="p-2 text-muted-foreground hover:text-primary flex items-center justify-center w-full h-full cursor-pointer"
                            title="Select from Media Library"
                          >
                            <ImageIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVariantMediaPickerIndex(i)}
                          className="h-7 text-[11px] px-2.5 font-medium gap-1 cursor-pointer"
                        >
                          <ImageIcon className="h-3 w-3" />
                          {v.imagePreview ? "Change" : "Media Library"}
                        </Button>
                        <label
                          htmlFor={`variant-image-${i}`}
                          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 h-7 text-[11px] font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer gap-1"
                        >
                          <UploadCloud className="h-3 w-3" />
                          Upload
                        </label>
                        <input
                          type="file"
                          id={`variant-image-${i}`}
                          onChange={(e) => handleVariantImageSelect(i, e)}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Bottom Action: Add New Variation */}
            <div className="pt-1 flex justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 font-semibold bg-background hover:bg-muted/50 border-dashed"
                onClick={handleAddVariantWithSamePrice}
              >
                <Plus className="h-4 w-4" /> Add New Variation
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* Media Picker Modal for Variant Image */}
      <MediaPickerModal
        open={variantMediaPickerIndex !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setVariantMediaPickerIndex(null);
        }}
        onSelect={(selectedUrl) => {
          if (variantMediaPickerIndex !== null) {
            if (onSelectVariantMedia) {
              onSelectVariantMedia(variantMediaPickerIndex, selectedUrl);
            } else {
              updateVariant(variantMediaPickerIndex, "imageUrl", selectedUrl);
              updateVariant(variantMediaPickerIndex, "imagePreview", selectedUrl);
              updateVariant(variantMediaPickerIndex, "imageFile", null);
              updateVariant(variantMediaPickerIndex, "imageError", "");
            }
            setVariantMediaPickerIndex(null);
          }
        }}
        multiple={false}
        initialSelected={
          variantMediaPickerIndex !== null
            ? variants[variantMediaPickerIndex]?.imagePreview || variants[variantMediaPickerIndex]?.imageUrl
            : ""
        }
        title="Select Variant Image"
      />
    </div>
  );
};
