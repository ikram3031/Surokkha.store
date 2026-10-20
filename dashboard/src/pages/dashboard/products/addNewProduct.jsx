import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, X } from "lucide-react";
import { apiClient, baseURL } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCategories, useBrands } from "@/lib/category-cache";
import { getApiErrorMessage } from "@/lib/error-handler";
import { clientConfig } from "@/clientConfig";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import { useDashboardStore } from "@/store/use-dashboard-store";
import {
  ProductDetailsCard,
  ProductDataCard,
  SEOOverviewCard,
  SidebarCards,
  BanglaContentCard,
  bnFormFromProduct,
  bnPayloadFromForm,
} from "@/components/dashboard/products";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB limit

const emptyVariant = () => ({
  size: "",
  price: "",
  offerPrice: "",
  sku: "",
  imageUrl: "",
  imageFile: null,
  imagePreview: "",
  imageError: "",
  stockStatus: "instock",
});

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const API_BASE = (baseURL || "").replace(/\/$/, "");

const AddNewProduct = () => {
  const navigate = useNavigate();
  const { category: paramCategory } = useParams();
  const [searchParams] = useSearchParams();
  const queryCategory = searchParams.get("category");
  const [isCreating, setIsCreating] = useState(false);

  // Draft source info (duplicate banner)
  const [draftSourceName, setDraftSourceName] = useState("");

  const { duplicateDraft, clearDuplicateDraft } = useDashboardStore();

  // 1. Basic details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [bnContent, setBnContent] = useState(() => bnFormFromProduct({}));

  // 2. SEO details
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // 3. Product data & type
  const [productType, setProductType] = useState("");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [chargeTax, setChargeTax] = useState(false);
  const [taxRate, setTaxRate] = useState("");
  const [stockStatus, setStockStatus] = useState("instock");
  const [stockAmount, setStockAmount] = useState("");

  // 4. Variant product fields
  const [variants, setVariants] = useState([emptyVariant()]);
  const [attributeGroups, setAttributeGroups] = useState([]);
  const [selectedAttributeGroup, setSelectedAttributeGroup] = useState("");

  // 5. Sidebar & Organization (isActive boolean & Tags)
  const [isActive, setIsActive] = useState(true);
  const [tags, setTags] = useState([]);
  const [categorySlugs, setCategorySlugs] = useState([]);
  const [brandSlugs, setBrandSlugs] = useState([]);
  const [parentBrandSlug, setParentBrandSlug] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [season, setSeason] = useState(["All-Season"]);

  // 6. Media / Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImageError, setMainImageError] = useState("");
  const fileInputRef = useRef(null);

  const [galleryImages, setGalleryImages] = useState([]);
  const galleryInputRef = useRef(null);

  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const parentBrands = brands.filter((b) => !b.parent);
  const selectedParentObj = parentBrands.find(
    (pb) =>
      (pb.did && pb.did === parentBrandSlug) ||
      (pb.slug && pb.slug.toLowerCase() === parentBrandSlug?.toLowerCase()) ||
      (pb._id && String(pb._id) === parentBrandSlug)
  );

  const childBrands = selectedParentObj
    ? brands.filter((b) => {
        if (!b.parent) return false;
        const parentVal =
          typeof b.parent === "object"
            ? b.parent?.did || b.parent?.slug || b.parent?._id
            : String(b.parent);
        return (
          parentVal === selectedParentObj.did ||
          parentVal === selectedParentObj.slug ||
          parentVal === selectedParentObj._id ||
          (selectedParentObj.id && parentVal === String(selectedParentObj.id))
        );
      })
    : [];

  // Draft pre-fill: mount-এ একবার চেক করে সব field set করা হয়
  useEffect(() => {
    if (!duplicateDraft) return;

    const p = duplicateDraft;
    if (p.name) {
      setName(p.name);
      setDraftSourceName(p.name);
    }
    if (p.slug) setSlug(p.slug);
    if (p.sku) setSku(p.sku);
    if (p.description) setDescription(p.description);
    if (p.longDescription) setLongDescription(p.longDescription);
    if (p.bn) setBnContent(bnFormFromProduct(p.bn));
    if (p.type) setProductType(p.type);
    if (p.season) {
      setSeason(
        Array.isArray(p.season)
          ? p.season
          : typeof p.season === "string"
          ? p.season.split(",").map((s) => s.trim()).filter(Boolean)
          : ["All-Season"]
      );
    }
    if (typeof p.isActive === "boolean") setIsActive(p.isActive);
    if (p.stockStatus) setStockStatus(p.stockStatus);
    if (p.stockAmount !== undefined) setStockAmount(String(p.stockAmount));

    // Tags
    if (Array.isArray(p.tags) && p.tags.length > 0) {
      setTags(p.tags);
    }

    // Main Image
    const mainImg = p.imageUrl || p.thumbnailUrl;
    if (mainImg) {
      setImagePreview(mainImg);
      setUploadedImageUrl(mainImg);
    }

    // Gallery images
    if (Array.isArray(p.images) && p.images.length > 0) {
      setGalleryImages(
        p.images.map((img, index) => ({
          id: `dup-${index}-${Date.now()}`,
          file: null,
          preview: typeof img === "string" ? img : img?.url || img?.imageUrl || "",
          altText: "",
          isLoaded: true,
        }))
      );
    }

    // Categories (all)
    if (Array.isArray(p.categories) && p.categories.length > 0) {
      setCategorySlugs(
        p.categories
          .map((c) =>
            typeof c === "object" && c !== null ? c.slug || c.did || c._id : String(c)
          )
          .filter(Boolean)
      );
    } else if (p.category) {
      setCategorySlugs([
        typeof p.category === "object"
          ? p.category.slug || p.category.did || p.category._id
          : String(p.category),
      ]);
    }

    // Brands (all)
    if (Array.isArray(p.brand) && p.brand.length > 0) {
      setBrandSlugs(
        p.brand
          .map((b) =>
            typeof b === "object" && b !== null ? b.slug || b.did || b._id : String(b)
          )
          .filter(Boolean)
      );
    } else if (p.brand && typeof p.brand === "string") {
      setBrandSlugs([p.brand]);
    }

    // Simple product fields
    if (p.type === "simple") {
      setPrice(p.price ? String(p.price) : "");
      setOfferPrice(p.offerPrice ? String(p.offerPrice) : "");
    }

    // Variant fields
    if (p.type === "variant" && Array.isArray(p.variants) && p.variants.length > 0) {
      setVariants(
        p.variants.map((v) => ({
          size: v.size || "",
          price: v.price ? String(v.price) : "",
          offerPrice: v.offerPrice ? String(v.offerPrice) : "",
          sku: v.sku || "",
          imageUrl: v.imageUrl || "",
          imagePreview: v.imageUrl || "",
          imageFile: null,
          imageError: "",
          stockStatus: v.stockStatus || "instock",
        }))
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const rawCategory = paramCategory || queryCategory;
    if (!rawCategory || categories.length === 0) return;

    const cleanCategory = decodeURIComponent(rawCategory)
      .replace(/^\/+|\/+$/g, "")
      .trim()
      .toLowerCase();

    if (!cleanCategory) return;

    const matchedCat = categories.find(
      (c) =>
        c.slug?.toLowerCase() === cleanCategory ||
        c.name?.toLowerCase() === cleanCategory ||
        c.slug?.toLowerCase().includes(cleanCategory) ||
        c.name?.toLowerCase().includes(cleanCategory) ||
        c.did?.toLowerCase() === cleanCategory ||
        String(c._id).toLowerCase() === cleanCategory
    );

    if (matchedCat) {
      const catVal = matchedCat.did || matchedCat.slug || String(matchedCat._id);
      setCategorySlugs((prev) => (prev.includes(catVal) ? prev : [...prev, catVal]));
    }
  }, [paramCategory, queryCategory, categories]);

  useEffect(() => {
    const hasAttribute =
      clientConfig?.features?.attribute !== false &&
      clientConfig?.features?.attributes !== false;
    if (!hasAttribute) return;

    const fetchAttributes = async () => {
      try {
        const res = await apiClient.get("/api/v1/dashboard/attributes");
        const rawGroups = res.data?.data || [];
        const sortedGroups = rawGroups.map((g) => ({
          ...g,
          values: Array.isArray(g.values)
            ? [...g.values].sort((a, b) => {
                const nameA = String(a.name || a.size || a || "");
                const nameB = String(b.name || b.size || b || "");
                return nameA.localeCompare(nameB, undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              })
            : [],
        }));
        setAttributeGroups(sortedGroups);
      } catch (err) {
        console.error("Failed to fetch attributes", err);
      }
    };
    fetchAttributes();
  }, []);

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual]
  );

  // Variant operations
  const addVariant = () => {
    setVariants((prev) => [...prev, emptyVariant()]);
  };

  const addAllPresets = () => {
    const activeGroup = attributeGroups.find(
      (g) => g.slug === selectedAttributeGroup
    );
    if (!activeGroup) {
      toast.error("Please select a Variation Type first.");
      return;
    }

    const newVariants = activeGroup.values.map((val) => ({
      size: val.name,
      price: "",
      offerPrice: "",
      sku: "",
      imageUrl: "",
      imageFile: null,
      imagePreview: "",
    }));

    setVariants(newVariants);
    toast.success(
      `Loaded all ${newVariants.length} presets from "${activeGroup.name}".`
    );
  };

  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Image operations
  const handleImageSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      setMainImageError(
        "Maximum size exceeded. Please upload an image under 10MB."
      );
      setImagePreview("");
      setMainImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setMainImageError("");
    setImagePreview(URL.createObjectURL(file));
    setMainImageFile(file);
  };

  const removeUploadedImage = () => {
    setImagePreview("");
    setUploadedImageUrl("");
    setMainImageFile(null);
    setMainImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectExistingFeaturedImage = (url) => {
    if (!url) return;
    setUploadedImageUrl(url);
    setImagePreview(url);
    setMainImageFile(null);
    setMainImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectExistingGalleryImages = (urls) => {
    const urlList = Array.isArray(urls) ? urls : [urls];
    if (urlList.length === 0) return;

    const remainingSlots = Math.max(0, 5 - galleryImages.length);
    const toAdd = urlList.slice(0, remainingSlots);

    if (urlList.length > remainingSlots) {
      toast.error(`Maximum 5 gallery images allowed. Only ${remainingSlots} were added.`);
    }

    const newImages = toAdd.map((url, idx) => ({
      id: `media-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
      file: null,
      preview: url,
      url,
      altText: "",
      isLoaded: true,
    }));

    setGalleryImages((prev) => [...prev, ...newImages]);
  };

  const handleSelectExistingVariantImage = (index, url) => {
    updateVariant(index, "imageUrl", url || "");
    updateVariant(index, "imagePreview", url || "");
    updateVariant(index, "imageFile", null);
    updateVariant(index, "imageError", "");
  };

  const handleGalleryImageSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const oversizedFiles = fileList.filter((file) => file.size > MAX_IMAGE_SIZE);

    if (oversizedFiles.length > 0) {
      toast.error(
        oversizedFiles.length === 1
          ? `"${oversizedFiles[0].name}" exceeds 10MB limit. Please upload images under 10MB.`
          : `${oversizedFiles.length} images exceed the 10MB limit and were skipped.`
      );
    }

    const validFiles = fileList.filter((file) => file.size <= MAX_IMAGE_SIZE);
    if (validFiles.length === 0) {
      if (galleryInputRef.current) galleryInputRef.current.value = "";
      return;
    }

    if (galleryImages.length + validFiles.length > 5) {
      toast.error("Maximum 5 gallery images allowed.");
    }

    const remainingSlots = Math.max(0, 5 - galleryImages.length);
    const filesToAdd = validFiles.slice(0, remainingSlots);

    const newImages = filesToAdd.map((file) => ({
      id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      altText: "",
    }));

    setGalleryImages((prev) => [...prev, ...newImages]);
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const removeGalleryImage = (id) => {
    setGalleryImages((prev) => prev.filter((img) => img.id !== id));
  };

  const updateGalleryAltText = (id, altText) => {
    setGalleryImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, altText } : img))
    );
  };

  const handleVariantImageSelect = (index, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_IMAGE_SIZE) {
      updateVariant(
        index,
        "imageError",
        "Maximum size exceeded. Image must be under 10MB."
      );
      updateVariant(index, "imageFile", null);
      updateVariant(index, "imagePreview", "");
      e.target.value = "";
      return;
    }

    updateVariant(index, "imageError", "");
    updateVariant(index, "imageFile", file);
    updateVariant(index, "imagePreview", URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Product slug is required.");
      return;
    }
    if (!description.trim()) {
      toast.error("Product description is required.");
      return;
    }

    if (!productType) {
      toast.error("Please select a Product Type (Simple or Variable).");
      return;
    }

    if (productType === "simple") {
      if (!price || Number(price) <= 0) {
        toast.error("Base price must be greater than 0.");
        return;
      }
      if (stockStatus === "instock") {
        if (
          stockAmount === "" ||
          stockAmount === null ||
          stockAmount === undefined ||
          isNaN(Number(stockAmount)) ||
          Number(stockAmount) <= 0
        ) {
          toast.error("Stock quantity is mandatory for in-stock simple product (must be at least 1).");
          return;
        }
      }
    } else {
      const validVariants = variants.filter((v) => v.size.trim() && v.price);
      if (validVariants.length === 0) {
        toast.error("At least one variant with size and price is required.");
        return;
      }
    }

    if (!mainImageFile && !uploadedImageUrl) {
      toast.error(
        "Product featured image is required. Please upload an image."
      );
      return;
    }

    setIsCreating(true);
    let uploadToastId = null;
    try {
      const hasFilesToUpload = Boolean(
        mainImageFile ||
        variants.some((v) => v.imageFile) ||
        galleryImages.some((img) => img.file)
      );

      if (hasFilesToUpload) {
        uploadToastId = toast.loading("Uploading product images...");
      }

      let finalMainImageUrl = uploadedImageUrl || "";
      let finalThumbnailUrl = "";
      if (mainImageFile) {
        const formData = new FormData();
        formData.append("image", mainImageFile);
        formData.append("type", "product");
        formData.append("productSlug", slug.trim());
        const uploadRes = await apiClient.post(`/api/v1/images/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalMainImageUrl =
          uploadRes.data?.data?.imageUrl || uploadRes.data?.imageUrl || "";
        finalThumbnailUrl =
          uploadRes.data?.data?.thumbnailUrl ||
          uploadRes.data?.thumbnailUrl ||
          "";
      }

      const uploadedVariants = [];
      const validVariants = variants.filter((v) => v.size.trim() && v.price);

      for (let i = 0; i < validVariants.length; i++) {
        const v = validVariants[i];
        let varImageUrl = v.imageUrl || "";

        if (v.imageFile) {
          const formData = new FormData();
          formData.append("image", v.imageFile);
          formData.append("type", "product");
          formData.append("productSlug", slug.trim());
          if (v.size.trim()) {
            formData.append("variantName", v.size.trim());
          }
          const uploadRes = await apiClient.post(
            `/api/v1/images/upload`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          varImageUrl = uploadRes.data?.data?.imageUrl || "";
        }

        uploadedVariants.push({
          size: v.size.trim(),
          price: parseFloat(v.price),
          offerPrice: v.offerPrice ? parseFloat(v.offerPrice) : null,
          sku: v.sku.trim(),
          sortOrder: i,
          imageUrl: varImageUrl || null,
          stockStatus: v.stockStatus || "instock",
        });
      }

      const uploadedGalleryImages = [];
      for (let i = 0; i < galleryImages.length; i++) {
        const item = galleryImages[i];
        if (item.file) {
          const formData = new FormData();
          formData.append("image", item.file);
          formData.append("type", "product");
          formData.append("productSlug", slug.trim());
          const uploadRes = await apiClient.post(`/api/v1/images/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const uploadedUrl =
            uploadRes.data?.data?.imageUrl || uploadRes.data?.imageUrl || "";
          if (uploadedUrl) {
            uploadedGalleryImages.push(uploadedUrl);
          }
        } else if (item.url || item.preview) {
          const existingUrl = item.url || item.preview;
          if (typeof existingUrl === "string" && existingUrl.trim()) {
            uploadedGalleryImages.push(existingUrl.trim());
          }
        }
      }

      if (uploadToastId) {
        toast.dismiss(uploadToastId);
        uploadToastId = null;
      }

      const body = {
        name: name.trim(),
        slug: slug.trim(),
        sku: sku.trim(),
        description: description.trim(),
        longDescription: longDescription.trim(),
        bn: bnPayloadFromForm(bnContent),
        type: productType,
        imageUrl: finalMainImageUrl || "",
        thumbnailUrl: finalThumbnailUrl || finalMainImageUrl || "",
        season,
        chargeTax,
        taxRate: chargeTax && taxRate ? parseFloat(taxRate) : null,
        isActive: Boolean(isActive),
        stockStatus: stockStatus || "instock",
        stockAmount:
          productType === "simple" && stockStatus === "instock"
            ? Math.max(0, parseInt(stockAmount, 10))
            : 0,
        tags: Array.isArray(tags) ? tags : [],
        images: uploadedGalleryImages,
        metaData: {
          metaTitle: metaTitle.trim(),
          metaDescription: metaDescription.trim(),
        },
      };

      if (categorySlugs.length > 0) {
        body.categories = categorySlugs;
        body.category = categorySlugs[0];
      } else {
        body.categories = [];
      }

      if (brandSlugs.length > 0) {
        body.brand = brandSlugs;
        body.brands = brandSlugs;
      } else {
        body.brand = [];
      }

      if (productType === "simple") {
        body.price = parseFloat(price);
        body.offerPrice = offerPrice ? parseFloat(offerPrice) : null;
      } else {
        body.variants = uploadedVariants;
      }

      await apiClient.post("/api/v1/products", body);
      toast.success("Product published successfully!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      clearDuplicateDraft();
      navigate("/dashboard/products");
    } catch (err) {
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }
      toast.error(getApiErrorMessage(err, "Failed to create product."));
    } finally {
      setIsCreating(false);
    }
  };

  const getFullPreviewUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/products"
              className="p-2 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
              title="Back to products"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {draftSourceName ? 'Duplicate Product' : 'Add New Product'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                clearDuplicateDraft();
                navigate("/dashboard/products");
              }}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              Discard
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsActive(false);
                toast.success("Draft status set (Inactive). Click Publish to save.");
              }}
              className="text-xs font-semibold"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUploading}
              className="text-xs font-semibold"
            >
              {isCreating ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        {/* Content Layout Grid */}
        {draftSourceName && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-2.5 text-sm">
            <span className="text-amber-700 dark:text-amber-400">
              <span className="font-semibold">Duplicated from:</span>{' '}
              <span className="opacity-80">&ldquo;{draftSourceName}&rdquo;</span>
              {' '}— Review and update before publishing.
            </span>
            <button
              type="button"
              onClick={clearDuplicateDraft}
              className="text-amber-600 hover:text-amber-800 dark:hover:text-amber-300 transition-colors flex-shrink-0"
              title="Clear draft"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left Column: Form Details */}
          <div className="space-y-6">
            <ProductDetailsCard
              name={name}
              handleNameChange={handleNameChange}
              slug={slug}
              setSlug={setSlug}
              slugManual={slugManual}
              setSlugManual={setSlugManual}
              sku={sku}
              setSku={setSku}
              description={description}
              setDescription={setDescription}
            />

            <ProductDataCard
              productType={productType}
              setProductType={setProductType}
              price={price}
              setPrice={setPrice}
              offerPrice={offerPrice}
              setOfferPrice={setOfferPrice}
              chargeTax={chargeTax}
              setChargeTax={setChargeTax}
              taxRate={taxRate}
              setTaxRate={setTaxRate}
              stockStatus={stockStatus}
              setStockStatus={setStockStatus}
              stockAmount={stockAmount}
              setStockAmount={setStockAmount}
              variants={variants}
              attributeGroups={attributeGroups}
              selectedAttributeGroup={selectedAttributeGroup}
              setSelectedAttributeGroup={setSelectedAttributeGroup}
              addAllPresets={addAllPresets}
              addVariant={addVariant}
              removeVariant={removeVariant}
              updateVariant={updateVariant}
              handleVariantImageSelect={handleVariantImageSelect}
              onSelectVariantMedia={handleSelectExistingVariantImage}
              getFullPreviewUrl={getFullPreviewUrl}
              clientConfig={clientConfig}
            />

            {/* Long Description Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground block">
                  Long Description (Optional)
                </label>
                <RichTextEditor
                  placeholder="Write a detailed long description for this product..."
                  value={longDescription}
                  onChange={(val) => setLongDescription(val)}
                />
              </div>
            </div>

            <BanglaContentCard bn={bnContent} setBn={setBnContent} />
          </div>

          {/* Right Column: Sidebar Cards & SEO */}
          <div className="space-y-6">
            <SidebarCards
              isActive={isActive}
              setIsActive={setIsActive}
              imagePreview={imagePreview}
              mainImageError={mainImageError}
              fileInputRef={fileInputRef}
              handleImageSelect={handleImageSelect}
              removeUploadedImage={removeUploadedImage}
              onSelectFeaturedMedia={handleSelectExistingFeaturedImage}
              galleryImages={galleryImages}
              galleryInputRef={galleryInputRef}
              handleGalleryImageSelect={handleGalleryImageSelect}
              removeGalleryImage={removeGalleryImage}
              onSelectGalleryMedia={handleSelectExistingGalleryImages}
              categorySlugs={categorySlugs}
              setCategorySlugs={setCategorySlugs}
              categories={categories}
              brandSlugs={brandSlugs}
              setBrandSlugs={setBrandSlugs}
              parentBrands={parentBrands}
              childBrands={childBrands}
              brands={brands}
              season={season}
              setSeason={setSeason}
              tags={tags}
              setTags={setTags}
              clientConfig={clientConfig}
              getFullPreviewUrl={getFullPreviewUrl}
            />

            <SEOOverviewCard
              metaTitle={metaTitle}
              setMetaTitle={setMetaTitle}
              metaDescription={metaDescription}
              setMetaDescription={setMetaDescription}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddNewProduct;
