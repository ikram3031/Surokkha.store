import { StoreUtilsModel } from "../../common/models/storeUtils.model.js";

// GET /api/v1/store-utils
export const getStoreUtils = async (req, res, next) => {
  try {
    let doc = await StoreUtilsModel.findOne().lean();
    if (!doc) {
      doc = await StoreUtilsModel.create({});
    }
    res.json({ status: "success", data: doc });
  } catch (err) {
    next(err);
  }
};
