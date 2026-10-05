import { useState, useEffect } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

// Modal component to send order invoice via email to the customer or arbitrary recipient
export const SendOrderInvoiceModal = ({
  open,
  onOpenChange,
  order,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (open && order) {
      const defaultEmail = order.billingInfo?.email || order.customerEmail || order.email || '';
      setRecipientEmail(defaultEmail);
    }
  }, [open, order]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address.');
      return;
    }

    const orderIdentifier = order?._id || order?.id || order?.did || order?.orderNumber;
    if (!orderIdentifier) {
      toast.error('Order ID not found.');
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('Sending invoice email...');
    try {
      const res = await apiClient.post(`/api/v1/orders/${orderIdentifier}/send-invoice-email`, {
        email: recipientEmail.trim(),
      });

      if (res.data?.status === 'success' || res.data?.success) {
        toast.success(res.data?.message || 'Invoice email sent successfully!', { id: toastId });
        onOpenChange(false);
      } else {
        toast.error(res.data?.message || 'Failed to send invoice email.', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error sending invoice email.', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const orderNum = order?.orderNumber || order?.did || order?.id || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Send Invoice via Email</DialogTitle>
              <DialogDescription className="text-xs">
                Send official order invoice {orderNum ? `#${orderNum}` : ''} directly to recipient inbox.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Recipient Email Address</Label>
            <Input
              type="email"
              placeholder="e.g. customer@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              className="text-xs h-9"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Recipient will receive the full branded invoice and order details.
            </p>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
              className="text-xs h-8 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending}
              className="text-xs h-8 font-semibold gap-1.5 cursor-pointer"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Invoice</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendOrderInvoiceModal;
