import { useEffect, useMemo, useState } from "react";
import { Truck, CheckCircle2, RefreshCw, Copy, Check, Send, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { formatBDT } from "@/utils/orderHelper";
import { formatDateTime } from "@/utils/dateHelper";
import { useCourierEnabled } from "@/hooks/use-couriers";

// RedX areas are a flat list (~thousands); fetched once per page load
let areasCache = null;
const loadAreas = async () => {
  if (areasCache) return areasCache;
  const res = await apiClient.get("/api/v1/courier/redx/areas");
  areasCache = res.data?.data || [];
  return areasCache;
};

const cleanPhone = (raw) => {
  let clean = String(raw || "").replace(/\D/g, "");
  if (clean.startsWith("880")) clean = clean.slice(2);
  if (clean.length === 10 && !clean.startsWith("0")) clean = `0${clean}`;
  return clean;
};

// Handles RedX dispatch and parcel tracking for an order (same props as PathaoCourierCard)
const RedxCourierCardInner = ({
  order,
  onOrderUpdated,
  triggerOnly = false,
  triggerButtonVariant = "default",
  triggerButtonSize = "default",
  triggerButtonClassName = "",
  triggerIconOnly = false,
  dialogOnly = false,
  openSignal = 0,
}) => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [tracking, setTracking] = useState([]);
  const [copied, setCopied] = useState(false);

  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [config, setConfig] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState("");
  const [cash, setCash] = useState(0);
  const [weight, setWeight] = useState(500);
  const [instruction, setInstruction] = useState("");
  const [closedBox, setClosedBox] = useState(false);
  const [charge, setCharge] = useState(null);

  const courier = order?.courier || {};
  const hasConsignment = Boolean(courier.consignmentId);
  const selectedArea = useMemo(() => areas.find((a) => String(a.id) === String(areaId)), [areas, areaId]);
  const areaOptions = useMemo(
    () => areas.map((a) => ({ value: String(a.id), label: a.name, sublabel: [a.division_name, a.post_code].filter(Boolean).join(" · ") })),
    [areas]
  );

  const refreshOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["order", order?.id || order?._id] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    if (onOrderUpdated) onOrderUpdated();
  };

  const handleOpenDispatch = async () => {
    setIsOpen(true);
    setCharge(null);
    const s = order?.shippingInfo || {};
    const b = order?.billingInfo || {};
    setName(s.fullName || b.fullName || order?.customer?.fullName || "");
    setPhone(cleanPhone(s.phone || b.phone || order?.customer?.phone));
    setAddress([s.address || b.address, s.thana || b.thana, s.district || b.district].filter(Boolean).join(", "));
    const total = order?.totals?.total ?? 0;
    const paid = order?.paidAmount ?? (String(order?.paymentStatus).toLowerCase() === "paid" ? total : 0);
    setCash(Math.max(0, total - paid));

    setLoadingAreas(true);
    try {
      const [cfgRes, list] = await Promise.all([apiClient.get("/api/v1/courier/redx/config"), loadAreas()]);
      const cfg = cfgRes.data?.data || {};
      setConfig(cfg);
      setWeight(cfg.defaultParcelWeight || 500);
      setClosedBox(Boolean(cfg.isClosedBox));
      setAreas(list);
      // Best guess: area whose name matches the customer's thana
      const thana = String(s.thana || b.thana || "").toLowerCase().trim();
      const guess = thana && list.find((a) => a.name.toLowerCase().startsWith(thana));
      setAreaId(guess ? String(guess.id) : "");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load RedX areas. Check Settings → RedX Courier.");
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    if (openSignal > 0) handleOpenDispatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  // Live charge estimate whenever area / cash / weight change
  useEffect(() => {
    if (!isOpen || !areaId || !config?.pickupAreaId) return;
    const t = setTimeout(async () => {
      try {
        const res = await apiClient.post("/api/v1/courier/redx/charge", {
          delivery_area_id: Number(areaId),
          cash_collection_amount: Number(cash) || 0,
          weight: Number(weight) || 500,
        });
        setCharge(res.data?.data || null);
      } catch {
        setCharge(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [isOpen, areaId, cash, weight, config?.pickupAreaId]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedArea) return toast.error("Select a RedX delivery area.");
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/api/v1/courier/redx/parcels", {
        orderId: order?.orderNumber || order?.id || order?._id,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_address: address.trim(),
        delivery_area: selectedArea.name,
        delivery_area_id: selectedArea.id,
        cash_collection_amount: Number(cash) || 0,
        parcel_weight: Number(weight) || 500,
        instruction: instruction.trim(),
        is_closed_box: closedBox,
        updateOrderStatus: "shipped",
      });
      toast.success(res.data?.message || "Order dispatched to RedX.");
      setIsOpen(false);
      refreshOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch order to RedX.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrack = async () => {
    if (!hasConsignment) return;
    setIsTracking(true);
    try {
      const res = await apiClient.get(`/api/v1/courier/redx/parcels/${courier.consignmentId}/track`);
      setTracking(res.data?.data?.tracking || []);
      toast.success(`RedX status: ${res.data?.data?.parcel?.status || "unknown"}`);
      refreshOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch RedX tracking.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleCancel = async () => {
    if (!hasConsignment || !window.confirm(`Request RedX to cancel parcel ${courier.consignmentId}?`)) return;
    try {
      const res = await apiClient.post(`/api/v1/courier/redx/parcels/${courier.consignmentId}/cancel`, { reason: "Cancelled by merchant" });
      toast.success(res.data?.message || "Cancellation requested.");
      refreshOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel RedX parcel.");
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(courier.consignmentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderDialog = () => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> Send with RedX
          </DialogTitle>
          <DialogDescription>
            Pickup store: {config?.pickupStoreName || "RedX default"}. Verify the customer details and pick the delivery area.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleDispatch} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-medium">
              Customer name
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="space-y-1 text-xs font-medium">
              Phone
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-medium">
            Address
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} required />
          </label>
          <div className="space-y-1 text-xs font-medium">
            Delivery area
            <SearchableCombobox
              value={areaId}
              onChange={(v) => setAreaId(v)}
              options={areaOptions}
              isLoading={loadingAreas}
              placeholder="Select RedX area"
              searchPlaceholder="Search area / post code..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs font-medium">
              Cash to collect (৳)
              <Input type="number" min="0" value={cash} onChange={(e) => setCash(e.target.value)} />
            </label>
            <label className="space-y-1 text-xs font-medium">
              Weight (grams)
              <Input type="number" min="1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-medium">
            Instruction
            <Input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Optional" />
          </label>
          <div className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
            <span>Closed box (customer can't open before paying)</span>
            <Switch checked={closedBox} onCheckedChange={setClosedBox} />
          </div>
          {charge && (
            <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
              Estimated charge: <b>{formatBDT(charge.deliveryCharge || 0)}</b>
              {charge.codCharge ? ` + COD ${formatBDT(charge.codCharge)}` : ""}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loadingAreas} className="gap-2">
              <Send className="h-4 w-4" /> {isSubmitting ? "Dispatching..." : "Dispatch to RedX"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (dialogOnly) return renderDialog();

  if (triggerOnly) {
    const label = hasConsignment ? "RedX Dispatched" : "Send with RedX";
    return (
      <>
        <Button
          type="button"
          variant={triggerButtonVariant}
          size={triggerButtonSize}
          onClick={hasConsignment ? handleTrack : handleOpenDispatch}
          className={`gap-1.5 cursor-pointer font-medium ${triggerButtonClassName}`}
          title={hasConsignment ? `${label} · click to sync live status` : label}
        >
          <Truck className={triggerIconOnly ? "h-3.5 w-3.5" : "h-3.5 w-3.5 text-primary"} />
          {triggerIconOnly === "responsive" ? <span className="hidden md:inline text-xs font-medium">{label}</span> : !triggerIconOnly && label}
        </Button>
        {renderDialog()}
      </>
    );
  }

  return (
    <>
      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" /> RedX Courier Delivery
          </h3>
          {hasConsignment && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Dispatched
            </Badge>
          )}
        </div>
        {hasConsignment ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs">Tracking ID</span>
              <button type="button" onClick={copyId} className="flex items-center gap-1 font-mono text-xs font-semibold">
                {courier.consignmentId} {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{courier.orderStatus || "—"}</span>
            </div>
            {courier.deliveryAreaName && (
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Area</span>
                <span>{courier.deliveryAreaName}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">To collect</span>
              <span>{formatBDT(courier.amountToCollect || 0)}</span>
            </div>
            {tracking.length > 0 && (
              <ul className="space-y-1.5 border-t pt-2 text-xs">
                {tracking.map((t, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{t.message_en}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(t.time)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleTrack} disabled={isTracking} className="text-xs gap-1.5 h-8">
                <RefreshCw className={`h-3.5 w-3.5 ${isTracking ? "animate-spin" : ""}`} />
                {isTracking ? "Updating..." : "Sync Live Status"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} className="text-xs gap-1.5 h-8">
                <XCircle className="h-3.5 w-3.5" /> Cancel Parcel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dispatch this order to RedX to create a parcel and track its delivery.
            </p>
            <Button onClick={handleOpenDispatch} className="w-full gap-2 shadow-sm font-semibold">
              <Send className="h-4 w-4" /> Dispatch to RedX
            </Button>
          </div>
        )}
      </div>
      {renderDialog()}
    </>
  );
};

// Dispatch is hidden while RedX is disabled; parcels already sent with RedX keep their card
const RedxCourierCard = (props) => {
  const enabled = useCourierEnabled("redx");
  const dispatched = props.order?.courier?.provider === "redx" && Boolean(props.order?.courier?.consignmentId);
  return enabled || dispatched ? <RedxCourierCardInner {...props} /> : null;
};

export default RedxCourierCard;
