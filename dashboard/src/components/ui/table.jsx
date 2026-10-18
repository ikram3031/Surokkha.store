import * as React from "react"

import { cn } from "@/lib/utils"
import styles from "@/styles/styles.json"

// Renders the data table container on the theme background, recessed below card surfaces in dark mode
const Table = ({ className, ...props }) => {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto bg-background text-foreground"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

// Renders the table header with a subtle muted band
const TableHeader = ({ className, ...props }) => {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        styles.table.header,
        className
      )}
      {...props}
    />
  )
}

// Renders the table body on the theme background
const TableBody = ({ className, ...props }) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        className
      )}
      {...props}
    />
  )
}

// Renders the table footer with muted background
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

// Renders a table row with subtle hover state
const TableRow = ({ className, ...props }) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        styles.table.row,
        className
      )}
      {...props}
    />
  )
}

// Renders a table header cell with small uppercase muted label
const TableHead = ({ className, ...props }) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        styles.table.head,
        className
      )}
      {...props}
    />
  )
}

// Renders a table data cell
const TableCell = ({ className, ...props }) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        styles.table.cell,
        className
      )}
      {...props}
    />
  )
}

// Renders the table caption with muted styling
const TableCaption = ({
  className,
  ...props
}) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
