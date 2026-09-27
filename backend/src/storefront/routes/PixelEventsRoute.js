import { Router } from 'express';
import { trackAddToCart, trackViewContent } from '../controllers/PixelEventsController.js';

const pixelEventsRouter = Router();

// POST /api/v1/events/add-to-cart : Server-side Meta CAPI + TikTok AddToCart event using product.did
pixelEventsRouter.post('/add-to-cart', trackAddToCart);

// POST /api/v1/events/view-content : Server-side Meta CAPI ViewContent event using product.did
pixelEventsRouter.post('/view-content', trackViewContent);

export default pixelEventsRouter;
