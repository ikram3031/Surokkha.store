import * as React from "react"
import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { LayoutDashboard, Package, Radio } from "lucide-react"

import { NavLabel, NavLink } from "./app-sidebar"
import { WorkspaceSidebar } from "./workspace-sidebar"

// Sidebar for the /analytics workspace. Add new report pages here as they are built.
export const AnalyticsSidebar = (props) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <WorkspaceSidebar title={t("analytics.workspace", "Analytics")} {...props}>
      <NavLabel>{t("analytics.group_store", "Store")}</NavLabel>
      <NavLink to="/analytics" active={pathname === "/analytics"} icon={LayoutDashboard} label={t("analytics.overview", "Overview")} />
      <NavLink to="/analytics/products" active={pathname.startsWith("/analytics/products")} icon={Package} label={t("analytics.products", "Product Rankings")} />
      <NavLink to="/analytics/live" active={pathname.startsWith("/analytics/live")} icon={Radio} label={t("analytics.live", "Live Today")} />
    </WorkspaceSidebar>
  )
}
