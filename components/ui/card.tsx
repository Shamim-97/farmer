'use client';

import * as React from 'react';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}
    {...props}
  />
));

Card.displayName = 'Card';

export { Card };
