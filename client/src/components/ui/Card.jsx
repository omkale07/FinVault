import React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, bodyClassName, children, header, footer, noPadding, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-slate-700 bg-slate-900/50 shadow-sm backdrop-blur-sm',
        className
      )}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-slate-700">
          {header}
        </div>
      )}
      <div className={cn(!noPadding && 'px-6 py-4', bodyClassName)}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export { Card };
export default Card;
