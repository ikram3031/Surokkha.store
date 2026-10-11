import { useState, useEffect } from "react";
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
