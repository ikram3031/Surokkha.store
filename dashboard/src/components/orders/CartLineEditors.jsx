import { useState } from "react";
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
import { Plus } from "lucide-react";

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
const buildCustomLine = (name, price, quantity) => {
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
  return {
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

// Inline card for adding a product that is not in the catalogue
export const CustomItemCard = ({ onAdd }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleSubmit = (e) => {
    e.preventDefault();
    const line = buildCustomLine(name, price, quantity);
    if (!line) return;
    onAdd(line);
    toast.success(`"${line.name}" added to the order.`);
    setName("");
    setPrice("");
    setQuantity("1");
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
