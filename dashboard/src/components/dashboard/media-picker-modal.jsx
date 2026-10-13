import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { apiClient, resolveImageUrl } from "@/lib/api-client";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error-handler";
import { formatDate } from "@/utils/dateHelper";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const DEFAULT_INITIAL_SELECTED = [];

// Reusable modal for choosing existing product images or uploading new ones
export const MediaPickerModal = ({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  maxSelect = 5,
  initialSelected = DEFAULT_INITIAL_SELECTED,
  title,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("library");

  const [mediaList, setMediaList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);

  const [selectedItems, setSelectedItems] = useState([]);
  const [focusedItem, setFocusedItem] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const uploadInputRef = useRef(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      if (Array.isArray(initialSelected)) {
        setSelectedItems(
          initialSelected
            .filter(Boolean)
            .map((item) => (typeof item === "string" ? { url: item, filename: item } : item))
        );
      } else if (typeof initialSelected === "string" && initialSelected.trim()) {
        setSelectedItems([{ url: initialSelected, filename: initialSelected }]);
      } else {
        setSelectedItems([]);
      }
      setFocusedItem(null);
      setCurrentPage(1);
      setActiveSearch("");
      setSearchQuery("");
      setActiveTab("library");
    }
    prevOpenRef.current = open;
  }, [open]);

  const fetchMedia = useCallback(async (page = 1, search = "") => {
    setIsLoading(true);
    try {
      const res = await apiClient.get("/api/v1/images", {
        params: {
          page,
          limit: 24,
          search,
        },
      });
      const data = res.data?.data || [];
      const meta = res.data?.meta || {};
      setMediaList(data);
      setTotalPages(meta.totalPages || 1);
      setTotalFiles(meta.total || data.length);
    } catch (err) {
      if (!apiClient.isCancel?.(err)) {
        toast.error(getApiErrorMessage(err, "Failed to load media assets"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMedia(currentPage, activeSearch);
    }
  }, [open, currentPage, activeSearch, fetchMedia]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setCurrentPage(1);
  };

  const isItemSelected = (item) => {
    if (!item?.url) return false;
    return selectedItems.some((sel) => {
      const selUrl = typeof sel === "string" ? sel : sel?.url;
      return selUrl === item.url || (selUrl && item.url && (selUrl.endsWith(item.url) || item.url.endsWith(selUrl)));
    });
  };

  const getSelectionIndex = (item) => {
    if (!item?.url) return null;
    const idx = selectedItems.findIndex((sel) => {
      const selUrl = typeof sel === "string" ? sel : sel?.url;
      return selUrl === item.url || (selUrl && item.url && (selUrl.endsWith(item.url) || item.url.endsWith(selUrl)));
    });
    return idx >= 0 ? idx + 1 : null;
  };

  const handleItemClick = (item) => {
    setFocusedItem(item);
    if (!multiple) {
      setSelectedItems([item]);
    } else {
      if (isItemSelected(item)) {
        setSelectedItems((prev) =>
          prev.filter((sel) => {
            const selUrl = typeof sel === "string" ? sel : sel?.url;
            return selUrl !== item.url && (!selUrl || !item.url || (!selUrl.endsWith(item.url) && !item.url.endsWith(selUrl)));
          })
        );
      } else {
        if (selectedItems.length >= maxSelect) {
          toast.error(`You can select at most ${maxSelect} images.`);
          return;
        }
        setSelectedItems((prev) => [...prev, item]);
      }
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
      const selected = selectedItems[0];
      onSelect?.(selected?.url || selected);
    } else {
      onSelect?.(selectedItems.map((item) => item.url || item));
    }
    onOpenChange?.(false);
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const oversized = fileList.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized.length > 0) {
      toast.error(`Some files exceed 10MB limit and were skipped.`);
    }

    const validFiles = fileList.filter((f) => f.size <= MAX_IMAGE_SIZE);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    const uploadToast = toast.loading(`Uploading ${validFiles.length} image(s)...`);

    const uploadedUrls = [];

    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("type", "product");

        const res = await apiClient.post("/api/v1/images/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const url = res.data?.data?.imageUrl || res.data?.imageUrl;
        if (url) {
          uploadedUrls.push({
            url,
            filename: file.name,
            size: file.size,
            createdAt: new Date().toISOString(),
          });
        }
      }

      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`, { id: uploadToast });

      await fetchMedia(1, "");
      setCurrentPage(1);
      setActiveTab("library");

      if (uploadedUrls.length > 0) {
        if (!multiple) {
          setSelectedItems([uploadedUrls[0]]);
          setFocusedItem(uploadedUrls[0]);
        } else {
          setSelectedItems((prev) => {
            const combined = [...prev, ...uploadedUrls];
            return combined.slice(0, maxSelect);
          });
          setFocusedItem(uploadedUrls[0]);
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to upload image(s)"), { id: uploadToast });
    } finally {
      setIsUploading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl p-0 max-h-[92vh] flex flex-col overflow-hidden gap-0 rounded-2xl">
        <DialogHeader className="p-4 sm:p-5 border-b shrink-0 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {title || (multiple ? "Select Product Images" : "Select Product Image")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {multiple
                  ? `Choose up to ${maxSelect} images from media library or upload new ones.`
                  : "Choose an existing image from media library or upload a new one."}
              </p>
            </div>
          </div>

          {multiple && selectedItems.length > 0 && (
            <Badge variant="secondary" className="font-semibold text-xs py-1 px-3 bg-primary/10 text-primary border border-primary/20">
              {selectedItems.length} of {maxSelect} Selected
            </Badge>
          )}
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 sm:px-5 pt-3 border-b flex items-center justify-between gap-3 flex-wrap">
            <TabsList className="bg-muted/60 p-1">
              <TabsTrigger value="library" className="text-xs px-3.5 py-1.5 font-semibold gap-1.5 cursor-pointer">
                <ImageIcon className="h-3.5 w-3.5" />
                Media Library ({totalFiles})
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs px-3.5 py-1.5 font-semibold gap-1.5 cursor-pointer">
                <UploadCloud className="h-3.5 w-3.5" />
                Upload Files
              </TabsTrigger>
            </TabsList>

            {activeTab === "library" && (
              <div className="flex items-center gap-2 flex-1 max-w-sm ml-auto">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by filename or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs pr-7"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </form>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMedia(currentPage, activeSearch)}
                  className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="library" className="flex-1 flex flex-col md:flex-row overflow-hidden m-0 p-0">
            <div className="flex-1 flex flex-col overflow-hidden p-4">
              <div className="flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-xl bg-muted/40 animate-pulse border border-border/40"
                      />
                    ))}
                  </div>
                ) : mediaList.length === 0 ? (
                  <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-xl bg-muted/5">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-2.5" />
                    <p className="text-sm font-bold text-foreground">No media files found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      {activeSearch
                        ? `No results matching "${activeSearch}". Try another keyword.`
                        : "Upload images from the 'Upload Files' tab to see them here."}
                    </p>
                    {activeSearch && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleClearSearch}
                        className="mt-2 text-xs cursor-pointer"
                      >
                        Clear search filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {mediaList.map((item, idx) => {
                      const selected = isItemSelected(item);
                      const selIndex = getSelectionIndex(item);
                      const isFocused = focusedItem?.url === item.url;

                      return (
                        <div
                          key={item.url || idx}
                          onClick={() => handleItemClick(item)}
                          onDoubleClick={() => handleItemDoubleClick(item)}
                          className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all duration-150 flex flex-col justify-between bg-card ${
                            selected
                              ? "border-primary ring-2 ring-primary/30 shadow-md scale-[0.98]"
                              : isFocused
                              ? "border-primary/60 shadow-sm"
                              : "border-border/80 hover:border-primary/50 hover:shadow-xs"
                          }`}
                        >
                          <div className="relative w-full h-full bg-muted/20 flex items-center justify-center overflow-hidden">
                            {item.url?.match(/\.(jpeg|jpg|png|webp|gif|svg|avif)$/i) ? (
                              <img
                                src={resolveImageUrl(item.url)}
                                alt={item.filename}
                                loading="lazy"
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                                <FileText className="h-7 w-7 text-primary/70 mb-1" />
                                <span className="text-[10px] font-mono truncate max-w-full">
                                  {item.filename?.split(".").pop()}
                                </span>
                              </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-1.5 pt-4 opacity-90">
                              <p className="text-[10px] font-medium text-white truncate drop-shadow-xs">
                                {item.filename}
                              </p>
                            </div>

                            {selected && (
                              <div className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md animate-in zoom-in-50">
                                {multiple ? selIndex : <Check className="h-3.5 w-3.5" />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="pt-3 border-t mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Page {currentPage} of {totalPages} ({totalFiles} items)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || isLoading}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-7 px-2.5 text-xs cursor-pointer"
                    >
                      Previous
                    </Button>
                    <span className="font-semibold px-2 text-foreground">{currentPage}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || isLoading}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-7 px-2.5 text-xs cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l bg-muted/10 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
              {focusedItem || (selectedItems.length > 0 ? selectedItems[selectedItems.length - 1] : null) ? (
                (() => {
                  const target = focusedItem || selectedItems[selectedItems.length - 1];
                  const fullUrl = resolveImageUrl(target.url);

                  return (
                    <div className="space-y-3.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Image Details
                      </h4>

                      <div className="relative aspect-video rounded-xl border bg-black/5 dark:bg-black/40 overflow-hidden flex items-center justify-center p-1">
                        <img
                          src={fullUrl}
                          alt={target.filename}
                          className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-foreground break-all" title={target.filename}>
                          {target.filename}
                        </p>
                        {target.size && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <HardDrive className="h-3 w-3 text-primary" />
                            <span>{formatFileSize(target.size)}</span>
                          </div>
                        )}
                        {(target.updatedAt || target.createdAt) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span>{formatDate(target.updatedAt || target.createdAt)}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full text-xs h-8 gap-1.5 font-medium cursor-pointer"
                          onClick={() => {
                            navigator.clipboard.writeText(fullUrl);
                            toast.success("Image URL copied to clipboard!");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center text-muted-foreground p-3">
                  <ImageIcon className="h-8 w-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium">Click an image to inspect details and preview.</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t text-[11px] text-muted-foreground">
                <p>💡 Tip: Double-click any image to instantly select and close.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 p-6 overflow-y-auto m-0">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[300px] transition-all ${
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border/80 hover:border-primary/50 hover:bg-muted/10"
              }`}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>

              <h3 className="text-base font-bold text-foreground">
                {isUploading ? "Uploading Images..." : "Upload New Product Images"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Drag and drop your images here, or browse files from your computer. Files will be auto-optimized to WebP.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <Button
                  type="button"
                  disabled={isUploading}
                  onClick={() => uploadInputRef.current?.click()}
                  className="font-semibold text-xs px-5 h-9 gap-1.5 shadow-sm cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  Browse Files
                </Button>
              </div>

              <span className="text-[11px] text-muted-foreground mt-3">
                Supports JPG, PNG, WEBP, GIF, AVIF up to 10MB each
              </span>

              <input
                ref={uploadInputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between sm:justify-between bg-card">
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItems([])}
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2.5 cursor-pointer"
              >
                Clear Selection
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 px-3.5 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={selectedItems.length === 0}
              onClick={handleConfirmSelection}
              className="text-xs h-8 px-4 font-semibold gap-1.5 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              {multiple
                ? `Insert Selected (${selectedItems.length})`
                : "Select Image"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
