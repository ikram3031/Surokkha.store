import { PromoModel } from "../../common/models/promo.model.js";
import { getPromo } from "../../common/utils/promo.js";

// GET /api/v1/promo — the dashboard Promo page
export const getPromoSettings = async (_req, res, next) => {
  try {
    res.json({ status: "success", data: await getPromo() });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/promo — { banner: { isActive, imageUrl, text, link }, newUserFreeDelivery: { isActive, minOrderAmount } }
export const updatePromoSettings = async (req, res, next) => {
  try {
    const b = req.body?.banner || {};
    const n = req.body?.newUserFreeDelivery || {};
    const minOrderAmount = Number(n.minOrderAmount);
    if (!(minOrderAmount >= 0)) return res.status(400).json({ status: "error", message: "Minimum order amount must be 0 or more" });
    const update = {
      banner: {
        isActive: b.isActive === true,
        imageUrl: String(b.imageUrl || "").trim().slice(0, 1000),
        text: String(b.text || "").trim().slice(0, 500),
        link: String(b.link || "").trim().slice(0, 500),
      },
      newUserFreeDelivery: { isActive: n.isActive === true, minOrderAmount },
      updatedBy: req.user?._id || req.user?.id || null,
    };
    await PromoModel.findOneAndUpdate({ key: "main" }, { $set: update }, { upsert: true, setDefaultsOnInsert: true });
    res.json({ status: "success", data: await getPromo() });
  } catch (error) {
    next(error);
  }
};
