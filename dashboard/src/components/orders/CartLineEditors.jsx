import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { clientConfig } from "@/clientConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, X, Boxes } from "lucide-react";

// Same switch the backend uses: picked pieces leave stock only while stock tracking is on
const inventoryOn = clientConfig?.stockManagement?.simpleProduct !== false;

// Keeps only digits and a single decimal point from a typed price string
const sanitizePrice = (raw) => {
  const cleaned = String(raw ?? "").replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("").slice(0, 2)}` : whole;
};

// Renders an inline editable unit price input for a cart line
export const CartPriceInput = ({ value, onChange, className = "" }) => {
  const [draft, setDraft] = useState(String(value ?? ""));
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value ?? ""));
  }

  return (
    <div className={`flex items-center h-6 rounded border border-input bg-transparent overflow-hidden ${className}`}>
      <span className="px-1 text-[10px] text-muted-foreground border-r bg-muted/40 h-full flex items-center">৳</span>
      <input
        type="text"
        inputMode="decimal"
        aria-label="Unit price"
        value={draft}
        onChange={(e) => setDraft(sanitizePrice(e.target.value))}
        onBlur={() => {
          const next = Number(draft);
          if (draft === "" || Number.isNaN(next) || next < 0) {
            setDraft(String(value ?? ""));
            return;
          }
          if (next !== Number(value)) onChange(next);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-16 h-full bg-transparent px-1 text-xs text-right font-medium outline-none"
      />
    </div>
  );
};

// Renders a dialog to add a custom (non-catalogue) line item with name, unit price and quantity
// Validates the custom item fields and builds a cart line; shows a toast and returns null when invalid
const buildCustomLine = (name, price, quantity, pieces = []) => {
  const trimmedName = name.trim();
  const unitPrice = Number(price);
  const qty = parseInt(quantity, 10);
  if (!trimmedName) {
    toast.error("Item name is required.");
    return null;
  }
  if (price === "" || Number.isNaN(unitPrice) || unitPrice < 0) {
    toast.error("Enter a valid price.");
    return null;
  }
  if (!Number.isInteger(qty) || qty < 1) {
    toast.error("Quantity must be at least 1.");
    return null;
  }
  const cleanPieces = pieces
    .map((p) => ({ entity: p.entity, refId: p.refId, name: p.name, quantity: parseInt(p.quantity, 10) || 0 }))
    .filter((p) => p.quantity >= 1);
  if (cleanPieces.length !== pieces.length) {
    toast.error("Each inventory piece needs at least 1 unit.");
    return null;
  }
  return {
    ...(cleanPieces.length ? { pieces: cleanPieces } : {}),
    id: `custom__${Date.now()}`,
    name: trimmedName,
    price: unitPrice,
    quantity: qty,
    image: "",
    sku: "",
    size: "",
    productId: "",
    itemId: "",
    itemType: "custom",
    productDid: "",
  };
};


// Searches stock items (products are already pickable above) so a custom line can take real pieces out of inventory
const InventoryPiecesPicker = ({ pieces, onChange, lineQty }) => {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["custom-line-inventory", q],
    enabled: q.length > 0,
    queryFn: async () => {
      const fetchEntity = async (entity) => {
        const params = new URLSearchParams({ entity, status: "all", limit: "6", search: q });
        const res = await apiClient.get(`/api/v1/inventory?${params.toString()}`);
        return res.data?.data || [];
      };
      return fetchEntity("item");
    },
  });

  const addPiece = (row) => {
    if (pieces.some((p) => p.refId === row.id && p.entity === row.entity)) {
      toast.info(`"${row.name}" is already added.`);
      return;
    }
    const regular = Number(row.price) || 0;
    const offer = Number(row.offerPrice);
    const unitPrice = offer > 0 && offer < regular ? offer : regular;
    onChange([...pieces, { entity: row.entity, refId: row.id, name: row.name, quantity: "1", stock: row.stockAmount, unitPrice }]);
    setSearch("");
    setQ("");
  };

  const setUnits = (idx, value) => onChange(pieces.map((p, i) => (i === idx ? { ...p, quantity: value.replace(/\D/g, "") } : p)));
  const removePiece = (idx) => onChange(pieces.filter((_, i) => i !== idx));
  const qty = parseInt(lineQty, 10) || 1;

  return (
    <div className="mt-4 pt-3 border-t">
      <div className="flex items-center gap-1.5 mb-1">
        <Boxes className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Take from inventory</span>
        <span className="text-xs text-muted-foreground">(optional)</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        Pick the stock this product is made of. Units are per 1 quantity and leave stock when the order is placed.
      </p>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stock items by name or SKU" className="h-9 text-sm pl-8" />
        {q && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover shadow-lg">
            {isFetching && results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>
            ) : results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">Nothing found in inventory.</p>
            ) : (
              results.map((row) => (
                <button
                  type="button"
                  key={`${row.entity}-${row.id}`}
                  onClick={() => addPiece(row)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{row.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{row.entity === "item" ? "Item" : "Product"}{row.sku ? ` · ${row.sku}` : ""}</span>
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${row.stockAmount > 0 ? "text-emerald-600" : "text-destructive"}`}>
                    Stock: {row.stockAmount}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {pieces.length > 0 && (
        <div className="mt-3 space-y-2">
          {pieces.map((p, idx) => {
            const need = (parseInt(p.quantity, 10) || 0) * qty;
            const short = typeof p.stock === "number" && need > p.stock;
            return (
              <div key={`${p.entity}-${p.refId}`} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {typeof p.stock === "number" && (
                    <p className={`text-[11px] ${short ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      Stock {p.stock} · this order takes {need}{short ? " (not enough stock)" : ""}
                    </p>
                  )}
                </div>
                <label className="text-xs text-muted-foreground">Units</label>
                <Input value={p.quantity} inputMode="numeric" onChange={(e) => setUnits(idx, e.target.value)} className="h-8 w-16 text-sm text-right" aria-label={`Units of ${p.name}`} />
                <button type="button" onClick={() => removePiece(idx)} className="p-1 rounded text-destructive hover:bg-destructive/10 cursor-pointer" aria-label={`Remove ${p.name}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Inline card for adding a product that is not in the catalogue
export const CustomItemCard = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pieces, setPieces] = useState([]);

  // The first picked piece fills an empty name and price, so a plain stock sale needs no typing
  const handlePiecesChange = (next) => {
    if (pieces.length === 0 && next.length === 1) {
      if (!name.trim()) setName(next[0].name);
      if (price === "" && next[0].unitPrice > 0) setPrice(String(next[0].unitPrice));
    }
    setPieces(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const line = buildCustomLine(name, price, quantity, pieces);
    if (!line) return;
    onAdd(line);
    toast.success(`"${line.name}" added to the order.`);
    setName("");
    setPrice("");
    setQuantity("1");
    setPieces([]);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/80 rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-lg mb-1">Custom Product</h3>
      <p className="text-xs text-muted-foreground mb-4 pb-2 border-b">
        Add a product that is not in the catalogue, with its own name and price.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_auto] gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Product Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Special combo pack" className="h-9 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Unit Price (৳)</label>
          <Input value={price} inputMode="decimal" onChange={(e) => setPrice(sanitizePrice(e.target.value))} placeholder="0" className="h-9 text-sm text-right" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
          <Input value={quantity} inputMode="numeric" onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} className="h-9 text-sm text-right" />
        </div>
        <Button type="submit" className="h-9 gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
      {inventoryOn && <InventoryPiecesPicker pieces={pieces} onChange={handlePiecesChange} lineQty={quantity} />}
    </form>
  );
};

export const CustomItemDialog = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const reset = () => {
    setName("");
    setPrice("");
    setQuantity("1");
  };

  const handleAdd = () => {
    const line = buildCustomLine(name, price, quantity);
    if (!line) return;
    onAdd(line);
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Add Extra Item</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a service, gift wrap or any item that is not in the catalogue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Gift wrap" className="h-8 text-xs" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Unit Price (৳)</label>
              <Input value={price} inputMode="decimal" onChange={(e) => setPrice(sanitizePrice(e.target.value))} placeholder="0" className="h-8 text-xs text-right" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
              <Input value={quantity} inputMode="numeric" onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} className="h-8 text-xs text-right" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleAdd}>Add Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
