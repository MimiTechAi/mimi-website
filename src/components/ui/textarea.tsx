import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  "aria-describedby"?: string;
}

function Textarea({ className, "aria-describedby": ariaDescribedBy, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      aria-describedby={ariaDescribedBy}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-all duration-200 outline-none focus-visible:ring-[3px] focus-visible:shadow-md disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-primary/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }