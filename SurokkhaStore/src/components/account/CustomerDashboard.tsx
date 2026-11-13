import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  LayoutGrid,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  fetchMyAddresses,
  fetchMyOrders,
  saveMyAddresses,
  type Customer,
  type CustomerOrder,
  type CustomerOrderStatus,
  type SavedAddress,
} from '@/lib/api/customer-auth'

type Tab = 'overview' | 'orders' | 'tracking' | 'addresses'
type OrderStatus = CustomerOrderStatus
type Address = SavedAddress

const STATUS_META: Record<OrderStatus, { label: string; cls: string; step: number }> = {
  pending: { label: 'Pending', cls: 'bg-slate-100 text-slate-700 border-slate-200', step: 0 },
  confirmed: { label: 'Confirmed', cls: 'bg-sky-50 text-sky-800 border-sky-200', step: 1 },
  shipped: { label: 'Shipped', cls: 'bg-indigo-50 text-indigo-800 border-indigo-200', step: 3 },
  out: { label: 'Out for Delivery', cls: 'bg-amber-50 text-amber-800 border-amber-200', step: 4 },
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200', step: 5 },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200', step: -1 },
  returned: { label: 'Returned', cls: 'bg-stone-100 text-stone-700 border-stone-300', step: -1 },
}

const TRACK_STEPS = [
  { t: 'Order Placed', d: 'We have received your order.' },
  { t: 'Order Confirmed', d: 'Confirmed by phone call with our team.' },
  { t: 'Packed Discreetly', d: 'Sealed in plain packaging, no product name outside.' },
  { t: 'Handed to Courier', d: 'Picked up by the courier partner.' },
  { t: 'Out for Delivery', d: 'Rider is on the way to your address.' },
  { t: 'Delivered', d: 'Parcel received and payment collected.' },
]

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
    : ''

const COURIER_NAMES: Record<string, string> = { pathao: 'Pathao', steadfast: 'Steadfast', redx: 'RedX' }
const courierName = (o: CustomerOrder) =>
  o.courier.provider ? COURIER_NAMES[o.courier.provider.toLowerCase()] || o.courier.provider : '—'

/** Known time for each tracking step (blank when the backend does not record that moment). */
function stepTimes(o: CustomerOrder): string[] {
  return [
    fmtDateTime(o.createdAt),
    '',
    '',
    fmtDateTime(o.courier.dispatchedAt),
    o.status === 'out' ? fmtDateTime(o.courier.lastEventAt) : '',
    fmtDateTime(o.courier.deliveredAt || (o.status === 'delivered' ? o.updatedAt : null)),
  ]
}

const isActive = (o: CustomerOrder) => ['pending', 'confirmed', 'shipped', 'out'].includes(o.status)
const payLabel = (o: CustomerOrder) =>
  o.paymentMethod === 'cod' || !o.paymentMethod ? 'Cash on Delivery' : o.paymentMethod.toUpperCase()

const DIVISIONS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh']

