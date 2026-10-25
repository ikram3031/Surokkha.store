import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';
import { ACTION_BTN, money } from './pathaoUtils';

const postCsv = async (csvText, { apply, invoiceId }) => {
  const res = await apiClient.post('/api/v1/courier/pathao/invoices/import', csvText, {
    headers: { 'Content-Type': 'text/csv' },
    params: { apply, ...(invoiceId ? { invoiceId } : {}) },
  });
  return res.data?.data;
};

// Two-step import of a Pathao invoice CSV: preview the match, then apply exact figures
export default function InvoiceImportDialog({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [preview, setPreview] = useState(null);

  const reset = () => {
    setCsvText('');
    setFileName('');
    setInvoiceId('');
    setPreview(null);
  };

  const previewMutation = useMutation({
    mutationFn: () => postCsv(csvText, { apply: false, invoiceId }),
    onSuccess: setPreview,
    onError: (err) => toast.error(getApiErrorMessage(err, 'Could not read the invoice')),
  });

  const applyMutation = useMutation({
    mutationFn: () => postCsv(csvText, { apply: true, invoiceId }),
    onSuccess: (data) => {
      toast.success(`${data?.totals?.applicable ?? 0} parcel(s) marked settled`);
      queryClient.invalidateQueries({ queryKey: ['pathao-parcels'] });
      queryClient.invalidateQueries({ queryKey: ['pathao-summary'] });
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Import failed')),
  });

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      toast.error('Please export the Pathao invoice as CSV and upload that file.');
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    setCsvText(await file.text());
    setPreview(null);
  };

  const totals = preview?.totals;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Pathao invoice</DialogTitle>
          <DialogDescription>
            Upload the invoice CSV from Pathao's merchant panel. Matched parcels get Pathao's exact charges and payout and are marked settled.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pathao-invoice-file">Invoice CSV</Label>
            <Input id="pathao-invoice-file" type="file" accept=".csv,text/csv" onChange={handleFile} />
            {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pathao-invoice-id">Invoice ID (if not a column in the file)</Label>
            <Input id="pathao-invoice-id" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="e.g. INV-992384" />
          </div>
        </div>

        {preview && (
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Detected columns:{' '}
              {Object.entries(preview.detectedColumns).map(([key, header]) => (
                <span key={key} className="inline-block mr-2">
                  <b>{key}</b> ← {header}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
              <div className="rounded border p-2">Rows <b className="block">{totals.rows}</b></div>
              <div className="rounded border p-2">Will settle <b className="block">{totals.applicable}</b></div>
              <div className="rounded border p-2">Payout <b className="block">{money(totals.netPayout)}</b></div>
              <div className="rounded border p-2">Mismatches <b className="block text-amber-600">{totals.mismatched}</b></div>
              <div className="rounded border p-2">Not matched <b className="block text-red-600">{totals.errors}</b></div>
            </div>
            <div className="rounded-md border max-h-80 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consignment</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead className="text-right">Collected</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead className="text-right">vs estimate</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.rows.map((r) => (
                    <TableRow key={r.consignmentId} className={r.error ? 'bg-red-500/5' : r.mismatch ? 'bg-amber-500/5' : ''}>
                      <TableCell className="font-mono text-xs">{r.consignmentId}</TableCell>
                      <TableCell>{r.orderNumber ? `#${r.orderNumber}` : '—'}</TableCell>
                      <TableCell className="text-right">{money(r.exact?.collectedAmount)}</TableCell>
                      <TableCell className="text-right">{money(r.exact?.totalCharge)}</TableCell>
                      <TableCell className="text-right font-medium">{money(r.exact?.netPayout)}</TableCell>
                      <TableCell className="text-right">{r.difference === null ? '—' : money(r.difference)}</TableCell>
                      <TableCell className="text-xs">{r.error || (r.alreadySettled ? 'Already settled' : r.mismatch ? 'Differs from estimate' : '')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!preview ? (
            <Button type="button" className={ACTION_BTN} disabled={!csvText || previewMutation.isPending} onClick={() => previewMutation.mutate()}>
              {previewMutation.isPending ? 'Reading…' : 'Preview'}
            </Button>
          ) : (
            <Button type="button" className={ACTION_BTN} disabled={!totals?.applicable || applyMutation.isPending} onClick={() => applyMutation.mutate()}>
              {applyMutation.isPending ? 'Applying…' : `Settle ${totals?.applicable ?? 0} parcel(s)`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
