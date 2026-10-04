import React from 'react';
import { toast } from 'sonner';
import { Copy, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const AVAILABLE_TOKENS = [
  { token: '{{orderId}}', label: 'Order ID / No', example: '#10284' },
  { token: '{{customerName}}', label: 'Customer Name', example: 'Tanvir Ahmed' },
  { token: '{{customerPhone}}', label: 'Customer Phone', example: '+880 1712-345678' },
  { token: '{{customerEmail}}', label: 'Customer Email', example: 'tanvir@example.com' },
  { token: '{{customerAddress}}', label: 'Delivery Address', example: 'Banani, Dhaka' },
  { token: '{{totalAmount}}', label: 'Total Amount', example: '৳ 4,780' },
  { token: '{{subtotal}}', label: 'Subtotal', example: '৳ 4,950' },
  { token: '{{discount}}', label: 'Discount Amount', example: '৳ 250' },
  { token: '{{deliveryCharge}}', label: 'Delivery Fee', example: '৳ 80' },
  { token: '{{paidAmount}}', label: 'Paid Amount', example: '৳ 4,780' },
  { token: '{{dueAmount}}', label: 'Due / COD Amount', example: '৳ 0' },
  { token: '{{paymentMethod}}', label: 'Payment Method', example: 'bKash Online' },
  { token: '{{orderDate}}', label: 'Order Date', example: '04 Oct, 2026' },
  { token: '{{orderStatus}}', label: 'Order Status', example: 'Processing' },
  { token: '{{brandName}}', label: 'Brand Name', example: 'Store Name' },
  { token: '{{supportEmail}}', label: 'Support Email', example: 'support@brand.com' },
  { token: '{{supportPhone}}', label: 'Support Phone', example: '+880 1800-000000' },
  { token: '{{domain}}', label: 'Store URL / Domain', example: 'example.com' },
];

export function DynamicTokenChips({ onInsertToken, className = '' }) {
  const handleCopy = (token) => {
    navigator.clipboard.writeText(token);
    toast.success(`Copied "${token}" to clipboard!`);
    if (onInsertToken) {
      onInsertToken(token);
    }
  };

  return (
    <div className={`space-y-2.5 p-3 rounded-xl bg-muted/40 border border-border/70 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
        <span>Dynamic Interpolation Tokens</span>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Click any token below to copy it into your clipboard, then paste it into your notes, terms, email greetings, or custom headers.
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {AVAILABLE_TOKENS.map(({ token, label, example }) => (
          <button
            key={token}
            type="button"
            onClick={() => handleCopy(token)}
            title={`Example: ${example} (Click to copy)`}
            className="group flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-medium bg-background border border-border/80 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-pointer select-none shadow-xs"
          >
            <span>{token}</span>
            <Copy className="h-2.5 w-2.5 text-muted-foreground group-hover:text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default DynamicTokenChips;
