import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Image as ImageIcon,
  UploadCloud,
  Check,
  RefreshCw,
  FileText,
  Copy,
  Calendar,
  HardDrive,
  Loader2,
  X,
  Maximize2,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { apiClient, resolveImageUrl } from "@/lib/api-client";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-handler";
import { formatDate } from "@/utils/dateHelper";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const PAGE_SIZE = 30;
// Longest side below this looks blurry on product pages and in the Meta catalog
const LOW_RES_PX = 600;

const DEFAULT_INITIAL_SELECTED = [];

const IMAGE_EXT = /\.(jpeg|jpg|png|webp|gif|svg|avif)$/i;

const urlOf = (item) => (typeof item === "string" ? item : item?.url);

// Stored urls may be absolute or relative, so match on either ending
const sameUrl = (a, b) => !!a && !!b && (a === b || a.endsWith(b) || b.endsWith(a));

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Reusable modal for choosing existing product images or uploading new ones
export const MediaPickerModal = ({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  maxSelect = 5,
  initialSelected = DEFAULT_INITIAL_SELECTED,
  title,
  productSlug,
}) => {
  const [mediaList, setMediaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  const [selectedItems, setSelectedItems] = useState([]);
  const [currentUrls, setCurrentUrls] = useState([]);
  const [focusedItem, setFocusedItem] = useState(null);
  // Natural size of the previewed image, tagged with its url so a stale size is never shown
  const [dimensions, setDimensions] = useState(null);

  const [uploadProgress, setUploadProgress] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const uploadInputRef = useRef(null);
  const prevOpenRef = useRef(false);
  const requestRef = useRef(0);
  const dragDepth = useRef(0);

  const isUploading = uploadProgress !== null;

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const initial = (Array.isArray(initialSelected) ? initialSelected : [initialSelected])
        .filter((item) => (typeof item === "string" ? item.trim() : item))
        .map((item) => (typeof item === "string" ? { url: item, filename: item.split("/").pop() } : item));
      setSelectedItems(initial);
      setCurrentUrls(initial.map(urlOf));
      setFocusedItem(null);
      setSearchQuery("");
      setActiveSearch("");
    }
    prevOpenRef.current = open;
  }, [open]);

  const fetchMedia = useCallback(async (nextPage = 1, search = "") => {
    const requestId = ++requestRef.current;
    const append = nextPage > 1;
    append ? setIsLoadingMore(true) : setIsLoading(true);
    try {
      const res = await apiClient.get("/api/v1/images", {
        params: { page: nextPage, limit: PAGE_SIZE, search },
      });
      // A newer search or refresh started while this one was in flight
      if (requestId !== requestRef.current) return;
      const data = res.data?.data || [];
      const meta = res.data?.meta || {};
      setMediaList((prev) => (append ? [...prev, ...data] : data));
      setPage(nextPage);
      setTotalPages(meta.totalPages || 1);
      setTotalFiles(meta.total || data.length);
    } catch (err) {
      if (!apiClient.isCancel?.(err)) {
        toast.error(getApiErrorMessage(err, "Failed to load media assets"));
      }
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Search as you type, after a short pause
  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(searchQuery.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (open) fetchMedia(1, activeSearch);
  }, [open, activeSearch, fetchMedia]);

  const isItemSelected = (item) => selectedItems.some((sel) => sameUrl(urlOf(sel), item?.url));

  const getSelectionIndex = (item) => {
    const idx = selectedItems.findIndex((sel) => sameUrl(urlOf(sel), item?.url));
    return idx >= 0 ? idx + 1 : null;
  };

  const isCurrent = (item) => currentUrls.some((url) => sameUrl(url, item?.url));

  const handleItemClick = (item) => {
    setFocusedItem(item);
    if (!multiple) {
      setSelectedItems([item]);
    } else if (isItemSelected(item)) {
      setSelectedItems((prev) => prev.filter((sel) => !sameUrl(urlOf(sel), item.url)));
    } else {
      if (selectedItems.length >= maxSelect) {
        toast.error(`You can select at most ${maxSelect} images.`);
        return;
      }
      setSelectedItems((prev) => [...prev, item]);
    }
  };

  const handleItemDoubleClick = (item) => {
    if (!multiple) {
      onSelect?.(item.url || item);
      onOpenChange?.(false);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length === 0) return;
    if (!multiple) {
      onSelect?.(urlOf(selectedItems[0]));
    } else {
      onSelect?.(selectedItems.map(urlOf));
    }
    onOpenChange?.(false);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0 || isUploading) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const validFiles = fileList.filter((f) => f.size <= MAX_IMAGE_SIZE);
    if (validFiles.length < fileList.length) {
      toast.error("Some files exceed the 10MB limit and were skipped.");
    }
    if (validFiles.length === 0) return;

    const uploaded = [];
    try {
      for (const [i, file] of validFiles.entries()) {
        setUploadProgress({ done: i, total: validFiles.length });
        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", "product");
        // Name the file after the product so it can be found by product name later
        if (productSlug?.trim()) formData.append("productSlug", productSlug.trim());

        const res = await apiClient.post("/api/v1/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const url = res.data?.data?.imageUrl || res.data?.imageUrl;
        if (url) {
          uploaded.push({
            url,
            filename: url.split("/").pop(),
            size: file.size,
            createdAt: new Date().toISOString(),
          });
        }
      }
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to upload image(s)"));
    } finally {
      setUploadProgress(null);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }

    if (uploaded.length > 0) {
      setSearchQuery("");
      setActiveSearch("");
      await fetchMedia(1, "");
      setSelectedItems((prev) => (multiple ? [...prev, ...uploaded].slice(0, maxSelect) : [uploaded[0]]));
      setFocusedItem(uploaded[0]);
    }
  };

  // Drop files anywhere on the library; the depth counter ignores enter/leave from child elements
  const handleDragEnter = (e) => {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    handleFileUpload(e.dataTransfer?.files);
  };

  const previewItem = focusedItem || selectedItems[selectedItems.length - 1] || null;
  const previewUrl = previewItem ? resolveImageUrl(urlOf(previewItem)) : "";
  const previewSize = dimensions?.url === previewUrl ? dimensions : null;
  const isLowRes = previewSize && Math.max(previewSize.w, previewSize.h) < LOW_RES_PX;

  const firstSelected = selectedItems[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl md:max-w-6xl p-0 h-[90vh] max-h-[860px] flex flex-col overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="px-5 pt-4 pb-3 pr-14 shrink-0 space-y-0">
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="h-4.5 w-4.5 text-primary" />
            {title || (multiple ? "Select Product Images" : "Select Product Image")}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {multiple
              ? `Pick up to ${maxSelect} images, or upload new ones. Click to select, click again to remove.`
              : "Pick an image from the library, or upload a new one. Double-click to select and close."}
          </p>
        </DialogHeader>

        <div className="px-5 pb-3 border-b shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder={`Search ${totalFiles || ""} images by filename or product slug...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            onClick={() => fetchMedia(1, activeSearch)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={isUploading}
            onClick={() => uploadInputRef.current?.click()}
            className="h-9 px-3.5 text-xs font-semibold cursor-pointer"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            {isUploading ? `Uploading ${uploadProgress.done + 1}/${uploadProgress.total}` : "Upload"}
          </Button>
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
        </div>

        <div className="flex-1 flex min-h-0">
          <div
            className="relative flex-1 min-w-0 overflow-y-auto p-4 sm:p-5"
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {dragActive && (
              <div className="sticky top-0 z-10 h-0">
                <div className="absolute inset-x-0 top-0 h-[60vh] max-h-[640px] rounded-2xl border-2 border-dashed border-primary bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center text-center pointer-events-none">
                  <UploadCloud className="h-10 w-10 text-primary mb-2" />
                  <p className="text-sm font-bold text-foreground">Drop images to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP, GIF or AVIF, up to 10MB each</p>
                </div>
              </div>
            )}

            {isLoading && mediaList.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/50 overflow-hidden">
                    <div className="aspect-square bg-muted/40 animate-pulse" />
                    <div className="h-8 border-t border-border/50" />
                  </div>
                ))}
              </div>
            ) : mediaList.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-2xl">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-bold text-foreground">
                  {activeSearch ? `No images match "${activeSearch}"` : "No images yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {activeSearch
                    ? "Try another keyword, or upload a new image."
                    : "Drag images here, or use the Upload button."}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {activeSearch && (
                    <Button type="button" variant="outline" size="lg" onClick={() => setSearchQuery("")} className="cursor-pointer">
                      Clear search
                    </Button>
                  )}
                  <Button type="button" size="lg" onClick={() => uploadInputRef.current?.click()} className="cursor-pointer">
                    <UploadCloud />
                    Upload images
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 transition-opacity ${isLoading ? "opacity-50" : ""}`}>
                  {mediaList.map((item, idx) => {
                    const selected = isItemSelected(item);
                    const selIndex = getSelectionIndex(item);
                    const isFocused = sameUrl(urlOf(focusedItem), item.url);
                    const current = isCurrent(item);

                    return (
                      <button
                        type="button"
                        key={item.url || idx}
                        onClick={() => handleItemClick(item)}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                        title={item.filename}
                        className={`group relative text-left rounded-xl overflow-hidden border bg-card cursor-pointer transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          selected
                            ? "border-primary ring-2 ring-primary"
                            : isFocused
                            ? "border-primary/60"
                            : "border-border hover:border-primary/50 hover:shadow-md"
                        }`}
                      >
                        <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                          {IMAGE_EXT.test(item.url || "") ? (
                            <img
                              src={resolveImageUrl(item.url)}
                              alt={item.filename}
                              loading="lazy"
                              className="h-full w-full object-contain p-1.5 group-hover:scale-[1.03] transition-transform duration-200"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <FileText className="h-7 w-7 text-primary/70 mb-1" />
                              <span className="text-[10px] font-mono uppercase">{item.filename?.split(".").pop()}</span>
                            </div>
                          )}
                        </div>

                        <div className={`px-2 py-1.5 border-t ${selected ? "bg-primary/10 border-primary/30" : "border-border/60"}`}>
                          <p className="text-[11px] font-medium text-foreground truncate">{item.filename}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {[item.size && formatFileSize(item.size), (item.updatedAt || item.createdAt) && formatDate(item.updatedAt || item.createdAt)]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>

                        {current && (
                          <span className="absolute top-1.5 left-1.5 rounded-md bg-foreground/80 text-background text-[10px] font-semibold px-1.5 py-0.5">
                            Current
                          </span>
                        )}

                        <span
                          className={`absolute top-1.5 right-1.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-white/90 border border-border text-transparent opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {multiple && selected ? selIndex : <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-5 pb-1 flex flex-col items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Showing {mediaList.length} of {totalFiles} images
                  </span>
                  {page < totalPages && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={isLoadingMore}
                      onClick={() => fetchMedia(page + 1, activeSearch)}
                      className="px-5 cursor-pointer"
                    >
                      {isLoadingMore && <Loader2 className="animate-spin" />}
                      Load more
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          <aside className="hidden md:flex w-72 lg:w-80 shrink-0 border-l bg-muted/20 flex-col overflow-y-auto">
            {previewItem ? (
              <div className="p-4 space-y-3">
                <div className="relative aspect-square rounded-xl border bg-white overflow-hidden flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={previewItem.filename}
                    onLoad={(e) => setDimensions({ url: previewUrl, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                <p className="text-xs font-semibold text-foreground break-all leading-snug">{previewItem.filename}</p>

                <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-[11px]">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Maximize2 className="h-3 w-3" /> Size
                  </dt>
                  <dd className="text-foreground font-medium">
                    {previewSize ? `${previewSize.w} × ${previewSize.h} px` : "…"}
                  </dd>
                  {previewItem.size && (
                    <>
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <HardDrive className="h-3 w-3" /> File
                      </dt>
                      <dd className="text-foreground font-medium">{formatFileSize(previewItem.size)}</dd>
                    </>
                  )}
                  {(previewItem.updatedAt || previewItem.createdAt) && (
                    <>
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="h-3 w-3" /> Added
                      </dt>
                      <dd className="text-foreground font-medium">
                        {formatDate(previewItem.updatedAt || previewItem.createdAt)}
                      </dd>
                    </>
                  )}
                </dl>

                {isLowRes && (
                  <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-px" />
                    <span>Low resolution. This image may look blurry on the store and in the Meta catalog.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(previewUrl);
                      toast.success("Image URL copied");
                    }}
                  >
                    <Copy />
                    Copy link
                  </Button>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "outline", size: "lg" })}
                  >
                    <ExternalLink />
                    Open
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                <ImageIcon className="h-9 w-9 opacity-30 mb-2" />
                <p className="text-xs font-medium">Select an image to preview it here</p>
              </div>
            )}
          </aside>
        </div>

        <DialogFooter className="m-0 rounded-none px-3 sm:px-5 py-3 border-t shrink-0 flex flex-row items-center justify-between sm:justify-between gap-3 bg-card">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedItems.length === 0 ? (
              <span className="text-xs text-muted-foreground">No image selected</span>
            ) : multiple ? (
              <>
                <Badge variant="secondary" className="text-xs font-semibold">
                  {selectedItems.length} of {maxSelect} selected
                </Badge>
                <div className="hidden sm:flex -space-x-2">
                  {selectedItems.slice(0, 5).map((sel) => (
                    <img
                      key={urlOf(sel)}
                      src={resolveImageUrl(urlOf(sel))}
                      alt=""
                      className="h-8 w-8 rounded-md border-2 border-card bg-white object-contain"
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <img
                  src={resolveImageUrl(urlOf(firstSelected))}
                  alt=""
                  className="h-9 w-9 rounded-md border bg-white object-contain shrink-0"
                />
                <span className="text-xs font-medium text-foreground truncate max-w-[16rem]">
                  {firstSelected.filename || urlOf(firstSelected).split("/").pop()}
                </span>
              </>
            )}
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedItems([])}
                className="text-xs text-muted-foreground hover:text-destructive underline-offset-2 hover:underline cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="cancel"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="px-3.5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={selectedItems.length === 0}
              onClick={handleConfirmSelection}
              className="px-4 font-semibold cursor-pointer"
            >
              <Check />
              {multiple ? `Use ${selectedItems.length || ""} image${selectedItems.length === 1 ? "" : "s"}` : "Use this image"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
