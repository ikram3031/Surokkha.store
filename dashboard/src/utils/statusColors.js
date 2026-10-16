import styles from '@/styles/styles.json';

// Text color class for an order status option (dropdowns, filters), keyed by status name
export const getStatusOptionClass = (status) =>
  styles.badge.status.optionText[String(status || '').toLowerCase()] || '';
