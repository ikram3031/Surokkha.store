import React, { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2 } from 'lucide-react';
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

export function SendTestEmailModal({
  open,
  onOpenChange,
  templateConfig,
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [templateType, setTemplateType] = useState('email'); // 'email' | 'invoice'
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Please enter a valid recipient email address.');
      return;
    }

    setIsSending(true);
    const toastId = toast.loading('Sending test template email...');
    try {
      const res = await apiClient.post('/api/v1/settings/templates/test-email', {
        recipientEmail: recipientEmail.trim(),
        templateType,
        templateConfig,
      });

      if (res.data?.success) {
        toast.success(res.data?.message || 'Test email dispatched successfully!', { id: toastId });
        onOpenChange(false);
      } else {
        toast.error(res.data?.message || 'Failed to dispatch test email', { id: toastId });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error sending test email', { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">Send Test Email</DialogTitle>
              <DialogDescription className="text-xs">
                Dispatch a live preview of this template directly to your inbox.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 py-2">
          {/* Recipient Email */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Recipient Email Address</Label>
            <Input
              type="email"
              placeholder="e.g. admin@yourdomain.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              required
              className="text-xs h-9"
            />
          </div>

          {/* Template Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Template Layout Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('email')}
                className={`flex flex-col items-start p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  templateType === 'email'
                    ? 'border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <span className="font-bold text-foreground">Transactional Email</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Customer order notification HTML</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('invoice')}
                className={`flex flex-col items-start p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                  templateType === 'invoice'
                    ? 'border-primary bg-primary/5 text-primary font-semibold ring-1 ring-primary'
                    : 'border-border/80 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <span className="font-bold text-foreground">Vector A4 Invoice</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">Full printable receipt HTML</span>
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSending}
              className="text-xs h-8 font-semibold gap-1.5"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SendTestEmailModal;
