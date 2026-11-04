import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LifeBuoy,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  RefreshCw,
  Paperclip,
  FileText,
  X,
  AlertCircle,
  HelpCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clientConfig } from "@/clientConfig";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import axios from "axios";

const HUB_BASE_URL =
  import.meta.env.VITE_HUB_API_URL ||
  clientConfig?.hubApiUrl ||
  (import.meta.env.VITE_USE_LOCAL_BACKEND === 'true' && typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://hub.plexivia.online');

// Fetches live hosting alerts and status from Central Hub
const fetchBillingAlerts = async (clientKey) => {
  try {
    const res = await axios.get(`${HUB_BASE_URL}/api/billing/alerts/${clientKey}`, { timeout: 8000 });
    return res.data?.data || null;
  } catch {
    return null;
  }
};

// ── Support Desk API (Surokkha backend proxy → Plexivia) ─────────────────────────────
// Every call is same-origin through the authenticated apiClient; the Plexivia key lives only on the server.
// skipGlobalError: this page renders upstream messages itself (e.g. "ticket is closed") instead of a generic toast.
const SUPPORT_API = "/api/v1/support";
const REQ = { skipGlobalError: true };

const POLL_INTERVAL_MS = 60000;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const ATTACHMENT_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"];

// Pulls the status and the message the proxy relayed from Plexivia out of an axios error
const describeError = (err) => ({
  status: err?.response?.status || 0,
  message: err?.response?.data?.message || (err?.code === "ECONNABORTED" ? "The request timed out. Please try again." : err?.message) || "Something went wrong",
});

const fetchTickets = async () => {
  const res = await apiClient.get(`${SUPPORT_API}/tickets`, REQ);
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

const postTicket = async (payload) => {
  const res = await apiClient.post(`${SUPPORT_API}/tickets`, payload, { ...REQ, timeout: 20000 });
  return res.data?.data;
};

const postReply = async (ticketId, payload) => {
  const res = await apiClient.post(`${SUPPORT_API}/tickets/${encodeURIComponent(ticketId)}/messages`, payload, { ...REQ, timeout: 20000 });
  return res.data?.data;
};

// Raw bytes (not multipart): the file's mime as Content-Type plus its original name in X-File-Name
const uploadAttachment = async (file) => {
  const name = /^[\x20-\x7e]*$/.test(file.name) ? file.name : encodeURIComponent(file.name);
  const res = await apiClient.post(`${SUPPORT_API}/attachments`, file, {
    ...REQ,
    timeout: 45000,
    headers: { "Content-Type": file.type, "X-File-Name": name },
  });
  return res.data?.data;
};

// ── Display helpers ─────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  { value: "BUG", label: "Bug / Something is broken" },
  { value: "DEPLOYMENT", label: "Deployment / Update" },
  { value: "VPS", label: "VPS / Hosting" },
  { value: "BILLING", label: "Billing" },
  { value: "FEATURE", label: "Feature Request" },
];

const PRIORITY_OPTIONS = [
  { value: "MEDIUM", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent / Blocking Sales" },
  { value: "LOW", label: "Low Priority" },
];

const STATUS_META = {
  OPEN: { label: "Open", cls: "bg-amber-500/10 text-amber-500 border border-amber-500/20", pulse: true },
  IN_PROGRESS: { label: "In progress", cls: "bg-primary/10 text-primary border border-primary/20", pulse: true },
  WAITING_CLIENT: { label: "Awaiting your reply", cls: "bg-sky-500/10 text-sky-500 border border-sky-500/20", pulse: true },
  RESOLVED: { label: "Resolved", cls: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20", pulse: false },
  CLOSED: { label: "Closed", cls: "bg-muted text-muted-foreground border border-border", pulse: false },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_CLIENT", label: "Awaiting you" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const labelOf = (options, value) => options.find((o) => o.value === value)?.label || value || "";

const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

const fmtSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return n ? `${n} B` : "";
};

// Upload names with non-ASCII characters travel percent-encoded
const displayName = (name) => {
  try {
    return decodeURIComponent(name || "attachment");
  } catch {
    return name || "attachment";
  }
};

// First-response SLA state; is_overdue is computed server-side
const slaInfo = (t) => {
  if (t.is_overdue) {
    return { cls: "bg-destructive/10 text-destructive border border-destructive/20", text: "SLA overdue", title: `First response was due ${fmtDateTime(t.sla_due_at)}` };
  }
  if (t.first_response_at) {
    return { cls: "text-emerald-500", text: `Responded ${fmtDateTime(t.first_response_at)}`, title: "First response from the engineering team" };
  }
  if (t.sla_due_at && t.status === "OPEN") {
    return { cls: "text-muted-foreground", text: `Reply due by ${fmtDateTime(t.sla_due_at)}`, title: "First-response target" };
  }
  return null;
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.OPEN;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase flex items-center gap-1 whitespace-nowrap ${meta.cls}`}>
      {status === "RESOLVED" ? <CheckCircle2 className="w-3 h-3" /> : status === "CLOSED" ? <Lock className="w-3 h-3" /> : <span className={`w-1.5 h-1.5 rounded-full bg-current ${meta.pulse ? "animate-pulse" : ""}`} />}
      {meta.label}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  if (priority === "URGENT") return <Badge variant="destructive" className="text-[10px] uppercase font-semibold">Urgent</Badge>;
  if (priority === "HIGH") return <Badge variant="outline" className="text-[10px] uppercase font-semibold text-amber-500 border-amber-500/40">High</Badge>;
  if (priority === "LOW") return <Badge variant="outline" className="text-[10px] uppercase font-semibold">Low</Badge>;
  return null;
};

// Attachment links; urls arrive absolute from the backend, anything else is not rendered as a link
const AttachmentList = ({ attachments }) => {
  const items = (attachments || []).filter((a) => typeof a?.url === "string" && /^https?:\/\//i.test(a.url));
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((a, i) =>
        (a.mimeType || "").startsWith("image/") ? (
          <a key={`${a.url}-${i}`} href={a.url} target="_blank" rel="noreferrer" title={displayName(a.name)}>
            <img src={a.url} alt={displayName(a.name)} loading="lazy" className="h-20 max-w-[10rem] object-cover rounded-md border border-border bg-background" />
          </a>
        ) : (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-background text-[11px] text-primary hover:underline max-w-[14rem]"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{displayName(a.name)}</span>
            {a.size ? <span className="text-muted-foreground shrink-0">{fmtSize(a.size)}</span> : null}
          </a>
        )
      )}
    </div>
  );
};

// Support Desk main view component
export const SupportDesk = () => {
  const clientKey = clientConfig?.clientKey || "demo";
  const brandName = clientConfig?.brandName || "Store";
  const domain = clientConfig?.domain || window.location.hostname;

  const [tickets, setTickets] = useState([]);
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("BUG");
  const [priority, setPriority] = useState("MEDIUM");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closedNotice, setClosedNotice] = useState("");
  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  const selected = tickets.find((t) => t.dId === selectedId) || null;

  const upsertTicket = (ticket) => {
    if (!ticket?.dId) return;
    setTickets((prev) => (prev.some((t) => t.dId === ticket.dId) ? prev.map((t) => (t.dId === ticket.dId ? ticket : t)) : [ticket, ...prev]));
  };

  // Loads tickets (and, on first load / manual refresh, hosting alert telemetry from the central hub)
  const loadData = useCallback(
    async ({ manual = false, withBilling = false } = {}) => {
      if (manual) setRefreshing(true);
      try {
        const [ticketsData, billingData] = await Promise.all([
          fetchTickets().then((data) => ({ ok: true, data }), (err) => ({ ok: false, err })),
          withBilling || manual ? fetchBillingAlerts(clientKey) : Promise.resolve(undefined),
        ]);
        if (ticketsData.ok) {
          setTickets(ticketsData.data);
          setLoadError(null);
        } else {
          // Keep whatever we already show; surface the proxy's message inline instead of a toast on every poll
          setLoadError(describeError(ticketsData.err));
        }
        if (billingData !== undefined) setBillingInfo(billingData);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientKey]
  );

  useEffect(() => {
    loadData({ withBilling: true });
    const timer = setInterval(() => {
      if (!document.hidden) loadData();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadData]);

  // Keep the newest message in view when a thread opens or grows
  useEffect(() => {
    if (selectedId) threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [selectedId, selected?.messages?.length]);

  const openThread = (ticket) => {
    setSelectedId(ticket.dId);
    setReplyText("");
    setReplyFiles([]);
    setClosedNotice("");
  };

  const closeThread = () => {
    setSelectedId(null);
    setReplyText("");
    setReplyFiles([]);
    setClosedNotice("");
  };

  const openNewTicketDialog = (prefillSubject = "") => {
    if (prefillSubject) setSubject(prefillSubject);
    setModalOpen(true);
  };

  // A closed ticket can't take replies; carry its reference over into a fresh one
  const startFollowUp = (ticket) => {
    const ref = `Follow-up to ${ticket.ticket_number}`;
    closeThread();
    setCategory(ticket.category || "BUG");
    openNewTicketDialog(`${ref}: ${ticket.subject}`.slice(0, 200));
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    const cleanSubject = subject.trim();
    const cleanDesc = description.trim();
    if (!cleanSubject || !cleanDesc) {
      toast.error("Please add a subject and describe the issue");
      return;
    }

    setSubmitting(true);
    try {
      const created = await postTicket({ subject: cleanSubject, description: cleanDesc, category, priority });
      upsertTicket(created);
      toast.success(created?.ticket_number ? `Ticket ${created.ticket_number} submitted. The engineering team has been notified.` : "Ticket submitted. The engineering team has been notified.");
      setSubject("");
      setDescription("");
      setCategory("BUG");
      setPriority("MEDIUM");
      setModalOpen(false);
    } catch (err) {
      toast.error(describeError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;

    const room = MAX_ATTACHMENTS - replyFiles.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_ATTACHMENTS} files per reply`);
      return;
    }

    setUploading(true);
    for (const file of picked.slice(0, room)) {
      if (!ATTACHMENT_MIME.includes(file.type)) {
        toast.error(`${file.name}: only PNG, JPEG, WebP, GIF or PDF files are accepted`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name} is larger than 5 MB`);
        continue;
      }
      try {
        const uploaded = await uploadAttachment(file);
        if (uploaded) setReplyFiles((prev) => [...prev, uploaded]);
      } catch (err) {
        toast.error(`${file.name}: ${describeError(err).message}`);
      }
    }
    if (picked.length > room) toast.error(`Only ${MAX_ATTACHMENTS} files can be attached; the rest were skipped`);
    setUploading(false);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    const message = replyText.trim();
    if (!selected || !message) return;

    setSending(true);
    try {
      const updated = await postReply(selected.dId, { message, ...(replyFiles.length ? { attachments: replyFiles } : {}) });
      upsertTicket(updated);
      setReplyText("");
      setReplyFiles([]);
      setClosedNotice("");
    } catch (err) {
      const { status, message: upstreamMessage } = describeError(err);
      if (status === 400 && /closed/i.test(upstreamMessage)) {
        // The ticket was closed while the thread was open: explain it in place and sync the list
        setClosedNotice(upstreamMessage);
        loadData();
      } else {
        toast.error(upstreamMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const filteredTickets = tickets.filter((t) => filterStatus === "all" || t.status === filterStatus);

  const totalCount = tickets.length;
  const activeCount = tickets.filter((t) => ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"].includes(t.status)).length;
  const waitingCount = tickets.filter((t) => t.status === "WAITING_CLIENT").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;
  const overdueCount = tickets.filter((t) => t.is_overdue).length;

  const notConfigured = loadError?.status === 503;
  const selectedClosed = selected?.status === "CLOSED" || Boolean(closedNotice);
  const selectedSla = selected ? slaInfo(selected) : null;

  return (
    <div className="page-container space-y-6 p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">Support & Engineering Desk</h1>
              <Badge variant="outline" className="text-[11px] font-mono font-medium">
                {brandName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData({ manual: true })}
            disabled={refreshing}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => openNewTicketDialog()}
            disabled={notConfigured}
            className="text-xs gap-1.5 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Report Issue / Bug
          </Button>
        </div>
      </div>

      {billingInfo?.showWarningBanner && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h3 className="font-bold text-amber-500 text-sm">হোস্টিং রিনিউয়াল নোটিফিকেশন</h3>
            <p className="mt-1 text-foreground/90 leading-relaxed">{billingInfo.warningMessage}</p>
            <div className="mt-2.5 flex items-center gap-2 text-muted-foreground font-mono">
              <span>মেয়াদ শেষ: {billingInfo.hostingExpiryDate ? billingInfo.hostingExpiryDate.slice(0, 10) : "N/A"}</span>
              <span>•</span>
              <span>প্যাকেজ: {billingInfo.hostingPackage}</span>
            </div>
          </div>
        </div>
      )}

      {loadError && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 shadow-sm text-xs border ${
            notConfigured ? "bg-amber-500/10 border-amber-500/30" : "bg-destructive/10 border-destructive/30"
          }`}
        >
          <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${notConfigured ? "text-amber-500" : "text-destructive"}`} />
          <div className="flex-1">
            <h3 className={`font-bold text-sm ${notConfigured ? "text-amber-500" : "text-destructive"}`}>
              {notConfigured ? "Support Desk is not set up yet" : loadError.status === 403 ? "No access to the Support Desk" : "Could not load support tickets"}
            </h3>
            <p className="mt-1 text-foreground/90 leading-relaxed">
              {loadError.status === 403 ? "Your role does not have access to the Support Desk. Ask an Owner, Admin or Manager." : loadError.message}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Tickets</span>
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground mt-2">{totalCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Submitted from your store</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-500 text-xs font-medium">
            <span>Active / In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500 mt-2">{activeCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {waitingCount > 0 ? `${waitingCount} awaiting your reply` : "Under engineering review"}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 text-xs font-medium">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Issues resolved & closed</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className={`flex items-center justify-between text-xs font-medium ${overdueCount ? "text-destructive" : "text-muted-foreground"}`}>
            <span>SLA Overdue</span>
            <AlertTriangle className={`w-4 h-4 ${overdueCount ? "text-destructive" : "text-emerald-500"}`} />
          </div>
          <div className={`text-2xl font-bold mt-2 ${overdueCount ? "text-destructive" : "text-emerald-500"}`}>{overdueCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {overdueCount ? "Waiting past the first-response target" : "All within response targets"}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Ticket History & Status
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Open a ticket to read the conversation and reply to our engineers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition ${
                  filterStatus === f.value
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
            <HelpCircle className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">{tickets.length === 0 ? "No support tickets found" : "No tickets with this status"}</p>
            {tickets.length === 0 && !loadError && (
              <p className="text-xs text-muted-foreground">
                If you notice any bug or discrepancy, click "Report Issue / Bug" above.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const sla = slaInfo(ticket);
              const lastMessage = ticket.messages?.[ticket.messages.length - 1];
              const replies = Math.max((ticket.messages?.length || 1) - 1, 0);
              return (
                <button
                  type="button"
                  key={ticket.dId}
                  onClick={() => openThread(ticket)}
                  className="w-full text-left bg-muted/20 hover:bg-muted/40 border border-border/70 rounded-xl p-4 transition text-xs space-y-2.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-muted-foreground">{ticket.ticket_number}</span>
                      <h3 className="font-bold text-foreground text-sm">{ticket.subject}</h3>
                      <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                        {labelOf(CATEGORY_OPTIONS, ticket.category)}
                      </Badge>
                      <PriorityBadge priority={ticket.priority} />
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusPill status={ticket.status} />
                      <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ticket.created_at ? ticket.created_at.slice(0, 10) : ""}
                      </span>
                    </div>
                  </div>

                  <p className="text-foreground/85 leading-relaxed line-clamp-2 whitespace-pre-wrap">
                    {lastMessage?.body || ticket.description}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {replies} {replies === 1 ? "reply" : "replies"}
                    </span>
                    {lastMessage?.author_type === "ADMIN" && (
                      <span className="text-primary font-medium">Latest from engineering</span>
                    )}
                    {sla && (
                      <span
                        title={sla.title}
                        className={`${ticket.is_overdue ? "px-2 py-0.5 rounded-full font-semibold uppercase" : ""} ${sla.cls}`}
                      >
                        {sla.text}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Conversation thread */}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeThread()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
          {selected && (
            <>
              <DialogHeader className="p-5 pb-3 border-b border-border space-y-2">
                <DialogTitle className="text-base flex items-center gap-2 flex-wrap pr-6">
                  <span className="font-mono text-muted-foreground">{selected.ticket_number}</span>
                  <span>{selected.subject}</span>
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap text-xs">
                    <StatusPill status={selected.status} />
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {labelOf(CATEGORY_OPTIONS, selected.category)}
                    </Badge>
                    <PriorityBadge priority={selected.priority} />
                    {selectedSla && (
                      <span title={selectedSla.title} className={`text-[11px] ${selected.is_overdue ? "px-2 py-0.5 rounded-full font-semibold uppercase" : ""} ${selectedSla.cls}`}>
                        {selectedSla.text}
                      </span>
                    )}
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[12rem]">
                {(selected.messages?.length ? selected.messages : [{ dId: "desc", author_type: "CLIENT", author_name: brandName, body: selected.description, created_at: selected.created_at }]).map((m) => {
                  const fromEngineer = m.author_type === "ADMIN";
                  return (
                    <div key={m.dId} className={`flex ${fromEngineer ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs border ${
                          fromEngineer
                            ? "bg-muted/50 border-border rounded-tl-sm"
                            : "bg-primary/10 border-primary/20 rounded-tr-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold ${fromEngineer ? "text-foreground" : "text-primary"}`}>
                            {fromEngineer ? m.author_name || "Engineering team" : "You"}
                          </span>
                          <Badge variant={fromEngineer ? "secondary" : "outline"} className="text-[9px] uppercase h-4 px-1.5">
                            {fromEngineer ? "Support" : m.author_name || "Client"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">{fmtDateTime(m.created_at)}</span>
                        </div>
                        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{m.body}</p>
                        <AttachmentList attachments={m.attachments} />
                      </div>
                    </div>
                  );
                })}
                <div ref={threadEndRef} />
              </div>

              {selectedClosed ? (
                <div className="p-5 border-t border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs text-foreground/90">
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{closedNotice || "This ticket is closed. Please open a new one."}</span>
                  </div>
                  <Button size="sm" onClick={() => startFollowUp(selected)} className="gap-1.5 text-xs font-semibold shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                    Open a new ticket
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="p-5 border-t border-border space-y-3">
                  {selected.status === "RESOLVED" && (
                    <p className="text-[11px] text-muted-foreground">This ticket is marked resolved. Replying will reopen it for the engineering team.</p>
                  )}
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="w-full bg-background border border-input rounded-md p-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 placeholder:italic focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  {replyFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {replyFiles.map((f, i) => (
                        <span key={`${f.url}-${i}`} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md border border-border bg-muted/40 text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span className="truncate max-w-[10rem]">{displayName(f.name)}</span>
                          <span className="text-muted-foreground">{fmtSize(f.size)}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${displayName(f.name)}`}
                            onClick={() => setReplyFiles((prev) => prev.filter((_, idx) => idx !== i))}
                            className="p-0.5 rounded hover:bg-background text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ATTACHMENT_MIME.join(",")}
                        onChange={handlePickFiles}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading || sending || replyFiles.length >= MAX_ATTACHMENTS}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5 text-xs h-8"
                      >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                        {uploading ? "Uploading..." : "Attach"}
                      </Button>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">PNG, JPEG, WebP, GIF or PDF, up to 5 MB</span>
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={sending || uploading || !replyText.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {sending ? "Sending..." : "Send Reply"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New ticket */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="w-5 h-5 text-primary" />
              Report an Issue / Get Engineering Support
            </DialogTitle>
            <DialogDescription className="text-xs">
              Client: <span className="font-bold text-foreground font-mono">{brandName}</span> ({clientKey})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitTicket} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-background border border-input rounded-md p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-background border border-input rounded-md p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Subject <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="Brief one-line summary..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
                className="text-xs h-9 placeholder:text-muted-foreground/40 placeholder:italic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Detailed Description <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Explain what happened or what needs to be fixed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-background border border-input rounded-md p-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 placeholder:italic focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="p-3 bg-muted/40 border border-border/80 rounded-lg text-[11px] text-muted-foreground flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                You can add screenshots or files once the ticket is open, by replying in the conversation.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="cancel" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportDesk;
