import * as React from "react"
import { AlertCircle, MoreHorizontal, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Table V2: the look of the orders View2 table (primary-tinted header, primary header text,
// compact rows, primary-tinted selected rows). Same API as ui/table, so it is a drop-in swap.

// Scroll container plus the table element
const Table = ({ className, ...props }) => {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto bg-background text-foreground"
    >
      <table
        data-slot="table"
        data-version="2"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

// Primary-tinted header band
const TableHeader = ({ className, ...props }) => {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-primary/10 dark:bg-primary/15 [&_tr]:border-b [&_tr]:border-primary/20 [&_tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

const TableBody = ({ className, ...props }) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

const TableFooter = ({ className, ...props }) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

// Row with hover state; selected rows (data-state="selected") get a primary tint
const TableRow = ({ className, ...props }) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/40 has-aria-expanded:bg-muted/40 data-[state=selected]:bg-primary/5 data-[state=selected]:hover:bg-primary/10",
        className
      )}
      {...props}
    />
  )
}

// Header cell: small uppercase label in the primary color
const TableHead = ({ className, ...props }) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap text-primary dark:text-foreground/90 [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

// Data cell with compact vertical padding
const TableCell = ({ className, ...props }) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

const TableCaption = ({ className, ...props }) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

// Full-width row for "nothing found" messages
const TableEmpty = ({ colSpan, className, children }) => {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className={cn("h-28 text-center text-muted-foreground", className)}>
        {children}
      </TableCell>
    </TableRow>
  )
}

// Error box shown in place of the table when loading fails
const TableError = ({ title = "Error", children, className }) => {
  return (
    <Alert variant="destructive" className={cn("m-4 w-auto", className)}>
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

// "⋯" row actions menu. Children are DropdownMenuItem / DropdownMenuSeparator.
// Clicks inside it don't trigger the row's own onClick.
const TableRowActions = ({ label = "Actions", children }) => {
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={label}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Checkbox used for row and "select all on page" selection
const TableCheckbox = ({ checked, indeterminate = false, onChange, label = "Select" }) => {
  const ref = React.useRef(null)
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked
  }, [indeterminate, checked])
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      className="size-4 cursor-pointer rounded border-border accent-primary"
      checked={checked}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.checked)}
    />
  )
}

// Selection state for a table page: ids, toggles and a page-level select all
const useTableSelection = (rows = [], getId = (r) => r._id ?? r.id) => {
  const [selected, setSelected] = React.useState([])
  const pageIds = rows.map(getId)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const someOnPage = pageIds.some((id) => selected.includes(id))
  return {
    selected,
    count: selected.length,
    clear: () => setSelected([]),
    isSelected: (id) => selected.includes(id),
    toggle: (id, on) =>
      setSelected((prev) => (on ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id))),
    allOnPage,
    someOnPage,
    togglePage: (on) =>
      setSelected((prev) =>
        on ? Array.from(new Set([...prev, ...pageIds])) : prev.filter((id) => !pageIds.includes(id))
      ),
  }
}

// Bar shown above a table while rows are selected: count, extra actions, delete, clear
const TableBulkBar = ({ count, onDelete, onClear, deleting = false, deleteLabel = "Delete", children }) => {
  if (!count) return null
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
      <span className="font-medium">{count} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            {deleting ? "Deleting..." : deleteLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

// Flatten fragments so every action button becomes one menu row
const flattenActions = (children) =>
  React.Children.toArray(children).flatMap((c) =>
    React.isValidElement(c) && c.type === React.Fragment ? flattenActions(c.props.children) : c
  ).filter((c) => React.isValidElement(c))

const ACTION_ROW =
  "!h-8 !w-full !justify-start !gap-2 !rounded-md !border-0 !bg-transparent !px-2 !text-sm !font-normal !shadow-none hover:!bg-accent [&_svg]:!size-4"

// "⋯" menu that takes ordinary icon buttons/links (with a title) and lists them as labelled rows.
// Lets a table swap its side-by-side buttons for one menu without rewriting each action.
const TableActionMenu = ({ label = "Actions", children }) => {
  const [open, setOpen] = React.useState(false)
  const items = flattenActions(children)
  if (!items.length) return null
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={label}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <div
            className="flex flex-col"
            onClickCapture={() => setTimeout(() => setOpen(false), 0)}
          >
            {items.map((el, i) => {
              const text = el.props.title || el.props["aria-label"] || ""
              return React.cloneElement(
                el,
                { key: el.key ?? i, className: cn(el.props.className, ACTION_ROW) },
                <>
                  {el.props.children}
                  {text && <span>{text}</span>}
                </>
              )
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export {
  TableActionMenu,
  TableCheckbox,
  useTableSelection,
  TableBulkBar,
  TableRowActions,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
  TableError,
}
