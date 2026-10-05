import { StyleModel } from "../../common/models/style.model.js";

export const getStyles = async (req, res) => {
  try {
    const styles = await StyleModel.find();
    return res.status(200).json({ status: "success", data: styles });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

export const updateStyle = async (req, res) => {
  try {
    const { type } = req.params;
    const updateData = req.body;
    updateData.updatedBy = req.user?.id;
    
    // Ensure we are only updating an existing type, not creating a new one (although upsert is false by default)
    const style = await StyleModel.findOneAndUpdate(
      { type },
      { $set: updateData },
      { new: true }
    );
    
    if (!style) {
      return res.status(404).json({ status: "error", message: "Style type not found" });
    }
    
    return res.status(200).json({ status: "success", data: style });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
