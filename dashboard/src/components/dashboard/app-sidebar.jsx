import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CreditCard,
  BarChart3,
  ShieldAlert,
  ListOrdered,
  PlusCircle,
  Package,
  Receipt,
  Ticket,
  Tag,
  X,
  Menu,
  Sliders,
  Terminal,
  Sparkles,
  ShieldCheck,
  Activity,
  Trash2,
  Star,
  Wrench,
  ImageDown,
  Share2,
  Settings,
  LogOut,
  User,
  ChevronRight,
  Mail,
  Image as ImageIcon,
  Images,
  LineChart,
  LifeBuoy,
  Ruler,
  Store,
  Search,
  Truck,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import pkg from "../../../package.json"
import { clientConfig } from "@/clientConfig"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"
import { hasMenuAccess } from "@/lib/rbac"

// Renders the standard TikTok musical note brand icon
const TikTokIcon = ({ className = "h-3.5 w-3.5", ...props }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...props}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.96-4.49V8.75a8.16 8.16 0 0 0 4.81 1.54V6.85a4.87 4.87 0 0 1-1-.16z" />
  </svg>
);

// Main application sidebar rendering organized multi-tenant navigation
export const AppSidebar = ({ ...props }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const pathname = location.pathname
  const { user, logout } = useAuth()
  const { state, setOpen } = useSidebar()
  const { brandName, features } = clientConfig

  const [openMenu, setOpenMenu] = React.useState(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false)
  const [profileModalOpen, setProfileModalOpen] = React.useState(false)

  // Toggles single accordion menu state
  const toggleMenu = (menuKey) => {
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey))
  }

  // Logs out active user and closes modal
  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    logout()
  }

  const userRole = user?.role || "Marketing Expert"

  // Evaluates menu visibility based on tenant feature flags and role access
  const isAllowed = (menuKey) => {
    if (menuKey === "products.categories" && (features?.category === false || features?.categories === false)) return false
    if ((menuKey === "products.attributes" || menuKey.startsWith("products.attributes")) && (features?.attribute === false || features?.attributes === false)) return false
    if (menuKey === "products.brands" && features?.brand === false) return false
    if (menuKey === "season" && features?.season === false) return false
    if ((menuKey === "tools.messages" || menuKey === "webmail") && features?.webmail === false) return false
    if (menuKey === "products.size-charts" && !features?.sizeChart) return false
    if ((menuKey === "orders.instore" || menuKey === "orders.new") && features?.inStoreOrder === false) return false
    if ((menuKey === "orders.custom" || menuKey === "orders.custom-new") && !features?.customOrders) return false
    if (menuKey === "cpanel" && (clientConfig?.modules?.cpanelAccess === false || features?.cpanelAccess === false)) return false

    return hasMenuAccess(userRole, menuKey)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" ? (
            <>
              <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                <span className="text-xl font-heading font-extrabold text-white tracking-tight leading-tight">
                  {brandName || "Admin"}
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-400 tracking-wider">
                  v{pkg.version || "3.03.07"}
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0"
                title="Close Sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0"
              title="Open Sidebar"
            >
              <Menu className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-4">
        <SidebarMenu className="group-data-[collapsible=icon]:gap-4">
          {isAllowed("overview") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard"}
                tooltip={t("nav.overview", "Overview")}
                render={<Link to="/dashboard" />}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{t("nav.overview", "Overview")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {(isAllowed("webmail") || isAllowed("tools.messages")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/dashboard/tools/messages" || pathname.startsWith("/dashboard/tools/messages") || pathname === "/dashboard/messages"}
                tooltip={t("nav.webmail", "Webmail")}
                render={<Link to="/dashboard/tools/messages" />}
              >
                <Mail className="h-4 w-4" />
                <span>{t("nav.webmail", "Webmail")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAllowed("orders") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/orders")}
                tooltip={t("nav.orders", "Orders")}
                onClick={() => toggleMenu("orders")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span>{t("nav.orders", "Orders")}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "orders" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "orders" && (
                <SidebarMenuSub>
                  {isAllowed("orders.custom-new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/custom/new" || pathname === "/dashboard/orders/custom-new"}
                        render={<Link to="/dashboard/orders/custom/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{t("nav.new_custom_order", "New Custom Order")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/new"}
                        render={<Link to="/dashboard/orders/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{t("nav.new_in_store_order", "New In-Store Order")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders"}
                        render={<Link to="/dashboard/orders" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>{t("nav.orders_list", "Orders List")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.custom") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/custom"}
                        render={<Link to="/dashboard/orders/custom" />}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{t("nav.custom_orders", "Custom Orders")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.instore") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/orders/in-store" || pathname === "/dashboard/orders/instore"}
                        render={<Link to="/dashboard/orders/in-store" />}
                      >
                        <Store className="h-3.5 w-3.5" />
                        <span>{t("nav.in_store_orders", "In-Store Orders")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {isAllowed("products") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/dashboard/products") ||
                  pathname === "/dashboard/settings/products" ||
                  pathname.startsWith("/dashboard/reviews")
                }
                tooltip={t("nav.products", "Products")}
                onClick={() => toggleMenu("products")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>{t("nav.products", "Products")}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "products" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "products" && (
                <SidebarMenuSub>
                  {isAllowed("products.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/new"}
                        render={<Link to="/dashboard/products/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{t("nav.add_product", "Add Product")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products" || pathname === "/dashboard/products/list"}
                        render={<Link to="/dashboard/products" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>{t("nav.product_list", "Product List")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.on-sale") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/on-sale"}
                        render={<Link to="/dashboard/products/on-sale" />}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>{t("nav.on_sale", "On Sale")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.miniature") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/miniature"}
                        render={<Link to="/dashboard/products/miniature" />}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("nav.miniature", "Miniature")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("products.showcases") || isAllowed("settings")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/settings/products"}
                        render={<Link to="/dashboard/settings/products" />}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("nav.showcases", "Showcases")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.categories") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/categories"}
                        render={<Link to="/dashboard/products/categories" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>{t("nav.categories", "Categories")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.brands") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/brands"}
                        render={<Link to="/dashboard/products/brands" />}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{t("nav.brands", "Brands")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.attributes") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/products/attributes")}
                        render={<Link to="/dashboard/products/attributes" />}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>{t("nav.attributes", "Attributes")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.coupons") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/coupons"}
                        render={<Link to="/dashboard/products/coupons" />}
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>{t("nav.coupons", "Coupons")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.size-charts") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/products/size-charts"}
                        render={<Link to="/dashboard/products/size-charts" />}
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        <span>{t("nav.size_charts", "Size Charts")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("products.reviews") || isAllowed("reviews")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/reviews")}
                        render={<Link to="/dashboard/reviews" />}
                      >
                        <Star className="h-3.5 w-3.5" />
                        <span>{t("nav.reviews", "Reviews")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {isAllowed("settings") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/dashboard/settings") && pathname !== "/dashboard/settings/products"}
                tooltip={t("nav.settings", "Settings")}
                onClick={() => toggleMenu("settings")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>{t("nav.settings", "Settings")}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "settings" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "settings" && (
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/settings/cms")}
                      render={<Link to="/dashboard/settings/cms-content" />}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{t("nav.cms_content", "CMS Content")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/settings/seo")}
                      render={<Link to="/dashboard/settings/seo" />}
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>{t("nav.general_seo", "General & SEO")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/settings/meta-pixel")}
                      render={<Link to="/dashboard/settings/meta-pixel" />}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{t("nav.meta_pixel", "Meta Pixel")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/settings/tiktok-pixel")}
                      render={<Link to="/dashboard/settings/tiktok-pixel" />}
                    >
                      <TikTokIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("nav.tiktok_pixel", "TikTok Pixel")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/settings/google-analytics")}
                      render={<Link to="/dashboard/settings/google-analytics" />}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>{t("nav.google_analytics", "Google Analytics")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/settings/pathao-courier") || pathname.startsWith("/dashboard/settings/pathao")}
                      render={<Link to="/dashboard/settings/pathao-courier" />}
                    >
                      <Truck className="h-3.5 w-3.5 text-red-500" />
                      <span>{t("nav.pathao_courier", "Pathao Courier")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {(isAllowed("admin") || isAllowed("reports") || isAllowed("users") || isAllowed("customers") || isAllowed("members") || isAllowed("trash") || isAllowed("billing") || isAllowed("billing.billings") || isAllowed("billing.payments") || isAllowed("cpanel")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/dashboard/reports") ||
                  pathname.startsWith("/dashboard/users") ||
                  pathname.startsWith("/dashboard/members") ||
                  pathname.startsWith("/dashboard/billing") ||
                  pathname.startsWith("/dashboard/tools/support") ||
                  pathname.startsWith("/dashboard/cpanel") ||
                  pathname.startsWith("/dashboard/trash")
                }
                tooltip={t("nav.admin", "Admin")}
                onClick={() => toggleMenu("admin")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("nav.admin", "Admin")}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "admin" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "admin" && (
                <SidebarMenuSub>
                  {(isAllowed("reports") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/reports")}
                        render={<Link to="/dashboard/reports" />}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>{t("nav.reports", "Reports")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("users") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/users")}
                        render={<Link to="/dashboard/users" />}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>{t("nav.system_users", "System Users")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("customers") || isAllowed("members") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/members")}
                        render={<Link to="/dashboard/members" />}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{t("nav.customer_list", "Customer List")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("billing.billings") || isAllowed("billing") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/billing/billings"}
                        render={<Link to="/dashboard/billing/billings" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>{t("nav.bills_invoices", "Bills & Invoices")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("billing.payments") || isAllowed("billing") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/billing/payments"}
                        render={<Link to="/dashboard/billing/payments" />}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{t("nav.payments", "Payments")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("tools.support") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/support" || pathname.startsWith("/dashboard/tools/support")}
                        render={<Link to="/dashboard/tools/support" />}
                      >
                        <LifeBuoy className="h-3.5 w-3.5" />
                        <span>{t("nav.support_desk", "Support Desk")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("cpanel") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/cpanel")}
                        render={<Link to="/dashboard/cpanel" />}
                      >
                        <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">{t("nav.cpanel", "PPanel / cPanel")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/dashboard/trash")}
                      render={<Link to="/dashboard/trash" />}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-destructive font-medium">{t("nav.trash", "Trash")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {(isAllowed("tools") || isAllowed("logs") || isAllowed("analytics") || isAllowed("tools.analytics") || isAllowed("activity-logs") || isAllowed("tools.activity-logs")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/dashboard/analytics") ||
                  pathname.startsWith("/dashboard/tools/analytics") ||
                  pathname.startsWith("/dashboard/cloudflare-analytics") ||
                  pathname.startsWith("/dashboard/tools/cloudflare-analytics") ||
                  pathname.startsWith("/dashboard/cloudflare") ||
                  pathname.startsWith("/dashboard/activity-logs") ||
                  pathname.startsWith("/dashboard/tools/activity-logs") ||
                  pathname.startsWith("/dashboard/media") ||
                  pathname.startsWith("/dashboard/tools/bulk-image-resize") ||
                  pathname.startsWith("/dashboard/tools/meta-catalog") ||
                  pathname.startsWith("/dashboard/logs") ||
                  pathname.startsWith("/dashboard/tools/logs")
                }
                tooltip={t("nav.tools_media", "Tools & Media")}
                onClick={() => toggleMenu("tools")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span>{t("nav.tools_media", "Tools & Media")}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "tools" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "tools" && (
                <SidebarMenuSub>
                  {(isAllowed("analytics") || isAllowed("tools.analytics") || isAllowed("tools") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/analytics") || pathname.startsWith("/dashboard/tools/analytics")}
                        render={<Link to="/dashboard/analytics" />}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>{t("nav.google_analytics", "Google Analytics")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {Boolean(clientConfig?.cloudFlareAnalytics?.active || clientConfig?.clientKey === "surokkha") && (isAllowed("analytics") || isAllowed("tools.analytics") || isAllowed("tools") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/cloudflare-analytics") || pathname.startsWith("/dashboard/tools/cloudflare-analytics") || pathname.startsWith("/dashboard/cloudflare")}
                        render={<Link to="/dashboard/cloudflare-analytics" />}
                      >
                        <LineChart className="h-3.5 w-3.5 text-blue-500" />
                        <span>{t("nav.cloudflare_analytics", "Cloudflare Analytics")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("activity-logs") || isAllowed("tools.activity-logs") || isAllowed("tools") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/activity-logs") || pathname.startsWith("/dashboard/tools/activity-logs")}
                        render={<Link to="/dashboard/activity-logs" />}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        <span>{t("nav.activity_logs", "Activity Logs")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("tools.assets") || isAllowed("tools.media") || isAllowed("tools")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/media" || pathname.startsWith("/dashboard/media")}
                        render={<Link to="/dashboard/media" />}
                      >
                        <Images className="h-3.5 w-3.5" />
                        <span>{t("nav.all_media", "All Media")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.bulk-image-resize") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/bulk-image-resize"}
                        render={<Link to="/dashboard/tools/bulk-image-resize" />}
                      >
                        <ImageDown className="h-3.5 w-3.5" />
                        <span>{t("nav.bulk_image_resize", "Bulk Image Resize")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.meta-catalog") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/dashboard/tools/meta-catalog"}
                        render={<Link to="/dashboard/tools/meta-catalog" />}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{t("nav.meta_catalog", "Meta Catalog")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("logs") || isAllowed("tools.logs")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/dashboard/logs") || pathname.startsWith("/dashboard/tools/logs")}
                        render={<Link to="/dashboard/logs" />}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>{t("nav.system_logs", "System Logs")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2.5 group-data-[collapsible=icon]:p-2 mt-auto">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent/80 border border-sidebar-border/60 transition-all w-full group-data-[collapsible=icon]:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer outline-none group/user"
                  title={user?.name || "User Account"}
                >
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm">
                      {user?.name?.charAt(0)?.toUpperCase() || "B"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight group-hover/user:text-primary transition-colors">
                      {user?.name || "Bithy Akther"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5 capitalize">
                      {user?.role || "Frontdesk"}
                    </p>
                  </div>
                </button>
              }
            />
            <DropdownMenuContent side="top" align="start" sideOffset={12} className="w-48 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover">
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
                onClick={() => setProfileModalOpen(true)}
              >
                <User className="h-4 w-4 text-primary" />
                <span>{t("nav.profile", "Profile")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="h-8 w-8 shrink-0 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title={t("nav.logout", "Logout")}
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-white" />
          </button>
        </div>

        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-2 w-full">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="relative h-8 w-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-primary/30 transition-all"
                  title={user?.name || "User Account"}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "B"}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border-2 border-sidebar" />
                </button>
              }
            />
            <DropdownMenuContent side="right" align="end" sideOffset={12} className="w-48 p-1.5 shadow-xl rounded-xl border border-border/80 bg-popover">
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg hover:bg-accent focus:bg-accent text-foreground"
                onClick={() => setProfileModalOpen(true)}
              >
                <User className="h-4 w-4 text-primary" />
                <span>{t("nav.profile", "Profile")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="h-8 w-8 rounded-xl bg-destructive hover:bg-destructive/90 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title={t("nav.logout", "Logout")}
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4 text-white" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />

      {/* Logout Confirmation Alert Dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 text-center">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-1">
              <LogOut className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              {t("nav.logout_confirm_title", "Do you want to log out?")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              {t("nav.logout_confirm_desc", "Are you sure you want to end your current session? You will need to sign in again to access the dashboard.")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 pt-4 border-t mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogoutConfirmOpen(false)}
              className="flex-1 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/40 hover:border-destructive/60 font-semibold cursor-pointer text-xs"
            >
              {t("common.no", "No")}
            </Button>

            <Button
              type="button"
              onClick={handleConfirmLogout}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black dark:text-neutral-950 font-bold shadow-sm cursor-pointer text-xs"
            >
              {t("common.yes", "Yes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[420px] p-6">
          <DialogHeader className="space-y-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || "B"}
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-bold text-foreground">
                  {user?.name || "Bithy Akther"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {user?.email || "user@example.com"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2.5 py-3 border-y border-border text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("admin.user_role", "Role")}</span>
              <span className="font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 capitalize">
                {user?.role || "Frontdesk"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("settings.store_name", "Store Brand")}</span>
              <span className="font-semibold text-foreground">{brandName || "Store"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("common.status", "Status")}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                {t("common.active", "Active")}
              </span>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProfileModalOpen(false)}
              className="w-full text-xs font-semibold cursor-pointer"
            >
              {t("common.close", "Close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
