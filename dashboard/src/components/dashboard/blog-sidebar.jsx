import * as React from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ChevronsUpDown,
  FileText,
  Folder,
  Gauge,
  Heading,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Newspaper,
  PlusCircle,
  ScanSearch,
  Search,
  Share2,
  Tag,
  X,
  ArrowRightLeft,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { BrandLogo } from "@/components/BrandLogo"
import { resolveImageUrl } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import pkg from "../../../package.json"
import { NavGroup, NavLabel, NavLink, NavSub } from "./app-sidebar"

// Sidebar for the /blog workspace: content management and SEO tooling
export const BlogSidebar = (props) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { state, setOpen, isMobile, setOpenMobile } = useSidebar()

  const activeGroup =
    pathname.startsWith("/blog/seo/meta") || pathname.startsWith("/blog/seo/social") || pathname.startsWith("/blog/seo/keywords")
      ? "optimize"
      : pathname.startsWith("/blog/seo/sitemap") || pathname.startsWith("/blog/seo/redirects")
        ? "technical"
        : null

  const [openMenu, setOpenMenu] = React.useState(activeGroup)

  // Close the mobile drawer and open the group that owns the current page
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

  const displayName = user?.preferredName || user?.name || ""
  const avatarSrc = resolveImageUrl(user?.avatar)
  const [avatarFailed, setAvatarFailed] = React.useState(false)
  React.useEffect(() => setAvatarFailed(false), [avatarSrc])

  const closeSidebar = () => (isMobile ? setOpenMobile(false) : setOpen(false))

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 sm:h-16 shrink-0 flex items-center justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" || isMobile ? (
            <>
              <div className="flex flex-col items-start gap-1 overflow-hidden">
                <BrandLogo className="w-24 h-auto" />
                <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider uppercase ml-1">
                  {t("blog.workspace", "Blog & SEO")} · v{pkg.version}
                </span>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="h-8 w-8 rounded-lg border border-sidebar-border/80 dark:border-white/15 bg-sidebar-accent/50 dark:bg-white/5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground dark:hover:bg-white/10 transition-colors flex items-center justify-center shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                title="Close Sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-8 w-8 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors flex items-center justify-center shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              title="Open Sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-3 group-data-[collapsible=icon]:px-1.5">
        <SidebarMenu className="gap-0.5">
          <NavLink to="/dashboard" active={false} icon={ArrowLeft} label={t("blog.back_to_dashboard", "Back to Dashboard")} />

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
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-1.5 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left cursor-pointer outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                title={displayName || "User Account"}
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                  {avatarSrc && !avatarFailed ? (
                    <img src={avatarSrc} alt={displayName || "Avatar"} onError={() => setAvatarFailed(true)} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase() || "B"
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded border-2 border-sidebar bg-emerald-500" />
                </span>
                <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-semibold text-foreground">{displayName || "User"}</span>
                  <span className="truncate text-xs capitalize text-muted-foreground">{user?.role || "Frontdesk"}</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
              </button>
            }
          />
          <DropdownMenuContent
            side={isMobile ? "top" : state === "collapsed" ? "right" : "top"}
            align={isMobile || state !== "collapsed" ? "start" : "end"}
            sideOffset={10}
            className="w-56 p-1 shadow-xl rounded-lg border border-border bg-popover"
          >
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm text-destructive focus:bg-primary/10 focus:text-primary"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logout", "Logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
