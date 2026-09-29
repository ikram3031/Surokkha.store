import { apiClient } from './api-client';

export const LOG_TYPES = {
  NEW_ORDER: 'newOrder',
  CREATED: 'created',
  UPDATED: 'updated',
  DELETED: 'deleted',
};

export const LOG_TYPE_DIDS = {
  newOrder: '111',
  created: '110',
  updated: '121',
  deleted: '666',
};

/**
 * Global non-blocking utility to record user activity logs to the server
 * @param {Object} params
 * @param {string} params.type - 'newOrder' | 'created' | 'updated' | 'deleted'
 * @param {string} params.description - Readable log description
 * @param {boolean} [params.readStatus=false] - Optional read status
 */
export const logActivity = async ({
  type = 'updated',
  description,
  readStatus = false,
}) => {
  if (!description || !description.trim()) return null;
  try {
    const res = await apiClient.post('/api/v1/logs', {
      type,
      typeDid: LOG_TYPE_DIDS[type] || '121',
      description: description.trim(),
      readStatus: Boolean(readStatus),
    });
    return res.data;
  } catch (err) {
    console.error('Activity logging non-blocking error:', err);
    return null;
  }
};
