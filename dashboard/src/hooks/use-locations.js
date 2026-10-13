import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/lib/api-client";
import { DISTRICTS as FALLBACK_DISTRICTS, DISTRICT_THANAS as FALLBACK_THANAS } from "@/data/districts";

// In-memory cache for loaded districts and thanas
let cachedDistricts = null;
const cachedThanasByCity = new Map();

/**
 * Hook to retrieve districts list with automatic caching and offline fallback
 */
export function useDistricts() {
  const [districts, setDistricts] = useState(cachedDistricts || []);
  const [isLoading, setIsLoading] = useState(!cachedDistricts);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cachedDistricts && cachedDistricts.length > 0) {
      setDistricts(cachedDistricts);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    apiClient
      .get("/api/v1/courier/districts")
      .then((res) => {
        if (!isMounted) return;
        const apiData = res.data?.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          cachedDistricts = apiData;
          setDistricts(apiData);
        } else {
          cachedDistricts = FALLBACK_DISTRICTS;
          setDistricts(FALLBACK_DISTRICTS);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Failed to fetch districts from API, using fallback data:", err.message);
        cachedDistricts = FALLBACK_DISTRICTS;
        setDistricts(FALLBACK_DISTRICTS);
        setError(err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { districts, isLoading, error };
}

/**
 * Hook to retrieve thanas for a given district name or cityId
 */
export function useThanas(districtIdentifier, districtsList = []) {
  const [thanas, setThanas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Resolve matching district record
  const matchingDistrict = useMemo(() => {
    if (!districtIdentifier) return null;
    const cleanId = String(districtIdentifier).trim().toLowerCase();
    return (
      districtsList.find(
        (d) =>
          String(d.name).toLowerCase() === cleanId ||
          String(d.cityId) === cleanId ||
          String(d.id).toLowerCase() === cleanId
      ) || null
    );
  }, [districtIdentifier, districtsList]);

  const cityId = matchingDistrict?.cityId || null;
  const districtName = matchingDistrict?.name || (typeof districtIdentifier === "string" ? districtIdentifier.trim() : "");

  useEffect(() => {
    if (!districtName) {
      setThanas([]);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = String(cityId || districtName).toLowerCase();
    if (cachedThanasByCity.has(cacheKey)) {
      setThanas(cachedThanasByCity.get(cacheKey));
      setIsLoading(false);
      return;
    }

    // Check if the district doc already has embedded thanas
    if (matchingDistrict?.thanas && Array.isArray(matchingDistrict.thanas) && matchingDistrict.thanas.length > 0) {
      const embedded = matchingDistrict.thanas.map((t) => ({
        ...t,
        districtName,
      }));
      cachedThanasByCity.set(cacheKey, embedded);
      setThanas(embedded);
      setIsLoading(false);
      return;
    }

    // Check fallback static dictionary
    const fallbackList = FALLBACK_THANAS[districtName];
    if (fallbackList && Array.isArray(fallbackList) && fallbackList.length > 0) {
      cachedThanasByCity.set(cacheKey, fallbackList);
      setThanas(fallbackList);
    }

    let isMounted = true;
    setIsLoading(true);

    const lookupTarget = cityId || encodeURIComponent(districtName);
    apiClient
      .get(`/api/v1/courier/districts/${lookupTarget}/thanas`)
      .then((res) => {
        if (!isMounted) return;
        const apiData = res.data?.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          cachedThanasByCity.set(cacheKey, apiData);
          setThanas(apiData);
        } else if (!fallbackList) {
          setThanas([]);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn(`Failed to fetch thanas for district '${districtName}':`, err.message);
        if (!fallbackList) {
          setThanas([]);
        }
        setError(err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [districtName, cityId, matchingDistrict]);

  return { thanas, isLoading, error, matchingDistrict };
}
