import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Fetches a paginated and filtered list of orders from the backend API
const fetchOrders = async (params) => {
  const limit = params?.limit ?? 15;
  const page = params?.page ?? 1;

  try {
    const queryParams = {
      limit,
      page,
    };
    if (params?.status) queryParams.status = params.status.toLowerCase();
    if (params?.paymentStatus) queryParams.paymentStatus = params.paymentStatus.toLowerCase();
    if (params?.search) queryParams.search = params.search;
    if (params?.orderType) queryParams.orderType = params.orderType;

    const response = await apiClient.get('/api/v1/orders', { params: queryParams });
    const responseData = response.data;

    const rawOrderList = Array.isArray(responseData)
      ? responseData
      : responseData?.data ?? [];
    const orderList = Array.isArray(rawOrderList) ? rawOrderList : [];
    const meta = responseData?.meta ?? {
      total: orderList.length,
      page,
      limit,
      totalPages: Math.ceil(orderList.length / limit),
    };

    const orders = orderList.map((o) => {
      let fulfillment = 'Pending';
      if (o.status === 'processing') {
        fulfillment = 'Processing';
      } else if (o.status === 'shipped') {
        fulfillment = 'Shipped';
      } else if (o.status === 'completed') {
        fulfillment = 'Completed';
      } else if (o.status === 'cancelled') {
        fulfillment = 'Cancelled';
      } else if (o.status === 'fake') {
        fulfillment = 'Fake';
      }

      let paymentStatus = 'Pending';
      if (o.paymentStatus) {
        const p = o.paymentStatus.toLowerCase();
        if (p === 'paid') paymentStatus = 'Paid';
        else if (p === 'partial' || p === 'partially_paid') paymentStatus = 'Partial';
        else if (p === 'failed') paymentStatus = 'Failed';
        else if (p === 'cancelled' || p === 'canceled') paymentStatus = 'Canceled';
        else paymentStatus = 'Pending';
      } else {
        const isPaid = o.status === 'completed' || o.status === 'shipped';
        paymentStatus = isPaid ? 'Paid' : 'Pending';
      }

      const id = o._id || o.id || `UNKNOWN-${Math.random().toString(36).slice(2, 10)}`;
      const totalAmount = o.totals?.total ?? o.totalAmount ?? 0;
      const paidAmount = o.paidAmount ?? (paymentStatus === 'Paid' ? totalAmount : 0);

      return {
        ...o,
        id,
        orderNumber: o.orderNumber || `ORD-${o._id?.slice(-8) || id}`,
        customerName: o.billingInfo?.fullName || o.shippingInfo?.fullName || o.customer?.fullName || 'Guest Customer',
        customer: o.customer || o.billingInfo || o.shippingInfo || {},
        date: o.createdAt || new Date().toISOString(),
        totalAmount,
        paidAmount,
        paymentStatus,
        orderStatus: fulfillment,
      };
    });

    return {
      data: orders,
      meta: {
        total: meta.total ?? orders.length,
        page: meta.page ?? page,
        limit: meta.limit ?? limit,
        totalPages: meta.totalPages ?? Math.ceil((meta.total ?? orders.length) / limit),
      },
    };
  } catch (err) {
    console.warn('Backend API orders request failed:', err);
  }

  return {
    data: [],
    meta: { total: 0, page, limit, totalPages: 0 },
  };
};

// React Query hook to fetch paginated and filtered orders
export const useOrders = (params) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => fetchOrders(params),
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
};

// Fetches detailed information for a single order by ID
const fetchOrderById = async (id) => {
  const response = await apiClient.get(`/api/v1/orders/${id}`);
  if (!response.data?.data) {
    throw new Error('Order not found');
  }
  return response.data.data;
};

// React Query hook to fetch a single order by ID
export const useOrder = (id) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
};
