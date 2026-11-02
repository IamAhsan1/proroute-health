import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 select-none uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/15 text-primary border border-primary/30',
        secondary: 'border-transparent bg-secondary/15 text-secondary border border-secondary/30',
        destructive: 'border-transparent bg-error/15 text-error border border-error/30',
        outline: 'text-on-surface border border-surface-container-highest bg-surface-container/40',
        success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
        warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30',
        doctor: 'bg-secondary/15 text-secondary border border-secondary/30',
        admin: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30',
        patient: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

