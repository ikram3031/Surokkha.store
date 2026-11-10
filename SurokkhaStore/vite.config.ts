import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const SITE_URL = 'https://surokkhastore.shop'

// Public pages that never change between deploys
const STATIC_PAGES = ['/', '/offer', '/faq', '/blog', '/terms-and-conditions', '/privacy-policy', '/return-and-refund-policy']

// Reads blog slugs and dates straight from blogData.ts (posts are listed as `slug: "...", ... date: "..."`)
function readBlogPosts(): { slug: string; date: string }[] {
  const source = fs.readFileSync(path.resolve(import.meta.dirname, 'src/components/blog/blogData.ts'), 'utf8')
  const posts: { slug: string; date: string }[] = []
  for (const match of source.matchAll(/^\s+slug:\s*["']([^"']+)["'][\s\S]*?^\s+date:\s*["']([^"']+)["']/gm)) {
    posts.push({ slug: match[1], date: match[2] })
  }
  return posts
}

const urlEntry = (loc: string, lastmod: string) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`

// Writes sitemap.xml (an index) and sitemap-pages.xml into the build output.
// sitemap-catalog.xml (products, categories) is served live by the backend through nginx.
function sitemapPlugin(): Plugin {
  return {
    name: 'surokkha-sitemap',
    apply: 'build',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const pages = [
        ...STATIC_PAGES.map((p) => urlEntry(`${SITE_URL}${p}`, today)),
        ...readBlogPosts().map((p) => urlEntry(`${SITE_URL}/blog/${encodeURIComponent(p.slug)}`, p.date)),
      ]
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap-pages.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join('\n')}\n</urlset>\n`,
      })
      const index = ['sitemap-pages.xml', 'sitemap-catalog.xml']
        .map((file) => `  <sitemap>\n    <loc>${SITE_URL}/${file}</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`)
        .join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${index}\n</sitemapindex>\n`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sitemapPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
