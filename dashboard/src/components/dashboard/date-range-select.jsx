import * as React from "react"
import { useTranslation } from "react-i18next"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"]

export const CUSTOM_RANGE = "custom"

export const DEFAULT_RANGE_PRESETS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "month", label: "This month" },
  { id: "7", label: "Last 7 days" },
  { id: "15", label: "Last 15 days" },
  { id: "30", label: "Last 30 days" },
  { id: CUSTOM_RANGE, label: "Custom range" },
]

// Dates travel as "YYYY-MM-DD" strings (Asia/Dhaka days) so no timezone shifting can creep in
const pad = (n) => String(n).padStart(2, "0")
const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

export const todayInDhaka = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" })

const formatDay = (s, withYear) =>
  new Date(parse(s)).toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}), timeZone: "UTC" })

export const formatRangeLabel = (from, to) => {
  if (!from || !to) return ""
  if (from === to) return formatDay(from, true)
  const sameYear = from.slice(0, 4) === to.slice(0, 4)
  return `${formatDay(from, !sameYear)} – ${formatDay(to, true)}`
}

// Sunday-first grid for one month: leading blanks, then each day as a date string
const buildMonth = (year, month) => {
  const lead = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => toStr(year, month, i + 1))]
}

const monthTitle = (year, month) =>
  new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })

// Shifts a { year, month } pair by n months
const shiftMonth = ({ year, month }, n) => {
  const d = new Date(Date.UTC(year, month + n, 1))
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() }
}

const MonthGrid = ({ year, month, start, end, hover, today, onPick, onHover }) => {
  const cells = buildMonth(year, month)
  // While only the first day is picked, preview the range up to the hovered day
  const previewEnd = end || (start && hover && hover >= start ? hover : null)

  return (
    <div className="w-full">
      <div className="mb-2 text-center text-sm font-medium">{monthTitle(year, month)}</div>
      <div className="grid grid-cols-7 text-center text-[11px] text-muted-foreground">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`b${i}`} />
          const disabled = day > today
          const isStart = day === start
          const isEnd = day === (end || previewEnd)
          const inRange = start && previewEnd && day > start && day < previewEnd
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onPick(day)}
              onMouseEnter={() => onHover(day)}
              className={cn(
                "relative h-9 text-sm tabular-nums outline-none transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring",
                disabled && "cursor-not-allowed opacity-30",
                !disabled && !isStart && !isEnd && !inRange && "rounded-md hover:bg-muted",
                inRange && "bg-primary/15",
                (isStart || isEnd) && "bg-primary font-semibold text-primary-foreground",
                isStart && "rounded-l-md",
                isEnd && "rounded-r-md",
                isStart && !previewEnd && "rounded-md",
                day === today && !isStart && !isEnd && "font-semibold text-primary"
              )}
            >
              {Number(day.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Modal with a two-month calendar: click the first day, then the last day, then Apply
export const DateRangeDialog = ({ open, onOpenChange, from, to, onApply, maxDays = 92, title, description }) => {
  const { t } = useTranslation()
  const today = todayInDhaka()
  const [start, setStart] = React.useState(null)
  const [end, setEnd] = React.useState(null)
  const [hover, setHover] = React.useState(null)
  const [view, setView] = React.useState({ year: 0, month: 0 })

  // Every time the dialog opens, start from the currently applied range
  React.useEffect(() => {
    if (!open) return
    setStart(from || null)
    setEnd(to || null)
    setHover(null)
    // Left calendar = month before the one being shown on the right, so the latest days are always visible
    const anchor = parse(to || today)
    const d = new Date(anchor)
    setView(shiftMonth({ year: d.getUTCFullYear(), month: d.getUTCMonth() }, -1))
  }, [open])

  const todayParts = { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }
  const right = shiftMonth(view, 1)
  const canGoNext = right.year < todayParts.year || (right.year === todayParts.year && right.month < todayParts.month)

  const pick = (day) => {
    if (!start || end) {
      setStart(day)
      setEnd(null)
    } else if (day < start) {
      setStart(day)
    } else {
      setEnd(day)
    }
  }

  const finalEnd = end || start
  const spanDays = start ? Math.round((parse(finalEnd) - parse(start)) / DAY_MS) + 1 : 0
  const tooLong = spanDays > maxDays

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title || t("date_range.title", "Select date range")}</DialogTitle>
          <DialogDescription>
            {description || t("date_range.hint", "Click the first day, then the last day.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-2" onMouseLeave={() => setHover(null)}>
          <Button type="button" variant="outline" size="icon" className="mt-0.5 shrink-0" onClick={() => setView(shiftMonth(view, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <div className="grid min-w-0 flex-1 gap-6 sm:grid-cols-2">
            <MonthGrid {...view} start={start} end={end} hover={hover} today={today} onPick={pick} onHover={setHover} />
            <div className="hidden sm:block">
              <MonthGrid {...right} start={start} end={end} hover={hover} today={today} onPick={pick} onHover={setHover} />
            </div>
          </div>
          <Button type="button" variant="outline" size="icon" className="mt-0.5 shrink-0" disabled={!canGoNext} onClick={() => setView(shiftMonth(view, 1))}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {start ? formatRangeLabel(start, finalEnd) : t("date_range.none", "No dates selected")}
          </span>
          <span className={cn("text-xs", tooLong ? "text-destructive" : "text-muted-foreground")}>
            {tooLong
              ? t("date_range.too_long", "Pick at most {{n}} days", { n: maxDays })
              : start && t("date_range.days", "{{n}} days", { n: spanDays })}
          </span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button type="button" disabled={!start || tooLong} onClick={() => onApply({ from: start, to: finalEnd })}>
            {t("date_range.apply", "Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dropdown of range presets. Choosing "Custom range" opens the DateRangeDialog.
 * value:    { preset, from, to }   (from/to are "YYYY-MM-DD", only used when preset === "custom")
 * onChange: receives the next { preset, from, to }
 */
export const DateRangeSelect = ({ value, onChange, presets = DEFAULT_RANGE_PRESETS, maxDays = 92, className }) => {
  const { t } = useTranslation()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const isCustom = value.preset === CUSTOM_RANGE && value.from && value.to
  const labels = Object.fromEntries(presets.map((p) => [p.id, t(`date_range.${p.id}`, p.label)]))
  // The trigger shows the picked dates instead of "Custom range" once a custom range is applied
  const items = isCustom ? { ...labels, [CUSTOM_RANGE]: formatRangeLabel(value.from, value.to) } : labels

  const handleSelect = (preset) => {
    // Custom only becomes active after Apply, so cancelling the dialog keeps the previous range
    if (preset === CUSTOM_RANGE) setDialogOpen(true)
    else onChange({ ...value, preset })
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select value={value.preset} onValueChange={handleSelect} items={items}>
        <SelectTrigger className="w-48">
          <CalendarDays className="size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-48">
          {presets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {labels[p.id]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          {t("date_range.edit", "Edit dates")}
        </Button>
      )}

      <DateRangeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        from={value.from}
        to={value.to}
        maxDays={maxDays}
        onApply={({ from, to }) => {
          onChange({ preset: CUSTOM_RANGE, from, to })
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
