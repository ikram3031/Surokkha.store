import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadLastOrder } from '@/lib/checkout'
import { bn, taka } from '@/lib/bn'
import { navigate } from '@/lib/router'

export function ConfirmationPage() {
  const order = loadLastOrder()

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center md:py-16">
      <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
      <h1 className="mt-4 font-display text-2xl font-bold md:text-3xl">অর্ডার সম্পন্ন হয়েছে!</h1>
      <p className="mt-2 text-muted-foreground">ধন্যবাদ। আমাদের প্রতিনিধি শীঘ্রই কনফার্ম করতে ফোন করবেন।</p>

      {order && (
        <div className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 text-left">
          {order.orderNumber && (
            <p className="text-center">
              অর্ডার নম্বর: <span className="font-display text-lg font-bold text-primary">{order.orderNumber}</span>
            </p>
          )}
          <ul className="space-y-1 text-sm">
            {order.items.map((item) => (
              <li key={item.name} className="flex justify-between gap-4">
                <span>
                  {item.name} × {bn(item.qty)}
                </span>
                <span>{taka(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ডেলিভারি চার্জ</dt>
              <dd>{order.shipping ? taka(order.shipping) : 'ফ্রি'}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">ছাড়</dt>
                <dd>−{taka(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <dt>মোট (ক্যাশ অন ডেলিভারি)</dt>
              <dd>{taka(order.total)}</dd>
            </div>
          </dl>
          <div className="border-t border-border pt-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{order.name}</p>
            <p>{order.phone}</p>
            <p>
              {order.address}
              {order.thana ? `, ${order.thana}` : ''}, {order.district}
            </p>
          </div>
        </div>
      )}

      <Button className="mt-8 rounded-full" size="lg" onClick={() => navigate('/')}>
        আরও কেনাকাটা করুন
      </Button>
    </div>
  )
}
