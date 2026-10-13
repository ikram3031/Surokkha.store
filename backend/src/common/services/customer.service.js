import { CustomerModel } from "../models/customer.model.js";
import { OrderModel } from "../models/order.model.js";

/**
 * Standardize phone number for Bangladesh (e.g. 017XXXXXXXX)
 */
export const normalizeCustomerPhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  const digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";

  // 8801XXXXXXXXX -> 01XXXXXXXXX
  if (digits.length === 13 && digits.startsWith("880")) {
    return "0" + digits.slice(3);
  }
  // 1XXXXXXXXX -> 01XXXXXXXXX
  if (digits.length === 10 && digits.startsWith("1")) {
    return "0" + digits;
  }
  // Already 01XXXXXXXXX
  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }
  return digits;
};

/**
 * Parses full name into firstName and lastName
 */
export const parseCustomerNames = (rawFullName = "", rawFirstName = "", rawLastName = "") => {
  if (rawFirstName && typeof rawFirstName === "string" && rawFirstName.trim()) {
    return {
      firstName: rawFirstName.trim(),
      lastName: (rawLastName && typeof rawLastName === "string") ? rawLastName.trim() : "",
    };
  }

  const clean = (rawFullName || "").trim();
  if (!clean) {
    return { firstName: "Customer", lastName: "" };
  }

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] };
  }

  // Handle common Bengali titles: Md, Md., Mr, Mr., Mst, Mst.
  const firstWordLower = parts[0].toLowerCase().replace(/\./g, "");
  const titles = ["md", "mr", "mrs", "ms", "mst", "dr", "prof"];
  if (titles.includes(firstWordLower) && parts.length >= 3) {
    return {
      firstName: `${parts[0]} ${parts[1]}`,
      lastName: parts.slice(2).join(" "),
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

/**
 * Lookup existing customer by phone or email
 */
export const findCustomerByPhoneOrEmail = async ({ phone = "", email = "" }) => {
  const cleanPhone = normalizeCustomerPhone(phone);
  const cleanEmail = (email || "").trim().toLowerCase();
  const isDummyEmail =
    !cleanEmail ||
    cleanEmail.includes("@instore") ||
    cleanEmail.includes("@local") ||
    cleanEmail.includes("walkin@");

  const queryOr = [];
  if (cleanPhone) {
    // Match normalized phone or exact raw string or regex matching the 10/11 digits
    const phoneSuffix = cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone;
    queryOr.push({ phone: cleanPhone });
    queryOr.push({ phone: { $regex: `${phoneSuffix}$` } });
  }

  if (cleanEmail && !isDummyEmail) {
    queryOr.push({ email: cleanEmail });
  }

  if (queryOr.length === 0) return null;

  return await CustomerModel.findOne({ $or: queryOr }).sort({ updatedAt: -1 });
};

/**
 * Upsert customer record upon order creation and maintain history log
 */
export const upsertCustomerFromOrder = async ({ order, payload = {}, updatedBy = null }) => {
  try {
    if (!order) return null;

    const billing = order.billingInfo || payload.billingInfo || {};
    const shipping = order.shippingInfo || payload.shippingInfo || {};

    const rawFullName = billing.fullName || shipping.fullName || payload.customerName || payload.fullName || "";
    const rawPhone = billing.phone || shipping.phone || payload.customerPhone || payload.phone || "";
    const rawEmail = (billing.email || shipping.email || payload.customerEmail || payload.email || "").trim().toLowerCase();
    const rawAddress = billing.address || shipping.address || payload.customerAddress || payload.address || "";
    const rawThana = billing.thana || shipping.thana || payload.customerThana || payload.thana || "";
    const rawDistrict = billing.district || shipping.district || payload.customerDistrict || payload.district || "";
    const rawPostcode = billing.zip || shipping.zip || payload.postcode || payload.zip || "";

    const cleanPhone = normalizeCustomerPhone(rawPhone);
    if (!cleanPhone && !rawEmail) {
      return null;
    }

    const { firstName, lastName } = parseCustomerNames(rawFullName, payload.firstName, payload.lastName);
    const orderTotal = Number(order.totals?.total || order.total || payload.total || 0);
    const orderNumber = order.orderNumber || payload.orderNumber || "UNKNOWN";
    const orderType = order.orderType || payload.orderType || "online";

    let customer = await findCustomerByPhoneOrEmail({
      phone: cleanPhone,
      email: rawEmail,
    });

    if (!customer) {
      // 1. Create New Customer
      const historyEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "created",
        source: orderType,
        orderNumber,
        updatedBy: updatedBy || "order_system",
        snapshot: {
          firstName,
          lastName,
          phone: cleanPhone || rawPhone,
          email: rawEmail,
          address: rawAddress,
          thana: rawThana,
          district: rawDistrict,
          postcode: rawPostcode,
        },
        note: `New customer created from order #${orderNumber}`,
      });

      customer = await CustomerModel.create({
        firstName: firstName || "Customer",
        lastName: lastName || "",
        phone: cleanPhone || rawPhone,
        email: rawEmail || "",
        address: rawAddress || "",
        thana: rawThana || "",
        district: rawDistrict || "",
        postcode: rawPostcode || "",
        history: [historyEntry],
        totalOrders: 1,
        totalSpent: orderTotal,
        lastOrderAt: new Date(),
        orders: [
          {
            orderId: order._id,
            orderNumber,
            total: orderTotal,
            date: new Date(),
            orderType,
          },
        ],
        source: orderType,
      });
    } else {
      // 2. Update Existing Customer & Record History Diff
      const changes = {};

      if (firstName && firstName !== "Customer" && firstName !== "Walk-in" && firstName !== customer.firstName) {
        changes.firstName = { old: customer.firstName, new: firstName };
        customer.firstName = firstName;
      }
      if (lastName && lastName !== customer.lastName) {
        changes.lastName = { old: customer.lastName, new: lastName };
        customer.lastName = lastName;
      }
      if (rawAddress && rawAddress !== "In-Store" && rawAddress !== customer.address) {
        changes.address = { old: customer.address, new: rawAddress };
        customer.address = rawAddress;
      }
      if (rawThana && rawThana !== customer.thana) {
        changes.thana = { old: customer.thana, new: rawThana };
        customer.thana = rawThana;
      }
      if (rawDistrict && rawDistrict !== customer.district) {
        changes.district = { old: customer.district, new: rawDistrict };
        customer.district = rawDistrict;
      }
      if (rawPostcode && rawPostcode !== customer.postcode) {
        changes.postcode = { old: customer.postcode, new: rawPostcode };
        customer.postcode = rawPostcode;
      }
      if (rawEmail && !rawEmail.includes("@instore") && !rawEmail.includes("@local") && rawEmail !== customer.email) {
        changes.email = { old: customer.email, new: rawEmail };
        customer.email = rawEmail;
      }
      if (cleanPhone && cleanPhone !== customer.phone) {
        changes.phone = { old: customer.phone, new: cleanPhone };
        customer.phone = cleanPhone;
      }

      if (Object.keys(changes).length > 0) {
        const historyEntry = JSON.stringify({
          timestamp: new Date().toISOString(),
          action: "updated",
          source: orderType,
          orderNumber,
          updatedBy: updatedBy || "order_system",
          changes,
          note: `Customer information updated during order #${orderNumber}`,
        });
        customer.history.push(historyEntry);
      }

      // Refresh Stats & Orders list
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + orderTotal;
      customer.lastOrderAt = new Date();

      const existingOrderEntry = (customer.orders || []).find(
        (o) => String(o.orderNumber) === String(orderNumber) || String(o.orderId) === String(order._id)
      );

      if (!existingOrderEntry) {
        customer.orders.push({
          orderId: order._id,
          orderNumber,
          total: orderTotal,
          date: new Date(),
          orderType,
        });
      }

      await customer.save();
    }

    // Link customer to the order document
    await OrderModel.findByIdAndUpdate(order._id, { customer: customer._id });
    order.customer = customer._id;

    return customer;
  } catch (err) {
    console.error("[upsertCustomerFromOrder] Error upserting customer:", err);
    return null;
  }
};

