import { sendServerAddToCartEvent, sendServerViewContentEvent } from '../../common/services/facebookCapi.service.js';
import { sendTikTokServerAddToCartEvent } from '../../common/services/tiktokEventsApi.service.js';

// Dispatches server-side AddToCart CAPI event for Meta and TikTok using product.did as content ID
export const trackAddToCart = async (req, res) => {
  try {
    const {
      productDid,
      productId,
      sku,
      productName,
      price,
      quantity = 1,
      currency = 'BDT',
      category,
      fbp,
      fbc,
      fb_login_id,
      fbLoginId,
      eventId,
      eventSourceUrl,
      user = {},
    } = req.body || {};

    const contentId = productDid || productId || sku || '';

    if (!contentId) {
      return res.status(400).json({
        status: 'error',
        message: 'productDid, productId, or sku is required to track this event.',
      });
    }

    const resolvedFbLoginId = fb_login_id || fbLoginId || user?.fb_login_id || user?.fbLoginId || '';
    const enrichedReq = { ...req };
    enrichedReq.body = { ...req.body, ...(resolvedFbLoginId ? { fb_login_id: resolvedFbLoginId } : {}) };
    if (fbp || fbc || resolvedFbLoginId) {
      enrichedReq.cookies = enrichedReq.cookies || {};
      if (fbp) enrichedReq.cookies._fbp = fbp;
      if (fbc) enrichedReq.cookies._fbc = fbc;
      if (resolvedFbLoginId) enrichedReq.cookies.fb_login_id = resolvedFbLoginId;
    }

    const enrichedUser = {
      ...user,
      ...(resolvedFbLoginId ? { fb_login_id: resolvedFbLoginId } : {}),
    };

    const product = {
      did: contentId,
      name: productName || '',
      offerPrice: Number(price || 0),
      price: Number(price || 0),
      category: category || '',
    };

    sendServerAddToCartEvent({
      product,
      quantity,
      currency,
      req: enrichedReq,
      eventId,
      eventSourceUrl,
      user: enrichedUser,
    });

    sendTikTokServerAddToCartEvent({
      product,
      quantity,
      currency,
      req: enrichedReq,
      eventId,
      eventSourceUrl,
      user: enrichedUser,
    });

    return res.json({ status: 'success', message: 'AddToCart event dispatched.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to dispatch AddToCart event.' });
  }
};

// Dispatches server-side ViewContent CAPI event for Meta using product.did as content ID
export const trackViewContent = async (req, res) => {
  try {
    const {
      productDid,
      productId,
      sku,
      productName,
      price,
      category,
      fbp,
      fbc,
      fb_login_id,
      fbLoginId,
      eventId,
      eventSourceUrl,
      user = {},
    } = req.body || {};

    const contentId = productDid || productId || sku || '';

    if (!contentId) {
      return res.status(400).json({
        status: 'error',
        message: 'productDid, productId, or sku is required to track this event.',
      });
    }

    const resolvedFbLoginId = fb_login_id || fbLoginId || user?.fb_login_id || user?.fbLoginId || '';
    const enrichedReq = { ...req };
    enrichedReq.body = { ...req.body, ...(resolvedFbLoginId ? { fb_login_id: resolvedFbLoginId } : {}) };
    if (fbp || fbc || resolvedFbLoginId) {
      enrichedReq.cookies = enrichedReq.cookies || {};
      if (fbp) enrichedReq.cookies._fbp = fbp;
      if (fbc) enrichedReq.cookies._fbc = fbc;
      if (resolvedFbLoginId) enrichedReq.cookies.fb_login_id = resolvedFbLoginId;
    }

    const enrichedUser = {
      ...user,
      ...(resolvedFbLoginId ? { fb_login_id: resolvedFbLoginId } : {}),
    };

    const product = {
      did: contentId,
      name: productName || '',
      offerPrice: Number(price || 0),
      price: Number(price || 0),
      category: category || '',
    };

    sendServerViewContentEvent({
      product,
      req: enrichedReq,
      eventId,
      eventSourceUrl,
      user: enrichedUser,
    });

    return res.json({ status: 'success', message: 'ViewContent event dispatched.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to dispatch ViewContent event.' });
  }
};
