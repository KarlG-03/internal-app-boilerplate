import * as React from 'react';
import { cn } from '../lib/utils';

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<'select'>
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full appearance-none rounded-md border border-input bg-background py-2 pl-3 pr-10 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  );
});
NativeSelect.displayName = 'NativeSelect';
