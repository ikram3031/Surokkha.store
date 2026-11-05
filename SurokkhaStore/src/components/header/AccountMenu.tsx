import { useEffect, useRef, useState } from 'react'
import { LayoutDashboard, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SESSION_EVENT, fetchCurrentCustomer, getCustomerToken, logout, type Customer } from '@/lib/api/customer-auth'
import { navigate } from '@/lib/router'

/**
 * Profile icon in the header. Logged out: goes to the log in / sign up page.
 * Logged in: opens a small menu with the customer's details, the dashboard and log out.
 */
export function AccountMenu() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      if (!getCustomerToken()) {
        setCustomer(null)
        return
      }
      fetchCurrentCustomer().then((c) => {
        if (!cancelled) setCustomer(c)
      })
    }
    refresh()
    window.addEventListener(SESSION_EVENT, refresh)
    return () => {
      cancelled = true
      window.removeEventListener(SESSION_EVENT, refresh)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  const itemClass = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-secondary'

  return (
    <div ref={ref} className="relative">
      <Button
        size="icon"
        className="rounded-full bg-white/10 text-white hover:bg-white/20"
        aria-label={customer ? 'My account menu' : 'Log in or sign up'}
        aria-expanded={customer ? open : undefined}
        onClick={() => (customer ? setOpen((o) => !o) : navigate('/account'))}
      >
        <User className="h-5 w-5" />
      </Button>

      {customer && open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-background p-2 text-foreground shadow-xl">
          <div className="border-b border-border px-3 pb-3 pt-2">
            <p className="truncate font-semibold">{customer.name}</p>
            <p className="truncate text-sm text-muted-foreground">{customer.email}</p>
            {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
          </div>
          <div className="pt-2">
            <button type="button" className={itemClass} onClick={() => go('/account')}>
              <LayoutDashboard className="h-4 w-4" /> Profile dashboard
            </button>
            <button
              type="button"
              className={`${itemClass} text-red-600`}
              onClick={() => {
                logout()
                go('/')
              }}
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
