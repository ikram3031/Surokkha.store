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
        className="max-w-sm rounded-3xl text-center [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <LogoMark className="mx-auto h-14 w-14" />
        <DialogTitle className="mt-3 font-display text-2xl font-bold">
          Are you 18 or older?
        </DialogTitle>
        <DialogDescription className="mt-2 text-muted-foreground">
          Products on this site are for adults only.
        </DialogDescription>
        <div className="mt-6 flex flex-col gap-3">
          <Button className="rounded-full" onClick={confirm}>
            Yes, I'm 18 or older
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setDeclined(true)}>
            No
          </Button>
        </div>
        {declined && (
          <p className="mt-4 text-sm text-primary">
            Sorry, please come back when you are an adult.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
