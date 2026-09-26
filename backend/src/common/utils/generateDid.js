import { randomBytes } from "crypto";

export const generateDid = () => randomBytes(8).toString("hex");
