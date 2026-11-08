import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Boxes, History, Truck, Package, Layers } from "lucide-react"

import { NavLabel, NavLink } from "./app-sidebar"
import { WorkspaceSidebar } from "./workspace-sidebar"

// Sidebar for the /inventory workspace: stock items, stock history and purchases received from Plexivia
export const InventorySidebar = (props) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <WorkspaceSidebar title={t("inventory.workspace", "Inventory")} {...props}>
      <NavLabel>{t("inventory.group_stock", "Stock")}</NavLabel>
      <NavLink to="/inventory" active={pathname === "/inventory" || pathname === "/inventory/"} icon={Boxes} label={t("inventory.items", "Stock Items")} />
      <NavLabel>{t("inventory.group_catalog", "Catalog links")}</NavLabel>
      <NavLink to="/inventory/products" active={pathname.startsWith("/inventory/products")} icon={Package} label={t("inventory.products", "Products")} />
      <NavLink to="/inventory/items" active={pathname.startsWith("/inventory/items")} icon={Layers} label={t("inventory.catalog_items", "Items")} />
      <NavLabel>{t("inventory.group_history", "History")}</NavLabel>
      <NavLink to="/inventory/movements" active={pathname.startsWith("/inventory/movements")} icon={History} label={t("inventory.movements", "Stock History")} />
      <NavLabel>{t("inventory.group_purchases", "Purchases")}</NavLabel>
      <NavLink to="/inventory/receipts" active={pathname.startsWith("/inventory/receipts")} icon={Truck} label={t("inventory.receipts", "Received Purchases")} />
    </WorkspaceSidebar>
  )
}
