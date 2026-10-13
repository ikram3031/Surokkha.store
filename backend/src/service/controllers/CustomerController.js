import { CustomerModel } from "../../common/models/customer.model.js";
import {
  searchCustomers,
  findCustomerByPhoneOrEmail,
  normalizeCustomerPhone,
  parseCustomerNames,
} from "../../common/services/customer.service.js";

/**
 * Manually create a new customer record
 */
export const createCustomerController = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      fullName,
      phone,
      email = "",
      address = "",
      thana = "",
      district = "",
      postcode = "",
      notes = "",
      source = "manual",
    } = req.body;

    const cleanPhone = normalizeCustomerPhone(phone || "");
    const { firstName: parsedFirst, lastName: parsedLast } = parseCustomerNames(
      fullName || "",
      firstName || "",
      lastName || ""
    );

    if (!parsedFirst) {
      return res.status(400).json({ status: "error", message: "Customer name is required." });
    }
    if (!cleanPhone) {
      return res.status(400).json({ status: "error", message: "A valid phone number is required." });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await findCustomerByPhoneOrEmail({ phone: cleanPhone, email: cleanEmail });
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "A customer with this phone or email already exists.",
        data: { id: existing._id.toString(), fullName: [existing.firstName, existing.lastName].filter(Boolean).join(" ") },
      });
    }

    const historyEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "created",
      source: "manual",
      updatedBy: req.user?.name || req.user?.did || "admin",
      note: "Customer manually created from dashboard",
    });

    const customer = await CustomerModel.create({
      firstName: parsedFirst,
      lastName: parsedLast,
      phone: cleanPhone,
      email: cleanEmail,
      address: address.trim(),
      thana: thana.trim(),
      district: district.trim(),
      postcode: postcode.trim(),
      notes: notes.trim(),
      source,
      history: [historyEntry],
    });

    return res.status(201).json({
      status: "success",
      message: "Customer created successfully.",
      data: {
        ...customer.toJSON(),
        fullName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft-delete a customer (sets isActive: false)
 */
export const deleteCustomerController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ status: "error", message: "Customer not found." });
    }

    const historyEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      action: "deleted",
      source: "manual",
      updatedBy: req.user?.name || req.user?.did || "admin",
      note: "Customer soft-deleted from dashboard",
    });

    customer.isActive = false;
    customer.history.push(historyEntry);
    await customer.save();

    return res.json({ status: "success", message: "Customer deleted successfully." });
  } catch (error) {
    next(error);
  }
};

/**
 * Quick search customers by phone, email, name, or address (for combobox/autocomplete)
 */
export const searchCustomersController = async (req, res, next) => {
  try {
    const { q = "", limit = 10 } = req.query;
    const results = await searchCustomers({ query: q, limit: Number(limit) || 10 });

    return res.json({
      status: "success",
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct lookup customer by exact/normalized phone or email
 */
export const lookupCustomerController = async (req, res, next) => {
  try {
    const { phone = "", email = "" } = req.query;
    if (!phone && !email) {
      return res.status(400).json({
        status: "error",
        message: "Either phone or email query parameter is required.",
      });
    }

    const customer = await findCustomerByPhoneOrEmail({ phone, email });
    if (!customer) {
      return res.json({
        status: "success",
        data: null,
        message: "No customer found.",
      });
    }

    const customerObj = customer.toJSON ? customer.toJSON() : customer;
    return res.json({
      status: "success",
      data: {
        ...customerObj,
        fullName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all customers with pagination and filtering
 */
export const getCustomersListController = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      district = "",
      sortBy = "lastOrderAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = { isActive: true };

    if (search && search.trim()) {
      const q = search.trim();
      const cleanDigits = q.replace(/\D/g, "");
      const orList = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ];
      if (cleanDigits.length >= 3) {
        orList.push({ phone: { $regex: cleanDigits, $options: "i" } });
      }
      filter.$or = orList;
    }

    if (district && district.trim()) {
      filter.district = { $regex: new RegExp(`^${district.trim()}$`, "i") };
    }

    const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [total, customers] = await Promise.all([
      CustomerModel.countDocuments(filter),
      CustomerModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const formatted = customers.map((c) => ({
      ...c,
      id: c._id.toString(),
      fullName: [c.firstName, c.lastName].filter(Boolean).join(" "),
    }));

    return res.json({
      status: "success",
      data: formatted,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer by ID or DID
 */
export const getCustomerByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    let customer;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      customer = await CustomerModel.findById(id).lean();
    }
    if (!customer) {
      customer = await CustomerModel.findOne({ did: id }).lean();
    }

    if (!customer) {
      return res.status(404).json({ status: "error", message: "Customer not found." });
    }

    // Parse history json strings for frontend convenience
    const parsedHistory = (customer.history || []).map((h) => {
      try {
        return typeof h === "string" ? JSON.parse(h) : h;
      } catch (_) {
        return { raw: h };
      }
    });

    return res.json({
      status: "success",
      data: {
        ...customer,
        id: customer._id.toString(),
        fullName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
        parsedHistory,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually update a customer record and record changes to history
 */
export const updateCustomerController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      email,
      address,
      thana,
      district,
      postcode,
      notes,
    } = req.body;

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ status: "error", message: "Customer not found." });
    }

    const changes = {};

    if (firstName !== undefined && firstName.trim() !== customer.firstName) {
      changes.firstName = { old: customer.firstName, new: firstName.trim() };
      customer.firstName = firstName.trim();
    }
    if (lastName !== undefined && lastName.trim() !== customer.lastName) {
      changes.lastName = { old: customer.lastName, new: lastName.trim() };
      customer.lastName = lastName.trim();
    }
    if (phone !== undefined) {
      const cleanPhone = normalizeCustomerPhone(phone);
      if (cleanPhone && cleanPhone !== customer.phone) {
        changes.phone = { old: customer.phone, new: cleanPhone };
        customer.phone = cleanPhone;
      }
    }
    if (email !== undefined && email.trim().toLowerCase() !== customer.email) {
      changes.email = { old: customer.email, new: email.trim().toLowerCase() };
      customer.email = email.trim().toLowerCase();
    }
    if (address !== undefined && address.trim() !== customer.address) {
      changes.address = { old: customer.address, new: address.trim() };
      customer.address = address.trim();
    }
    if (thana !== undefined && thana.trim() !== customer.thana) {
      changes.thana = { old: customer.thana, new: thana.trim() };
      customer.thana = thana.trim();
    }
    if (district !== undefined && district.trim() !== customer.district) {
      changes.district = { old: customer.district, new: district.trim() };
      customer.district = district.trim();
    }
    if (postcode !== undefined && postcode.trim() !== customer.postcode) {
      changes.postcode = { old: customer.postcode, new: postcode.trim() };
      customer.postcode = postcode.trim();
    }
    if (notes !== undefined && notes.trim() !== customer.notes) {
      changes.notes = { old: customer.notes, new: notes.trim() };
      customer.notes = notes.trim();
    }

    if (Object.keys(changes).length > 0) {
      const historyEntry = JSON.stringify({
        timestamp: new Date().toISOString(),
        action: "updated",
        source: "manual_edit",
        updatedBy: req.user?.name || req.user?.did || "admin",
        changes,
        note: "Manual customer profile edit from dashboard",
      });
      customer.history.push(historyEntry);
    }

    await customer.save();

    return res.json({
      status: "success",
      message: "Customer updated successfully.",
      data: {
        ...customer.toJSON(),
        fullName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      },
    });
  } catch (error) {
    next(error);
  }
};
