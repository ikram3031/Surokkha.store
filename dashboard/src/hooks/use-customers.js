import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/**
 * Formats a raw Bangladesh phone number to either 10 digits (1XXXXXXXXX) or 11 digits (01XXXXXXXXX)
 */
export function formatPhoneForOrderInput(rawPhone = "", targetLength = 11) {
  const digits = String(rawPhone || "").replace(/\D/g, "");
  if (!digits) return "";

  let elevenDigits = digits;
  if (digits.startsWith("880") && digits.length >= 13) {
    elevenDigits = "0" + digits.slice(3, 13);
  } else if (digits.startsWith("1") && digits.length === 10) {
    elevenDigits = "0" + digits;
  } else if (digits.startsWith("01") && digits.length >= 11) {
    elevenDigits = digits.slice(0, 11);
  }

  if (targetLength === 10) {
    return elevenDigits.startsWith("0") ? elevenDigits.slice(1, 11) : elevenDigits.slice(0, 10);
  }
  return elevenDigits.slice(0, 11);
}

/**
 * Debounced hook to search existing customers by phone, email, or name
 */
export function useCustomerSearch(query, enabled = true, debounceMs = 250) {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cleanQ = String(query || "").trim();
    if (!enabled || cleanQ.length < 3) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      apiClient
        .get("/api/v1/customers/search", {
          params: { q: cleanQ, limit: 8 },
        })
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setCustomers(list);
        })
        .catch(() => {
          if (!isMounted) return;
          setCustomers([]);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, debounceMs);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query, enabled, debounceMs]);

  return { customers, isLoading };
}

// Fetches the paginated Customer collection (customers saved from orders) for the customer list page
const fetchCustomersList = async (params) => {
  const limit = params?.limit ?? 15;
  const page = params?.page ?? 1;

  const response = await apiClient.get("/api/v1/customers", {
    params: { page, limit, ...(params?.search ? { search: params.search } : {}) },
  });

  const rawList = response.data?.data ?? [];
  const pagination = response.data?.pagination ?? {};

  const customers = rawList.map((c) => ({
    id: c.id || c._id,
    name: c.fullName || [c.firstName, c.lastName].filter(Boolean).join(" ") || c.phone || "",
    email: c.email || "",
    phone: c.phone || "",
    totalOrders: Number(c.totalOrders) || 0,
    lifetimeSpent: Number(c.totalSpent) || 0,
    joinedDate: c.createdAt || null,
    did: c.did || "",
    isActive: c.isActive ?? true,
  }));

  return {
    data: customers,
    meta: {
      total: pagination.total ?? customers.length,
      page: pagination.page ?? page,
      limit: pagination.limit ?? limit,
      totalPages: pagination.totalPages ?? (Math.ceil(customers.length / limit) || 1),
    },
  };
};

export const useCustomersList = (params) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => fetchCustomersList(params),
  });
};
