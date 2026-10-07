import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { apiClient, baseURL } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCategories, useBrands } from "@/lib/category-cache";
import { getApiErrorMessage } from "@/lib/error-handler";
import { clientConfig } from "@/clientConfig";
import { RichTextEditor } from "@/components/dashboard/rich-text-editor";
import {
  ProductDetailsCard,
  ProductDataCard,
  SEOOverviewCard,
  SidebarCards,
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

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Basic details
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");

  // 2. SEO details
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // 3. Product data & type
  const [productType, setProductType] = useState("simple");
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

  useEffect(() => {
    if (!brandSlug || brands.length === 0) return;

    const currentBrandObj = brands.find(
      (b) =>
        (b.did && b.did === brandSlug) ||
        (b.slug && b.slug.toLowerCase() === brandSlug.toLowerCase()) ||
        (b._id && String(b._id) === brandSlug) ||
        (b.id && String(b.id) === brandSlug)
    );

    if (currentBrandObj) {
      const canonicalKey = currentBrandObj.did || currentBrandObj.slug;
      if (brandSlug !== canonicalKey) {
        setBrandSlug(canonicalKey);
      }

      if (currentBrandObj.parent) {
        const parentVal =
          typeof currentBrandObj.parent === "object"
            ? currentBrandObj.parent.did ||
              currentBrandObj.parent.slug ||
              currentBrandObj.parent._id
            : String(currentBrandObj.parent);

        const parentObj = brands.find(
          (b) =>
            (b.did && b.did === parentVal) ||
            (b.slug && b.slug.toLowerCase() === String(parentVal).toLowerCase()) ||
            (b._id && String(b._id) === parentVal) ||
            (b.id && String(b.id) === parentVal)
        );
        if (parentObj) {
          setParentBrandSlug(parentObj.did || parentObj.slug);
        }
      } else {
        setParentBrandSlug(currentBrandObj.did || currentBrandObj.slug);
      }
    }
  }, [brandSlug, brands]);

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

  useEffect(() => {
    if (!id || id === "new") return;

    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/api/items/${id}`);
        const product = res.data?.data || res.data;

        if (product) {
          setName(product.name || "");
          setSlug(product.slug || "");
          setSlugManual(true);
          setSku(product.sku || "");
          setDescription(product.description || "");
          setLongDescription(product.longDescription || "");
          setChargeTax(Boolean(product.chargeTax));
          setTaxRate(product.taxRate ? String(product.taxRate) : "");
          setIsActive(product.isActive !== undefined ? Boolean(product.isActive) : true);
          setProductType(product.type || "simple");
          setStockStatus(product.stockStatus || "instock");
          setStockAmount(
            product.stockAmount !== undefined && product.stockAmount !== null
              ? String(product.stockAmount)
              : product.stock !== undefined && product.stock !== null
              ? String(product.stock)
              : ""
          );
          const mainImg = product.imageUrl || product.image_url || "";
          setUploadedImageUrl(mainImg);
          setImagePreview(mainImg);
          setTags(Array.isArray(product.tags) ? product.tags : []);
          if (product.season) {
            setSeason(
              Array.isArray(product.season)
                ? product.season
                : typeof product.season === "string"
                ? product.season.split(",").map((s) => s.trim()).filter(Boolean)
                : ["All-Season"]
            );
          } else {
            setSeason(["All-Season"]);
          }

          if (product.metaData) {
            setMetaTitle(product.metaData.metaTitle || "");
            setMetaDescription(product.metaData.metaDescription || "");
          }

          if (Array.isArray(product.categories) && product.categories.length > 0) {
            setCategorySlugs(
              product.categories
                .map((c) =>
                  typeof c === "object" && c !== null ? c.slug || c.did || c._id : String(c)
                )
                .filter(Boolean)
            );
          } else if (product.category) {
            setCategorySlugs([
              typeof product.category === "object"
                ? product.category.slug || product.category.did || product.category._id
                : String(product.category),
            ]);
          }

          if (Array.isArray(product.brand) && product.brand.length > 0) {
            setBrandSlugs(
              product.brand
                .map((b) =>
                  typeof b === "object" && b !== null ? b.slug || b.did || b._id : String(b)
                )
                .filter(Boolean)
            );
          } else if (product.brand && typeof product.brand === "string") {
            setBrandSlugs([product.brand]);
          }

          if (product.type === "simple") {
            setPrice(product.price ? String(product.price) : "");
            setOfferPrice(product.offerPrice ? String(product.offerPrice) : "");
          }

          if (product.type === "variant" && Array.isArray(product.variants)) {
            setVariants(
              product.variants.map((v) => ({
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

          if (Array.isArray(product.images)) {
            setGalleryImages(
              product.images.map((img, index) => ({
                id: `loaded-${index}-${Date.now()}`,
                file: null,
                preview: img.url || img,
                altText: img.altText || "",
                isLoaded: true,
              }))
            );
          }
        }
      } catch (err) {
        toast.error("Failed to load product details.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleNameChange = useCallback(
    (value) => {
      setName(value);
      if (!slugManual) {
        setSlug(slugify(value));
      }
    },
    [slugManual]
  );

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

    setIsUpdating(true);
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
        } else if (item.isLoaded || item.preview || item.url) {
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

      await apiClient.put(`/api/items/${id}`, body);
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["items"] });
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/dashboard/items");
      }
    } catch (err) {
      if (uploadToastId) {
        toast.dismiss(uploadToastId);
      }
      toast.error(getApiErrorMessage(err, "Failed to update product."));
    } finally {
      setIsUpdating(false);
    }
  };

  const getFullPreviewUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 min-h-[300px]">
        <div className="text-sm font-semibold text-muted-foreground animate-pulse">
          Loading product details...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              type="button"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard/items")}
              className="h-9 w-9 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer"
              title="Back to products"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Edit Product
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/dashboard/items")}
              className="text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              Discard
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsActive(false);
                toast.success("Draft status set (Inactive). Click Update to save.");
              }}
              className="text-xs font-semibold"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || isUploading}
              className="text-xs font-semibold"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left Column: Form Details */}
          <div className="space-y-6">
            <ItemDetailsCard
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

export default EditProductPage;
