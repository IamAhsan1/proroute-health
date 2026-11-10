import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, onChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2',
          checked ? 'bg-primary' : 'bg-surface-container-highest',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
          }}
          {...props}
        />
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </label>
    );
  }
);
Switch.displayName = 'Switch';

