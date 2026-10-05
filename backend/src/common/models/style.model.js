import mongoose, { Schema, model } from "mongoose";

const styleSchema = new Schema(
  {
    type: { 
      type: String, 
      required: true, 
      unique: true, 
      default: "Stoorefr" 
    },
    theme: { type: Object, default: {} },
    styles: { type: Object, default: {} },
    variables: { type: Object, default: {} }
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

export const StyleModel = mongoose.models.Style || model("Style", styleSchema);
