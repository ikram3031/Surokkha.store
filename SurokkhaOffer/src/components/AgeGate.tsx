import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/icons/ArtIcons'
import { useAgeGate } from '@/hooks/useAgeGate'

export function AgeGate() {
  const { verified, confirm } = useAgeGate()
  const [declined, setDeclined] = useState(false)

  return (
    <Dialog open={!verified}>
      <DialogContent
        className="offer-font max-w-sm rounded-3xl bg-white text-center [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <LogoMark className="mx-auto h-14 w-14" />
        <DialogTitle className="mt-3 font-display text-2xl font-bold">
          আপনার বয়স কি ১৮ বা তার বেশি?
        </DialogTitle>
        <DialogDescription className="mt-2 text-muted-foreground">
          এই সাইটের পণ্য শুধুমাত্র প্রাপ্তবয়স্কদের জন্য।
        </DialogDescription>
        <div className="mt-6 flex flex-col gap-3">
          <Button className="rounded-full focus-visible:ring-0 focus-visible:border-transparent" onClick={confirm}>
            হ্যাঁ, আমার বয়স ১৮ বা বেশি
          </Button>
          <Button className="rounded-full bg-red-600 text-white hover:bg-red-700 focus-visible:ring-0" onClick={() => setDeclined(true)}>
            না
          </Button>
        </div>
        {declined && (
          <p className="mt-4 text-sm text-primary">
            দুঃখিত, প্রাপ্তবয়স্ক হওয়ার পর আবার আসুন।
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
