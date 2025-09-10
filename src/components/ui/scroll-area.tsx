import { cn } from "@/lib/utils"
import React from "react"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("overflow-auto", className)}
      {...props}
    >
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
