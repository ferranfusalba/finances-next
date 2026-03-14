"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      className={cn("p-3", className)}
      style={{ "--rdp-accent-color": "var(--color-foreground)" } as React.CSSProperties}
      classNames={{
        today: "bg-accent text-accent-foreground rounded-md",
        selected:
          "bg-primary text-primary-foreground rounded-md",
        disabled: "text-muted-foreground opacity-50",
        outside: "text-muted-foreground opacity-50",
        hidden: "invisible",
        chevron: defaultClassNames.chevron,
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
