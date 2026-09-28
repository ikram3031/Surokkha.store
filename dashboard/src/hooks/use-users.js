import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Fetches system users list from backend API
const fetchSystemUsers = async (params) => {
  const limit = params?.limit ?? 15;
  const page = params?.page ?? 1;

  try {
    const queryParams = {
      limit,
      page,
    };
    if (params?.search) queryParams.q = params.search;
    if (params?.role && params.role !== 'All') queryParams.role = params.role;

    const response = await apiClient.get('/api/v1/users', { params: queryParams });
    const userList = response.data?.data || (Array.isArray(response.data) ? response.data : []);
    const meta = response.data?.meta;

    const mapped = userList.map((u) => ({
      id: u.id || u._id,
      name: u.name || u.email?.split('@')[0] || 'User',
      email: u.email || '',
      role: u.role || 'Admin',
      status: u.isActive !== false ? 'Active' : 'Inactive',
      lastLogin: u.updatedAt || u.createdAt || new Date().toISOString(),
      avatar: u.avatar || undefined,
    }));

    return {
      data: mapped,
      meta: meta || {
        total: mapped.length,
        page,
        limit,
        totalPages: Math.ceil(mapped.length / limit) || 1,
      },
    };
  } catch (err) {
    console.error('Backend API system users request failed:', err);
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 1,
      },
    };
  }
};

// React hook for system users query
export const useSystemUsers = (params) => {
  return useQuery({
    queryKey: ['system-users', params],
    queryFn: () => fetchSystemUsers(params),
  });
};
