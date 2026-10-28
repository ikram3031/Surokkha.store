import { ItemModel } from "../../common/models/item.model.js";
import { serializeGroupOffer } from "../../common/utils/groupOffer.js";

// GET /api/v1/group-offers
export const listGroupOffers = async (_req, res) => {
  try {
    const offers = await ItemModel.find({ type: "group", isActive: true }).sort({ createdAt: -1 });
    res.json({ status: "success", data: offers.map((o) => serializeGroupOffer(o, { publicView: true })) });
  } catch {
    res.status(500).json({ status: "error", message: "Unable to retrieve group offers" });
  }
};

// GET /api/v1/group-offers/:identifier (slug, did or id)
export const getGroupOffer = async (req, res) => {
  try {
    const id = req.params.identifier;
    const offer = await ItemModel.findOne({
      type: "group",
      isActive: true,
      $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(id) ? id : null }, { did: id }, { slug: id }],
    });
    if (!offer) return res.status(404).json({ status: "error", message: "Group offer not found" });
    res.json({ status: "success", data: serializeGroupOffer(offer, { publicView: true }) });
  } catch {
    res.status(500).json({ status: "error", message: "Unable to retrieve group offer" });
  }
};
