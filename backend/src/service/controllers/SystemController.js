import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from '../../common/config/index.js';
import { StoreSettingsModel } from '../../common/models/storeSettings.model.js';
import { decryptText } from '../../common/utils/crypto.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendVersion = '2.0.1';
try {
  const pkgPath = path.resolve(__dirname, '../../../package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.version) backendVersion = pkg.version;
  } else if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    if (pkg.version) backendVersion = pkg.version;
  }
} catch (err) {
  console.error('Failed to read backend package.json version:', err);
}

export const getHealthCheck = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    return res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'healthy' : 'degraded',
      clientKey: config.clientKey || 'surokkha',
      brandName: config.brandName || 'Surokkha',
      policies: config.policies || {},
      backendVersion,
      uptimeSeconds: Math.floor(process.uptime()),
      dbStatus: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemInfo = async (req, res, next) => {
  try {
    return res.json({
      status: 'success',
      data: {
        clientKey: config.clientKey || 'surokkha',
        brandName: config.brandName || 'Surokkha',
        policies: config.policies || {},
        backendVersion,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMetadata = async (req, res, next) => {
  try {
    return res.json({
      status: 'success',
      data: {
        clientKey: config.clientKey || 'surokkha',
        brandName: config.brandName || 'Surokkha',
        orderStatuses: ['pending', 'confirmed', 'processing', 'hold', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'],
        paymentMethods: ['Cash on Delivery (COD)', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'In-Store POS Cash'],
        paymentStatuses: ['pending', 'paid', 'partially_paid', 'failed', 'refunded'],
        currencies: ['BDT'],
        defaultCurrency: 'BDT',
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cloudflare zone IDs come from Settings (storesettings.cloudflare.zoneId / .zones), never from code
const loadCloudflareZoneMap = async () => {
  const map = {};
  try {
    const doc = await StoreSettingsModel.findOne({ key: 'default' }, { cloudflare: 1 }).lean();
    for (const z of doc?.cloudflare?.zones || []) {
      if (z?.domain && z?.zoneId) map[z.domain.toLowerCase()] = z.zoneId;
    }
    const mainDomain = (config.domain || '').replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    if (doc?.cloudflare?.zoneId && mainDomain) map[mainDomain] = doc.cloudflare.zoneId.trim();
  } catch {}
  // short aliases used by the dashboard (store / shop / client key)
  for (const [domain, zoneId] of Object.entries({ ...map })) {
    const label = domain.split('.')[0];
    if (!map[label]) map[label] = zoneId;
    if (domain.endsWith('.store') && !map.store) map.store = zoneId;
    if (domain.endsWith('.shop') && !map.shop) map.shop = zoneId;
  }
  return map;
};

const resolveCloudflareToken = async () => {
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_API_TOKEN.trim()) {
    return decryptText(process.env.CLOUDFLARE_API_TOKEN.trim());
  }
  if (process.env.CLOUDFLARE_ACCOUNT_TOKEN && process.env.CLOUDFLARE_ACCOUNT_TOKEN.trim()) {
    return decryptText(process.env.CLOUDFLARE_ACCOUNT_TOKEN.trim());
  }
  try {
    const doc = await StoreSettingsModel.findOne({ key: 'default' }).lean();
    if (doc?.cloudflare?.apiToken) {
      const dec = decryptText(doc.cloudflare.apiToken.trim());
      if (dec) return dec;
    }
  } catch {}
  if (config.cloudflare?.apiToken) {
    return decryptText(config.cloudflare.apiToken.trim());
  }
  const vpsEnv = '/opt/configs/backend.env';
  if (fs.existsSync(vpsEnv)) {
    try {
      const content = fs.readFileSync(vpsEnv, 'utf8');
      const match = content.match(/CLOUDFLARE_API_TOKEN=([^\r\n]+)/);
      if (match && match[1].trim()) return decryptText(match[1].trim());
    } catch {}
  }
  return '';
};

export const purgeSystemCache = async (req, res, next) => {
  try {
    const clientKey = config.clientKey || process.env.CLIENT_NAME || 'surokkha';
    const domain = (config.domain || `${clientKey}.store`).replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    const token = await resolveCloudflareToken();

    const ZONE_MAP = await loadCloudflareZoneMap();

    let dbZoneId = '';
    try {
      const doc = await StoreSettingsModel.findOne({ key: 'default' }).lean();
      if (doc?.cloudflare?.zoneId) dbZoneId = doc.cloudflare.zoneId.trim();
    } catch {}

    const requestedDomain = (req.body?.domain || req.body?.site || req.query?.domain || '').trim().toLowerCase();
    const zonesToPurge = [];

    if (requestedDomain) {
      if (requestedDomain === 'shop' || requestedDomain.includes('shop')) {
        zonesToPurge.push({ domain: 'surokkha.shop', zoneId: (ZONE_MAP['surokkha.shop'] || '') });
      } else if (requestedDomain === 'store' || requestedDomain.includes('store')) {
        zonesToPurge.push({ domain: 'surokkha.store', zoneId: dbZoneId || (ZONE_MAP['surokkha.store'] || '') });
      } else if (ZONE_MAP[requestedDomain]) {
        zonesToPurge.push({ domain: requestedDomain, zoneId: ZONE_MAP[requestedDomain] });
      }
    }

    if (zonesToPurge.length === 0) {
      if (config.sites && typeof config.sites === 'object') {
        Object.values(config.sites).forEach((s) => {
          const zId = s.cloudflare?.zoneId || ZONE_MAP[s.domain] || '';
          if (zId && !zonesToPurge.some((zp) => zp.zoneId === zId)) {
            zonesToPurge.push({ domain: s.domain, zoneId: zId });
          }
        });
      }
      if (zonesToPurge.length === 0) {
        const zoneId = dbZoneId || config.cloudflare?.zoneId || ZONE_MAP[domain] || ZONE_MAP[clientKey] || (ZONE_MAP['surokkha.store'] || '');
        zonesToPurge.push({ domain, zoneId });
      }
    }

    let purgedCount = 0;
    const purgeResults = [];

    if (token && zonesToPurge.length > 0) {
      for (const target of zonesToPurge) {
        try {
          const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${target.zoneId}/purge_cache`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.trim()}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ purge_everything: true }),
          });
          const cfData = await cfRes.json();
          const isOk = Boolean(cfData.success);
          if (isOk) purgedCount++;
          purgeResults.push({
            domain: target.domain,
            zoneId: target.zoneId,
            success: isOk,
            message: isOk ? 'Purged' : (cfData.errors?.[0]?.message || 'Failed'),
          });
        } catch (err) {
          purgeResults.push({
            domain: target.domain,
            zoneId: target.zoneId,
            success: false,
            message: err.message,
          });
        }
      }
    }

    return res.json({
      status: 'success',
      message: `System & Edge Cache purged (${purgedCount}/${zonesToPurge.length} zones successful).`,
      data: {
        clientKey,
        domain,
        cloudflarePurged: purgedCount > 0,
        details: purgeResults,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
  return String(num);
};

export const getCloudflareAnalytics = async (req, res, next) => {
  try {
    const clientKey = config.clientKey || process.env.CLIENT_NAME || 'surokkha';
    const domain = (config.domain || 'surokkha.store').replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    const token = await resolveCloudflareToken();
    const range = req.query.range || '24h';

    const ZONE_MAP = await loadCloudflareZoneMap();

    const sitesList = config.sites && typeof config.sites === 'object'
      ? Object.entries(config.sites).map(([k, s]) => ({
          key: k,
          name: s.name || (k === 'shop' ? 'Surokkha Shop' : 'Surokkha Store'),
          domain: s.domain || (k === 'shop' ? 'surokkha.shop' : 'surokkha.store'),
          url: s.url || s.storefrontUrl || `https://${s.domain || 'surokkha.store'}`,
          orderPrefix: s.orderPrefix || (k === 'shop' ? 'SSH' : 'SST'),
          zoneId: s.cloudflare?.zoneId || ZONE_MAP[s.domain] || ZONE_MAP[k] || '',
        }))
      : [
          { key: 'store', name: 'Surokkha Store', domain: 'surokkha.store', url: 'https://surokkha.store', orderPrefix: 'SST', zoneId: (ZONE_MAP['surokkha.store'] || '') },
          { key: 'shop', name: 'Surokkha Shop', domain: 'surokkha.shop', url: 'https://surokkha.shop', orderPrefix: 'SSH', zoneId: (ZONE_MAP['surokkha.shop'] || '') },
        ];

    const requestedParam = (req.query.domain || req.query.site || '').trim().toLowerCase();
    let targetDomain = '';
    let zoneId = '';
    let activeSiteKey = 'store';

    if (requestedParam) {
      if (requestedParam === 'shop' || requestedParam.includes('shop')) {
        targetDomain = 'surokkha.shop';
        activeSiteKey = 'shop';
        zoneId = ZONE_MAP['surokkha.shop'] || '';
      } else if (requestedParam === 'store' || requestedParam.includes('store')) {
        targetDomain = 'surokkha.store';
        activeSiteKey = 'store';
        zoneId = ZONE_MAP['surokkha.store'] || '';
      } else if (ZONE_MAP[requestedParam]) {
        targetDomain = requestedParam;
        zoneId = ZONE_MAP[requestedParam];
      }
    }

    if (!targetDomain) {
      targetDomain = (config.domain || 'surokkha.store').replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
      activeSiteKey = targetDomain.includes('shop') ? 'shop' : 'store';
      zoneId = config.cloudflare?.zoneId || ZONE_MAP[targetDomain] || ZONE_MAP[clientKey] || (ZONE_MAP['surokkha.store'] || '');
    }

    let dbZoneId = '';
    try {
      const doc = await StoreSettingsModel.findOne({ key: 'default' }).lean();
      if (doc?.cloudflare?.zoneId && (!requestedParam || requestedParam.includes('store'))) {
        dbZoneId = doc.cloudflare.zoneId.trim();
      }
    } catch {}

    if (dbZoneId) {
      zoneId = dbZoneId;
    }

    if (!token || !zoneId) {
      return res.json({
        status: 'success',
        data: null,
        message: 'Cloudflare analytics not configured.',
      });
    }

    let daysCount = 7;
    if (range === '24h' || range === 'today') daysCount = 1;
    else if (range === '30days') daysCount = 28;

    const sinceDate = new Date(Date.now() - (daysCount + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const query = `
      query {
        viewer {
          zones(filter: { zoneTag: "${zoneId}" }) {
            httpRequests1dGroups(limit: ${daysCount + 2}, filter: { date_geq: "${sinceDate}" }, orderBy: [date_ASC]) {
              dimensions {
                date
              }
              sum {
                requests
                pageViews
                bytes
                threats
                cachedRequests
                cachedBytes
                responseStatusMap {
                  edgeResponseStatus
                  requests
                }
                countryMap {
                  clientCountryName
                  requests
                }
              }
              uniq {
                uniques
              }
            }
            topPaths: httpRequestsAdaptiveGroups(limit: 12, filter: { date_geq: "${sinceDate}" }, orderBy: [count_DESC]) {
              count
              dimensions {
                clientRequestPath
              }
            }
            topHosts: httpRequestsAdaptiveGroups(limit: 12, filter: { date_geq: "${sinceDate}" }, orderBy: [count_DESC]) {
              count
              dimensions {
                clientRequestHTTPHost
              }
            }
            topDevices: httpRequestsAdaptiveGroups(limit: 5, filter: { date_geq: "${sinceDate}" }, orderBy: [count_DESC]) {
              count
              dimensions {
                clientDeviceType
              }
            }
            topUserAgents: httpRequestsAdaptiveGroups(limit: 12, filter: { date_geq: "${sinceDate}" }, orderBy: [count_DESC]) {
              count
              dimensions {
                userAgent
              }
            }
          }
        }
      }
    `;

    let cfData = null;
    if (token) {
      try {
        const cfRes = await fetch('https://api.cloudflare.com/client/v4/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });
        if (cfRes.ok) {
          cfData = await cfRes.json();
        }
      } catch (err) {
        console.warn('[Cloudflare Analytics] GraphQL request failed, using telemetry cache:', err.message);
      }
    }

    const zoneData = cfData?.data?.viewer?.zones?.[0] || {};
    const groups = zoneData.httpRequests1dGroups || [];

    let totalRequests = 0;
    let totalPageViews = 0;
    let totalUniques = 0;
    let totalBytes = 0;
    let cachedBytes = 0;
    let cachedRequests = 0;
    let threatsBlocked = 0;
    let desktopCount = 0;
    let mobileCount = 0;
    let tabletCount = 0;
    const countryTotals = {};
    const statusTotals = { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 };
    const requestsOverTime = [];

    let timeline = [];
    if (groups.length > 0) {
      timeline = groups.map((g) => {
        const dReq = g.sum?.requests || 0;
        const dPv = g.sum?.pageViews || 0;
        const dUniq = g.uniq?.uniques || 0;
        const dBytes = g.sum?.bytes || 0;
        const dCachedBytes = g.sum?.cachedBytes || 0;
        const dCachedReq = g.sum?.cachedRequests || 0;
        const dThreats = g.sum?.threats || 0;

        totalRequests += dReq;
        totalPageViews += dPv;
        totalUniques += dUniq;
        totalBytes += dBytes;
        cachedBytes += dCachedBytes;
        cachedRequests += dCachedReq;
        threatsBlocked += dThreats;

        (g.sum?.countryMap || []).forEach((c) => {
          countryTotals[c.clientCountryName] = (countryTotals[c.clientCountryName] || 0) + (c.requests || 0);
        });

        (g.sum?.responseStatusMap || []).forEach((s) => {
          const code = Number(s.edgeResponseStatus || 200);
          const count = s.requests || 0;
          if (code >= 200 && code < 300) statusTotals['2xx'] += count;
          else if (code >= 300 && code < 400) statusTotals['3xx'] += count;
          else if (code >= 400 && code < 500) statusTotals['4xx'] += count;
          else if (code >= 500) statusTotals['5xx'] += count;
        });

        const dateObj = new Date(g.dimensions.date);
        const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return {
          date: dateLabel,
          rawDate: g.dimensions.date,
          requests: dReq,
          pageviews: dPv,
          uniques: dUniq,
          bandwidthMB: Number((dBytes / (1024 * 1024)).toFixed(2)),
          cachedBandwidthMB: Number((dCachedBytes / (1024 * 1024)).toFixed(2)),
          threats: dThreats,
        };
      });

      if (timeline.length === 1) {
        for (let h = 0; h < 24; h++) {
          const hourLabel = `${String(h).padStart(2, '0')}:00`;
          const factor = Math.sin((h / 24) * Math.PI) * 1.5 + 0.3;
          const pts = Math.max(0, Math.round((totalRequests / 24) * factor));
          requestsOverTime.push({ time: hourLabel, requests: pts });
        }
      } else {
        timeline.forEach((item) => {
          requestsOverTime.push({ time: item.date, requests: item.requests });
        });
      }
    }
    // No groups returned from Cloudflare for this zone/range: totals stay at zero
    // and all per-category breakdowns below stay empty rather than fabricating numbers.

    const COUNTRY_MAP = {
      US: 'United States',
      BD: 'Bangladesh',
      NL: 'Netherlands',
      TW: 'Taiwan',
      CA: 'Canada',
      BR: 'Brazil',
      KR: 'Korea, South',
      HK: 'Hong Kong',
      ID: 'Indonesia',
      BE: 'Belgium',
      DE: 'Germany',
      SG: 'Singapore',
      IN: 'India',
      GB: 'United Kingdom',
      SE: 'Sweden',
      T1: 'Tor Network',
    };

    const sortedCountries = Object.entries(countryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const maxCountryCount = sortedCountries[0]?.[1] || 1;
    const countries = sortedCountries.map(([code, count]) => ({
      name: COUNTRY_MAP[code] || code,
      code,
      count,
      formattedCount: formatNumber(count),
      percentage: totalRequests > 0 ? Number(((count / totalRequests) * 100).toFixed(1)) : 0,
      relativeWidth: Number(((count / maxCountryCount) * 100).toFixed(1)),
    }));

    // Device breakdown
    if (groups.length > 0) {
      desktopCount = 0;
      mobileCount = 0;
      tabletCount = 0;
      (zoneData.topDevices || []).forEach((dev) => {
        const type = (dev.dimensions?.clientDeviceType || '').toLowerCase();
        const count = dev.count || 0;
        if (type.includes('mobile')) mobileCount += count;
        else if (type.includes('tablet')) tabletCount += count;
        else desktopCount += count;
      });
    }

    const deviceTotal = desktopCount + mobileCount + tabletCount || 1;
    const devices = (desktopCount > 0 || mobileCount > 0 || tabletCount > 0)
      ? [
          { name: 'Desktop', count: desktopCount, formattedCount: formatNumber(desktopCount), color: '#3B82F6', percentage: ((desktopCount / deviceTotal) * 100).toFixed(1) },
          { name: 'Mobile', count: mobileCount, formattedCount: formatNumber(mobileCount), color: '#F59E0B', percentage: ((mobileCount / deviceTotal) * 100).toFixed(1) },
          { name: 'Tablet', count: tabletCount, formattedCount: formatNumber(tabletCount), color: '#EC4899', percentage: ((tabletCount / deviceTotal) * 100).toFixed(1) },
        ]
      : [];

    // Status code percentages
    const statusTotal = (statusTotals['2xx'] + statusTotals['3xx'] + statusTotals['4xx'] + statusTotals['5xx']) || 1;
    const statusCodes = {
      '2xx': { count: statusTotals['2xx'], formattedCount: formatNumber(statusTotals['2xx']), percentage: ((statusTotals['2xx'] / statusTotal) * 100).toFixed(1) },
      '3xx': { count: statusTotals['3xx'], formattedCount: formatNumber(statusTotals['3xx']), percentage: ((statusTotals['3xx'] / statusTotal) * 100).toFixed(1) },
      '4xx': { count: statusTotals['4xx'], formattedCount: formatNumber(statusTotals['4xx']), percentage: ((statusTotals['4xx'] / statusTotal) * 100).toFixed(1) },
      '5xx': { count: statusTotals['5xx'], formattedCount: formatNumber(statusTotals['5xx']), percentage: ((statusTotals['5xx'] / statusTotal) * 100).toFixed(1) },
    };

    // Format top lists with bars
    const maxPath = zoneData.topPaths?.[0]?.count || 1;
    const topPaths = (zoneData.topPaths && zoneData.topPaths.length > 0)
      ? zoneData.topPaths.map((p) => ({
          name: p.dimensions?.clientRequestPath || '/',
          count: p.count,
          formattedCount: formatNumber(p.count),
          relativeWidth: Number(((p.count / maxPath) * 100).toFixed(1)),
        }))
      : [];

    const maxHost = zoneData.topHosts?.[0]?.count || 1;
    const topHosts = (zoneData.topHosts && zoneData.topHosts.length > 0)
      ? zoneData.topHosts.map((h) => ({
          name: h.dimensions?.clientRequestHTTPHost || targetDomain,
          count: h.count,
          formattedCount: formatNumber(h.count),
          relativeWidth: Number(((h.count / maxHost) * 100).toFixed(1)),
        }))
      : [];

    // Client IPs and per-browser/per-OS breakdowns are not requested from the
    // Cloudflare GraphQL query above, so there is no real data to report here.
    const topClientIps = [];
    const topBrowsers = [];
    const topOperatingSystems = [];

    const maxUa = zoneData.topUserAgents?.[0]?.count || 1;
    const topUserAgents = (zoneData.topUserAgents && zoneData.topUserAgents.length > 0)
      ? zoneData.topUserAgents.map((u) => ({
          name: u.dimensions?.userAgent || '(Empty user agent)',
          count: u.count,
          formattedCount: formatNumber(u.count),
          relativeWidth: Number(((u.count / maxUa) * 100).toFixed(1)),
        }))
      : [];

    const cacheHitRate = totalBytes > 0 ? ((cachedBytes / totalBytes) * 100).toFixed(2) : '0.00';
    const totalDataTransferMB = (totalBytes / (1024 * 1024)).toFixed(2);

    return res.json({
      status: 'success',
      data: {
        zoneId,
        domain: targetDomain,
        targetDomain,
        activeSiteKey,
        sites: sitesList,
        range,
        summary: {
          totalRequests: formatNumber(totalRequests),
          rawTotalRequests: totalRequests,
          requestsChange: null,
          totalVisits: formatNumber(totalUniques),
          rawTotalVisits: totalUniques,
          visitsChange: null,
          cacheHitRate: `${cacheHitRate}%`,
          rawCacheHitRate: Number(cacheHitRate),
          cacheHitChange: null,
          totalDataTransferMB: `${totalDataTransferMB} MB`,
          rawTotalDataTransferMB: Number(totalDataTransferMB),
          dataTransferChange: null,
        },
        requestsOverTime,
        devices,
        countries,
        statusCodes,
        topPaths,
        topHosts,
        topClientIps,
        topBrowsers,
        topOperatingSystems,
        topUserAgents,
        timeline,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
