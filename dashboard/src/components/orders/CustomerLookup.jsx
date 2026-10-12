import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  UserCheck,
  Phone,
  Mail,
  MapPin,
  History,
  X,
  Loader2,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatPhoneForOrderInput } from "@/hooks/use-customers";

/**
 * Floating dropdown displaying matching existing customers when typing Phone or Email
 */
export function CustomerSuggestionsDropdown({
  customers = [],
  isLoading = false,
  open = false,
  onSelect,
}) {
  if (!open || (!isLoading && customers.length === 0)) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
      <div className="bg-muted/50 px-3 py-1.5 border-b border-border/60 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Existing Customer Matches
        </span>
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </div>

      <div className="max-h-60 overflow-y-auto divide-y divide-border/40 scrollbar-thin">
        {customers.map((c) => {
          const fullName = c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ");
          return (
            <button
              key={c.id || c.did || c.phone}
              type="button"
              onMouseDown={(e) => {
                // Prevent input blur before selection fires
                e.preventDefault();
                onSelect?.(c);
              }}
              className="w-full px-3 py-2.5 text-left hover:bg-primary/8 transition-colors flex items-start justify-between gap-2 cursor-pointer group"
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary truncate">
                    {fullName}
                  </span>
                  {c.totalOrders > 0 && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                      {c.totalOrders} {c.totalOrders === 1 ? "order" : "orders"}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {c.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="h-2.5 w-2.5 text-primary/70" />
                      {c.phone}
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1 truncate max-w-[180px]">
                      <Mail className="h-2.5 w-2.5 text-primary/70" />
                      {c.email}
                    </span>
                  )}
                </div>

                {(c.address || c.district || c.thana) && (
                  <p className="text-[10px] text-muted-foreground/80 truncate flex items-center gap-1 pt-0.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">
                      {[c.address, c.thana, c.district].filter(Boolean).join(", ")}
                    </span>
                  </p>
                )}
              </div>

              <span className="text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center bg-primary/10 px-2 py-1 rounded-md">
                Autofill
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Banner displayed when an existing customer is selected & autofilled.
 * Detects live edits and allows inspecting the customer's JSON update history.
 */
export function SelectedCustomerBanner({
  customer,
  currentValues = {},
  onClear,
  phoneLength = 11,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const modifiedFields = useMemo(() => {
    if (!customer) return [];
    const diffs = [];
    const origName = (customer.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(" ")).trim();
    const currName = (currentValues.name || "").trim();
    if (currName && currName !== origName) diffs.push("Name");

    const origPhone = formatPhoneForOrderInput(customer.phone, phoneLength);
    const currPhone = formatPhoneForOrderInput(currentValues.phone, phoneLength);
    if (currPhone && currPhone !== origPhone) diffs.push("Phone");

    const origEmail = (customer.email || "").trim().toLowerCase();
    const currEmail = (currentValues.email || "").trim().toLowerCase();
    if (currEmail !== origEmail) diffs.push("Email");

    const origAddr = (customer.address || "").trim();
    const currAddr = (currentValues.address || "").trim();
    if (currAddr && currAddr !== origAddr) diffs.push("Address");

    const origDist = (customer.district || "").trim().toLowerCase();
    const currDist = (currentValues.district || "").trim().toLowerCase();
    if (currDist && currDist !== origDist) diffs.push("District");

    const origThana = (customer.thana || "").trim().toLowerCase();
    const currThana = (currentValues.thana || "").trim().toLowerCase();
    if (currThana !== origThana) diffs.push("Thana");

    return diffs;
  }, [customer, currentValues, phoneLength]);

  const parsedHistory = useMemo(() => {
    if (!customer || !Array.isArray(customer.history)) return [];
    return [...customer.history]
      .map((item) => {
        try {
          return typeof item === "string" ? JSON.parse(item) : item;
        } catch {
          return { note: String(item) };
        }
      })
      .reverse();
  }, [customer]);

  if (!customer) return null;

  const fullName = customer.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(" ");

  return (
    <>
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground truncate">{fullName}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                Existing Customer
              </Badge>
              {customer.totalOrders > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  • {customer.totalOrders} orders
                </span>
              )}
            </div>
            {modifiedFields.length > 0 ? (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                Edited ({modifiedFields.join(", ")}) — will update customer & save history on submit
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Auto-filled from saved profile ({customer.phone})
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {parsedHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition cursor-pointer"
              title="View customer update history"
            >
              <History className="h-3 w-3 text-primary" />
              <span>History ({parsedHistory.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center justify-center h-6 w-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
            title="Unlink customer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Customer Update History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4 text-primary" />
              Customer Audit History — {fullName}
            </DialogTitle>
            <DialogDescription className="text-xs">
              DID: <span className="font-mono">{customer.did}</span> • Phone:{" "}
              <span className="font-mono">{customer.phone}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-2 scrollbar-thin">
            {parsedHistory.map((entry, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-muted/20 p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={entry.action === "created" ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0 uppercase"
                    >
                      {entry.action || "log"}
                    </Badge>
                    {entry.orderNumber && (
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        #{entry.orderNumber}
                      </span>
                    )}
                  </div>
                  {entry.timestamp && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>

                {entry.note && (
                  <p className="text-[11px] text-muted-foreground">{entry.note}</p>
                )}

                {entry.changes && Object.keys(entry.changes).length > 0 && (
                  <div className="rounded-lg bg-background border border-border/60 p-2 space-y-1 mt-1">
                    {Object.entries(entry.changes).map(([field, diff]) => (
                      <div key={field} className="flex items-center gap-1.5 text-[11px] flex-wrap">
                        <span className="font-semibold capitalize text-foreground min-w-[65px]">
                          {field}:
                        </span>
                        <span className="line-through text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {diff?.old || "(empty)"}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {diff?.new || "(empty)"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
