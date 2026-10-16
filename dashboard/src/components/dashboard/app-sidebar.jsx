import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
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
  ChevronDown,
  ChevronsUpDown,
  Mail,
  Image as ImageIcon,
  Images,
  LineChart,
  LifeBuoy,
  Ruler,
  Store,
  Search,
  Truck,
  Landmark,
  Wallet,
  TrendingUp,
  Scale,
  HardDrive,
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
import { BrandLogo } from "@/components/BrandLogo"
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
import { cn } from "@/lib/utils"
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

const navItemClass = "relative h-9 gap-2.5 font-medium text-sidebar-foreground data-active:bg-primary/10 data-active:font-semibold data-active:text-foreground data-active:before:absolute data-active:before:-left-3 data-active:before:bottom-2 data-active:before:top-2 data-active:before:w-[3px] data-active:before:rounded-r data-active:before:bg-primary data-active:[&>svg]:text-primary group-data-[collapsible=icon]:data-active:before:-left-1.5"

// Section caption rendered above a navigation group, collapsing to a divider in rail mode
const NavLabel = ({ children }) => (
  <li
    role="presentation"
    className="px-2.5 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80 group-data-[collapsible=icon]:mx-2 group-data-[collapsible=icon]:my-2 group-data-[collapsible=icon]:h-px group-data-[collapsible=icon]:bg-sidebar-border group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:text-[0px]"
  >
    {children}
  </li>
)

// Expandable parent entry with animated accordion submenu
const NavGroup = ({ id, icon: Icon, label, active, open, onToggle, children }) => (
  <SidebarMenuItem>
    <SidebarMenuButton
      tooltip={label}
      onClick={() => onToggle(id)}
      aria-expanded={open}
      data-has-active={active ? "true" : "false"}
      className="relative h-9 cursor-pointer justify-between font-medium text-sidebar-foreground data-[has-active=true]:text-foreground data-[has-active=true]:[&>div>svg]:text-primary group-data-[collapsible=icon]:data-[has-active=true]:bg-primary/10"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </div>
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 opacity-60 transition-transform duration-200 group-data-[collapsible=icon]:hidden",
          open && "rotate-180"
        )}
      />
    </SidebarMenuButton>
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-200 ease-out group-data-[collapsible=icon]:hidden",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className={cn("min-h-0 overflow-hidden transition-[visibility] duration-200", open ? "visible" : "invisible")}>
        <SidebarMenuSub className="mx-0 ml-[1.1rem] my-1 translate-x-0 gap-px border-sidebar-border px-2 py-0">
          {children}
        </SidebarMenuSub>
      </div>
    </div>
  </SidebarMenuItem>
)

// Submenu link with active indicator bar
const NavSub = ({ to, active, icon: Icon, iconClass = "", children, className = "" }) => (
  <SidebarMenuSubItem>
    <SidebarMenuSubButton
      isActive={active}
      render={<Link to={to} />}
      className={cn(
        "relative h-8 translate-x-0 rounded-md px-2.5 text-[13px] data-active:bg-primary/10 data-active:font-semibold data-active:text-foreground data-active:before:absolute data-active:before:-left-[calc(0.5rem+1px)] data-active:before:bottom-1.5 data-active:before:top-1.5 data-active:before:w-0.5 data-active:before:rounded data-active:before:bg-primary",
        className
      )}
    >
      {Icon && <Icon className={cn("h-3.5 w-3.5", iconClass)} />}
      <span>{children}</span>
    </SidebarMenuSubButton>
  </SidebarMenuSubItem>
)

// Top-level single link entry
const NavLink = ({ to, active, icon: Icon, label }) => (
  <SidebarMenuItem>
    <SidebarMenuButton isActive={active} tooltip={label} render={<Link to={to} />} className={navItemClass}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </SidebarMenuButton>
  </SidebarMenuItem>
)

