import mongoose from "mongoose";
import dotenv from "dotenv";
import { UserModel } from "./src/common/models/user.model.js";
import { hashPassword } from "./src/common/utils/password.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    console.log("Dropping users collection...");
    try {
      await mongoose.connection.db.dropCollection("users");
      console.log("Users collection dropped.");
    } catch (e) {
      if (e.code === 26) {
        console.log("Users collection does not exist, skipping drop.");
      } else {
        throw e;
      }
    }

    const passwordHash = await hashPassword("11223345");

    console.log("Creating new Owner users...");
    const users = await UserModel.insertMany([
      {
        name: "Metalhead Dev",
        email: "ihkhan2027@gmail.com",
        passwordHash,
        role: "Owner",
        phone: "01000000000"
      },
      {
        name: "Maher",
        email: "maherhasan502@gmail.com",
        passwordHash,
        role: "Owner",
        phone: "01000000000"
      }
    ]);

    console.log(`Created ${users.length} users successfully.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

run();
