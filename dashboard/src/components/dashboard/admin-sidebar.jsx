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
  Landmark,
  Wallet,
  TrendingUp,
  Scale,
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
export const AdminSidebar = ({ ...props }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const { user, logout } = useAuth()
  const { state, setOpen, isMobile, setOpenMobile, toggleSidebar } = useSidebar()
  const { brandName, features } = clientConfig

  const [openMenu, setOpenMenu] = React.useState(null)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false)

  // Auto-close mobile navigation drawer on route transition
  React.useEffect(() => {
    if (isMobile && setOpenMobile) {
      setOpenMobile(false)
    }
  }, [pathname, isMobile, setOpenMobile])

  // Toggles single accordion menu state
  const toggleMenu = (menuKey) => {
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
    <Sidebar collapsible="icon" style={{ backgroundColor: 'var(--theme-sidebar, #ffffff)' }} {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
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
                className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                title="Close Sidebar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all flex items-center justify-center shrink-0 cursor-pointer"
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
                isActive={pathname === "/admin"}
                tooltip={t("nav.overview", "Overview")}
                render={<Link to="/admin" />}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>{t("nav.overview", "Overview")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {(isAllowed("webmail") || isAllowed("tools.messages")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === "/admin/tools/messages" || pathname.startsWith("/admin/tools/messages") || pathname === "/admin/messages"}
                tooltip={t("nav.webmail", "Webmail")}
                render={<Link to="/admin/tools/messages" />}
              >
                <Mail className="h-4 w-4" />
                <span>{t("nav.webmail", "Webmail")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAllowed("admin") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={false}
                tooltip={t("nav.return_to_dashboard", "Exit Admin")}
                render={<Link to="/admin" />}
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">{t("nav.return_to_dashboard", "Exit Admin")}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isAllowed("orders") && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith("/admin/orders")}
                tooltip={t("nav.orders", "Orders")}
                closeOnClick={false}
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
                        isActive={pathname === "/admin/orders/custom/new" || pathname === "/admin/orders/custom-new"}
                        render={<Link to="/admin/orders/custom/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{t("nav.new_custom_order", "New Custom Order")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.new") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/orders/new"}
                        render={<Link to="/admin/orders/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{t("nav.new_in_store_order", "New In-Store Order")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/orders"}
                        render={<Link to="/admin/orders" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>{t("nav.orders_list", "Orders List")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.custom") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/orders/custom"}
                        render={<Link to="/admin/orders/custom" />}
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{t("nav.custom_orders", "Custom Orders")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("orders.instore") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/orders/in-store" || pathname === "/admin/orders/instore"}
                        render={<Link to="/admin/orders/in-store" />}
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
                  pathname.startsWith("/admin/products") ||
                  pathname === "/admin/settings/products" ||
                  pathname.startsWith("/admin/reviews")
                }
                tooltip={t("nav.products", "Products")}
                closeOnClick={false}
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
                        isActive={pathname === "/admin/products/new"}
                        render={<Link to="/admin/products/new" />}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{t("nav.add_product", "Add Product")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.list") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products" || pathname === "/admin/products/list"}
                        render={<Link to="/admin/products" />}
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                        <span>{t("nav.product_list", "Product List")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.on-sale") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products/on-sale"}
                        render={<Link to="/admin/products/on-sale" />}
                      >
                        <Tag className="h-3.5 w-3.5" />
                        <span>{t("nav.on_sale", "On Sale")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.miniature") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products/miniature"}
                        render={<Link to="/admin/products/miniature" />}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("nav.miniature", "Miniature")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("products.showcases") || isAllowed("settings")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/settings/products"}
                        render={<Link to="/admin/settings/products" />}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{t("nav.showcases", "Showcases")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.categories") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products/categories"}
                        render={<Link to="/admin/products/categories" />}
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        <span>{t("nav.categories", "Categories")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.brands") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products/brands"}
                        render={<Link to="/admin/products/brands" />}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{t("nav.brands", "Brands")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.attributes") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/products/attributes")}
                        render={<Link to="/admin/products/attributes" />}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>{t("nav.attributes", "Attributes")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.coupons") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products/coupons"}
                        render={<Link to="/admin/products/coupons" />}
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>{t("nav.coupons", "Coupons")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("products.size-charts") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/products/size-charts"}
                        render={<Link to="/admin/products/size-charts" />}
                      >
                        <Ruler className="h-3.5 w-3.5" />
                        <span>{t("nav.size_charts", "Size Charts")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("products.reviews") || isAllowed("reviews")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/reviews")}
                        render={<Link to="/admin/reviews" />}
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
                isActive={pathname.startsWith("/admin/settings") && pathname !== "/admin/settings/products"}
                tooltip={t("nav.settings", "Settings")}
                closeOnClick={false}
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
                      isActive={pathname.startsWith("/admin/settings/cms")}
                      render={<Link to="/admin/settings/cms-content" />}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>{t("nav.cms_content", "CMS Content")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/admin/settings/seo")}
                      render={<Link to="/admin/settings/seo" />}
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>{t("nav.general_seo", "General & SEO")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/settings/meta-pixel"}
                      render={<Link to="/admin/settings/meta-pixel/shop" />}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{t("nav.meta_pixel", "Meta Pixel")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {["shop", "store"].map((site) => (
                    <SidebarMenuSubItem key={site}>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith(`/admin/settings/meta-pixel/${site}`)}
                        render={<Link to={`/admin/settings/meta-pixel/${site}`} />}
                        className="pl-8"
                      >
                        <span>{site === "shop" ? t("nav.meta_pixel_shop", "Shop") : t("nav.meta_pixel_store", "Store")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/admin/settings/tiktok-pixel")}
                      render={<Link to="/admin/settings/tiktok-pixel" />}
                    >
                      <TikTokIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{t("nav.tiktok_pixel", "TikTok Pixel")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>


                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/admin/settings/pathao-courier") || pathname.startsWith("/admin/settings/pathao")}
                      render={<Link to="/admin/settings/pathao-courier" />}
                    >
                      <Truck className="h-3.5 w-3.5 text-red-500" />
                      <span>{t("nav.pathao_courier", "Pathao Courier")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/admin/settings/smtp")}
                      render={<Link to="/admin/settings/smtp" />}
                    >
                      <Mail className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{t("nav.email_server_setup", "SMTP Configuration")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/admin/settings/admin-view/styles")}
                      render={<Link to="/admin/settings/admin-view/styles" />}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                      <span>{t("nav.admin_view_styles", "Admin View Styles")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {features?.templates !== false && (isAllowed("templates") || isAllowed("settings")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={
                          pathname.startsWith("/admin/settings/templates") ||
                          pathname === "/admin/templates"
                        }
                        render={<Link to="/admin/settings/templates" />}
                      >
                        <Receipt className="h-3.5 w-3.5 text-blue-500" />
                        <span>{t("nav.templates", "Invoice & Templates")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {(isAllowed("accounts") || isAllowed("accounts.bills") || isAllowed("accounts.payments") || isAllowed("accounts.investors") || isAllowed("accounts.investments") || isAllowed("accounts.balance") || isAllowed("billing") || isAllowed("admin")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/admin/accounts") ||
                  pathname.startsWith("/admin/billing")
                }
                tooltip={t("nav.accounts", "Accounts")}
                closeOnClick={false}
                onClick={() => toggleMenu("accounts")}
                className="cursor-pointer flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  <span>{t("nav.accounts", "Accounts")}</span>
                </div>
                <ChevronRight
                  className={`h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                    openMenu === "accounts" ? "rotate-90 text-primary" : ""
                  }`}
                />
              </SidebarMenuButton>
              {openMenu === "accounts" && (
                <SidebarMenuSub>
                  {/* Account Balance */}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/balance" || pathname === "/admin/accounts" || pathname === "/admin/billing"}
                      render={<Link to="/admin/accounts/balance" />}
                    >
                      <Scale className="h-3.5 w-3.5 text-blue-500" />
                      <span>{t("nav.account_balance", "Account Balance")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {/* Bills Submenu Group */}
                  <div className="px-2 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
                    {t("nav.bills", "Bills")}
                  </div>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/bills/new"}
                      render={<Link to="/admin/accounts/bills/new" />}
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-red-500" />
                      <span>{t("nav.add_bill", "Add New")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/bills/types"}
                      render={<Link to="/admin/accounts/bills/types" />}
                    >
                      <Tag className="h-3.5 w-3.5 text-amber-500" />
                      <span>{t("nav.bill_types", "Bill Types")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={
                        pathname === "/admin/accounts/payments/methods" ||
                        pathname === "/admin/accounts/payments/types" ||
                        pathname === "/admin/accounts/bills/payment-methods" ||
                        pathname === "/admin/accounts/payment-methods"
                      }
                      render={<Link to="/admin/accounts/payments/methods" />}
                    >
                      <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t("nav.payment_methods", "Payment Methods")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/bills" || pathname === "/admin/billing/billings"}
                      render={<Link to="/admin/accounts/bills" />}
                    >
                      <Receipt className="h-3.5 w-3.5 text-red-500" />
                      <span>{t("nav.all_bills", "All Bills")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {/* Payments Submenu Group */}
                  <div className="px-2 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
                    {t("nav.payments", "Payments")}
                  </div>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/payments/new"}
                      render={<Link to="/admin/accounts/payments/new" />}
                    >
                      <PlusCircle className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t("nav.add_payment", "Add New")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={
                        pathname === "/admin/accounts/payments/methods" ||
                        pathname === "/admin/accounts/payments/types" ||
                        pathname === "/admin/accounts/bills/payment-methods" ||
                        pathname === "/admin/accounts/payment-methods"
                      }
                      render={<Link to="/admin/accounts/payments/methods" />}
                    >
                      <CreditCard className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t("nav.payment_methods", "Payment Methods")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/payments" || pathname === "/admin/billing/payments"}
                      render={<Link to="/admin/accounts/payments" />}
                    >
                      <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{t("nav.all_payments", "All Payments")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>

                  {/* Investments Submenu Group */}
                  <div className="px-2 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
                    {t("nav.investments", "Investments")}
                  </div>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/investors"}
                      render={<Link to="/admin/accounts/investors" />}
                    >
                      <Users className="h-3.5 w-3.5 text-purple-500" />
                      <span>{t("nav.investors", "Investors")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname === "/admin/accounts/investments"}
                      render={<Link to="/admin/accounts/investments" />}
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                      <span>{t("nav.investments_list", "Investments")}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          )}

          {(isAllowed("admin") || isAllowed("reports") || isAllowed("users") || isAllowed("customers") || isAllowed("members") || isAllowed("trash") || isAllowed("cpanel")) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  pathname.startsWith("/admin/reports") ||
                  pathname.startsWith("/admin/users") ||
                  pathname.startsWith("/admin/members") ||
                  pathname.startsWith("/admin/tools/support") ||
                  pathname.startsWith("/admin/cpanel") ||
                  pathname.startsWith("/admin/trash")
                }
                tooltip={t("nav.admin", "Admin")}
                closeOnClick={false}
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
                        isActive={pathname.startsWith("/admin/reports")}
                        render={<Link to="/admin/reports" />}
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span>{t("nav.reports", "Reports")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("users") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/users")}
                        render={<Link to="/admin/users" />}
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>{t("nav.system_users", "System Users")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("customers") || isAllowed("members") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/members")}
                        render={<Link to="/admin/members" />}
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span>{t("nav.customer_list", "Customer List")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("tools.support") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/tools/support" || pathname.startsWith("/admin/tools/support")}
                        render={<Link to="/admin/tools/support" />}
                      >
                        <LifeBuoy className="h-3.5 w-3.5" />
                        <span>{t("nav.support_desk", "Support Desk")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("cpanel") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/cpanel")}
                        render={<Link to="/admin/cpanel" />}
                      >
                        <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-medium">{t("nav.cpanel", "PPanel / cPanel")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      isActive={pathname.startsWith("/admin/trash")}
                      render={<Link to="/admin/trash" />}
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
                  pathname.startsWith("/admin/analytics") ||
                  pathname.startsWith("/admin/tools/analytics") ||
                  pathname.startsWith("/admin/cloudflare-analytics") ||
                  pathname.startsWith("/admin/tools/cloudflare-analytics") ||
                  pathname.startsWith("/admin/cloudflare") ||
                  pathname.startsWith("/admin/activity-logs") ||
                  pathname.startsWith("/admin/tools/activity-logs") ||
                  pathname.startsWith("/admin/media") ||
                  pathname.startsWith("/admin/tools/bulk-image-resize") ||
                  pathname.startsWith("/admin/tools/meta-catalog") ||
                  pathname.startsWith("/admin/logs") ||
                  pathname.startsWith("/admin/tools/logs")
                }
                tooltip={t("nav.tools_media", "Tools & Media")}
                closeOnClick={false}
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

                  {Boolean(clientConfig?.cloudFlareAnalytics?.active || clientConfig?.features?.cloudflareAnalytics !== false) && (isAllowed("analytics") || isAllowed("tools.analytics") || isAllowed("tools") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/cloudflare-analytics") || pathname.startsWith("/admin/tools/cloudflare-analytics") || pathname.startsWith("/admin/cloudflare")}
                        render={<Link to="/admin/cloudflare-analytics" />}
                      >
                        <LineChart className="h-3.5 w-3.5 text-blue-500" />
                        <span>{t("nav.cloudflare_analytics", "Cloudflare Analytics")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("activity-logs") || isAllowed("tools.activity-logs") || isAllowed("tools") || isAllowed("admin")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/activity-logs") || pathname.startsWith("/admin/tools/activity-logs")}
                        render={<Link to="/admin/activity-logs" />}
                      >
                        <Activity className="h-3.5 w-3.5" />
                        <span>{t("nav.activity_logs", "Activity Logs")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("tools.assets") || isAllowed("tools.media") || isAllowed("tools")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/media" || pathname.startsWith("/admin/media")}
                        render={<Link to="/admin/media" />}
                      >
                        <Images className="h-3.5 w-3.5" />
                        <span>{t("nav.all_media", "All Media")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.bulk-image-resize") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/tools/bulk-image-resize"}
                        render={<Link to="/admin/tools/bulk-image-resize" />}
                      >
                        <ImageDown className="h-3.5 w-3.5" />
                        <span>{t("nav.bulk_image_resize", "Bulk Image Resize")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {isAllowed("tools.meta-catalog") && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname === "/admin/tools/meta-catalog"}
                        render={<Link to="/admin/tools/meta-catalog" />}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{t("nav.meta_catalog", "Meta Catalog")}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                  {(isAllowed("logs") || isAllowed("tools.logs")) && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        isActive={pathname.startsWith("/admin/logs") || pathname.startsWith("/admin/tools/logs")}
                        render={<Link to="/admin/logs" />}
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
                onClick={() => navigate('/admin/profile')}
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
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary mb-1">
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
