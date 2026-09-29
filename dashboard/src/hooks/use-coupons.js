import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const normalizeCoupon = (coupon) => {
  if (!coupon) return coupon;

  const normalizedId = coupon.id || coupon._id;
  return {
    ...coupon,
    id: normalizedId || '',
  };
};

const fetchCoupons = async () => {
  const response = await apiClient.get('/api/v1/coupons');
  const coupons = response.data?.data ?? [];

  return (Array.isArray(coupons) ? coupons : []).map((coupon) => normalizeCoupon(coupon));
};

export function useCoupons() {
  return useQuery({
    queryKey: ['coupons'],
    queryFn: fetchCoupons,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
