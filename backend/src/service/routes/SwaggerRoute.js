import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../../common/docs/swaggerSpec.js";
import { authenticateToken, authorizeRoles } from "../../common/middlewares/auth.middleware.js";

const swaggerRouter = Router();

// Protect all Swagger UI and API specification endpoints for Owner and Admin roles only
swaggerRouter.use(authenticateToken, authorizeRoles("Owner", "Admin"));

// Custom CSS for modern, professional UI styling with dark aesthetic accents
const customCss = `
  .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #334155; }
  .swagger-ui .topbar .topbar-wrapper a span { font-weight: 700; color: #38bdf8; }
  .swagger-ui .info { margin: 25px 0; }
  .swagger-ui .info .title { font-size: 32px; color: #0f172a; font-weight: 800; }
  .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 20px; }
  .swagger-ui .btn.authorize { background: #0284c7; color: #ffffff; border-color: #0284c7; font-weight: 600; border-radius: 6px; }
  .swagger-ui .btn.authorize svg { fill: #ffffff; }
  .swagger-ui .opblock { border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
  .swagger-ui .opblock.opblock-get { border-color: #0284c7; background: rgba(2, 132, 199, 0.05); }
  .swagger-ui .opblock.opblock-post { border-color: #16a34a; background: rgba(22, 163, 74, 0.05); }
  .swagger-ui .opblock.opblock-put { border-color: #d97706; background: rgba(217, 119, 6, 0.05); }
  .swagger-ui .opblock.opblock-delete { border-color: #dc2626; background: rgba(220, 38, 38, 0.05); }
  .swagger-ui .opblock.opblock-patch { border-color: #9333ea; background: rgba(147, 51, 234, 0.05); }
  .swagger-ui .opblock .opblock-summary-method { border-radius: 5px; font-weight: 700; min-width: 75px; text-align: center; }
  .swagger-ui .opblock-tag { font-size: 18px; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding: 10px 0; }
  .swagger-ui section.models { border-radius: 8px; border: 1px solid #e2e8f0; }
`;

const customOptions = {
  customCss,
  customSiteTitle: "Decantre BD | API Documentation",
  customfavIcon: "https://decantrebd.com/favicon.ico",
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: "none",
    filter: true,
    displayRequestDuration: true,
    tagsSorter: "alpha",
    operationsSorter: "alpha"
  }
};

// Endpoint to fetch raw OpenAPI 3.0 specification JSON
swaggerRouter.get("/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

// Mount Swagger UI handler
swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec, customOptions));

export default swaggerRouter;