/**
 * Search customers by query string (phone, email, name, address)
 */
export const searchCustomers = async ({ query = "", limit = 10 }) => {
  const cleanQ = (query || "").trim();
  if (!cleanQ) return [];

  const cleanDigits = cleanQ.replace(/\D/g, "");
  const searchConditions = [];

  // 1. Phone search
  if (cleanDigits.length >= 3) {
    searchConditions.push({ phone: { $regex: cleanDigits, $options: "i" } });
  }

  // 2. Email search
  if (cleanQ.includes("@") || cleanQ.includes(".")) {
    searchConditions.push({ email: { $regex: cleanQ, $options: "i" } });
  }

  // 3. Name or Address search
  const regex = new RegExp(cleanQ, "i");
  searchConditions.push({ firstName: regex });
  searchConditions.push({ lastName: regex });
  searchConditions.push({ address: regex });
  searchConditions.push({ did: regex });

  const customers = await CustomerModel.find({
    isActive: true,
    $or: searchConditions,
  })
    .sort({ lastOrderAt: -1, updatedAt: -1 })
    .limit(Number(limit) || 10)
    .lean();

  return customers.map((c) => ({
    ...c,
    id: c._id.toString(),
    fullName: [c.firstName, c.lastName].filter(Boolean).join(" "),
  }));
};
