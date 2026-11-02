import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
        destructive: 'bg-error-container text-on-error-container hover:bg-error-container/90 border border-error/30 shadow-sm',
        outline: 'border border-surface-container-highest bg-transparent hover:bg-surface-container-high text-on-surface hover:text-on-surface',
        secondary: 'bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25 shadow-sm',
        ghost: 'hover:bg-surface-container-high/60 text-on-surface-variant hover:text-on-surface',
        link: 'text-primary underline-offset-4 hover:underline p-0 h-auto',
        clinical: 'bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-md hover:opacity-95',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-11 rounded-xl px-6 text-sm',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

