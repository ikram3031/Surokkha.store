import {
  runOrphanMediaScan,
  deleteOrphanFiles,
} from "../../common/services/mediaAudit.service.js";
import { syncUploadsToR2 } from "../../common/services/r2Sync.service.js";
import { MediaCleanupAuditModel } from "../../common/models/mediaCleanupAudit.model.js";
import { R2SyncLogModel } from "../../common/models/r2SyncLog.model.js";
import { env } from "../../common/config/env.js";

// Returns high-level media storage stats, orphan counts, and R2 sync status
export const getMediaAuditSummary = async (req, res, next) => {
  try {
    const totalOrphans = await MediaCleanupAuditModel.countDocuments({
      status: "PENDING_REVIEW",
    });

    const reclaimableAggregation = await MediaCleanupAuditModel.aggregate([
      { $match: { status: "PENDING_REVIEW" } },
      { $group: { _id: null, totalBytes: { $sum: "$fileSize" } } },
    ]);
    const reclaimableBytes = reclaimableAggregation[0]?.totalBytes || 0;

    const latestSync = await R2SyncLogModel.findOne().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      status: "success",
      data: {
        totalOrphans,
        reclaimableBytes,
        reclaimableMb: (reclaimableBytes / (1024 * 1024)).toFixed(2),
        r2Config: {
          enabled: env.R2_SYNC_ENABLED,
          intervalDays: env.R2_SYNC_INTERVAL_DAYS,
          bucketConfigured: Boolean(env.R2_BUCKET_NAME),
        },
        latestSyncLog: latestSync,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Retrieves paginated list of orphan candidates with filtering
export const getOrphanCandidates = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const status = req.query.status || "PENDING_REVIEW";
    const search = req.query.search ? String(req.query.search).trim() : "";

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: "i" } },
        { filePath: { $regex: search, $options: "i" } },
      ];
    }

    const total = await MediaCleanupAuditModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;
    const orphans = await MediaCleanupAuditModel.find(query)
      .sort({ detectedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      status: "success",
      data: orphans,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Triggers an on-demand database versus filesystem orphan scan
export const triggerOrphanScan = async (req, res, next) => {
  try {
    const reviewerDid = req.user?.did || req.user?.id || "ADMIN";
    const result = await runOrphanMediaScan(`ADMIN_${reviewerDid}`);

    return res.status(200).json({
      status: "success",
      message: "Orphan media scan completed successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Triggers an on-demand Cloudflare R2 synchronization job
export const triggerR2Sync = async (req, res, next) => {
  try {
    const reviewerDid = req.user?.did || req.user?.id || "ADMIN";
    const result = await syncUploadsToR2(`ADMIN_${reviewerDid}`);

    return res.status(200).json({
      status: "success",
      message: "Cloudflare R2 synchronization completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// Marks selected filepaths as whitelisted
export const whitelistOrphanFiles = async (req, res, next) => {
  try {
    const { filePaths } = req.body;
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "filePaths array is required",
      });
    }

    const reviewerDid = req.user?.did || req.user?.id || "ADMIN";
    const result = await MediaCleanupAuditModel.updateMany(
      { filePath: { $in: filePaths } },
      {
        $set: {
          status: "WHITELISTED",
          reviewedBy: reviewerDid,
          reviewedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      status: "success",
      message: `Successfully whitelisted ${result.modifiedCount} file(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// Confirms and deletes selected or all pending orphan files permanently from disk
export const confirmDeleteOrphanFiles = async (req, res, next) => {
  try {
    const { filePaths, deleteAllPending } = req.body;
    const reviewerDid = req.user?.did || req.user?.id || "ADMIN";

    let targetPaths = [];

    if (deleteAllPending) {
      const pendingAudits = await MediaCleanupAuditModel.find(
        { status: "PENDING_REVIEW" },
        { filePath: 1 }
      ).lean();
      targetPaths = pendingAudits.map((a) => a.filePath);
    } else if (Array.isArray(filePaths)) {
      targetPaths = filePaths;
    }

    if (targetPaths.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No files specified for deletion",
      });
    }

    const result = await deleteOrphanFiles(targetPaths, reviewerDid);

    return res.status(200).json({
      status: "success",
      message: `Successfully deleted ${result.deletedCount} orphan file(s)`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
