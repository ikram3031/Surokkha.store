import { SizeChartModel } from "../../common/models/sizeChart.model.js";

// GET /api/v1/size-charts
export const getAllSizeCharts = async (req, res) => {
  try {
    const charts = await SizeChartModel.find({ active: true }).lean();
    res.json({ status: "success", data: charts });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve size charts" });
  }
};

// GET /api/v1/size-charts/category/:categoryId
export const getSizeChartByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const chart = await SizeChartModel.findOne({
      $or: [{ category: categoryId }, { categorySlug: categoryId }, { categoryDid: categoryId }],
      active: true,
    }).lean();
    if (!chart) {
      return res.status(404).json({ status: "error", message: "Size chart not found for this category" });
    }
    res.json({ status: "success", data: chart });
  } catch (err) {
    res.status(500).json({ status: "error", message: "Unable to retrieve size chart" });
  }
};
