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
import { Plus, UploadCloud, X, Layers, Lock, Package, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

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
  stockStatus = "instock",
  setStockStatus,
  stockAmount = "",
  setStockAmount,
  variants,
  attributeGroups,
  selectedAttributeGroup,
  setSelectedAttributeGroup,
  addAllPresets,
  addVariant,
  removeVariant,
  updateVariant,
  handleVariantImageSelect,
  getFullPreviewUrl,
  clientConfig,
}) => {
  const [applySamePrice, setApplySamePrice] = useState(false);
  const [samePrice, setSamePrice] = useState("");
  const [sameOfferPrice, setSameOfferPrice] = useState("");

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

          {/* Disabled Stock Controls */}
          <div className="pt-4 border-t border-border/60 opacity-40 pointer-events-none select-none space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-xs font-bold text-muted-foreground">Inventory & Stock (Disabled)</h4>
              </div>
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Disabled
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Stock Status
                </label>
                <Input
                  disabled
                  placeholder="Select Product Type to enable stock"
                  className="h-9 bg-muted/30 cursor-not-allowed"
                />
              </div>
            </div>
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

          {/* Inventory & Stock Section for Simple Product */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">Inventory & Stock</h4>
              </div>
              <Badge
                variant="outline"
                className={
                  stockStatus === "instock"
                    ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]"
                    : "text-destructive border-destructive/30 bg-destructive/10 text-[10px]"
                }
              >
                {stockStatus === "instock" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> In Stock
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-destructive" /> Out of Stock
                  </span>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Stock Status *
                </label>
                <Select
                  value={stockStatus || "instock"}
                  onValueChange={(val) => setStockStatus?.(val || "instock")}
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer bg-background">
                    <SelectValue placeholder="Select Stock Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    <SelectItem value="instock">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        In Stock
                      </span>
                    </SelectItem>
                    <SelectItem value="outofstock">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                        Out of Stock
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  {stockStatus === "instock"
                    ? "Product is active and available for purchase."
                    : "Product will be marked as Sold Out / Out of Stock."}
                </p>
              </div>

              {stockStatus === "instock" ? (
                <div className="space-y-2 animate-in fade-in">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1 block">
                    <span>Stock Quantity</span>
                    <span className="text-destructive font-bold">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 50"
                    value={stockAmount}
                    onChange={(e) => setStockAmount?.(e.target.value)}
                    className="h-9 bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Mandatory: Enter the number of available items in stock.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex items-center gap-2.5 text-destructive text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] leading-tight">
                    Stock quantity is not required for Out of Stock simple products.
                  </span>
                </div>
              )}
            </div>
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
                    <Badge
                      variant="outline"
                      className={
                        (v.stockStatus || "instock") === "instock"
                          ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px] py-0 px-1.5 font-medium"
                          : "text-red-600 border-red-500/30 bg-red-500/10 text-[10px] py-0 px-1.5 font-medium"
                      }
                    >
                      {(v.stockStatus || "instock") === "instock" ? "In Stock" : "Out of Stock"}
                    </Badge>
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

                {/* Row 3: Stock Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Stock Status *
                    </label>
                    <Select
                      value={v.stockStatus || "instock"}
                      onValueChange={(val) =>
                        updateVariant(i, "stockStatus", val || "instock")
                      }
                    >
                      <SelectTrigger className="h-9 bg-background">
                        <SelectValue placeholder="Stock Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-md">
                        <SelectItem value="instock" className="cursor-pointer">
                          <span className="flex items-center gap-1.5 font-medium text-emerald-600">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                            In Stock
                          </span>
                        </SelectItem>
                        <SelectItem value="outofstock" className="cursor-pointer">
                          <span className="flex items-center gap-1.5 font-medium text-red-600">
                            <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                            Out of Stock
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4: Image Thumbnail (Conditional on clientConfig) */}
                {clientConfig?.features?.variantImage !== false && (
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <label className="text-[11px] font-semibold text-muted-foreground block">
                      Variation Image (Optional, Max 2MB)
                    </label>
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative w-12 h-12 border rounded-lg flex items-center justify-center cursor-pointer overflow-hidden group bg-background ${
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
                                  : getFullPreviewUrl(v.imagePreview)
                              }
                              alt="variant"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                updateVariant(i, "imageFile", null);
                                updateVariant(i, "imagePreview", "");
                                updateVariant(i, "imageError", "");
                              }}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <label
                            htmlFor={`variant-image-${i}`}
                            className="cursor-pointer p-2 text-muted-foreground hover:text-primary flex items-center justify-center w-full h-full"
                          >
                            <UploadCloud className="w-5 h-5" />
                          </label>
                        )}
                        <input
                          type="file"
                          id={`variant-image-${i}`}
                          onChange={(e) => handleVariantImageSelect(i, e)}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {v.imagePreview
                          ? "Image uploaded"
                          : "Click icon to upload variant image"}
                      </span>
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

          {/* Inventory & Stock Section for Variable Product */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">Inventory & Stock</h4>
              </div>
              <Badge
                variant="outline"
                className={
                  stockStatus === "instock"
                    ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10 text-[10px]"
                    : "text-destructive border-destructive/30 bg-destructive/10 text-[10px]"
                }
              >
                {stockStatus === "instock" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> In Stock
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-destructive" /> Out of Stock
                  </span>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Stock Status *
                </label>
                <Select
                  value={stockStatus || "instock"}
                  onValueChange={(val) => setStockStatus?.(val || "instock")}
                >
                  <SelectTrigger className="h-9 w-full cursor-pointer bg-background">
                    <SelectValue placeholder="Select Stock Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md">
                    <SelectItem value="instock">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        In Stock
                      </span>
                    </SelectItem>
                    <SelectItem value="outofstock">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                        Out of Stock
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                  Controls overall storefront availability for this variable product.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
