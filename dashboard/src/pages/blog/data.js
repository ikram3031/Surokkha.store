// Sample content for the Blog & SEO workspace until the blog API is wired up

export const blogPosts = [
  { id: 1, title: 'How to choose your signature attar', slug: 'choose-signature-attar', category: 'Guides', author: 'Rafi', seo: 92, status: 'published', views: 9420, date: 'Oct 28, 2026', tone: 'from-primary/60 to-primary/20' },
  { id: 2, title: "Oud vs Musk: what's the difference?", slug: 'oud-vs-musk', category: 'Guides', author: 'Nadia', seo: 88, status: 'published', views: 7115, date: 'Oct 21, 2026', tone: 'from-sky-500/50 to-sky-500/10' },
  { id: 3, title: 'Winter fragrance layering', slug: 'winter-layering', category: 'Care Tips', author: 'Nadia', seo: 64, status: 'scheduled', views: 0, date: 'Nov 02, 2026', tone: 'from-emerald-500/50 to-emerald-500/10' },
  { id: 4, title: 'Behind the scenes: our distillery', slug: 'our-distillery', category: 'News', author: 'Rafi', seo: 41, status: 'draft', views: 0, date: 'Oct 29, 2026', tone: 'from-violet-500/50 to-violet-500/10' },
  { id: 5, title: 'Eid gift guide 2026', slug: 'eid-gift-guide-2026', category: 'Guides', author: 'Rafi', seo: 95, status: 'published', views: 5980, date: 'Oct 30, 2026', tone: 'from-rose-500/50 to-rose-500/10' },
];

export const postStatusTone = { published: 'green', scheduled: 'amber', draft: 'gray', review: 'blue' };

export const topPosts = [
  { title: 'How to choose your signature attar', views: 9420 },
  { title: "Oud vs Musk: what's the difference?", views: 7115 },
  { title: 'Eid gift guide 2026', views: 5980 },
  { title: 'Perfume storage tips for summer', views: 3204 },
];

export const dailyViews = [42, 55, 38, 70, 64, 81, 59, 92, 77, 66, 88, 73, 95, 84];

export const pipeline = [
  { label: 'Published', value: 112, dot: 'bg-emerald-500' },
  { label: 'Scheduled', value: 6, dot: 'bg-amber-500' },
  { label: 'Draft', value: 9, dot: 'bg-muted-foreground' },
  { label: 'In review', value: 1, dot: 'bg-sky-500' },
];

export const categories = [
  { id: 1, name: 'Guides', slug: 'guides', posts: 64, depth: 0 },
  { id: 2, name: 'Buying Guides', slug: 'buying-guides', posts: 22, depth: 1 },
  { id: 3, name: 'News', slug: 'news', posts: 31, depth: 0 },
  { id: 4, name: 'Care Tips', slug: 'care-tips', posts: 19, depth: 0 },
  { id: 5, name: 'Behind the Scenes', slug: 'behind-the-scenes', posts: 14, depth: 0 },
];

export const tags = [
  { name: 'attar', count: 34, hot: true },
  { name: 'oud', count: 28, hot: true },
  { name: 'musk', count: 17 },
  { name: 'gift', count: 15 },
  { name: 'eid', count: 12 },
  { name: 'rose', count: 9 },
  { name: 'layering', count: 7 },
  { name: 'summer', count: 5 },
  { name: 'storage', count: 3 },
];

export const comments = [
  { id: 1, name: 'Tanvir H.', email: 'tanvir@example.com', when: '2h ago', body: 'Loved this guide! Which attar would you suggest for daily office wear?', post: 'How to choose your signature attar', status: 'pending' },
  { id: 2, name: 'Sumaiya R.', email: 'sumaiya@example.com', when: '6h ago', body: 'Can I get a sample of the oud before buying the full bottle?', post: "Oud vs Musk: what's the difference?", status: 'pending' },
  { id: 3, name: 'cheap-seo-links', email: '', when: '1d ago', body: 'Buy backlinks now!!! www.spam-link.example', post: '', status: 'spam' },
];

export const seoIssues = [
  { id: 1, label: 'Missing meta descriptions', count: '23 pages', tone: 'red' },
  { id: 2, label: 'Images without alt text', count: '41 images', tone: 'amber' },
  { id: 3, label: 'Title too long (> 60 chars)', count: '12 pages', tone: 'amber' },
  { id: 4, label: 'Broken internal links', count: '7 links', tone: 'red' },
];

export const topKeywords = [
  { keyword: 'best attar in bangladesh', position: 3, clicks: 1240 },
  { keyword: 'oud perfume price', position: 6, clicks: 880 },
  { keyword: 'surokkha attar', position: 1, clicks: 2310 },
  { keyword: 'eid gift perfume', position: 14, clicks: 420 },
];

export const auditRows = [
  { id: 1, url: '/blog/our-distillery', type: 'Post', issue: 'Missing meta description', severity: 'error', score: 41, editable: true },
  { id: 2, url: '/product/oud-imperial', type: 'Product', issue: 'Duplicate title with /product/oud-royal', severity: 'error', score: 52 },
  { id: 3, url: '/blog/winter-layering', type: 'Post', issue: 'Title longer than 60 characters', severity: 'warning', score: 64, editable: true },
  { id: 4, url: '/collections/gift-sets', type: 'Page', issue: '3 images without alt text', severity: 'warning', score: 70 },
  { id: 5, url: '/about', type: 'Page', issue: 'Only 1 internal link', severity: 'warning', score: 76 },
];

export const keywordRows = [
  { id: 1, keyword: 'surokkha attar', page: '/', position: 1, change: 0, volume: 2900, trend: [12, 11, 10, 8, 9, 6, 5] },
  { id: 2, keyword: 'best attar in bangladesh', page: '/blog/choose-signature-attar', position: 3, change: 2, volume: 1600, trend: [16, 14, 13, 11, 9, 7, 4] },
  { id: 3, keyword: 'oud perfume price', page: '/product/oud-imperial', position: 6, change: -1, volume: 1100, trend: [6, 7, 6, 9, 8, 10, 11] },
  { id: 4, keyword: 'eid gift perfume', page: '/blog/eid-gift-guide-2026', position: 14, change: 5, volume: 880, trend: [17, 15, 16, 12, 10, 9, 6] },
  { id: 5, keyword: 'how to layer fragrances', page: '/blog/winter-layering', position: 38, change: 0, volume: 720, trend: [10, 10, 11, 10, 11, 10, 10] },
];

export const redirectRows = [
  { id: 1, from: '/blog/attar-guide', to: '/blog/choose-signature-attar', type: 301, hits: 1204, active: true },
  { id: 2, from: '/shop/oud', to: '/collections/oud', type: 301, hits: 682, active: true },
  { id: 3, from: '/eid-sale', to: '/blog/eid-gift-guide-2026', type: 302, hits: 91, active: false },
];

export const notFoundRows = [
  { id: 1, url: '/blog/oud-guide', referrer: 'google.com', hits: 48, last: '1h ago' },
  { id: 2, url: '/products/rose-attar', referrer: 'facebook.com', hits: 23, last: '5h ago' },
];

export const titleVariables = ['%post_title%', '%category%', '%author%', '%sep%', '%site_name%', '%year%'];
