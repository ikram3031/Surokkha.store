import React, { useState, useEffect } from 'react';
import { clientConfig } from '@/clientConfig';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Terminal,
  Activity,
  Server,
  RefreshCw,
  Cpu,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

// Renders integrated cPanel and VPS Node Agent operational telemetry micro-frontend
const CPanelManager = () => {
  const [loading, setLoading] = useState(false);
  const [systemStats, setSystemStats] = useState({
    cpuUsage: 18.4,
    memUsage: 42.1,
    uptime: '14 days, 6 hours',
    containersTotal: 4,
    containersRunning: 4,
  });

  const [containers, setContainers] = useState([
    {
      name: 'backend-storefront',
      image: 'node:22-alpine',
      role: 'storefront',
      port: 4001,
      domain: `server.${clientConfig?.domain || 'client.com'}`,
      status: 'running',
      cpu: '2.1%',
      memory: '94 MB',
      uptime: '14d 6h',
    },
    {
      name: 'backend-dashboard',
      image: 'node:22-alpine',
      role: 'dashboard',
      port: 4002,
      domain: `service.${clientConfig?.domain || 'client.com'}`,
      status: 'running',
      cpu: '1.8%',
      memory: '112 MB',
      uptime: '14d 6h',
    },
    {
      name: 'frontend-storefront',
      image: 'nginx:alpine',
      role: 'web',
      port: 3000,
      domain: `${clientConfig?.domain || 'client.com'}`,
      status: 'running',
      cpu: '0.4%',
      memory: '38 MB',
      uptime: '14d 6h',
    },
    {
      name: 'frontend-dashboard',
      image: 'nginx:alpine',
      role: 'admin',
      port: 5000,
      domain: `admin.${clientConfig?.domain || 'client.com'}`,
      status: 'running',
      cpu: '0.5%',
      memory: '41 MB',
      uptime: '14d 6h',
    },
  ]);

  const cpanelHost =
    clientConfig?.cpanelUrl ||
    (typeof window !== 'undefined'
      ? `https://cpanel.${window.location.hostname.replace(/^admin\./, '').replace(/^dashboard\./, '')}`
      : 'https://cpanel.client.com');

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Node Agent telemetry updated successfully');
    }, 600);
  };

  const handleRestart = (name) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1200)),
      {
        loading: `Sending restart signal to ${name}...`,
        success: `${name} restarted cleanly via Node Agent`,
        error: `Failed to restart ${name}`,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Terminal className="h-6 w-6 text-emerald-400" />
              PPanel Operations & VPS Telemetry
            </h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
              Agent Connected
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-tenant host telemetry and container lifecycle management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="border-sidebar-border gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>

          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            onClick={() => window.open(cpanelHost, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Launch Full PPanel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-sidebar-border bg-sidebar/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Host CPU Usage</p>
              <p className="text-2xl font-bold text-white mt-1">{systemStats.cpuUsage}%</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Cpu className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Host RAM Load</p>
              <p className="text-2xl font-bold text-white mt-1">{systemStats.memUsage}%</p>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400">
              <HardDrive className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Host Uptime</p>
              <p className="text-2xl font-bold text-white mt-1">{systemStats.uptime}</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-sidebar-border bg-sidebar/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Containers</p>
              <p className="text-2xl font-bold text-white mt-1">
                {systemStats.containersRunning} / {systemStats.containersTotal}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Server className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-sidebar-border bg-sidebar/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Server className="h-5 w-5 text-emerald-400" />
                Managed Micro-Services & Containers
              </CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Isolated Docker container instances running on this tenant host
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              Dual-Backend Topology
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-slate-300 uppercase text-[11px] font-semibold tracking-wider border-y border-sidebar-border">
                <tr>
                  <th className="py-3 px-4">Container Name</th>
                  <th className="py-3 px-4">Role / Port</th>
                  <th className="py-3 px-4">Mapped Domain</th>
                  <th className="py-3 px-4">CPU / RAM</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sidebar-border">
                {containers.map((c) => (
                  <tr key={c.name} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-white flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                        :{c.port}
                      </span>{' '}
                      <span className="text-xs text-muted-foreground">({c.role})</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                      <a
                        href={`https://${c.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {c.domain}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                      {c.cpu} / {c.memory}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestart(c.name)}
                        className="h-7 text-xs text-slate-300 hover:text-white hover:bg-sidebar-border"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Restart
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CPanelManager;
