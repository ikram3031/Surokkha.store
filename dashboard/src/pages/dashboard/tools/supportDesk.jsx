import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Plus,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Server,
  CreditCard,
  X,
  AlertCircle,
  HelpCircle,
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
import { toast } from "sonner";
import axios from "axios";

const HUB_BASE_URL =
  import.meta.env.VITE_HUB_API_URL ||
  clientConfig?.hubApiUrl ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "http://144.79.218.241:5000");

// Fetches live hosting alerts and status from Central Hub
const fetchBillingAlerts = async (clientKey) => {
  try {
    const res = await axios.get(`${HUB_BASE_URL}/api/billing/alerts/${clientKey}`, { timeout: 8000 });
    return res.data?.data || null;
  } catch {
    return null;
  }
};

// Fetches submitted support tickets for active client
const fetchTickets = async (clientKey) => {
  try {
    const res = await axios.get(`${HUB_BASE_URL}/api/tickets?clientKey=${clientKey}`, { timeout: 8000 });
    return res.data?.data || [];
  } catch {
    return [];
  }
};

// Submits a new support ticket to Central Hub
const postTicket = async (payload) => {
  const res = await axios.post(`${HUB_BASE_URL}/api/tickets`, payload, { timeout: 12000 });
  return res.data;
};

// Support Desk main view component
export const SupportDesk = () => {
  const clientKey = clientConfig?.clientKey || "decantre";
  const brandName = clientConfig?.brandName || "Store";
  const domain = clientConfig?.domain || window.location.hostname;

  const [tickets, setTickets] = useState([]);
  const [billingInfo, setBillingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState("ui_bug");
  const [priority, setPriority] = useState("normal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Loads tickets and hosting alert telemetry from central hub
  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [ticketsData, billingData] = await Promise.all([
        fetchTickets(clientKey),
        fetchBillingAlerts(clientKey),
      ]);
      setTickets(ticketsData);
      setBillingInfo(billingData);
    } catch {
      toast.error("Failed to fetch support data from Central Hub");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      loadData();
    }, 30000);
    return () => clearInterval(timer);
  }, [clientKey]);

  // Submits support ticket with automatic title fallback and sanitized inputs
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    if (!cleanTitle && !cleanDesc) {
      toast.error("Please provide a description of the issue");
      return;
    }

    const finalTitle = cleanTitle || (cleanDesc.length > 60 ? `${cleanDesc.slice(0, 57)}...` : cleanDesc);
    const finalDesc = cleanDesc || cleanTitle;

    setSubmitting(true);
    try {
      await postTicket({
        clientKey,
        category,
        priority,
        title: finalTitle,
        description: finalDesc,
        pageUrl: window.location.href,
        browserInfo: `${navigator.userAgent} (${window.screen.width}x${window.screen.height})`,
        errorLogs: [`Submitted from ${brandName} eCommerce Admin Dashboard`],
      });

      toast.success("Support ticket submitted! Engineering team has been notified.");
      setTitle("");
      setDescription("");
      setCategory("ui_bug");
      setPriority("normal");
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 animate-in fade-in duration-300">
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
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="text-xs gap-1.5 h-9"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
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
              <span>মেয়াদ শেষ: {billingInfo.hostingExpiryDate ? billingInfo.hostingExpiryDate.slice(0, 10) : "N/A"}</span>
              <span>•</span>
              <span>প্যাকেজ: {billingInfo.hostingPackage}</span>
            </div>
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
          <div className="text-2xl font-bold text-amber-500 mt-2">{openCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Under engineering review</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 text-xs font-medium">
            <span>Resolved Tickets</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Issues resolved & verified</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Storefront API</span>
            <Server className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500 mt-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            99.9%
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Live VPS Operational</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Ticket History & Status
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track the progress and engineer responses for your reported issues.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/60">
            {["all", "open", "in_progress", "resolved"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider transition ${
                  filterStatus === st
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.replace("_", " ")}
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
            <p className="text-sm font-medium text-foreground">No support tickets found</p>
            <p className="text-xs text-muted-foreground">
              If you notice any bug or discrepancy, click "Report Issue / Bug" above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-muted/20 hover:bg-muted/40 border border-border/70 rounded-xl p-4 transition text-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-muted-foreground">#{ticket.id}</span>
                    <h3 className="font-bold text-foreground text-sm">{ticket.title}</h3>
                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                      {ticket.category.replace("_", " ")}
                    </Badge>
                    {ticket.priority === "urgent" && (
                      <Badge variant="destructive" className="text-[10px] uppercase font-semibold">
                        Urgent
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase flex items-center gap-1 ${
                        ticket.status === "resolved" || ticket.status === "closed"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : ticket.status === "in_progress"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      }`}
                    >
                      {ticket.status === "resolved" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      )}
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className="text-muted-foreground font-mono text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {ticket.createdAt ? ticket.createdAt.slice(0, 10) : ""}
                    </span>
                  </div>
                </div>

                <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

                {ticket.pageUrl && (
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono pt-0.5">
                    <span>Page:</span>
                    <a
                      href={ticket.pageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline flex items-center gap-0.5 truncate max-w-md"
                    >
                      {ticket.pageUrl}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {ticket.resolutionNotes && (
                  <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
                    <div className="font-bold text-foreground text-xs mb-0.5">Engineer Response / Resolution:</div>
                    <p className="text-foreground/90">{ticket.resolutionNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
                  <option value="ui_bug">UI / Visual Bug</option>
                  <option value="order_flow">Order Processing Error</option>
                  <option value="payment">Payment Gateway</option>
                  <option value="stock">Stock / Inventory</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-background border border-input rounded-md p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent / Blocking Sales</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Issue Summary <span className="text-[11px] font-normal text-muted-foreground/60">(Optional)</span>
              </label>
              <Input
                type="text"
                placeholder="Brief one-line summary..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                Browser environment, screen resolution, and current URL will be automatically attached to help resolve your issue faster.
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
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
