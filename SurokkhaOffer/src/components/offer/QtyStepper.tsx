import { Minus, Plus } from 'lucide-react'
import { bn } from '@/lib/bn'

interface Props {
  value: number
  onDec: () => void
  onInc: () => void
  label: string
}

export function QtyStepper({ value, onDec, onInc, label }: Props) {
  return (
    <div className="flex items-center justify-between rounded-full border border-gray-200 bg-white p-1">
      <button
        type="button"
        onClick={onDec}
        disabled={value === 0}
        aria-label={`${label} কমান`}
        className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-gray-100 disabled:hover:text-primary"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-8 text-center font-semibold tabular-nums">{bn(value)}</span>
      <button
        type="button"
        onClick={onInc}
        aria-label={`${label} বাড়ান`}
        className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90"
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}