const FILTER_OPTIONS: [string, string][] = [
  ['all', 'All'],
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['out', 'Out for Delivery'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
  ['returned', 'Returned'],
]

const taka = (n: number) => '৳' + n.toLocaleString('en-IN')

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className={`inline-flex items-center text-xs font-semibold border px-2.5 py-1 rounded-full ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

function ItemThumb({ image, size = 'w-12 h-12' }: { image?: string; size?: string }) {
  if (image) return <img src={image} alt="" loading="lazy" className={`${size} rounded-lg object-cover shrink-0 bg-[#EADFD0]`} />
  return (
    <div className={`${size} rounded-lg bg-[#F5D9E0] grid place-items-center shrink-0`}>
      <Package className="w-5 h-5 text-[#6B1028]/60" strokeWidth={1.5} />
    </div>
  )
}

export function CustomerDashboard({
  customer,
  onSignOut,
}: {
  customer: Customer
  onSignOut: () => void
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [orderSearch, setOrderSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [trackInput, setTrackInput] = useState('')
  const [trackedOrderId, setTrackedOrderId] = useState('')
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [trackError, setTrackError] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [savingAddresses, setSavingAddresses] = useState(false)

  useEffect(() => {
    let alive = true
    fetchMyOrders()
      .then((list) => {
        if (!alive) return
        setOrders(list)
        const first = list.find(isActive) || list[0]
        if (first) {
          setTrackInput(first.id)
          setTrackedOrderId(first.id)
        }
      })
      .catch((err) => alive && setOrdersError(err instanceof Error ? err.message : 'Could not load your orders'))
      .finally(() => alive && setOrdersLoading(false))
    fetchMyAddresses()
      .then((list) => alive && setAddresses(list))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // Saves the whole list on the server; rolls back on failure
  const persistAddresses = async (next: Address[], okMessage: string) => {
    const prev = addresses
    setAddresses(next)
    setSavingAddresses(true)
    try {
      setAddresses(await saveMyAddresses(next))
      toast.success(okMessage)
      return true
    } catch (err) {
      setAddresses(prev)
      toast.error(err instanceof Error ? err.message : 'Could not save the address')
      return false
    } finally {
      setSavingAddresses(false)
    }
  }

  // Address modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    division: 'Dhaka',
    district: '',
    area: '',
    address: '',
    label: 'Home' as Address['label'],
    isDefault: false,
  })

  const firstName = customer.name.trim().split(/\s+/)[0] || 'there'
  const initials = getInitials(customer.name)
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0]
  const activeOrder = orders.find((o) => o.status === 'out') || orders.find(isActive) || null
  const inTransit = orders.filter((o) => o.status === 'shipped' || o.status === 'out').length
  const totalSpent = orders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0)

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase()
    return orders.filter(
      (o) =>
        (activeFilter === 'all' || o.status === activeFilter) &&
        (!q || o.id.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q))),
    )
  }, [activeFilter, orderSearch, orders])

  const trackedOrder = useMemo(() => {
    const clean = trackedOrderId.trim().toLowerCase().replace(/^#/, '')
    return clean ? orders.find((o) => o.id.toLowerCase() === clean) || null : null
  }, [trackedOrderId, orders])

  const switchTab = (next: Tab) => {
    setTab(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openTracking = (id: string) => {
    setTrackInput(id)
    setTrackedOrderId(id)
    setTrackError(false)
    switchTab('tracking')
  }

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = trackInput.trim().toLowerCase().replace(/^#/, '')
    const found = orders.find((o) => o.id.toLowerCase() === clean)
    if (!found) {
      setTrackError(true)
      setTrackedOrderId('')
    } else {
      setTrackError(false)
      setTrackedOrderId(found.id)
    }
  }

  const openAddressModal = (addr?: Address) => {
    if (addr) {
      setEditingId(addr.id)
      setFormState({
        name: addr.name,
        phone: addr.phone,
        division: addr.division,
        district: addr.district,
        area: addr.area,
        address: addr.address,
        label: addr.label,
        isDefault: addr.isDefault,
      })
    } else {
      setEditingId(null)
      setFormState({
        name: customer.name || '',
        phone: customer.phone || '',
        division: 'Dhaka',
        district: '',
        area: '',
        address: '',
        label: 'Home',
        isDefault: addresses.length === 0,
      })
    }
    setModalOpen(true)
  }

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    let next = addresses.map((a) => (formState.isDefault ? { ...a, isDefault: false } : a))
    if (editingId !== null) {
      next = next.map((a) => (a.id === editingId ? { id: editingId, ...formState } : a))
    } else {
      next = [...next, { id: Date.now(), ...formState }]
    }
    if (!next.some((a) => a.isDefault) && next.length > 0) {
      next[0] = { ...next[0], isDefault: true }
    }
    if (await persistAddresses(next, editingId !== null ? 'Address updated' : 'Address added')) setModalOpen(false)
  }

  const setDefaultAddress = (id: number) => {
    persistAddresses(
      addresses.map((a) => ({ ...a, isDefault: a.id === id })),
      'Default address updated',
    )
  }

  const deleteAddress = (id: number) => {
    if (!window.confirm('Remove this address?')) return
    persistAddresses(
      addresses.filter((a) => a.id !== id),
      'Address removed',
    )
  }

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={1.7} /> },
    {
      id: 'orders',
      label: 'My Orders',
      icon: <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.7} />,
      badge: orders.length,
    },
    { id: 'tracking', label: 'Track Order', icon: <Truck className="w-[18px] h-[18px]" strokeWidth={1.7} /> },
    { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-[18px] h-[18px]" strokeWidth={1.7} /> },
  ]

  return (
    <div className="bg-[#FAF6F0] text-[#1C1215] min-h-[85vh] antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10">
        {/* Breadcrumb + title */}
        <div className="mb-6 lg:mb-8">
          <p className="text-xs uppercase tracking-[.2em] text-[#B8955A] font-semibold">My Account</p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-1 tracking-tight">Welcome back, {firstName}</h1>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8">
          {/* ============ SIDEBAR ============ */}
          <aside>
            {/* Profile card (desktop) */}
            <div className="hidden lg:block bg-white rounded-2xl shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] border border-[#EADFD0] p-5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#6B1028] text-[#FAF6F0] grid place-items-center font-serif text-lg shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{customer.name}</p>
                  <p className="text-sm text-[#5E4E52] truncate">{customer.phone || customer.email}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#EADFD0] text-xs text-[#5E4E52] flex justify-between">
                <span>Member</span>
                <span className="font-semibold text-[#1C1215]">Verified</span>
              </div>
            </div>

            {/* Nav: horizontal on mobile, vertical on desktop */}
            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-1 lg:pb-2 lg:bg-white lg:rounded-2xl lg:shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] lg:border lg:border-[#EADFD0] lg:p-2">
              {navItems.map((item) => {
                const active = tab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => switchTab(item.id)}
                    className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                      active
                        ? 'bg-[#1C1215] text-[#FAF6F0]'
                        : 'bg-white lg:bg-transparent border border-[#EADFD0] lg:border-0 text-[#5E4E52] hover:bg-[#F4EDE3] hover:text-[#1C1215]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-auto text-[11px] px-2 py-0.5 rounded-full ${
                          active ? 'bg-white/15 text-[#FAF6F0]' : 'bg-[#FBEEF1] text-[#6B1028]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
              <div className="hidden lg:block h-px bg-[#EADFD0] my-1" />
              <button
                type="button"
                onClick={onSignOut}
                className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5E4E52] hover:bg-[#F4EDE3] hover:text-[#1C1215] transition cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px]" strokeWidth={1.7} />
                <span>Log out</span>
              </button>
            </nav>

            {/* Help card */}
            <div className="hidden lg:block mt-4 rounded-2xl bg-[#24171B] text-[#FAF6F0] p-5">
              <p className="font-serif text-lg">Need help?</p>
              <p className="text-sm text-[#FAF6F0]/75 mt-1 leading-relaxed">
                Our team is available 10 AM – 10 PM, every day.
              </p>
              <a
                href="https://wa.me/8801700000000"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#E9D9BC] hover:text-white"
              >
                Chat with us
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </aside>

          {/* ============ CONTENT ============ */}
          <section className="min-w-0">
            {/* ================= OVERVIEW ================= */}
            {tab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-[#5E4E52] font-medium">Total Orders</p>
                    <p className="text-2xl sm:text-3xl font-semibold mt-2">{orders.length}</p>
                    <p className="text-xs text-[#5E4E52] mt-1">All time</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-[#5E4E52] font-medium">In Transit</p>
                    <p className="text-2xl sm:text-3xl font-semibold mt-2 text-amber-700">{inTransit}</p>
                    <p className="text-xs text-[#5E4E52] mt-1">Arriving soon</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-4 sm:p-5">
                    <p className="text-xs sm:text-sm text-[#5E4E52] font-medium">Delivered</p>
                    <p className="text-2xl sm:text-3xl font-semibold mt-2 text-emerald-700">
                      {orders.filter((o) => o.status === 'delivered').length}
                    </p>
                    <p className="text-xs text-[#5E4E52] mt-1">Successfully received</p>
                  </div>
                  <div className="bg-[#6B1028] rounded-2xl shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-4 sm:p-5 text-[#FAF6F0]">
                    <p className="text-xs sm:text-sm text-[#FAF6F0]/80 font-medium">Total Spent</p>
                    <p className="text-2xl sm:text-3xl font-semibold mt-2">{taka(totalSpent)}</p>
                    <p className="text-xs text-[#FAF6F0]/75 mt-1">On delivered orders</p>
                  </div>
                </div>

                {ordersLoading && (
                  <div className="bg-white rounded-2xl border border-[#EADFD0] p-8 text-center text-sm text-[#5E4E52]">
                    Loading your orders…
                  </div>
                )}
                {ordersError && (
                  <div className="bg-red-50 rounded-2xl border border-red-200 p-4 text-sm text-red-700">{ordersError}</div>
                )}

                {/* Active order */}
                {activeOrder && (() => {
                  const STEPS = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered']
                  const cur = { pending: 0, confirmed: 1, shipped: 2, out: 3, delivered: 4, cancelled: 0, returned: 0 }[activeOrder.status]
                  return (
                    <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#EADFD0]">
                        <div>
                          <h2 className="font-serif text-xl">Active Order</h2>
                          <p className="text-sm text-[#5E4E52]">
                            Order <span className="font-semibold text-[#1C1215]">#{activeOrder.id}</span> · placed{' '}
                            {fmtDate(activeOrder.createdAt)}
                          </p>
                        </div>
                        <StatusBadge status={activeOrder.status} />
                      </div>
                      <div className="px-5 sm:px-6 py-6">
                        <div className="relative">
                          <div className="absolute top-3 left-[10%] right-[10%] h-0.5 bg-[#EADFD0]" />
                          <div
                            className="absolute top-3 left-[10%] h-0.5 bg-[#6B1028]"
                            style={{ width: `${(cur / (STEPS.length - 1)) * 80}%` }}
                          />
                          <ol className="relative grid grid-cols-5 text-center text-[11px] sm:text-xs">
                            {STEPS.map((label, i) => (
                              <li key={label}>
                                {i < cur ? (
                                  <span className="mx-auto w-6 h-6 rounded-full bg-[#6B1028] text-[#FAF6F0] grid place-items-center">✓</span>
                                ) : i === cur ? (
                                  <span className="mx-auto w-6 h-6 rounded-full bg-[#6B1028] ring-4 ring-[#F5D9E0] grid place-items-center">
                                    <span className="w-2 h-2 bg-[#FAF6F0] rounded-full" />
                                  </span>
                                ) : (
                                  <span className="mx-auto w-6 h-6 rounded-full bg-white border-2 border-[#EADFD0] block" />
                                )}
                                <p className={`mt-2 ${i <= cur ? 'font-semibold' : 'text-[#5E4E52]'} ${i === cur ? 'text-[#6B1028]' : ''}`}>
                                  {label}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-[#FAF6F0] rounded-xl p-4">
                          <div className="text-sm">
                            <p className="text-[#5E4E52]">Expected delivery</p>
                            <p className="font-semibold">{activeOrder.status === 'out' ? 'Today' : '2–3 days'}</p>
                          </div>
                          <div className="text-sm">
                            <p className="text-[#5E4E52]">{activeOrder.paymentStatus === 'paid' ? 'Paid' : 'Pay on delivery'}</p>
                            <p className="font-semibold text-lg text-[#6B1028]">{taka(activeOrder.total)}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openTracking(activeOrder.id)}
                            className="px-5 py-2.5 rounded-xl bg-[#1C1215] text-[#FAF6F0] text-sm font-semibold hover:bg-[#6B1028] transition cursor-pointer"
                          >
                            Track Order
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="grid xl:grid-cols-[1fr_320px] gap-6">
                  {/* Recent orders */}
                  <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)]">
                    <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EADFD0]">
                      <h2 className="font-serif text-xl">Recent Orders</h2>
                      <button
                        type="button"
                        onClick={() => switchTab('orders')}
                        className="text-sm font-semibold text-[#6B1028] hover:underline cursor-pointer"
                      >
                        View all
                      </button>
                    </div>
                    <div className="divide-y divide-[#EADFD0]">
                      {!ordersLoading && orders.length === 0 && (
                        <p className="px-6 py-8 text-center text-sm text-[#5E4E52]">You haven&apos;t placed any orders yet.</p>
                      )}
                      {orders.slice(0, 4).map((o) => (
                        <div key={o.id} className="flex items-center gap-4 px-5 sm:px-6 py-4">
                          <ItemThumb image={o.items[0]?.image} />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {o.items[0].name}
                              {o.items.length > 1 && (
                                <span className="text-[#5E4E52] font-normal"> +{o.items.length - 1} more</span>
                              )}
                            </p>
                            <p className="text-xs text-[#5E4E52] mt-0.5">
                              #{o.id} · {fmtDate(o.createdAt)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold">{taka(o.total)}</p>
                            <div className="mt-1">
                              <StatusBadge status={o.status} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Default address */}
                  {defaultAddress && (
                    <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-5 sm:p-6 h-fit">
                      <div className="flex items-center justify-between">
                        <h2 className="font-serif text-xl">Default Address</h2>
                        <button
                          type="button"
                          onClick={() => switchTab('addresses')}
                          className="text-sm font-semibold text-[#6B1028] hover:underline cursor-pointer"
                        >
                          Manage
                        </button>
                      </div>
                      <div className="mt-4 text-sm leading-relaxed">
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider bg-[#FBEEF1] text-[#6B1028] px-2 py-0.5 rounded">
                          {defaultAddress.label}
                        </span>
                        <p className="font-semibold mt-2">{defaultAddress.name}</p>
                        <p className="text-[#5E4E52]">{defaultAddress.phone}</p>
                        <p className="text-[#5E4E52] mt-1">
                          {defaultAddress.address}, {defaultAddress.area}, {defaultAddress.district}
                        </p>
                      </div>
                      <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#FAF6F0] p-3">
                        <ShieldCheck className="w-5 h-5 text-[#B8955A] shrink-0 mt-0.5" strokeWidth={1.7} />
                        <p className="text-xs text-[#5E4E52] leading-relaxed">
                          All parcels are packed discreetly with no product name on the outside.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= ORDERS ================= */}
            {tab === 'orders' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl">My Orders</h2>
                    <p className="text-sm text-[#5E4E52]">View and track all your orders</p>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5E4E52]" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search by order ID or product"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#EADFD0] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                    />
                  </div>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {FILTER_OPTIONS.map(([key, label]) => {
                    const count =
                      key === 'all' ? orders.length : orders.filter((o) => o.status === key).length
                    const on = key === activeFilter
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveFilter(key)}
                        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition cursor-pointer ${
                          on
                            ? 'bg-[#6B1028] text-[#FAF6F0] border-[#6B1028]'
                            : 'bg-white text-[#5E4E52] border-[#EADFD0] hover:text-[#1C1215]'
                        }`}
                      >
                        {label}{' '}
                        <span className={on ? 'text-[#FAF6F0]/80' : 'text-[#5E4E52]/70'}>{count}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Orders list */}
                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-[#EADFD0] p-10 text-center">
                    <p className="font-serif text-xl">No orders found</p>
                    <p className="text-sm text-[#5E4E52] mt-1">Try a different filter or search term.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((o) => {
                      const trackable = !['cancelled', 'returned'].includes(o.status)
                      return (
                        <article
                          key={o.id}
                          className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] overflow-hidden"
                        >
                          <header className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 bg-[#FAF6F0]/60 border-b border-[#EADFD0]">
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                              <span className="font-semibold">#{o.id}</span>
                              <span className="text-[#5E4E52]">{fmtDate(o.createdAt)}</span>
                              <span className="text-[#5E4E52]">{payLabel(o)}</span>
                            </div>
                            <StatusBadge status={o.status} />
                          </header>
                          <div className="px-5 sm:px-6 py-4 space-y-3">
                            {o.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-4">
                                <ItemThumb image={it.image} size="w-14 h-14" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{it.name}</p>
                                  <p className="text-xs text-[#5E4E52]">
                                    Qty {it.qty}
                                    {it.size ? ` · ${it.size}` : ''}
                                  </p>
                                </div>
                                <p className="font-medium">{taka(it.price * it.qty)}</p>
                              </div>
                            ))}
                          </div>
                          <footer className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-[#EADFD0]">
                            <p className="text-sm text-[#5E4E52]">
                              Total{' '}
                              <span className="font-semibold text-lg text-[#1C1215] ml-1">{taka(o.total)}</span>{' '}
                              <span className="text-xs">(incl. ৳{o.shipping} delivery)</span>
                            </p>
                            <div className="flex gap-2">
                              {o.status === 'pending' && (
                                <a
                                  href={`https://wa.me/8801700000000?text=${encodeURIComponent(`I want to cancel order #${o.id}`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50 cursor-pointer"
                                >
                                  Cancel
                                </a>
                              )}
                              {trackable ? (
                                <button
                                  type="button"
                                  onClick={() => openTracking(o.id)}
                                  className="px-4 py-2 rounded-xl bg-[#1C1215] text-[#FAF6F0] text-sm font-semibold hover:bg-[#6B1028] transition cursor-pointer"
                                >
                                  Track Order
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openTracking(o.id)}
                                  className="px-4 py-2 rounded-xl border border-[#EADFD0] text-sm font-semibold hover:bg-[#FAF6F0] cursor-pointer"
                                >
                                  View Details
                                </button>
                              )}
                            </div>
                          </footer>
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ================= TRACKING ================= */}
            {tab === 'tracking' && (
              <div className="space-y-6">
                <div className="bg-[#24171B] text-[#FAF6F0] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                  <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#6B1028]/40 blur-2xl" />
                  <div className="relative">
                    <h2 className="font-serif text-2xl sm:text-3xl">Track Your Order</h2>
                    <p className="text-sm text-[#FAF6F0]/75 mt-1">
                      Enter your order ID to see live delivery status.
                    </p>
                    <form onSubmit={handleTrackSubmit} className="mt-5 flex flex-col sm:flex-row gap-3 max-w-xl">
                      <input
                        type="text"
                        value={trackInput}
                        onChange={(e) => setTrackInput(e.target.value)}
                        placeholder={orders[0]?.id ? `e.g. ${orders[0].id}` : 'Order ID'}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/15 placeholder:text-[#FAF6F0]/50 text-[#FAF6F0] text-sm focus:outline-none focus:border-[#B8955A]"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-[#B8955A] text-[#140C0F] font-semibold text-sm hover:bg-[#E9D9BC] transition cursor-pointer"
                      >
                        Track
                      </button>
                    </form>
                    {trackError && (
                      <p className="text-sm text-red-300 mt-3">
                        We couldn&apos;t find that order in your account. Please check the ID and try again.
                      </p>
                    )}
                  </div>
                </div>

                {trackedOrder && (
                  <div className="grid xl:grid-cols-[1fr_340px] gap-6">
                    <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)]">
                      <div className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-5 border-b border-[#EADFD0]">
                        <div>
                          <p className="text-sm text-[#5E4E52]">Order</p>
                          <p className="font-serif text-2xl">#{trackedOrder.id}</p>
                          <p className="text-sm text-[#5E4E52] mt-1">Placed on {fmtDate(trackedOrder.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={trackedOrder.status} />
                          <p className="text-sm mt-2">
                            {trackedOrder.status === 'delivered' ? (
                              `Delivered on ${fmtDate(trackedOrder.courier.deliveredAt || trackedOrder.updatedAt)}`
                            ) : (
                              <>
                                Expected:{' '}
                                <span className="font-semibold">
                                  {trackedOrder.status === 'out' ? 'Today' : ['cancelled', 'returned'].includes(trackedOrder.status) ? '—' : '2–3 days'}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-px bg-[#EADFD0] border-b border-[#EADFD0]">
                        <div className="bg-white px-5 sm:px-6 py-4">
                          <p className="text-xs text-[#5E4E52]">Courier</p>
                          <p className="font-semibold mt-0.5">{courierName(trackedOrder)}</p>
                        </div>
                        <div className="bg-white px-5 sm:px-6 py-4">
                          <p className="text-xs text-[#5E4E52]">Consignment ID</p>
                          <p className="font-semibold mt-0.5 break-all">{trackedOrder.courier.consignmentId || '—'}</p>
                        </div>
                        <div className="bg-white px-5 sm:px-6 py-4">
                          <p className="text-xs text-[#5E4E52]">Payment</p>
                          <p className="font-semibold mt-0.5">{payLabel(trackedOrder)}</p>
                        </div>
                      </div>
                      <div className="px-5 sm:px-6 py-6">
                        <h3 className="font-serif text-lg mb-5">Delivery Progress</h3>
                        <ol>
                          {TRACK_STEPS.map((s, i) => {
                            const cur = STATUS_META[trackedOrder.status].step
                            const time = stepTimes(trackedOrder)[i]
                            const doneAll = trackedOrder.status === 'delivered'
                            const done = i < cur || doneAll
                            const active = i === cur && !doneAll
                            return (
                              <li key={s.t} className="relative pb-7 last:pb-0">
                                {i < TRACK_STEPS.length - 1 && (
                                  <span
                                    className={`absolute left-4 top-8 -ml-px h-full w-0.5 ${
                                      i < cur || doneAll ? 'bg-[#6B1028]' : 'bg-[#EADFD0]'
                                    }`}
                                  />
                                )}
                                <div className="relative flex gap-4">
                                  {done ? (
                                    <span className="w-8 h-8 rounded-full bg-[#6B1028] text-[#FAF6F0] grid place-items-center text-sm shrink-0">
                                      ✓
                                    </span>
                                  ) : active ? (
                                    <span className="w-8 h-8 rounded-full bg-[#6B1028] ring-4 ring-[#F5D9E0] grid place-items-center shrink-0">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#FAF6F0]" />
                                    </span>
                                  ) : (
                                    <span className="w-8 h-8 rounded-full border-2 border-[#EADFD0] bg-white shrink-0" />
                                  )}
                                  <div className="flex-1 pt-1">
                                    <div className="flex flex-wrap justify-between gap-x-4">
                                      <p
                                        className={`font-semibold ${!done && !active ? 'text-[#5E4E52]' : ''} ${
                                          active ? 'text-[#6B1028]' : ''
                                        }`}
                                      >
                                        {s.t}
                                      </p>
                                      <p className="text-xs text-[#5E4E52]">
                                        {done || active ? time : 'Pending'}
                                      </p>
                                    </div>
                                    <p className="text-sm text-[#5E4E52] mt-0.5">{s.d}</p>
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {trackedOrder.courier.status && (
                        <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-5">
                          <p className="text-xs uppercase tracking-wider font-bold text-[#B8955A]">Courier Update</p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="w-11 h-11 rounded-full bg-[#EADFD0] grid place-items-center">
                              <Truck className="w-5 h-5 text-[#6B1028]" strokeWidth={1.7} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold">{trackedOrder.courier.status}</p>
                              <p className="text-sm text-[#5E4E52]">
                                {courierName(trackedOrder)} · {fmtDateTime(trackedOrder.courier.lastEventAt)}
                              </p>
                            </div>
                            <a
                              href="tel:+8801700000000"
                              className="w-10 h-10 rounded-full bg-[#6B1028] text-[#FAF6F0] grid place-items-center hover:bg-[#4E0B1D]"
                              aria-label="Call support"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}

                      {trackedOrder.shippingInfo && (
                        <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-5">
                          <p className="text-xs uppercase tracking-wider font-bold text-[#B8955A]">Delivery Address</p>
                          <p className="font-semibold mt-3">{trackedOrder.shippingInfo.fullName}</p>
                          <p className="text-sm text-[#5E4E52]">{trackedOrder.shippingInfo.phone}</p>
                          <p className="text-sm text-[#5E4E52] mt-1">
                            {[trackedOrder.shippingInfo.address, trackedOrder.shippingInfo.thana, trackedOrder.shippingInfo.district]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        </div>
                      )}

                      <div className="bg-white rounded-2xl border border-[#EADFD0] shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-5">
                        <p className="text-xs uppercase tracking-wider font-bold text-[#B8955A]">Order Summary</p>
                        <div className="mt-3 space-y-3">
                          {trackedOrder.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              <ItemThumb image={it.image} size="w-10 h-10" />
                              <p className="text-sm flex-1">
                                {it.name} <span className="text-[#5E4E52]">× {it.qty}</span>
                              </p>
                              <p className="text-sm font-medium">{taka(it.price * it.qty)}</p>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#EADFD0] space-y-1.5 text-sm">
                          <div className="flex justify-between text-[#5E4E52]">
                            <span>Subtotal</span>
                            <span>
                              {taka(trackedOrder.subtotal)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[#5E4E52]">
                            <span>Delivery</span>
                            <span>{taka(trackedOrder.shipping)}</span>
                          </div>
                          {trackedOrder.discount > 0 && (
                            <div className="flex justify-between text-emerald-700">
                              <span>Discount</span>
                              <span>−{taka(trackedOrder.discount)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-semibold pt-1.5">
                            <span>{trackedOrder.status === 'delivered' || trackedOrder.paymentStatus === 'paid' ? 'Paid' : 'Pay on delivery'}</span>
                            <span className="text-lg text-[#6B1028]">{taka(trackedOrder.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================= ADDRESSES ================= */}
            {tab === 'addresses' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl">Delivery Addresses</h2>
                    <p className="text-sm text-[#5E4E52]">Manage where your orders are delivered</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddressModal()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6B1028] text-[#FAF6F0] text-sm font-semibold hover:bg-[#4E0B1D] transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.2} />
                    Add New Address
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`bg-white rounded-2xl border ${
                        a.isDefault ? 'border-[#6B1028] ring-1 ring-[#6B1028]/20' : 'border-[#EADFD0]'
                      } shadow-[0_1px_2px_rgba(28,18,21,.04),0_8px_24px_-12px_rgba(28,18,21,.12)] p-5 flex flex-col`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider bg-[#FBEEF1] text-[#6B1028] px-2 py-0.5 rounded">
                            {a.label}
                          </span>
                          {a.isDefault && (
                            <span className="text-[11px] font-bold uppercase tracking-wider bg-[#1C1215] text-[#FAF6F0] px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openAddressModal(a)}
                            className="p-2 rounded-lg text-[#5E4E52] hover:bg-[#FAF6F0] hover:text-[#1C1215] cursor-pointer"
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {!a.isDefault && (
                            <button
                              type="button"
                              onClick={() => deleteAddress(a.id)}
                              className="p-2 rounded-lg text-[#5E4E52] hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold mt-4">{a.name}</p>
                      <p className="text-sm text-[#5E4E52]">{a.phone}</p>
                      <p className="text-sm text-[#5E4E52] mt-2 leading-relaxed flex-1">
                        {a.address}, {a.area}
                        <br />
                        {a.district}, {a.division} Division
                      </p>
                      {!a.isDefault ? (
                        <button
                          type="button"
                          onClick={() => setDefaultAddress(a.id)}
                          className="mt-4 self-start text-sm font-semibold text-[#6B1028] hover:underline cursor-pointer"
                        >
                          Set as default
                        </button>
                      ) : (
                        <p className="mt-4 text-xs text-[#5E4E52]">Used for new orders automatically</p>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => openAddressModal()}
                    className="rounded-2xl border-2 border-dashed border-[#EADFD0] hover:border-[#6B1028]/40 hover:bg-white transition p-5 min-h-[200px] grid place-items-center text-[#5E4E52] hover:text-[#6B1028] cursor-pointer"
                  >
                    <span className="flex flex-col items-center gap-2 text-sm font-semibold">
                      <span className="w-10 h-10 rounded-full bg-[#F4EDE3] grid place-items-center">
                        <Plus className="w-5 h-5" />
                      </span>
                      Add New Address
                    </span>
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ============ ADDRESS MODAL ============ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-[#140C0F]/60" onClick={() => setModalOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EADFD0] sticky top-0 bg-white">
              <h3 className="font-serif text-xl">{editingId !== null ? 'Edit Address' : 'Add New Address'}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF6F0] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveAddress} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold">Full Name</span>
                  <input
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#EADFD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                    placeholder="Your name"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">Phone Number</span>
                  <input
                    required
                    value={formState.phone}
                    onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#EADFD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                    placeholder="01XXXXXXXXX"
                  />
                </label>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-semibold">Division</span>
                  <select
                    value={formState.division}
                    onChange={(e) => setFormState((s) => ({ ...s, division: e.target.value }))}
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#EADFD0] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                  >
                    {DIVISIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold">District</span>
                  <input
                    required
                    value={formState.district}
                    onChange={(e) => setFormState((s) => ({ ...s, district: e.target.value }))}
                    className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#EADFD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                    placeholder="e.g. Dhaka"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-semibold">Area / Thana</span>
                <input
                  required
                  value={formState.area}
                  onChange={(e) => setFormState((s) => ({ ...s, area: e.target.value }))}
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#EADFD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                  placeholder="e.g. Mirpur 10"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Full Address</span>
                <textarea
                  rows={2}
                  required
                  value={formState.address}
                  onChange={(e) => setFormState((s) => ({ ...s, address: e.target.value }))}
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-[#EADFD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B1028]/20 focus:border-[#6B1028]"
                  placeholder="House, road, block, landmark"
                />
              </label>
              <div>
                <span className="text-sm font-semibold">Label</span>
                <div className="mt-1.5 flex gap-2">
                  {(['Home', 'Office', 'Other'] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormState((s) => ({ ...s, label: lbl }))}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer transition ${
                        formState.label === lbl
                          ? 'border-[#6B1028] bg-[#FBEEF1] text-[#6B1028]'
                          : 'border-[#EADFD0] text-[#1C1215]'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.isDefault}
                  onChange={(e) => setFormState((s) => ({ ...s, isDefault: e.target.checked }))}
                  className="w-4 h-4 accent-[#6B1028]"
                />
                <span className="text-sm">Set as default delivery address</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[#EADFD0] text-sm font-semibold hover:bg-[#FAF6F0] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddresses}
                  className="flex-1 py-3 rounded-xl bg-[#6B1028] text-[#FAF6F0] text-sm font-semibold hover:bg-[#4E0B1D] cursor-pointer disabled:opacity-60"
                >
                  {savingAddresses ? 'Saving…' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
