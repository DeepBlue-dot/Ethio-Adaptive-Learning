import * as React from "react"

import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: React.ComponentPropsWithoutRef<"img">) {
  return <img className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
}

function AvatarFallback({ className, ...props }: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarFallback, AvatarImage }
