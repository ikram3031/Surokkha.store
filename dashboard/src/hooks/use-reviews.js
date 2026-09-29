import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const normalizeReview = (review) => {
  if (!review) return review;

  const normalizedId = review.id || review._id;
  return {
    ...review,
    id: normalizedId || '',
  };
};

const fetchReviews = async () => {
  const response = await apiClient.get('/api/v1/reviews?limit=1000');
  const reviews = response.data?.data ?? [];

  return (Array.isArray(reviews) ? reviews : []).map((review) => normalizeReview(review));
};

export function useReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: fetchReviews,
    staleTime: 30 * 1000,
    retry: 1,
  });
}
