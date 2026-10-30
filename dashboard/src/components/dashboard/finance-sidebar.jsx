import { useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { BarChart3, CreditCard, PlusCircle, Receipt, Scale, Tag, TrendingUp, Users } from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { hasMenuAccess } from "@/lib/rbac"
import { NavLabel, NavLink } from "./app-sidebar"
import { WorkspaceSidebar } from "./workspace-sidebar"

// Sidebar for the /finance workspace: balance, bills, payments, investments and reports
export const FinanceSidebar = (props) => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const role = user?.role || "Marketing Expert"
  const can = (key) => hasMenuAccess(role, key)

  const paymentMethodsActive =
    pathname === "/finance/payments/methods" ||
    pathname === "/finance/payments/types" ||
    pathname === "/finance/bills/payment-methods" ||
    pathname === "/finance/payment-methods"

  const showBills = can("accounts") || can("accounts.bills")
  const showPayments = can("accounts") || can("accounts.payments")
  const showInvestments = can("accounts") || can("accounts.investors") || can("accounts.investments")
  const showReports = can("reports") || can("admin")

  return (
    <WorkspaceSidebar title={t("finance.workspace", "Finance")} {...props}>
      <NavLabel>{t("finance.group_accounts", "Accounts")}</NavLabel>
      <NavLink to="/finance/balance" active={pathname === "/finance" || pathname === "/finance/balance"} icon={Scale} label={t("nav.account_balance", "Account Balance")} />

      {showBills && (
        <>
          <NavLabel>{t("nav.bills", "Bills")}</NavLabel>
          <NavLink to="/finance/bills/new" active={pathname === "/finance/bills/new"} icon={PlusCircle} label={t("nav.add_bill", "Add New")} />
          <NavLink to="/finance/bills/types" active={pathname === "/finance/bills/types"} icon={Tag} label={t("nav.bill_types", "Bill Types")} />
          <NavLink to="/finance/bills" active={pathname === "/finance/bills" || pathname === "/finance/bills/slips"} icon={Receipt} label={t("nav.all_bills", "All Bills")} />
        </>
      )}

      {showPayments && (
        <>
          <NavLabel>{t("nav.payments", "Payments")}</NavLabel>
          <NavLink to="/finance/payments/new" active={pathname === "/finance/payments/new"} icon={PlusCircle} label={t("nav.add_payment", "Add New")} />
          <NavLink to="/finance/payments/methods" active={paymentMethodsActive} icon={CreditCard} label={t("nav.payment_methods", "Payment Methods")} />
          <NavLink to="/finance/payments" active={pathname === "/finance/payments"} icon={Receipt} label={t("nav.all_payments", "All Payments")} />
        </>
      )}

      {showInvestments && (
        <>
          <NavLabel>{t("nav.investments", "Investments")}</NavLabel>
          <NavLink to="/finance/investors" active={pathname === "/finance/investors"} icon={Users} label={t("nav.investors", "Investors")} />
          <NavLink to="/finance/investments" active={pathname === "/finance/investments"} icon={TrendingUp} label={t("nav.investments_list", "Investments")} />
        </>
      )}

      {showReports && (
        <>
          <NavLabel>{t("nav.reports", "Reports")}</NavLabel>
          <NavLink to="/finance/reports" active={pathname.startsWith("/finance/reports")} icon={BarChart3} label={t("nav.reports", "Reports")} />
        </>
      )}
    </WorkspaceSidebar>
  )
}
