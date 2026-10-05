import { StyleModel } from "../../common/models/style.model.js";

// Ensure default styles are populated
const prepopulateStyles = async () => {
  const types = ["Stoorefr", "Admin", "Dashboard"];
  for (const type of types) {
    const existing = await StyleModel.findOne({ type });
    if (!existing) {
      await StyleModel.create({ type });
    }
  }
};
// We can run this once when controller loads
prepopulateStyles().catch(console.error);

export const getStyles = async (req, res) => {
  try {
    const styles = await StyleModel.find({});
    return res.status(200).json({ status: "success", data: styles });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateStyle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Do not allow updating type if it shouldn't be changed, but here we just update theme/styles
    if (updateData.type) delete updateData.type; // Prevent changing type

    const style = await StyleModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!style) {
      return res.status(404).json({ status: "error", message: "Style not found" });
    }
    return res.status(200).json({ status: "success", data: style });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
