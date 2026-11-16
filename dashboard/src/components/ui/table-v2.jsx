import * as React from "react"
import { AlertCircle, MoreHorizontal } from "lucide-react"

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

export {
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
