import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/error-handler';

const BASE = '/api/v1/blog';

// Builds a query hook that reads one blog endpoint and returns the response body
const useBlogQuery = (key, path, options = {}) =>
  useQuery({
    queryKey: ['blog', ...key],
    queryFn: async () => (await apiClient.get(`${BASE}${path}`, { params: options.params })).data,
    staleTime: 30 * 1000,
    retry: 1,
    placeholderData: options.keepPrevious ? keepPreviousData : undefined,
    enabled: options.enabled ?? true,
  });

// Builds a mutation hook that refreshes every blog query after it succeeds
const useBlogMutation = (request, success) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: request,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blog'] });
      const message = typeof success === 'function' ? success(data, variables) : success;
      if (message) toast.success(message);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Something went wrong. Please try again.')),
  });
};

export const useBlogOverview = () => useBlogQuery(['overview'], '/overview');

export const useBlogPosts = (params) => useBlogQuery(['posts', params], '/posts', { params, keepPrevious: true });
export const useBlogPost = (id) => useBlogQuery(['post', id], `/posts/${id}`, { enabled: Boolean(id) });
export const useSavePost = () =>
  useBlogMutation(
    async ({ id, ...payload }) => (await (id ? apiClient.put(`${BASE}/posts/${id}`, payload) : apiClient.post(`${BASE}/posts`, payload))).data,
    (_data, variables) => (variables.status === 'published' ? 'Post published' : variables.status === 'scheduled' ? 'Post scheduled' : 'Post saved')
  );
export const useDeletePost = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/posts/${id}`)).data, (data) => data?.message);
export const useBulkPosts = () => useBlogMutation(async (payload) => (await apiClient.post(`${BASE}/posts/bulk`, payload)).data, 'Posts updated');
export const useUploadBlogImage = () =>
  useMutation({
    mutationFn: async (file) => {
      const form = new FormData();
      form.append('image', file);
      return (await apiClient.post(`${BASE}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Image upload failed')),
  });

export const useBlogCategories = () => useBlogQuery(['categories'], '/categories');
export const useSaveCategory = () =>
  useBlogMutation(
    async ({ id, ...payload }) => (await (id ? apiClient.put(`${BASE}/categories/${id}`, payload) : apiClient.post(`${BASE}/categories`, payload))).data,
    (_data, variables) => (variables.id ? 'Category updated' : 'Category added')
  );
export const useDeleteCategory = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/categories/${id}`)).data, 'Category deleted');

export const useBlogTags = () => useBlogQuery(['tags'], '/tags');
export const useCreateTag = () => useBlogMutation(async (payload) => (await apiClient.post(`${BASE}/tags`, payload)).data, 'Tag added');
export const useDeleteTag = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/tags/${id}`)).data, 'Tag deleted');
export const useMergeTags = () => useBlogMutation(async (payload) => (await apiClient.post(`${BASE}/tags/merge`, payload)).data, 'Tags merged');

export const useBlogComments = (params) => useBlogQuery(['comments', params], '/comments', { params, keepPrevious: true });
export const useUpdateComment = () =>
  useBlogMutation(async ({ id, status }) => (await apiClient.patch(`${BASE}/comments/${id}`, { status })).data, (_data, variables) => (variables.status === 'approved' ? 'Comment approved' : 'Comment updated'));
export const useReplyComment = () => useBlogMutation(async ({ id, body }) => (await apiClient.post(`${BASE}/comments/${id}/reply`, { body })).data, 'Reply posted');
export const useDeleteComment = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/comments/${id}`)).data, 'Comment deleted');

export const useSeoOverview = () => useBlogQuery(['seo', 'overview'], '/seo/overview');
export const useSeoAudit = (params) => useBlogQuery(['seo', 'audit', params], '/seo/audit', { params, keepPrevious: true });
export const useSeoSettings = () => useBlogQuery(['seo', 'settings'], '/seo/settings');
export const useUpdateSeoSettings = () => useBlogMutation(async (payload) => (await apiClient.put(`${BASE}/seo/settings`, payload)).data, 'Settings saved');
export const useSitemapInfo = () => useBlogQuery(['seo', 'sitemap'], '/seo/sitemap');
export const useRegenerateSitemap = () => useBlogMutation(async () => (await apiClient.post(`${BASE}/seo/sitemap/regenerate`)).data, 'Sitemap regenerated');

export const useSeoKeywords = (params) => useBlogQuery(['seo', 'keywords', params], '/seo/keywords', { params, keepPrevious: true });
export const useCreateKeyword = () => useBlogMutation(async (payload) => (await apiClient.post(`${BASE}/seo/keywords`, payload)).data, 'Keyword added');
export const useUpdateKeyword = () => useBlogMutation(async ({ id, ...payload }) => (await apiClient.put(`${BASE}/seo/keywords/${id}`, payload)).data);
export const useDeleteKeyword = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/seo/keywords/${id}`)).data, 'Keyword removed');

export const useSeoRedirects = () => useBlogQuery(['seo', 'redirects'], '/seo/redirects');
export const useSaveRedirect = () =>
  useBlogMutation(
    async ({ id, ...payload }) => (await (id ? apiClient.put(`${BASE}/seo/redirects/${id}`, payload) : apiClient.post(`${BASE}/seo/redirects`, payload))).data,
    (_data, variables) => (variables.id ? 'Redirect updated' : 'Redirect added')
  );
export const useDeleteRedirect = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/seo/redirects/${id}`)).data, 'Redirect deleted');
export const useSeoNotFound = () => useBlogQuery(['seo', 'not-found'], '/seo/not-found');
export const useDeleteNotFound = () => useBlogMutation(async (id) => (await apiClient.delete(`${BASE}/seo/not-found/${id}`)).data, 'Entry cleared');
