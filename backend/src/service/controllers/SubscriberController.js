import { SubscriberModel } from "../../common/models/subscriber.model.js";

// POST /api/v1/subscribers
export const createSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const existingSubscriber = await SubscriberModel.findOne({ email });

    if (existingSubscriber) {
      if (!existingSubscriber.isActive) {
        existingSubscriber.isActive = true;
        await existingSubscriber.save();
        return res.status(200).json({ success: true, message: "Subscribed! Welcome back to the club." });
      }
      return res.status(400).json({ success: false, message: "This email is already subscribed." });
    }

    const newSubscriber = new SubscriberModel({ email });
    await newSubscriber.save();

    return res.status(201).json({ success: true, message: "Subscribed! Welcome to the club." });
  } catch (error) {
    console.error("Error creating subscriber:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};
