import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CartItem } from '@/components/cart/CartItem'
import { taka } from '@/lib/bn'
import { useCart } from '@/context/CartContext'
import { navigate } from '@/lib/router'

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { cart, count, subtotal, shipping, total, freeShipNote } = useCart()
  const lines = Object.values(cart)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-xl">আপনার কার্ট</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {count === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p>আপনার কার্ট খালি।</p>
              <Button className="mt-4 rounded-full" onClick={() => onOpenChange(false)}>
                পণ্য দেখুন
              </Button>
            </div>
          ) : (
            lines.map((line) => (
              <CartItem key={line.product.id} product={line.product} qty={line.qty} />
            ))
          )}
        </div>

        <div className="border-t border-border bg-card px-5 py-4">
          {freeShipNote && <p className="mb-3 text-sm text-muted-foreground">{freeShipNote}</p>}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">সাবটোটাল</dt>
              <dd>{taka(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">ডেলিভারি চার্জ</dt>
              <dd>{shipping ? taka(shipping) : 'ফ্রি'}</dd>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between text-base font-bold">
              <dt>মোট</dt>
              <dd>{taka(total)}</dd>
            </div>
          </dl>
          <Button
            className="mt-4 w-full rounded-full"
            disabled={count === 0}
            onClick={() => {
              onOpenChange(false)
              navigate('/checkout')
            }}
          >
            অর্ডার করুন
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
