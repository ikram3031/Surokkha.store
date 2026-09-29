import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  Trash2,
  Search,
  Pause,
  Play,
  Download,
  Database,
  RefreshCw,
  Activity,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function SystemLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef(null);

  // Fetch initial logs
  const fetchLogs = async () => {
    try {
      const response = await apiClient.get("/api/v1/developer/logs");
      if (response.data?.status === "success" && Array.isArray(response.data.data)) {
        setLogs(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load initial logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();

    let eventSource = null;
    try {
      const baseUrl = apiClient.defaults.baseURL || window.location.origin;
      const token = localStorage.getItem("accessToken") || localStorage.getItem("auth_token") || localStorage.getItem("token");
      const sseUrl = `${baseUrl}/api/v1/developer/logs/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onmessage = (event) => {
        if (isPaused) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "INIT" && Array.isArray(parsed.logs)) {
            setLogs(parsed.logs);
          } else if (parsed.timestamp || parsed.message || parsed.path) {
            setLogs((prev) => [...prev.slice(-400), parsed]);
          }
        } catch {
          // fallback plain string
          if (event.data) {
            setLogs((prev) => [...prev.slice(-400), { message: event.data, timestamp: new Date().toISOString() }]);
          }
        }
      };

      eventSource.onerror = () => {
        // Fallback to polling every 3 seconds if SSE fails
        eventSource?.close();
      };
    } catch {
      // SSE not available
    }

    // Polling interval fallback
    const interval = setInterval(() => {
      if (!isPaused && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        fetchLogs();
      }
    }, 3000);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [isPaused]);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleDownloadBackup = async () => {
    try {
      setIsDownloading(true);
      const response = await apiClient.get("/api/v1/developer/db-backup", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/gzip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `mongodb_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json.gz`;
      if (contentDisposition) {
        const matches = /filename="?([^";]+)"?/g.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Database backup downloaded successfully!");
    } catch (err) {
      console.error("Backup download failed:", err);
      toast.error("Failed to download database backup.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getMethodBadge = (method) => {
    const m = (method || "").toUpperCase();
    switch (m) {
      case "GET":
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-mono">GET</Badge>;
      case "POST":
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-mono">POST</Badge>;
      case "PUT":
      case "PATCH":
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-mono">{m}</Badge>;
      case "DELETE":
        return <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px] font-mono">DEL</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-mono">{m || "LOG"}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = parseInt(status, 10);
    if (s >= 200 && s < 300) {
      return <span className="font-mono font-semibold text-emerald-500">{s}</span>;
    }
    if (s >= 300 && s < 400) {
      return <span className="font-mono font-semibold text-blue-400">{s}</span>;
    }
    if (s >= 400 && s < 500) {
      return <span className="font-mono font-semibold text-amber-500">{s}</span>;
    }
    return <span className="font-mono font-semibold text-destructive">{s}</span>;
  };

  // Formats log timestamp into localized time string or raw fallback
  const formatLogTime = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-GB", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      });
    }
    if (typeof ts === "string" && /^\d{2}:\d{2}:\d{2}/.test(ts)) {
      return ts;
    }
    return String(ts);
  };

  const filteredLogs = logs.filter((log) => {
    const text = typeof log === "string" ? log : JSON.stringify(log);
    const matchesQuery = !filter || text.toLowerCase().includes(filter.toLowerCase());
    const matchesMethod =
      methodFilter === "ALL" ||
      (typeof log === "object" && log.method && log.method.toUpperCase() === methodFilter);
    return matchesQuery && matchesMethod;
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">System & API Logs</h2>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Realtime monitoring of live backend API requests, status codes, and server execution logs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className="shadow-2xs text-xs"
          >
            {isPaused ? <Play className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> : <Pause className="h-3.5 w-3.5 mr-1.5 text-amber-500" />}
            {isPaused ? "Resume Live" : "Pause Stream"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogs([])}
            className="shadow-2xs text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadBackup}
            disabled={isDownloading}
            className="shadow-2xs text-xs font-medium"
          >
            <Database className={`h-3.5 w-3.5 mr-1.5 text-primary ${isDownloading ? "animate-spin" : ""}`} />
            {isDownloading ? "Downloading..." : "Database Backup"}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 w-full sm:max-w-md relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter by endpoint, status, message, or IP..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8 h-9 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center rounded-lg border bg-card p-0.5 text-xs">
            {["ALL", "GET", "POST", "PUT", "DELETE"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-all ${
                  methodFilter === m
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <Button
            variant={autoScroll ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className="h-8 text-xs shrink-0"
            title="Auto-scroll to latest log"
          >
            <ArrowDown className="h-3.5 w-3.5 mr-1" />
            {autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}
          </Button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 shadow-xl overflow-hidden font-mono text-xs">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/90 border-b border-zinc-800 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block" />
            <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block" />
            <span className="ml-2 font-semibold text-zinc-300 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-primary" /> API Request & System Logs
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Buffer: {filteredLogs.length} items</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Connected
            </span>
          </div>
        </div>

        {/* Logs Output Box */}
        <div className="p-4 h-[550px] overflow-y-auto space-y-1.5 font-mono select-text">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
              <Activity className="h-8 w-8 text-zinc-600 animate-pulse" />
              <span>Waiting for API requests and server events...</span>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              if (typeof log === "string") {
                return (
                  <div key={index} className="leading-relaxed hover:bg-zinc-900/50 py-0.5 px-1.5 rounded-sm">
                    <span className="text-zinc-500 mr-2">[{index + 1}]</span>
                    <span>{log}</span>
                  </div>
                );
              }

              const time = formatLogTime(log.timestamp);

              return (
                <div
                  key={index}
                  className="flex items-start gap-2.5 hover:bg-zinc-900/60 py-1 px-2 rounded-sm transition-colors border-l-2 border-transparent hover:border-primary"
                >
                  <span className="text-zinc-500 text-[11px] shrink-0">{time}</span>
                  
                  {log.method && getMethodBadge(log.method)}

                  <span className="text-zinc-300 font-medium break-all flex-1">
                    {log.path || log.url || log.message || JSON.stringify(log)}
                  </span>

                  {log.status && (
                    <span className="shrink-0">{getStatusBadge(log.status)}</span>
                  )}

                  {(log.responseTime !== undefined || log.duration !== undefined) && (
                    <span className="text-zinc-400 text-[10px] shrink-0 font-mono bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800">
                      {log.responseTime ?? log.duration}ms
                    </span>
                  )}

                  {(log.ip || log.clientIp) && (
                    <span
                      className="text-amber-400/95 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded text-[11px] font-mono shrink-0 select-all"
                      title={`Client IP: ${log.ip || log.clientIp}`}
                    >
                      {log.ip || log.clientIp}
                    </span>
                  )}
                </div>
              );
            })
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
}