// Sub-section caption inside a submenu
const SubLabel = ({ children }) => (
  <div className="px-2 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
    {children}
  </div>
)

// Main application sidebar rendering organized multi-tenant navigation
export const AppSidebar = ({ ...props }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const { user, logout } = useAuth()
  const { state, setOpen, isMobile, setOpenMobile } = useSidebar()
  const { features } = clientConfig

  const [openMenu, setOpenMenu] = React.useState(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false)

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
    if (menuKey === "templates" && features?.templates === false) return false
    if ((menuKey === "items" || menuKey.startsWith("items.")) && features?.items === false) return false

    return hasMenuAccess(userRole, menuKey)
  }

  const showOverview = isAllowed("overview")
  const showWebmail = isAllowed("webmail") || isAllowed("tools.messages")
  const showSupport = isAllowed("tools.support") || isAllowed("admin")
  const showOrders = isAllowed("orders")
  const showCustomers = isAllowed("customers") || isAllowed("members") || isAllowed("admin")
  const showReviews = isAllowed("products.reviews") || isAllowed("reviews")
  const showProducts = isAllowed("products")
  const showOrganize = isAllowed("products.categories") || isAllowed("products.brands") || isAllowed("products.attributes") || isAllowed("products.size-charts")
  const showMedia = isAllowed("tools.assets") || isAllowed("tools.media") || isAllowed("tools") || isAllowed("tools.bulk-image-resize")
  const showSettings = isAllowed("settings")
  const showSettingsGroup = showSettings || isAllowed("users")
  const showAccounts = isAllowed("accounts") || isAllowed("accounts.bills") || isAllowed("accounts.payments") || isAllowed("accounts.investors") || isAllowed("accounts.investments") || isAllowed("accounts.balance") || isAllowed("billing") || isAllowed("admin")
  const showReports = isAllowed("reports") || isAllowed("admin")
  const showAdmin = isAllowed("admin")
  const showSystem = isAllowed("tools") || isAllowed("logs") || isAllowed("tools.logs") || isAllowed("analytics") || isAllowed("tools.analytics") || isAllowed("activity-logs") || isAllowed("tools.activity-logs") || isAllowed("cpanel") || showAdmin
  const showItems = isAllowed("items")
  const showAdminLayout = Boolean(features?.adminMenuLayout) && isAllowed("admin")

  const activeGroup =
    pathname.startsWith("/dashboard/orders") ? "orders"
    : pathname.startsWith("/dashboard/items") ? "items"
    : (pathname.startsWith("/dashboard/products") || pathname === "/dashboard/settings/products") ? "products"
    : (pathname.startsWith("/dashboard/media") || pathname.startsWith("/dashboard/tools/bulk-image-resize")) ? "media"
    : (pathname.startsWith("/dashboard/accounts") || pathname.startsWith("/dashboard/billing")) ? "accounts"
    : (pathname.startsWith("/dashboard/settings") || pathname.startsWith("/dashboard/users") || pathname.startsWith("/dashboard/tools/meta-catalog")) ? "settings"
    : (pathname.startsWith("/dashboard/cloudflare") || pathname.startsWith("/dashboard/tools/cloudflare-analytics") || pathname.startsWith("/dashboard/analytics") || pathname.startsWith("/dashboard/tools/analytics") || pathname.startsWith("/dashboard/activity-logs") || pathname.startsWith("/dashboard/tools/activity-logs") || pathname.startsWith("/dashboard/logs") || pathname.startsWith("/dashboard/tools/logs") || pathname.startsWith("/dashboard/cpanel") || pathname.startsWith("/dashboard/trash")) ? "system"
    : null

  const settingsProductsActive = pathname === "/dashboard/settings/products"
  const paymentMethodsActive =
    pathname === "/dashboard/accounts/payments/methods" ||
    pathname === "/dashboard/accounts/payments/types" ||
    pathname === "/dashboard/accounts/bills/payment-methods" ||
    pathname === "/dashboard/accounts/payment-methods"

  // Auto-close mobile navigation drawer and open the active group on route transition
  React.useEffect(() => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false)
    }
    if (activeGroup) {
      setOpenMenu(activeGroup)
    }
  }, [pathname, isMobile, setOpenMobile, activeGroup])

  // Toggles accordion state, expanding the rail first when collapsed
  const toggleMenu = (menuKey) => {
    if (!isMobile && state === "collapsed") {
      setOpen(true)
      setOpenMenu(menuKey)
      return
    }
    setOpenMenu((prev) => (prev === menuKey ? null : menuKey))
  }

  // Logs out active user and closes modal
  const handleConfirmLogout = () => {
    setLogoutConfirmOpen(false)
    logout()
  }

  const handleCloseSidebar = () => {
    if (isMobile) {
      setOpenMobile(false)
    } else {
      setOpen(false)
    }
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || "B"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-14 sm:h-16 shrink-0 flex items-center justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:justify-center">
          {state === "expanded" || isMobile ? (
            <>
              <div className="flex flex-col items-start gap-1 overflow-hidden">
                <BrandLogo className="w-24 h-auto" />
                <span className="text-[10px] font-mono font-medium text-slate-400 tracking-wider uppercase ml-1">
                  v{pkg.version || "3.04.03"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseSidebar}
                className="h-8 w-8 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors flex items-center justify-center shrink-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
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
          <NavLabel>{t("nav.group_main", "Main")}</NavLabel>
          {showOverview && (
            <NavLink to="/dashboard" active={pathname === "/dashboard"} icon={LayoutDashboard} label={t("nav.overview", "Overview")} />
          )}
          {showWebmail && (
            <NavLink to="/dashboard/tools/messages" active={pathname.startsWith("/dashboard/tools/messages") || pathname === "/dashboard/messages"} icon={Mail} label={t("nav.webmail", "Webmail")} />
          )}
          {showSupport && (
            <NavLink to="/dashboard/tools/support" active={pathname.startsWith("/dashboard/tools/support")} icon={LifeBuoy} label={t("nav.support_desk", "Support Desk")} />
          )}
          {showAdminLayout && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/admin")}
                tooltip={t("nav.admin_layout", "Admin View")}
                render={<Link to="/admin" />}
                className={navItemClass}
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{t("nav.admin_layout", "Admin View")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {(showOrders || showCustomers || showReviews) && <NavLabel>{t("nav.group_sell", "Sell")}</NavLabel>}
          {showOrders && (
            <NavGroup id="orders" icon={ShoppingBag} label={t("nav.orders", "Orders")} active={activeGroup === "orders"} open={openMenu === "orders"} onToggle={toggleMenu}>
              {isAllowed("orders.custom-new") && (
                <NavSub to="/dashboard/orders/custom/new" active={pathname === "/dashboard/orders/custom/new" || pathname === "/dashboard/orders/custom-new"} icon={PlusCircle}>
                  {t("nav.new_custom_order", "New Custom Order")}
                </NavSub>
              )}
              {isAllowed("orders.new") && (
                <NavSub to="/dashboard/orders/new" active={pathname === "/dashboard/orders/new"} icon={PlusCircle}>
                  {t("nav.new_in_store_order", "New In-Store Order")}
                </NavSub>
              )}
              {isAllowed("orders.list") && (
                <NavSub to="/dashboard/orders" active={pathname === "/dashboard/orders"} icon={ListOrdered}>
                  {t("nav.orders_list", "Orders List")}
                </NavSub>
              )}
              {isAllowed("orders.custom") && (
                <NavSub to="/dashboard/orders/custom" active={pathname === "/dashboard/orders/custom"} icon={ShoppingBag}>
                  {t("nav.custom_orders", "Custom Orders")}
                </NavSub>
              )}
              {isAllowed("orders.instore") && (
                <NavSub to="/dashboard/orders/in-store" active={pathname === "/dashboard/orders/in-store" || pathname === "/dashboard/orders/instore"} icon={Store}>
                  {t("nav.in_store_orders", "In-Store Orders")}
                </NavSub>
              )}
              {isAllowed("orders.spamlist") && (
                <NavSub to="/dashboard/orders/spamlist" active={pathname === "/dashboard/orders/spamlist"} icon={ShieldAlert} iconClass="text-red-500">
                  {t("nav.spam_list", "Spam List")}
                </NavSub>
              )}
            </NavGroup>
          )}
          {showCustomers && (
            <NavLink to="/dashboard/members" active={pathname.startsWith("/dashboard/members")} icon={Users} label={t("nav.customer_list", "Customers")} />
          )}
          {showReviews && (
            <NavLink to="/dashboard/reviews" active={pathname.startsWith("/dashboard/reviews")} icon={Star} label={t("nav.reviews", "Reviews")} />
          )}

          {(showProducts || showItems || showMedia) && <NavLabel>{t("nav.group_catalog", "Catalog")}</NavLabel>}
          {showProducts && (
            <NavGroup id="products" icon={Package} label={t("nav.products", "Products")} active={activeGroup === "products"} open={openMenu === "products"} onToggle={toggleMenu}>
              {isAllowed("products.list") && (
                <NavSub to="/dashboard/products" active={pathname === "/dashboard/products" || pathname === "/dashboard/products/list"} icon={ListOrdered}>
                  {t("nav.product_list", "Product List")}
                </NavSub>
              )}
              {isAllowed("products.on-sale") && (
                <NavSub to="/dashboard/products/on-sale" active={pathname === "/dashboard/products/on-sale"} icon={Tag}>
                  {t("nav.on_sale", "On Sale")}
                </NavSub>
              )}
              {isAllowed("products.miniature") && (
                <NavSub to="/dashboard/products/miniature" active={pathname === "/dashboard/products/miniature"} icon={Sparkles}>
                  {t("nav.miniature", "Miniature")}
                </NavSub>
              )}
              {(isAllowed("products.showcases") || isAllowed("settings")) && (
                <NavSub to="/dashboard/settings/products" active={settingsProductsActive} icon={Sparkles}>
                  {t("nav.showcases", "Showcases")}
                </NavSub>
              )}
              {isAllowed("products.coupons") && (
                <NavSub to="/dashboard/products/coupons" active={pathname === "/dashboard/products/coupons"} icon={Ticket}>
                  {t("nav.coupons", "Coupons")}
                </NavSub>
              )}
              {showOrganize && <SubLabel>{t("nav.organize", "Organize")}</SubLabel>}
              {isAllowed("products.categories") && (
                <NavSub to="/dashboard/products/categories" active={pathname === "/dashboard/products/categories"} icon={Receipt}>
                  {t("nav.categories", "Categories")}
                </NavSub>
              )}
              {isAllowed("products.brands") && (
                <NavSub to="/dashboard/products/brands" active={pathname === "/dashboard/products/brands"} icon={CreditCard}>
                  {t("nav.brands", "Brands")}
                </NavSub>
              )}
              {isAllowed("products.attributes") && (
                <NavSub to="/dashboard/products/attributes" active={pathname.startsWith("/dashboard/products/attributes")} icon={Sliders}>
                  {t("nav.attributes", "Attributes")}
                </NavSub>
              )}
              {isAllowed("products.size-charts") && (
                <NavSub to="/dashboard/products/size-charts" active={pathname === "/dashboard/products/size-charts"} icon={Ruler}>
                  {t("nav.size_charts", "Size Charts")}
                </NavSub>
              )}
            </NavGroup>
          )}
          {showItems && (
            <NavGroup id="items" icon={Package} label={t("nav.items", "Items")} active={activeGroup === "items"} open={openMenu === "items"} onToggle={toggleMenu}>
              {isAllowed("items.new") && (
                <NavSub to="/dashboard/items/new" active={pathname === "/dashboard/items/new"} icon={PlusCircle}>
                  {t("nav.add_item", "Add Item")}
                </NavSub>
              )}
              {isAllowed("items.list") && (
                <NavSub to="/dashboard/items" active={pathname === "/dashboard/items" || pathname === "/dashboard/items/list"} icon={ListOrdered}>
                  {t("nav.item_list", "Items List")}
                </NavSub>
              )}
            </NavGroup>
          )}
          {showMedia && (
            <NavGroup id="media" icon={Images} label={t("nav.media", "Media")} active={activeGroup === "media"} open={openMenu === "media"} onToggle={toggleMenu}>
              {(isAllowed("tools.assets") || isAllowed("tools.media") || isAllowed("tools")) && (
                <NavSub to="/dashboard/media" active={pathname.startsWith("/dashboard/media")} icon={Images}>
                  {t("nav.all_media", "All Media")}
                </NavSub>
              )}
              {isAllowed("tools.bulk-image-resize") && (
                <NavSub to="/dashboard/tools/bulk-image-resize" active={pathname === "/dashboard/tools/bulk-image-resize"} icon={ImageDown}>
                  {t("nav.bulk_image_resize", "Bulk Image Resize")}
                </NavSub>
              )}
            </NavGroup>
          )}

          {(showAccounts || showReports) && <NavLabel>{t("nav.group_finance", "Finance")}</NavLabel>}
          {showAccounts && (
            <NavGroup id="accounts" icon={Landmark} label={t("nav.accounts", "Accounts")} active={activeGroup === "accounts"} open={openMenu === "accounts"} onToggle={toggleMenu}>
              <NavSub
                to="/dashboard/accounts/balance"
                active={pathname === "/dashboard/accounts/balance" || pathname === "/dashboard/accounts" || pathname === "/dashboard/billing"}
                icon={Scale}
                iconClass="text-blue-500"
              >
                {t("nav.account_balance", "Account Balance")}
              </NavSub>

              <SubLabel>{t("nav.bills", "Bills")}</SubLabel>
              <NavSub to="/dashboard/accounts/bills/new" active={pathname === "/dashboard/accounts/bills/new"} icon={PlusCircle} iconClass="text-red-500">
                {t("nav.add_bill", "Add New")}
              </NavSub>
              <NavSub to="/dashboard/accounts/bills/types" active={pathname === "/dashboard/accounts/bills/types"} icon={Tag} iconClass="text-amber-500">
                {t("nav.bill_types", "Bill Types")}
              </NavSub>
              <NavSub to="/dashboard/accounts/bills" active={pathname === "/dashboard/accounts/bills" || pathname === "/dashboard/billing/billings"} icon={Receipt} iconClass="text-red-500">
                {t("nav.all_bills", "All Bills")}
              </NavSub>

              <SubLabel>{t("nav.payments", "Payments")}</SubLabel>
              <NavSub to="/dashboard/accounts/payments/new" active={pathname === "/dashboard/accounts/payments/new"} icon={PlusCircle} iconClass="text-emerald-500">
                {t("nav.add_payment", "Add New")}
              </NavSub>
              <NavSub to="/dashboard/accounts/payments/methods" active={paymentMethodsActive} icon={CreditCard} iconClass="text-emerald-500">
                {t("nav.payment_methods", "Payment Methods")}
              </NavSub>
              <NavSub to="/dashboard/accounts/payments" active={pathname === "/dashboard/accounts/payments" || pathname === "/dashboard/billing/payments"} icon={Receipt} iconClass="text-emerald-500">
                {t("nav.all_payments", "All Payments")}
              </NavSub>

              <SubLabel>{t("nav.investments", "Investments")}</SubLabel>
              <NavSub to="/dashboard/accounts/investors" active={pathname === "/dashboard/accounts/investors"} icon={Users} iconClass="text-purple-500">
                {t("nav.investors", "Investors")}
              </NavSub>
              <NavSub to="/dashboard/accounts/investments" active={pathname === "/dashboard/accounts/investments"} icon={TrendingUp} iconClass="text-purple-500">
                {t("nav.investments_list", "Investments")}
              </NavSub>
            </NavGroup>
          )}
          {showReports && (
            <NavLink to="/dashboard/reports" active={pathname.startsWith("/dashboard/reports")} icon={BarChart3} label={t("nav.reports", "Reports")} />
          )}

          {(showSettingsGroup || showSystem) && <NavLabel>{t("nav.group_system", "System")}</NavLabel>}
          {showSettingsGroup && (
            <NavGroup id="settings" icon={Settings} label={t("nav.settings", "Settings")} active={activeGroup === "settings"} open={openMenu === "settings"} onToggle={toggleMenu}>
              {showSettings && (
                <>
                  <SubLabel>{t("nav.store_content", "Store & Content")}</SubLabel>
                        <NavSub to="/dashboard/settings/cms-content" active={pathname.startsWith("/dashboard/settings/cms")} icon={ImageIcon}>
                          {t("nav.cms_content", "CMS Content")}
                        </NavSub>
                        <NavSub to="/dashboard/settings/seo" active={pathname.startsWith("/dashboard/settings/seo")} icon={Search}>
                          {t("nav.general_seo", "General & SEO")}
                        </NavSub>
                        {features?.templates !== false && (isAllowed("templates") || isAllowed("settings")) && (
                          <NavSub to="/dashboard/settings/templates" active={pathname.startsWith("/dashboard/settings/templates") || pathname === "/dashboard/templates"} icon={Receipt} iconClass="text-blue-500">
                            {t("nav.templates", "Invoice & Templates")}
                          </NavSub>
                        )}
                        <NavSub to="/dashboard/settings/admin-view/styles" active={pathname.startsWith("/dashboard/settings/admin-view/styles")} icon={Sparkles} iconClass="text-indigo-500">
                          {t("nav.admin_view_styles", "Admin View Styles")}
                        </NavSub>
                  <SubLabel>{t("nav.marketing", "Marketing")}</SubLabel>
                        <NavSub to="/dashboard/settings/meta-pixel" active={pathname.startsWith("/dashboard/settings/meta-pixel")} icon={Share2}>
                          {t("nav.meta_pixel", "Meta Pixel")}
                        </NavSub>
                        <NavSub to="/dashboard/settings/tiktok-pixel" active={pathname.startsWith("/dashboard/settings/tiktok-pixel")} icon={TikTokIcon} iconClass="shrink-0">
                          {t("nav.tiktok_pixel", "TikTok Pixel")}
                        </NavSub>
                        {isAllowed("tools.meta-catalog") && (
                          <NavSub to="/dashboard/tools/meta-catalog" active={pathname === "/dashboard/tools/meta-catalog"} icon={Share2}>
                            {t("nav.meta_catalog", "Meta Catalog")}
                          </NavSub>
                        )}
                  <SubLabel>{t("nav.integrations", "Integrations")}</SubLabel>
                        <NavSub to="/dashboard/settings/pathao-courier" active={pathname.startsWith("/dashboard/settings/pathao")} icon={Truck} iconClass="text-red-500">
                          {t("nav.pathao_courier", "Pathao Courier")}
                        </NavSub>
                        <NavSub to="/dashboard/settings/smtp" active={pathname.startsWith("/dashboard/settings/smtp")} icon={Mail} iconClass="text-indigo-500">
                          {t("nav.email_server_setup", "SMTP Configuration")}
                        </NavSub>
                        <NavSub to="/dashboard/settings/r2-storage" active={pathname.startsWith("/dashboard/settings/r2-storage")} icon={HardDrive} iconClass="text-orange-400">
                          {t("nav.r2_storage", "R2 Storage")}
                        </NavSub>
                </>
              )}
              {isAllowed("users") && (
                <>
                  <SubLabel>{t("nav.team", "Team")}</SubLabel>
                  <NavSub to="/dashboard/users" active={pathname.startsWith("/dashboard/users")} icon={ShieldAlert}>
                    {t("nav.system_users", "System Users")}
                  </NavSub>
                </>
              )}
            </NavGroup>
          )}
          {showSystem && (
            <NavGroup id="system" icon={Terminal} label={t("nav.system", "System")} active={activeGroup === "system"} open={openMenu === "system"} onToggle={toggleMenu}>
              {Boolean(clientConfig?.cloudFlareAnalytics?.active || clientConfig?.features?.cloudflareAnalytics !== false) && (isAllowed("analytics") || isAllowed("tools.analytics") || isAllowed("tools") || isAllowed("admin")) && (
                <NavSub
                  to="/dashboard/cloudflare-analytics"
                  active={pathname.startsWith("/dashboard/cloudflare-analytics") || pathname.startsWith("/dashboard/tools/cloudflare-analytics") || pathname.startsWith("/dashboard/cloudflare")}
                  icon={LineChart}
                  iconClass="text-blue-500"
                >
                  {t("nav.cloudflare_analytics", "Cloudflare Analytics")}
                </NavSub>
              )}
              {(isAllowed("activity-logs") || isAllowed("tools.activity-logs") || isAllowed("tools") || isAllowed("admin")) && (
                <NavSub to="/dashboard/activity-logs" active={pathname.startsWith("/dashboard/activity-logs") || pathname.startsWith("/dashboard/tools/activity-logs")} icon={Activity}>
                  {t("nav.activity_logs", "Activity Logs")}
                </NavSub>
              )}
              {(isAllowed("logs") || isAllowed("tools.logs")) && (
                <NavSub to="/dashboard/logs" active={pathname.startsWith("/dashboard/logs") || pathname.startsWith("/dashboard/tools/logs")} icon={Terminal}>
                  {t("nav.system_logs", "System Logs")}
                </NavSub>
              )}
              {isAllowed("cpanel") && (
                <NavSub to="/dashboard/cpanel" active={pathname.startsWith("/dashboard/cpanel")} icon={Terminal} iconClass="text-emerald-400" className="text-emerald-400 font-medium">
                  {t("nav.cpanel", "PPanel / cPanel")}
                </NavSub>
              )}
              {showAdmin && (
                <NavSub to="/dashboard/trash" active={pathname.startsWith("/dashboard/trash")} icon={Trash2} iconClass="text-destructive" className="text-destructive font-medium">
                  {t("nav.trash", "Trash")}
                </NavSub>
              )}
            </NavGroup>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-1.5 mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left cursor-pointer outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                title={user?.name || "User Account"}
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary">
                  {userInitial}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded border-2 border-sidebar bg-emerald-500" />
                </span>
                <span className="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-semibold text-foreground">{user?.name || "Bithy Akther"}</span>
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
              className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm"
              onClick={() => navigate("/dashboard/profile")}
            >
              <User className="h-4 w-4" />
              <span>{t("nav.profile", "Profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm text-destructive focus:bg-primary/10 focus:text-primary"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("nav.logout", "Logout")}</span>
            </DropdownMenuItem>
            <div className="-mx-1 mt-1 border-t px-3 pb-1 pt-1.5 font-mono text-[10px] text-muted-foreground">
              Build v{pkg.version || "3.04.03"}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />

      {/* Logout Confirmation Alert Dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 text-center">
          <DialogHeader className="space-y-2">
            <div className="mx-auto h-12 w-12 rounded bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-1">
              <LogOut className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground text-center">
              {t("nav.logout_confirm_title", "Confirm Logout")}
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
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm cursor-pointer text-xs"
            >
              {t("common.yes", "Yes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


    </Sidebar>
  )
}
