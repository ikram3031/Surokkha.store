import React, { useState, useRef, useEffect, useMemo } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, Check, X, Loader2 } from "lucide-react";

/**
 * Modern Shadcn-styled Searchable Combobox / Async Dropdown
 * Built on @base-ui/react/popover with instant search, keyboard navigation,
 * custom entry creation, and asynchronous loading states.
 */
export function SearchableCombobox({
  value,
  onChange,
  options = [],
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No results found.",
  isLoading = false,
  disabled = false,
  allowCustom = false,
  customLabel = "Use",
  clearable = true,
  className,
  triggerClassName,
  icon: Icon,
  badgeText,
  renderOption,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options to [{ value, label, sublabel, data }]
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt, sublabel: "" };
      }
      return {
        value: opt.value ?? opt.name ?? opt.id ?? "",
        label: opt.label ?? opt.name ?? opt.value ?? "",
        sublabel: opt.sublabel ?? opt.bnName ?? "",
        count: opt.count ?? opt.areasCount ?? opt.totalZones ?? null,
        data: opt,
      };
    });
  }, [options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (!value) return null;
    return (
      normalizedOptions.find(
        (opt) => String(opt.value).toLowerCase() === String(value).toLowerCase()
      ) || { value, label: value, sublabel: "" }
    );
  }, [value, normalizedOptions]);

  // Filter options based on search query (matches label, sublabel, or value)
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label && String(opt.label).toLowerCase().includes(q);
      const matchSublabel = opt.sublabel && String(opt.sublabel).toLowerCase().includes(q);
      const matchValue = opt.value && String(opt.value).toLowerCase().includes(q);
      return matchLabel || matchSublabel || matchValue;
    });
  }, [normalizedOptions, search]);

  // Reset search and active index when opening
  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveIndex(-1);
      // Auto-focus search input shortly after popover mounts
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  // Keep highlighted item in view during keyboard navigation
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-combobox-item]");
      if (items[activeIndex]) {
        items[activeIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [activeIndex]);

  const handleSelect = (opt) => {
    if (!opt) return;
    onChange?.(opt.value, opt.data || opt);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("", null);
  };

  const handleCustomSelect = () => {
    if (!search.trim()) return;
    const customVal = search.trim();
    onChange?.(customVal, { value: customVal, label: customVal, isCustom: true });
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const max = filteredOptions.length - 1;
      setActiveIndex((prev) => (prev < max ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const max = filteredOptions.length - 1;
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : max));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filteredOptions[activeIndex]) {
        handleSelect(filteredOptions[activeIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      } else if (allowCustom && search.trim() && filteredOptions.length === 0) {
        handleCustomSelect();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const isExactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredOptions.some(
      (opt) =>
        String(opt.label).toLowerCase() === q ||
        String(opt.value).toLowerCase() === q
    );
  }, [filteredOptions, search]);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel || placeholder}
          className={cn(
            "group relative flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-left text-xs transition-all outline-none select-none",
            "hover:border-primary/60 hover:bg-muted/10",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:hover:bg-background",
            open && "border-primary ring-2 ring-primary/20",
            triggerClassName,
            className
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-1">
            {Icon && (
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
            {value ? (
              <div className="flex min-w-0 flex-1 items-center gap-1.5 truncate">
                <span className="truncate font-medium text-foreground">
                  {selectedOption?.label || value}
                </span>
                {selectedOption?.sublabel && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    ({selectedOption.sublabel})
                  </span>
                )}
                {badgeText && (
                  <span className="shrink-0 rounded bg-primary/10 px-1 py-0.2 text-[9px] font-semibold text-primary">
                    {badgeText}
                  </span>
                )}
              </div>
            ) : (
              <span className="truncate text-muted-foreground">
                {placeholder}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 pl-1">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : value && clearable && !disabled ? (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e);
                  }
                }}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Clear selection"
              >
                <X className="h-3 w-3" />
              </span>
            ) : (
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180 text-primary"
                )}
              />
            )}
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        matchTriggerWidth
        align="start"
        sideOffset={4}
        className="w-(--anchor-width) min-w-[220px] max-w-[420px] p-1.5 shadow-xl border-border bg-popover rounded-xl"
      >
        {/* Search Input Header */}
        <div className="relative mb-1 px-1">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded-lg bg-muted/40 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground outline-none border border-transparent focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Options List */}
        <div
          ref={listRef}
          className="max-h-56 overflow-y-auto overflow-x-hidden p-0.5 space-y-0.5 scrollbar-thin text-xs"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary mb-2" />
              <span className="text-xs">Loading locations...</span>
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected =
                String(opt.value).toLowerCase() === String(value || "").toLowerCase();
              const isHighlighted = idx === activeIndex;

              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  data-combobox-item
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : isHighlighted
                      ? "bg-muted text-foreground"
                      : "text-foreground hover:bg-muted/80"
                  )}
                >
                  {renderOption ? (
                    renderOption(opt, { isSelected, isHighlighted })
                  ) : (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {opt.sublabel}
                        </span>
                      )}
                      {opt.count != null && opt.count > 0 && (
                        <span className="ml-auto text-[10px] text-muted-foreground/80 shrink-0">
                          {opt.count} areas
                        </span>
                      )}
                    </div>
                  )}

                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-4 px-2 text-center text-xs text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          )}

          {/* Custom Entry Option */}
          {allowCustom && search.trim() && !isExactMatch && !isLoading && (
            <button
              type="button"
              onClick={handleCustomSelect}
              className="mt-1 flex w-full items-center gap-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2.5 py-1.5 text-left text-xs font-medium text-primary hover:bg-primary/10 transition cursor-pointer"
            >
              <span>+ {customLabel} &quot;{search.trim()}&quot;</span>
            </button>
          )}
        </div>

        {/* Footer info showing total items count */}
        {filteredOptions.length > 0 && (
          <div className="mt-1 border-t border-border/40 px-2 pt-1 text-[10px] text-muted-foreground flex justify-between items-center">
            <span>
              {filteredOptions.length} of {normalizedOptions.length} available
            </span>
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-muted-foreground hover:text-destructive underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
export default SearchableCombobox;
