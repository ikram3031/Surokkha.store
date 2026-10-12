import React, { useMemo, useCallback } from "react";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useDistricts, useThanas } from "@/hooks/use-locations";
import { MapPin, Navigation } from "lucide-react";

/**
 * DistrictCombobox component for seamless search & selection
 */
export function DistrictCombobox({
  value,
  onChange,
  onDistrictChange,
  placeholder = "Select district...",
  searchPlaceholder = "Search district (e.g. Dhaka, Chittagong, ঢাকা)...",
  disabled = false,
  className,
  triggerClassName,
  ariaLabel = "District",
}) {
  const { districts, isLoading } = useDistricts();

  const formattedOptions = useMemo(() => {
    return districts.map((d) => ({
      value: d.name,
      label: d.name,
      sublabel: d.bnName || "",
      count: d.totalZones || d.thanas?.length || null,
      data: d,
    }));
  }, [districts]);

  const handleChange = useCallback(
    (districtName, districtObj) => {
      onChange?.(districtName);
      onDistrictChange?.(districtName, districtObj?.data || districtObj);
    },
    [onChange, onDistrictChange]
  );

  return (
    <SearchableCombobox
      value={value}
      onChange={handleChange}
      options={formattedOptions}
      isLoading={isLoading}
      disabled={disabled}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage="No district found."
      icon={MapPin}
      allowCustom={true}
      customLabel="Set district to"
      className={className}
      triggerClassName={triggerClassName}
      ariaLabel={ariaLabel}
    />
  );
}

/**
 * ThanaCombobox component for district-bound thana/upazila search & selection
 */
export function ThanaCombobox({
  district,
  value,
  onChange,
  placeholder = "Select thana / area...",
  searchPlaceholder = "Search thana / upazila (e.g. Mirpur, Dhanmondi)...",
  disabled = false,
  allowCustom = true,
  className,
  triggerClassName,
  ariaLabel = "Thana / Upazila",
}) {
  const { districts } = useDistricts();
  const { thanas, isLoading } = useThanas(district, districts);

  const isDistrictSelected = Boolean(district && String(district).trim());

  const formattedOptions = useMemo(() => {
    return thanas.map((t) => ({
      value: t.name,
      label: t.name,
      sublabel: t.bnName || "",
      count: t.areasCount || t.areas?.length || null,
      data: t,
    }));
  }, [thanas]);

  const promptPlaceholder = !isDistrictSelected
    ? "Select district first"
    : isLoading
    ? "Loading thanas..."
    : placeholder;

  return (
    <SearchableCombobox
      value={value}
      onChange={onChange}
      options={formattedOptions}
      isLoading={isLoading}
      disabled={disabled || !isDistrictSelected}
      placeholder={promptPlaceholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={
        isDistrictSelected
          ? "No thana found in this district."
          : "Please select a district first."
      }
      icon={Navigation}
      allowCustom={allowCustom}
      customLabel="Use custom area"
      className={className}
      triggerClassName={triggerClassName}
      ariaLabel={ariaLabel}
    />
  );
}
