// Completed orders the courier (Pathao sync) reported delivered are view only; mirrors the backend rule
export const isCourierDeliveredLocked = (order) => {
  if (String(order?.status || '').toLowerCase() !== 'completed') return false;
  const c = order?.courier || {};
  return Boolean(c.consignmentId) && Boolean(c.deliveredAt || String(c.category || '').toLowerCase() === 'delivered');
};
