import mongoose, { Schema, model } from "mongoose";

const { models } = mongoose;

const cmsContentTypeSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export const CMSContentTypeModel = models.CMSContentType || model("CMSContentType", cmsContentTypeSchema);

export const DEFAULT_CMS_CONTENT_TYPES = [
  { key: "slider", label: "Slider", description: "Homepage hero banner slider with dynamic slides" },
  {
    key: "section-bg",
    label: "Section Background",
    description: "Background images for homepage sections (item badge = section key, item image = background)",
  },
];

// Ensures the built-in content types exist in the database
export const seedCmsContentTypes = async () => {
  await Promise.all(
    DEFAULT_CMS_CONTENT_TYPES.map((t) =>
      CMSContentTypeModel.updateOne({ key: t.key }, { $setOnInsert: t }, { upsert: true }),
    ),
  );
};
