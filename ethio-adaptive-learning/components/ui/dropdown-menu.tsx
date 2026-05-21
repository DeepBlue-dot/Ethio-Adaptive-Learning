import * as React from "react"
import * as RadixDropdown from "@radix-ui/react-dropdown-menu"

import { cn } from "@/lib/utils"

const DropdownMenu = RadixDropdown.Root

const DropdownMenuTrigger = RadixDropdown.Trigger

const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => (
  <RadixDropdown.Portal>{children}</RadixDropdown.Portal>
)

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RadixDropdown.Content>
>(({ className, sideOffset = 6, ...props }, ref) => {
  return (
    <DropdownMenuPortal>
      <RadixDropdown.Content
        ref={ref}
        sideOffset={sideOffset}
        align="start"
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-lg bg-surface border border-outline-variant p-1 text-on-surface shadow-lg",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

type DropdownMenuItemProps = React.ComponentPropsWithoutRef<typeof RadixDropdown.Item> & {
  inset?: boolean
}

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, inset, ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(
      "flex items-center gap-2 px-3 py-2 text-sm leading-none rounded-md text-on-surface hover:bg-muted/50 cursor-default select-none",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}

export type {
  // re-export Radix types if consumers need them
  // These are optional and can be imported directly from Radix if preferred
}
