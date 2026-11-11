import { DirectOfferModel } from "../../common/models/directOffer.model.js";
import { logger } from "../../common/config/logger.js";
import { clearDirectOfferCache, normalizeDirectOfferPayload } from "../../common/utils/directOffer.js";

// Finds a Direct Offer by Mongo id or did
const findByIdentifier = (id) =>
  DirectOfferModel.findOne({ $or: [{ _id: /^[0-9a-fA-F]{24}$/.test(id) ? id : null }, { did: id }] });

// Lists every Direct Offer, newest first
export const getAllDirectOffers = async (_req, res) => {
  try {
    const offers = await DirectOfferModel.find().sort({ createdAt: -1 });
    res.json({ status: "success", data: offers.map((o) => o.toJSON()) });
  } catch (err) {
    logger.error({ err }, "Failed to fetch direct offers");
    res.status(500).json({ status: "error", message: "Unable to fetch direct offers" });
  }
};

// Creates a Direct Offer from a dashboard payload
export const createDirectOffer = async (req, res) => {
  try {
    const { errors, normalized } = normalizeDirectOfferPayload(req.body);
    if (errors.length) return res.status(400).json({ status: "error", message: errors[0], errors });
    const userId = req.user?._id || req.user?.id || null;
    const offer = await DirectOfferModel.create({ ...normalized, createdBy: userId, updatedBy: userId });
    clearDirectOfferCache();
    res.status(201).json({ status: "success", data: offer.toJSON() });
  } catch (err) {
    logger.error({ err }, "Failed to create direct offer");
    res.status(500).json({ status: "error", message: "Unable to create direct offer" });
  }
};

// Updates a Direct Offer; fields left out keep their saved values
export const updateDirectOffer = async (req, res) => {
  try {
    const offer = await findByIdentifier(req.params.id);
    if (!offer) return res.status(404).json({ status: "error", message: "Direct offer not found" });
    const { errors, normalized } = normalizeDirectOfferPayload({ ...offer.toJSON(), ...req.body });
    if (errors.length) return res.status(400).json({ status: "error", message: errors[0], errors });
    Object.assign(offer, normalized, { updatedBy: req.user?._id || req.user?.id || null });
    await offer.save();
    clearDirectOfferCache();
    res.json({ status: "success", data: offer.toJSON() });
  } catch (err) {
    logger.error({ err }, "Failed to update direct offer");
    res.status(500).json({ status: "error", message: "Unable to update direct offer" });
  }
};

// Deletes a Direct Offer
export const deleteDirectOffer = async (req, res) => {
  try {
    const offer = await findByIdentifier(req.params.id);
    if (!offer) return res.status(404).json({ status: "error", message: "Direct offer not found" });
    await DirectOfferModel.deleteOne({ _id: offer._id });
    clearDirectOfferCache();
    res.json({ status: "success", message: "Direct offer deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete direct offer");
    res.status(500).json({ status: "error", message: "Unable to delete direct offer" });
  }
};
