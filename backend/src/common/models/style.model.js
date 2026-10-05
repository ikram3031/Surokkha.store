import mongoose, { Schema, model } from "mongoose";

const styleSchema = new Schema(
  {
    type: {
      type: String,
      default: "Stoorefr",
      enum: ["Stoorefr", "Admin"],
      required: true,
      unique: true
    },
    theme: {
      primaryColor: { type: String, default: "#0f172a", trim: true },
      secondaryColor: { type: String, default: "#475569", trim: true },
      accentColor: { type: String, default: "#0284c7", trim: true },
      backgroundColor: { type: String, default: "#f8fafc", trim: true },
      sidebarColor: { type: String, default: "#ffffff", trim: true },
      textColor: { type: String, default: "#0f172a", trim: true },
      fontFamily: { type: String, default: "Plus Jakarta Sans", trim: true },
      borderRadius: { type: Number, default: 8, min: 0, max: 24 },
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// Pre-populate script logic could be attached here or in an init script.
// "Pre-populate it or have entries for all types. Do not allow creating new styles, only updating."
styleSchema.statics.initializeStyles = async function () {
  const types = ["Stoorefr", "Admin"];
  for (const type of types) {
    await this.updateOne(
      { type },
      { $setOnInsert: { type } },
      { upsert: true }
    );
  }
};

export const StyleModel = mongoose.models.Style || model("Style", styleSchema);
