import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const fetchMembers = async (params) => {
  const limit = params?.limit ?? 15;
  const page = params?.page ?? 1;

  const queryParams = {
    limit,
    page,
  };
  if (params?.search) queryParams.q = params.search;
  if (params?.segment) queryParams.segment = params.segment;

  const response = await apiClient.get('/api/v1/members', {
    params: queryParams,
  });

  const rawData = response.data;
  const memberList = rawData?.data ?? (Array.isArray(rawData) ? rawData : []);
  const calculatedTotal = memberList.length;
  const calculatedTotalPages = Math.ceil(calculatedTotal / limit) || 1;

  const meta = rawData?.meta ?? {
    total: calculatedTotal,
    page,
    limit,
    totalPages: calculatedTotalPages,
  };

  const parsedMembers = (Array.isArray(memberList) ? memberList : []).map((m) => {
    const member = m || {};

    const totalOrders = typeof member.totalOrders === 'number'
      ? member.totalOrders
      : (Array.isArray(member.orders) ? member.orders.length : 0);

    const lifetimeSpent = typeof member.lifetimeSpent === 'number'
      ? member.lifetimeSpent
      : (typeof member.totalOrderAmount === 'number' ? member.totalOrderAmount : 0);

    return {
      id: member.id || member._id,
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      totalOrders: totalOrders || 0,
      lifetimeSpent: lifetimeSpent || 0,
      joinedDate: member.createdAt || null,
      segment: member.segment || undefined,
      avatar: member.avatar || undefined,
      billingAddress: member.billingAddress || null,
      shippingAddress: member.shippingAddress || null,
      role: member.role || 'Customer',
      did: member.did || '',
      isActive: member.isActive ?? true,
    };
  });

  return {
    data: parsedMembers,
    meta: {
      total: meta.total ?? parsedMembers.length,
      page: meta.page ?? page,
      limit: meta.limit ?? limit,
      totalPages: meta.totalPages ?? calculatedTotalPages,
    },
  };
};

// React hook for members list
export const useMembers = (params) => {
  return useQuery({
    queryKey: ['members', params],
    queryFn: () => fetchMembers(params),
  });
};
