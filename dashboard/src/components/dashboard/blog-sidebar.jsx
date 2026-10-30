import * as React from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowRightLeft,
  FileText,
  Folder,
  Gauge,
  Heading,
  KeyRound,
  LayoutDashboard,
  Map,
  MessageSquare,
  Newspaper,
  PlusCircle,
  ScanSearch,
  Search,
  Share2,
  Tag,
} from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"
import { NavGroup, NavLabel, NavLink, NavSub } from "./app-sidebar"
import { WorkspaceSidebar } from "./workspace-sidebar"

// Sidebar for the /blog workspace: content management and SEO tooling
export const BlogSidebar = (props) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { state, setOpen, isMobile, setOpenMobile } = useSidebar()

  const activeGroup =
    pathname.startsWith("/blog/seo/meta") || pathname.startsWith("/blog/seo/social") || pathname.startsWith("/blog/seo/keywords")
      ? "optimize"
      : pathname.startsWith("/blog/seo/sitemap") || pathname.startsWith("/blog/seo/redirects")
        ? "technical"
        : null

  const [openMenu, setOpenMenu] = React.useState(activeGroup)

  React.useEffect(() => {
    if (isMobile && setOpenMobile) setOpenMobile(false)
    if (activeGroup) setOpenMenu(activeGroup)
  }, [pathname, isMobile, setOpenMobile, activeGroup])

  const toggleMenu = (key) => {
    if (!isMobile && state === "collapsed") {
      setOpen(true)
      setOpenMenu(key)
      return
    }
    setOpenMenu((prev) => (prev === key ? null : key))
  }

  return (
    <WorkspaceSidebar title={t("blog.workspace", "Blog & SEO")} {...props}>
      <NavLabel>{t("blog.group_content", "Content")}</NavLabel>
      <NavLink to="/blog" active={pathname === "/blog"} icon={LayoutDashboard} label={t("blog.overview", "Overview")} />
      <NavLink
        to="/blog/posts"
        active={pathname === "/blog/posts" || (pathname.startsWith("/blog/posts/") && pathname !== "/blog/posts/new")}
        icon={FileText}
        label={t("blog.all_posts", "All Posts")}
      />
      <NavLink to="/blog/posts/new" active={pathname === "/blog/posts/new"} icon={PlusCircle} label={t("blog.new_post", "New Post")} />
      <NavLink to="/blog/categories" active={pathname.startsWith("/blog/categories")} icon={Folder} label={t("blog.categories", "Categories")} />
      <NavLink to="/blog/tags" active={pathname.startsWith("/blog/tags")} icon={Tag} label={t("blog.tags", "Tags")} />
      <NavLink to="/blog/comments" active={pathname.startsWith("/blog/comments")} icon={MessageSquare} label={t("blog.comments", "Comments")} />

      <NavLabel>{t("blog.group_seo", "SEO")}</NavLabel>
      <NavLink to="/blog/seo" active={pathname === "/blog/seo"} icon={Gauge} label={t("blog.seo_overview", "SEO Overview")} />
      <NavLink to="/blog/seo/audit" active={pathname.startsWith("/blog/seo/audit")} icon={ScanSearch} label={t("blog.site_audit", "Site Audit")} />
      <NavGroup id="optimize" icon={Search} label={t("blog.optimize", "Optimize")} active={activeGroup === "optimize"} open={openMenu === "optimize"} onToggle={toggleMenu}>
        <NavSub to="/blog/seo/meta" active={pathname.startsWith("/blog/seo/meta")} icon={Heading}>
          {t("blog.meta_titles", "Meta & Titles")}
        </NavSub>
        <NavSub to="/blog/seo/social" active={pathname.startsWith("/blog/seo/social")} icon={Share2}>
          {t("blog.social_schema", "Social & Schema")}
        </NavSub>
        <NavSub to="/blog/seo/keywords" active={pathname.startsWith("/blog/seo/keywords")} icon={KeyRound}>
          {t("blog.keywords", "Keywords")}
        </NavSub>
      </NavGroup>
      <NavGroup id="technical" icon={Newspaper} label={t("blog.technical", "Technical")} active={activeGroup === "technical"} open={openMenu === "technical"} onToggle={toggleMenu}>
        <NavSub to="/blog/seo/sitemap" active={pathname.startsWith("/blog/seo/sitemap")} icon={Map}>
          {t("blog.sitemap_robots", "Sitemap & Robots")}
        </NavSub>
        <NavSub to="/blog/seo/redirects" active={pathname.startsWith("/blog/seo/redirects")} icon={ArrowRightLeft}>
          {t("blog.redirects", "Redirects & 404s")}
        </NavSub>
      </NavGroup>
    </WorkspaceSidebar>
  )
}
