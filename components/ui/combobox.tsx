"use client"

import * as React from "react"
import { Checkmark, ChevronSort } from "@carbon/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  searchLabel?: string
  icon?: React.ReactNode
}

export interface ComboboxGroup {
  heading: string
  options: ComboboxOption[]
}

interface ComboboxProps {
  options?: ComboboxOption[]
  groups?: ComboboxGroup[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  /** Accessible name for the trigger. Defaults to `placeholder`. */
  ariaLabel?: string
}

export function Combobox({
  options,
  groups,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled,
  ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const allOptions = React.useMemo(
    () => groups ? groups.flatMap((g) => g.options) : (options ?? []),
    [groups, options]
  )

  const selectedLabel = React.useMemo(
    () => allOptions.find((opt) => opt.value === value)?.label,
    [allOptions, value]
  )

  const renderOption = (option: ComboboxOption) => (
    <CommandItem
      key={option.value}
      value={option.searchLabel ?? option.label}
      onSelect={() => {
        onValueChange(option.value === value ? "" : option.value)
        setOpen(false)
      }}
    >
      {option.icon ?? (
        <Checkmark
          className={cn(
            "mr-2 h-4 w-4",
            value === option.value ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {option.label}
    </CommandItem>
  )

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          // `combobox` is not a name-from-content role, so without this the
          // trigger has NO accessible name — a screen reader announces nothing,
          // and getByRole("combobox", { name }) matches nothing.
          aria-label={ariaLabel ?? placeholder}
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronSort className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" matchTriggerWidth>
        <Command filter={(value, search) =>
          value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
        }>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {groups ? (
              groups.map((group) => (
                <CommandGroup key={group.heading} heading={group.heading}>
                  {group.options.map(renderOption)}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup>
                {(options ?? []).map(renderOption)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
