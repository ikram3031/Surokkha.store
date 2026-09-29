import { AssetModel } from "../../common/models/asset.model.js";

// GET /api/v1/assets
export const listAssets = async (req, res, next) => {
  try {
    const assets = await AssetModel.find({ active: true }).sort({ createdAt: -1 }).lean();
    res.json({ status: "success", data: assets });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/assets/:assetId
export const getAssetById = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const isObjectId = typeof assetId === "string" && /^[0-9a-fA-F]{24}$/.test(assetId);
    const filter = isObjectId ? { $or: [{ _id: assetId }, { did: assetId }] } : { did: assetId };
    const asset = await AssetModel.findOne(filter).lean();
    if (!asset) {
      return res.status(404).json({ status: "error", message: "Asset not found" });
    }
    res.json({ status: "success", data: asset });
  } catch (err) {
    next(err);
  }
};
