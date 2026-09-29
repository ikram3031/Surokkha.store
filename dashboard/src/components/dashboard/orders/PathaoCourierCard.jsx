import { useState, useEffect } from "react";
import {
  Truck,
  Package,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Send,
  MapPin,
  Phone,
  User,
  Clock,
  ChevronDown,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatBDT } from "@/utils/orderHelper";
import { formatDateTime } from '@/utils/dateHelper';

// Handles Pathao courier dispatch and consignment tracking for orders
const PathaoCourierCard = ({
  order,
  onOrderUpdated,
  triggerOnly = false,
  triggerButtonVariant = "default",
  triggerButtonSize = "default",
  triggerButtonClassName = "",
}) => {
  const queryClient = useQueryClient();
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  // Dispatch Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [itemWeight, setItemWeight] = useState(0.5);
  const [deliveryType, setDeliveryType] = useState(48);
  const [itemType, setItemType] = useState(2);
  const [amountToCollect, setAmountToCollect] = useState(0);
  const [specialInstruction, setSpecialInstruction] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(null);
  const [isCalculatingRate, setIsCalculatingRate] = useState(false);

  const courier = order?.courier || {};
  const hasConsignment = Boolean(courier?.consignmentId);

  // Calculates estimated delivery fee automatically using Pathao Price Plan API
  const calculateRateAutomatically = async (storeId, cityId, zoneId, weight, dType, iType) => {
    if (!storeId || !cityId || !zoneId) return;
    try {
      setIsCalculatingRate(true);
      const res = await apiClient.post("/api/v1/courier/pathao/price-plan", {
        store_id: Number(storeId),
        item_type: Number(iType ?? itemType ?? 2),
        delivery_type: Number(dType ?? deliveryType ?? 48),
        item_weight: Number(weight ?? itemWeight) || 0.5,
        recipient_city: Number(cityId),
        recipient_zone: Number(zoneId),
      });
      const price = res.data?.data?.price ?? res.data?.price ?? null;
      setEstimatedPrice(price);
    } catch (err) {
      console.warn("Auto rate calculation error:", err);
    } finally {
      setIsCalculatingRate(false);
    }
  };

  // Initialize dispatch form when dialog opens
  const handleOpenDispatch = async () => {
    setIsDispatchOpen(true);
    setEstimatedPrice(null);

    const sInfo = order?.shippingInfo || {};
    const bInfo = order?.billingInfo || {};

    const name =
      sInfo.fullName?.trim() ||
      bInfo.fullName?.trim() ||
      order?.customer?.fullName?.trim() ||
      order?.customerName?.trim() ||
      "";

    let rawPhone =
      sInfo.phone?.trim() ||
      bInfo.phone?.trim() ||
      order?.customer?.phone?.trim() ||
      order?.phone?.trim() ||
      "";

    // Normalize BD phone to 11 digits (01XXXXXXXXX)
    let clean = rawPhone.replace(/\D/g, "");
    if (clean.startsWith("880")) clean = clean.slice(2);
    if (clean.length === 10 && !clean.startsWith("0")) clean = `0${clean}`;

    setRecipientName(name);
    setRecipientPhone(clean);

    const fullAddr = [
      sInfo.address || bInfo.address || order?.customer?.address,
      sInfo.thana || bInfo.thana,
      sInfo.district || bInfo.district || sInfo.city || bInfo.city,
      sInfo.zip || bInfo.zip ? `Zip: ${sInfo.zip || bInfo.zip}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    setRecipientAddress(
      sInfo.address?.trim() ||
      bInfo.address?.trim() ||
      fullAddr ||
      order?.customer?.address?.trim() ||
      ""
    );

    // Calculate COD amount: if paid, 0; else remaining total
    const total = order?.totals?.total ?? order?.totalAmount ?? 0;
    const paid =
      order?.paymentDetails?.paidAmount ??
      order?.paidAmount ??
      (String(order?.paymentStatus).toLowerCase() === "paid" ? total : 0);
    const pending = Math.max(0, total - paid);
    setAmountToCollect(pending);

    // Load Pathao stores, config, and cities
    try {
      const [configRes, storesRes, citiesRes] = await Promise.all([
        apiClient.get("/api/v1/courier/pathao/config").catch(() => ({ data: {} })),
        apiClient.get("/api/v1/courier/pathao/stores").catch(() => ({ data: {} })),
        apiClient.get("/api/v1/courier/pathao/cities").catch(() => ({ data: {} })),
      ]);

      const cfg = configRes.data?.data || {};
      const stList = storesRes.data?.data || [];
      const cityList = citiesRes.data?.data || [];

      setStores(stList);
      setCities(cityList);

      let effectiveStoreId = "";
      if (cfg.storeId) {
        effectiveStoreId = String(cfg.storeId);
      } else if (stList.length > 0) {
        effectiveStoreId = String(stList[0].store_id);
      }
      setSelectedStoreId(effectiveStoreId);

      const effectiveWeight = cfg.defaultItemWeight ?? 0.5;
      const effectiveDelType = cfg.defaultDeliveryType ?? 48;
      const effectiveItmType = cfg.defaultItemType ?? 2;
      setItemWeight(effectiveWeight);
      setDeliveryType(effectiveDelType);
      setItemType(effectiveItmType);

      // Auto-match city & zone from destination shipping address (or billing fallback)
      const targetDistrict = (
        sInfo.district ||
        bInfo.district ||
        sInfo.city ||
        bInfo.city ||
        "Dhaka"
      )
        .toLowerCase()
        .trim();

      if (targetDistrict && cityList.length > 0) {
        const matchedCity =
          cityList.find(
            (c) =>
              c.city_name.toLowerCase().trim() === targetDistrict ||
              c.city_name.toLowerCase().includes(targetDistrict) ||
              targetDistrict.includes(c.city_name.toLowerCase())
          ) ||
          cityList.find((c) => c.city_name.toLowerCase().includes("dhaka"));

        if (matchedCity) {
          const matchedCityId = String(matchedCity.city_id);
          setSelectedCity(matchedCityId);

          const zonesRes = await apiClient.get(`/api/v1/courier/pathao/zones/${matchedCityId}`).catch(() => ({ data: {} }));
          const zList = zonesRes.data?.data || [];
          setZones(zList);

          const targetThana = (
            sInfo.thana ||
            bInfo.thana ||
            ""
          )
            .toLowerCase()
            .trim();

          let matchedZoneId = "";
          if (targetThana && zList.length > 0) {
            const matchedZone = zList.find(
              (z) =>
                z.zone_name.toLowerCase().trim() === targetThana ||
                z.zone_name.toLowerCase().includes(targetThana) ||
                targetThana.includes(z.zone_name.toLowerCase())
            );
            if (matchedZone) {
              matchedZoneId = String(matchedZone.zone_id);
            }
          }

          if (!matchedZoneId && zList.length > 0) {
            matchedZoneId = String(zList[0].zone_id);
          }

          if (matchedZoneId) {
            setSelectedZone(matchedZoneId);

            apiClient
              .get(`/api/v1/courier/pathao/areas/${matchedZoneId}`)
              .then((res) => setAreas(res.data?.data || []))
              .catch(() => {});

            if (effectiveStoreId) {
              calculateRateAutomatically(
                effectiveStoreId,
                matchedCityId,
                matchedZoneId,
                effectiveWeight,
                effectiveDelType,
                effectiveItmType
              );
            }
          }
        }
      }
    } catch (e) {
      console.warn("Error loading Pathao dispatch pre-requisites:", e);
    }
  };

  const handleCityChange = async (cityId) => {
    setSelectedCity(cityId);
    setSelectedZone("");
    setSelectedArea("");
    setZones([]);
    setAreas([]);
    setEstimatedPrice(null);

    if (!cityId) return;
    try {
      const res = await apiClient.get(`/api/v1/courier/pathao/zones/${cityId}`);
      const zList = res.data?.data || [];
      setZones(zList);

      const targetThana = (order?.shippingInfo?.thana || order?.billingInfo?.thana || "").toLowerCase().trim();
      let autoZoneId = "";
      if (targetThana && zList.length > 0) {
        const matched = zList.find(
          (z) =>
            z.zone_name.toLowerCase().includes(targetThana) ||
            targetThana.includes(z.zone_name.toLowerCase())
        );
        if (matched) {
          autoZoneId = String(matched.zone_id);
        }
      }

      if (!autoZoneId && zList.length > 0) {
        autoZoneId = String(zList[0].zone_id);
      }

      if (autoZoneId) {
        handleZoneChange(autoZoneId, cityId);
      }
    } catch (err) {
      console.warn("Failed to load zones", err);
    }
  };

  const handleZoneChange = async (zoneId, cityIdOverride) => {
    setSelectedZone(zoneId);
    setSelectedArea("");
    setAreas([]);
    setEstimatedPrice(null);

    if (!zoneId) return;
    try {
      const res = await apiClient.get(`/api/v1/courier/pathao/areas/${zoneId}`);
      setAreas(res.data?.data || []);

      const cityId = cityIdOverride || selectedCity;
      if (selectedStoreId && cityId) {
        calculateRateAutomatically(selectedStoreId, cityId, zoneId, itemWeight, deliveryType, itemType);
      }
    } catch (err) {
      console.warn("Failed to load areas", err);
    }
  };

  const handleEstimateRate = async () => {
    if (!selectedStoreId || !selectedCity || !selectedZone) {
      toast.error("Please select Pickup Store, City, and Zone to estimate rate.");
      return;
    }
    calculateRateAutomatically(selectedStoreId, selectedCity, selectedZone, itemWeight, deliveryType, itemType);
  };

  const handleSubmitDispatch = async (e) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      toast.error("Recipient Name is required.");
      return;
    }
    if (!recipientPhone.trim()) {
      toast.error("Recipient Phone is required.");
      return;
    }
    if (!recipientAddress.trim()) {
      toast.error("Delivery Address is required.");
      return;
    }
    if (!selectedCity || !selectedZone) {
      toast.error("Please select Destination City and Zone.");
      return;
    }
    if (!selectedStoreId) {
      toast.error("Please select a Pathao Pickup Store.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        orderId: order?.orderNumber || order?.id || order?._id,
        store_id: Number(selectedStoreId),
        merchant_order_id: order?.orderNumber || String(order?.id || ""),
        recipient_name: recipientName.trim(),
        recipient_phone: recipientPhone.trim(),
        recipient_address: recipientAddress.trim(),
        recipient_city: Number(selectedCity),
        recipient_zone: Number(selectedZone),
        recipient_area: selectedArea ? Number(selectedArea) : undefined,
        delivery_type: Number(deliveryType),
        item_type: Number(itemType),
        special_instruction: specialInstruction.trim(),
        item_quantity: order?.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 1,
        item_weight: Number(itemWeight) || 0.5,
        amount_to_collect: Number(amountToCollect) || 0,
        item_description: order?.items?.map((i) => `${i.name} (x${i.quantity || 1})`).join(", ") || "Parcel Items",
        updateOrderStatus: "shipped",
      };

      const res = await apiClient.post("/api/v1/courier/pathao/orders/create", payload);
      toast.success(res.data?.message || "Order dispatched to Pathao Courier successfully!");

      setIsDispatchOpen(false);
      queryClient.invalidateQueries(["order", order?.id || order?._id]);
      queryClient.invalidateQueries(["orders"]);
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch order to Pathao.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackLive = async () => {
    if (!courier?.consignmentId) return;
    try {
      setIsTrackingLoading(true);
      const res = await apiClient.get(`/api/v1/courier/pathao/orders/${courier.consignmentId}/track`);
      setTrackingData(res.data?.data || res.data);
      toast.success("Live tracking info updated.");
      queryClient.invalidateQueries(["order", order?.id || order?._id]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch live tracking info.");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const copyConsignment = () => {
    if (!courier?.consignmentId) return;
    navigator.clipboard.writeText(courier.consignmentId);
    setCopied(true);
    toast.success("Consignment ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const renderDispatchDialog = () => (
    <Dialog open={isDispatchOpen} onOpenChange={setIsDispatchOpen}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" /> Dispatch Order #{order?.orderNumber} to Pathao
          </DialogTitle>
          <DialogDescription>
            Verify recipient address and select delivery options to generate Pathao consignment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitDispatch} className="space-y-4 py-2">
          {/* Store Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Pickup Store <span className="text-destructive">*</span></label>
            {stores.length > 0 ? (
              <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Pickup Store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.store_id} value={String(s.store_id)}>
                      {s.store_name} ({s.store_address})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                placeholder="Enter Store ID"
                className="h-9 text-xs font-mono"
              />
            )}
          </div>

          {/* Recipient Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Recipient Name <span className="text-destructive">*</span></label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Customer Full Name"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Recipient Phone (11-digit) <span className="text-destructive">*</span></label>
              <Input
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="h-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Delivery Address <span className="text-destructive">*</span></label>
            <Textarea
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="House, Road, Area, Landmark"
              className="text-xs min-h-[60px]"
              required
            />
          </div>

          {/* City / Zone / Area Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">City <span className="text-destructive">*</span></label>
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {cities.map((c) => (
                    <SelectItem key={c.city_id} value={String(c.city_id)}>
                      {c.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Zone <span className="text-destructive">*</span></label>
              <Select value={selectedZone} onValueChange={handleZoneChange} disabled={!selectedCity || zones.length === 0}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={!selectedCity ? "Select city first" : "Select Zone"} />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {zones.map((z) => (
                    <SelectItem key={z.zone_id} value={String(z.zone_id)}>
                      {z.zone_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Area / Thana</label>
              <Select value={selectedArea} onValueChange={setSelectedArea} disabled={!selectedZone || areas.length === 0}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {areas.map((a) => (
                    <SelectItem key={a.area_id} value={String(a.area_id)}>
                      {a.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Parcel Attributes & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Weight (KG)</label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={itemWeight}
                onChange={(e) => setItemWeight(e.target.value)}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Delivery Speed</label>
              <Select value={String(deliveryType)} onValueChange={(v) => setDeliveryType(Number(v))}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="48">Normal (48h)</SelectItem>
                  <SelectItem value="12">On Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Amount to Collect (COD ৳)</label>
              <Input
                type="number"
                min="0"
                value={amountToCollect}
                onChange={(e) => setAmountToCollect(e.target.value)}
                className="h-9 text-xs font-mono font-bold text-primary"
              />
            </div>
          </div>

          {/* Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Special Instruction (Optional)</label>
            <Input
              value={specialInstruction}
              onChange={(e) => setSpecialInstruction(e.target.value)}
              placeholder="e.g. Call before delivery, handle with care"
              className="h-9 text-xs"
            />
          </div>

          {/* Estimated Delivery Fee & Price Calc */}
          <div className="p-3 rounded-lg bg-muted/60 border border-border/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block">Estimated Delivery Fee</span>
              <span className="text-sm font-bold text-foreground">
                {estimatedPrice != null ? `৳${estimatedPrice}` : "Not calculated"}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEstimateRate}
              disabled={isCalculatingRate || !selectedCity || !selectedZone}
              className="h-7 text-xs gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isCalculatingRate ? "animate-spin" : ""}`} />
              Check Rate
            </Button>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDispatchOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedCity || !selectedZone || !selectedStoreId}
              className="gap-1.5 font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Confirm & Dispatch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (triggerOnly) {
    return (
      <>
        <Button
          type="button"
          variant={triggerButtonVariant}
          size={triggerButtonSize}
          onClick={handleOpenDispatch}
          className={`gap-1.5 cursor-pointer font-medium ${triggerButtonClassName}`}
        >
          <Truck className="h-3.5 w-3.5 text-primary" />
          {hasConsignment ? "Pathao Dispatched" : "Send with Pathao"}
        </Button>
        {renderDispatchDialog()}
      </>
    );
  }

  return (
    <>
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Pathao Courier Delivery
          </h3>
          {hasConsignment ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Dispatched
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Not Dispatched
            </Badge>
          )}
        </div>

        {hasConsignment ? (
          <div className="space-y-3.5 text-sm">
            {/* Consignment ID Row */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/60">
              <div>
                <span className="text-[11px] text-muted-foreground block">Consignment ID</span>
                <span className="font-mono font-bold text-foreground text-sm tracking-wide">
                  {courier.consignmentId}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyConsignment}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Copy ID"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <a
                  href={`https://merchant.pathao.com/tracking?consignment_id=${courier.consignmentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-7 px-2 rounded-md text-xs font-medium text-primary hover:bg-primary/10 transition-colors gap-1"
                >
                  Track on Pathao <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Courier status & fee */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs text-muted-foreground block">Delivery Status</span>
                <span className="font-semibold text-foreground capitalize flex items-center gap-1.5 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  {trackingData?.order_status || courier.orderStatus || "In Transit"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Delivery Fee</span>
                <span className="font-semibold text-foreground font-mono mt-0.5 block">
                  {formatBDT(courier.deliveryFee || trackingData?.delivery_fee || 0)}
                </span>
              </div>
            </div>

            {courier.dispatchedAt && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1 border-t border-border/60">
                <Clock className="h-3 w-3" /> Dispatched on {formatDateTime(courier.dispatchedAt)}
              </div>
            )}

            {/* Live Track Action */}
            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTrackLive}
                disabled={isTrackingLoading}
                className="w-full text-xs gap-1.5 h-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTrackingLoading ? "animate-spin" : ""}`} />
                {isTrackingLoading ? "Updating Tracking..." : "Sync Live Status"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dispatch this order directly to Pathao Courier to generate consignment barcodes, schedule pickup, and automate delivery tracking.
            </p>
            <Button
              onClick={handleOpenDispatch}
              className="w-full gap-2 shadow-sm font-semibold"
            >
              <Send className="h-4 w-4" /> Dispatch to Pathao Courier
            </Button>
          </div>
        )}
      </div>

      {renderDispatchDialog()}
    </>
  );
};

export default PathaoCourierCard;
