import { PageViewModel } from "../../common/models/pageView.model.js";
import { rangeOf, bucketKeysOf } from "./ProductAnalyticsController.js";
import { logger } from "../../common/config/logger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const uniqueCount = { $size: { $setDifference: ["$visitors", [""]] } };

// Page views report: totals, timeline, most viewed pages, landing pages and their traffic sources (?site=shop|store)
export const getPageReport = async (req, res) => {
  try {
    const range = rangeOf(req.query);
    if (!range) return res.status(400).json({ status: "error", message: "Invalid date range." });
    const match = { createdAt: { $gte: range.from, $lte: range.to } };
    if (["shop", "store"].includes(req.query.site)) match.site = req.query.site;
    const hourly = range.to - range.from <= DAY_MS + 1000;
    const bucket = { $dateToString: { format: hourly ? "%H:00" : "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } };

    const [totals, timeline, pages, landings, sources] = await Promise.all([
      PageViewModel.aggregate([
        { $match: match },
        { $group: { _id: null, views: { $sum: 1 }, landings: { $sum: { $cond: ["$landing", 1, 0] } }, visitors: { $addToSet: "$visitorId" } } },
        { $project: { _id: 0, views: 1, landings: 1, visitors: uniqueCount } },
      ]),
      PageViewModel.aggregate([{ $match: match }, { $group: { _id: bucket, views: { $sum: 1 } } }]),
      PageViewModel.aggregate([
        { $match: match },
        { $sort: { createdAt: 1 } },
        { $group: { _id: { site: "$site", path: "$path" }, views: { $sum: 1 }, visitors: { $addToSet: "$visitorId" }, title: { $last: "$title" }, pageType: { $last: "$pageType" }, landings: { $sum: { $cond: ["$landing", 1, 0] } } } },
        { $project: { _id: 0, site: "$_id.site", path: "$_id.path", views: 1, title: 1, pageType: 1, landings: 1, visitors: uniqueCount } },
        { $sort: { views: -1 } },
        { $limit: 200 },
      ]),
      PageViewModel.aggregate([
        { $match: { ...match, landing: true } },
        { $group: { _id: { site: "$site", path: "$path", source: "$source" }, entries: { $sum: 1 }, title: { $last: "$title" } } },
        { $sort: { entries: -1 } },
      ]),
      PageViewModel.aggregate([
        { $match: { ...match, landing: true } },
        { $group: { _id: "$source", entries: { $sum: 1 } } },
        { $sort: { entries: -1 } },
        { $limit: 20 },
      ]),
    ]);

    const byBucket = new Map(timeline.map((r) => [r._id, r.views]));
    const trend = bucketKeysOf(range, hourly).map((k) => ({ bucket: k, views: byBucket.get(k) || 0 }));

    const landingMap = new Map();
    for (const r of landings) {
      const key = `${r._id.site}|${r._id.path}`;
      const row = landingMap.get(key) || { site: r._id.site, path: r._id.path, title: r.title, entries: 0, sources: [] };
      row.entries += r.entries;
      row.sources.push({ source: r._id.source, entries: r.entries });
      landingMap.set(key, row);
    }
    const landingPages = [...landingMap.values()].sort((a, b) => b.entries - a.entries).slice(0, 100);

    return res.json({
      status: "success",
      data: {
        hourly,
        totals: totals[0] || { views: 0, landings: 0, visitors: 0 },
        trend,
        pages,
        landingPages,
        sources: sources.map((s) => ({ source: s._id || "direct", entries: s.entries })),
      },
    });
  } catch (err) {
    logger?.error?.(`[PageAnalytics] report failed: ${err.message}`);
    return res.status(500).json({ status: "error", message: "Could not load the pages report." });
  }
};
