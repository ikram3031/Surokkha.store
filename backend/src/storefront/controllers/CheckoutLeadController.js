import { CheckoutLeadModel } from "../../common/models/checkoutLead.model.js";
import { sendServerInitiateCheckoutEvent, extractClientIp } from "../../common/services/facebookCapi.service.js";
import { logger } from "../../common/config/logger.js";

const str = (v, max = 300) => String(v ?? "").trim().slice(0, max);

// Last 10 digits of a Bangladeshi mobile number, or "" when it isn't a valid one
export const phoneKeyOf = (raw) => {
  const digits = String(raw || "").replace(/\D/g, "");
  const key = digits.length >= 10 ? digits.slice(-10) : "";
  return /^1[3-9]\d{8}$/.test(key) ? key : "";
};

// Marks open leads as converted once an order is placed (matched by session id or phone)
export const markCheckoutLeadConverted = async ({ sessionId, phone, orderNumber }) => {
  try {
    const or = [];
    if (sessionId) or.push({ sessionId: str(sessionId, 100) });
    const key = phoneKeyOf(phone);
    if (key) or.push({ phoneKey: key });
    if (!or.length) return;
    await CheckoutLeadModel.updateMany(
      { status: "open", $or: or },
      { $set: { status: "converted", convertedOrderNumber: str(orderNumber, 60), convertedAt: new Date() } }
    );
  } catch (err) {
    logger?.warn?.(`[CheckoutLead] mark converted failed: ${err.message}`);
  }
};

// Saves (upserts) the checkout details a customer has typed so far; public storefront endpoint
export const saveCheckoutLead = async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = str(body.sessionId, 100);
    if (!/^[\w-]{8,100}$/.test(sessionId)) {
      return res.status(400).json({ status: "error", message: "A valid sessionId is required." });
    }

    const phoneKey = phoneKeyOf(body.phone);
    const fullName = str(body.fullName, 120);
    const email = str(body.email, 160).toLowerCase();
    // Nothing worth saving until the customer has typed a phone number or a name
    if (!phoneKey && !fullName && !email) {
      return res.json({ status: "success", saved: false });
    }

    const items = (Array.isArray(body.items) ? body.items : []).slice(0, 30).map((i) => ({
      slug: str(i?.slug, 120),
      name: str(i?.name, 200),
      quantity: Math.max(1, Math.min(999, Number(i?.quantity) || 1)),
      unitPrice: Math.max(0, Number(i?.unitPrice) || 0),
    }));

    const set = {
      fullName,
      phone: phoneKey ? `+880${phoneKey}` : str(body.phone, 30),
      phoneKey,
      email,
      address: str(body.address, 400),
      district: str(body.district, 80),
      thana: str(body.thana, 80),
      items,
      cartTotal: Math.max(0, Number(body.cartTotal) || 0),
      fbp: str(body.fbp, 120),
      fbc: str(body.fbc, 200),
      ipAddress: extractClientIp(req) || "",
      userAgent: str(req.headers?.["user-agent"], 400),
      sourceUrl: str(body.sourceUrl, 400),
      lastActivityAt: new Date(),
    };

    // Never reopen a lead that already turned into an order
    const lead = await CheckoutLeadModel.findOneAndUpdate(
      { sessionId },
      { $set: set, $setOnInsert: { status: "open" } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // One InitiateCheckout per lead, with customer data, once the phone is known.
    // Same event_id as the browser pixel event so Meta merges the pair.
    if (phoneKey && !lead.metaSent) {
      const claimed = await CheckoutLeadModel.findOneAndUpdate(
        { _id: lead._id, metaSent: false },
        { $set: { metaSent: true } }
      );
      if (claimed) {
        const cd = body.customData || {};
        sendServerInitiateCheckoutEvent({
          customData: {
            content_ids: Array.isArray(cd.content_ids) ? cd.content_ids.slice(0, 30).map((v) => str(v, 100)) : [],
            contents: Array.isArray(cd.contents)
              ? cd.contents.slice(0, 30).map((c) => ({
                  id: str(c?.id, 100),
                  quantity: Number(c?.quantity) || 1,
                  item_price: Number(c?.item_price) || 0,
                }))
              : [],
            content_type: "product",
            value: set.cartTotal,
            currency: "BDT",
            num_items: items.reduce((s, i) => s + i.quantity, 0),
          },
          req,
          eventId: `ic_${sessionId}`,
          eventSourceUrl: set.sourceUrl,
          user: {
            name: fullName,
            email,
            phone: set.phone,
            district: set.district,
            externalId: sessionId,
          },
        });
      }
    }

    return res.json({ status: "success", saved: true });
  } catch (err) {
    logger?.warn?.(`[CheckoutLead] save failed: ${err.message}`);
    return res.status(500).json({ status: "error", message: "Failed to save checkout details." });
  }
};
