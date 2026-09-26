import { AssetModel } from "../../common/models/asset.model.js";

// GET /assets - সব asset-এর তালিকা দেখায়
export const listAssets = async (req, res, next) => {
  try {
    const assets = await AssetModel.find().lean();
    res.json({ data: assets });
  } catch (error) {
    next(error);
  }
};

// GET /assets/:assetId - একটি asset-এর বিস্তারিত তথ্য দেখায়
export const getAssetById = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const asset = await AssetModel.findById(assetId).lean();
    if (!asset) return res.status(404).json({ status: "error", message: "Asset not found" });
    res.json({ data: asset });
  } catch (error) {
    next(error);
  }
};

// POST /assets - নতুন asset তৈরি করে
export const createAsset = async (req, res, next) => {
  try {
    const { name, metadata } = req.body ?? {};
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Asset name is required' });
    }
    const asset = await AssetModel.create({ name: name.trim(), metadata: metadata ?? {}, createdBy: req.user?.userId ?? null });
    res.status(201).json({ status: 'success', data: asset });
  } catch (error) {
    next(error);
  }
};

// PUT /assets/:assetId - asset আপডেট করে
export const updateAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const payload = req.body ?? {};
    const asset = await AssetModel.findById(assetId);
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });
    if (payload.name) asset.name = payload.name.trim();
    if (payload.metadata) asset.metadata = payload.metadata;
    await asset.save();
    res.json({ status: 'success', data: asset.toJSON() });
  } catch (error) {
    next(error);
  }
};

// DELETE /assets/:assetId - asset ডিলিট করে
export const deleteAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const asset = await AssetModel.findByIdAndDelete(assetId).lean();
    if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });
    res.json({ status: 'success', message: 'Asset deleted' });
  } catch (error) {
    next(error);
  }
};
