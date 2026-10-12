import * as React from "react"

import { cn } from "@/lib/utils"

// Renders the data table container with persistent light gray background
const Table = ({ className, ...props }) => {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-md overflow-hidden bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb] shadow-2xs"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm bg-[#f3f4f6] text-[#111827]", className)}
        {...props}
      />
    </div>
  )
}

// Renders the table header with primary accent branding
const TableHeader = ({ className, ...props }) => {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-primary text-primary-foreground [&_tr]:bg-primary [&_tr]:hover:bg-primary [&_tr]:border-b [&_tr]:border-primary/20",
        className
      )}
      {...props}
    />
  )
}

// Renders the table body with light gray background and subtle alternating rows
const TableBody = ({ className, ...props }) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "bg-[#f3f4f6] text-[#111827] [&_tr:last-child]:border-0 [&_tr:nth-child(even)]:bg-[#ffffff]/60",
        className
      )}
      {...props}
    />
  )
}

// Renders the table footer with light gray background
const TableFooter = ({ className, ...props }) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-[#e5e7eb] bg-[#e5e7eb]/50 font-medium text-[#111827] [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

// Renders a table row with subtle hover state and light gray border
const TableRow = ({ className, ...props }) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-[#e5e7eb] transition-colors hover:bg-[#e5e7eb] has-aria-expanded:bg-[#e5e7eb] data-[state=selected]:bg-[#e5e7eb]",
        className
      )}
      {...props}
    />
  )
}

// Renders a table header cell with semibold text
const TableHead = ({ className, ...props }) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-semibold whitespace-nowrap text-primary-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

// Renders a table data cell with crisp dark text
const TableCell = ({ className, ...props }) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap text-[#111827] [&:has([role=checkbox])]:pr-0",
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
      className={cn("mt-4 text-sm text-[#6b7280]", className)}
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
