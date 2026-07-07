import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 dark:bg-primary/20 text-primary-700 dark:text-primary-300",
        success:
          "bg-success/10 dark:bg-success/20 text-success-dark dark:text-success-light",
        warning:
          "bg-warning/10 dark:bg-warning/20 text-warning-dark dark:text-warning-light",
        danger:
          "bg-danger/10 dark:bg-danger/20 text-danger-dark dark:text-danger-light",
        info:
          "bg-info/10 dark:bg-info/20 text-info-dark dark:text-info-light",
        outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300",
        secondary:
          "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
