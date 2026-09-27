import { config } from "../config/index.js";

// Middleware to guard routes based on client feature configuration
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    const features = config.features || {};
    let isEnabled = true;

    if (featureName === "brand" || featureName === "brands") {
      isEnabled = features.brand !== false && features.brands !== false;
    } else if (featureName === "attribute" || featureName === "attributes") {
      isEnabled = features.attribute !== false && features.attributes !== false;
    } else if (features[featureName] !== undefined) {
      isEnabled = Boolean(features[featureName]);
    }

    if (!isEnabled) {
      return res.status(404).json({
        status: "error",
        message: `Feature '${featureName}' is disabled for this store.`,
      });
    }

    next();
  };
};
