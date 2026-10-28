import { ItemModel } from "../../common/models/item.model.js";
import { logger } from "../../common/config/logger.js";
import { normalizeGroupOfferPayload, serializeGroupOffer, toItemFields } from "../../common/utils/groupOffer.js";

const findByIdentifier = (id) =>
  ItemModel.findOne({ type: "group", $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(id) ? id : null }, { did: id }, { slug: id }] });

export const getAllGroupOffers = async (_req, res) => {
  try {
    const offers = await ItemModel.find({ type: "group" }).sort({ createdAt: -1 });
    res.json({ status: "success", data: offers.map((o) => serializeGroupOffer(o)) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch group offers");
    res.status(500).json({ status: "error", message: "Unable to fetch group offers" });
  }
};

export const getGroupOfferById = async (req, res) => {
  try {
    const offer = await findByIdentifier(req.params.id);
    if (!offer) return res.status(404).json({ status: "error", message: "Group offer not found" });
    res.json({ status: "success", data: serializeGroupOffer(offer) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch group offer");
    res.status(500).json({ status: "error", message: "Unable to fetch group offer" });
  }
};

export const createGroupOffer = async (req, res) => {
  try {
    const { errors, normalized } = normalizeGroupOfferPayload(req.body);
    if (errors.length) return res.status(400).json({ status: "error", message: errors[0], errors });
    if (await ItemModel.exists({ slug: normalized.slug })) {
      return res.status(400).json({ status: "error", message: "A group offer with this slug already exists" });
    }
    const userId = req.user?._id || req.user?.id || null;
    const offer = await ItemModel.create({ ...toItemFields(normalized), createdBy: userId, updatedBy: userId });
    res.status(201).json({ status: "success", data: serializeGroupOffer(offer) });
  } catch (err) {
    logger.error({ err }, "Failed to create group offer");
    res.status(500).json({ status: "error", message: "Unable to create group offer" });
  }
};

export const updateGroupOffer = async (req, res) => {
  try {
    const offer = await findByIdentifier(req.params.id);
    if (!offer) return res.status(404).json({ status: "error", message: "Group offer not found" });
    const { errors, normalized } = normalizeGroupOfferPayload({ ...serializeGroupOffer(offer), ...req.body });
    if (errors.length) return res.status(400).json({ status: "error", message: errors[0], errors });
    if (await ItemModel.exists({ slug: normalized.slug, _id: { $ne: offer._id } })) {
      return res.status(400).json({ status: "error", message: "A group offer with this slug already exists" });
    }
    Object.assign(offer, toItemFields(normalized), { updatedBy: req.user?._id || req.user?.id || null });
    await offer.save();
    res.json({ status: "success", data: serializeGroupOffer(offer) });
  } catch (err) {
    logger.error({ err }, "Failed to update group offer");
    res.status(500).json({ status: "error", message: "Unable to update group offer" });
  }
};

export const deleteGroupOffer = async (req, res) => {
  try {
    const offer = await findByIdentifier(req.params.id);
    if (!offer) return res.status(404).json({ status: "error", message: "Group offer not found" });
    await ItemModel.deleteOne({ _id: offer._id });
    res.json({ status: "success", message: "Group offer deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete group offer");
    res.status(500).json({ status: "error", message: "Unable to delete group offer" });
  }
};
