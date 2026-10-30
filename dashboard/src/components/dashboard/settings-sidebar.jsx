import * as React from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  GalleryHorizontal,
  HardDrive,
  Image as ImageIcon,
  Mail,
  Megaphone,
  Receipt,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Truck,
} from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"
import { clientConfig } from "@/clientConfig"
import { useAuth } from "@/lib/auth-context"
import { hasMenuAccess } from "@/lib/rbac"
import { NavGroup, NavLabel, NavLink, NavSub } from "./app-sidebar"
import { WorkspaceSidebar } from "./workspace-sidebar"

// Builds the Shop / Store pair of sub-links for a settings area
const sitePair = (base) => [
  { key: "shop", label: "Shop", to: `${base}/shop` },
  { key: "store", label: "Store", to: `${base}/store` },
]

// Sidebar for the /settings workspace: store content, marketing, integrations and team
export const SettingsSidebar = (props) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { state, setOpen, isMobile, setOpenMobile } = useSidebar()
  const role = user?.role || "Marketing Expert"
  const can = (key) => hasMenuAccess(role, key)

  const showSettings = can("settings")
  const showTemplates = clientConfig?.features?.templates !== false && (can("templates") || showSettings)
  const showUsers = can("users")

  const groups = [
    { id: "cms", icon: ImageIcon, label: t("nav.cms_content", "CMS Content"), subs: sitePair("/settings/cms-content") },
    { id: "slider", icon: GalleryHorizontal, label: t("nav.hero_slider", "Hero Slider"), subs: sitePair("/settings/cms-content/slider") },
    { id: "seo", icon: Search, label: t("nav.general_seo", "General & SEO"), subs: sitePair("/settings/seo") },
    { id: "meta-pixel", icon: Share2, label: t("nav.meta_pixel", "Meta Pixel"), subs: sitePair("/settings/meta-pixel") },
    { id: "smtp", icon: Mail, label: t("nav.email_server_setup", "SMTP Configuration"), subs: sitePair("/settings/smtp") },
  ]
  const activeGroup = groups.find((group) => group.subs.some((sub) => pathname.startsWith(sub.to)))?.id || null
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

  const renderGroup = (id) => {
    const group = groups.find((item) => item.id === id)
    return (
      <NavGroup key={group.id} id={group.id} icon={group.icon} label={group.label} active={activeGroup === group.id} open={openMenu === group.id} onToggle={toggleMenu}>
        {group.subs.map((sub) => (
          <NavSub key={sub.key} to={sub.to} active={pathname.startsWith(sub.to)}>
            {sub.label}
          </NavSub>
        ))}
      </NavGroup>
    )
  }

  return (
    <WorkspaceSidebar title={t("settings.workspace", "Settings")} {...props}>
      {showSettings && (
        <>
          <NavLabel>{t("nav.store_content", "Store & Content")}</NavLabel>
          {renderGroup("cms")}
          {renderGroup("slider")}
          {renderGroup("seo")}
          {showTemplates && <NavLink to="/settings/templates" active={pathname.startsWith("/settings/templates")} icon={Receipt} label={t("nav.templates", "Invoice & Templates")} />}
          <NavLink to="/settings/admin-view/styles" active={pathname.startsWith("/settings/admin-view/styles")} icon={Sparkles} label={t("nav.admin_view_styles", "Admin View Styles")} />

          <NavLabel>{t("nav.marketing", "Marketing")}</NavLabel>
          {renderGroup("meta-pixel")}
          <NavLink to="/settings/tiktok-pixel" active={pathname.startsWith("/settings/tiktok-pixel")} icon={Megaphone} label={t("nav.tiktok_pixel", "TikTok Pixel")} />

          <NavLabel>{t("nav.integrations", "Integrations")}</NavLabel>
          <NavLink to="/settings/pathao-courier" active={pathname.startsWith("/settings/pathao")} icon={Truck} label={t("nav.pathao_courier", "Pathao Courier")} />
          {renderGroup("smtp")}
          <NavLink to="/settings/r2-storage" active={pathname.startsWith("/settings/r2-storage")} icon={HardDrive} label={t("nav.r2_storage", "R2 Storage")} />
        </>
      )}

      {showUsers && (
        <>
          <NavLabel>{t("nav.team", "Team")}</NavLabel>
          <NavLink to="/settings/users" active={pathname.startsWith("/settings/users")} icon={ShieldAlert} label={t("nav.system_users", "System Users")} />
        </>
      )}
    </WorkspaceSidebar>
  )
}
