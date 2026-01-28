import React from 'react';

/**
 * Standard Subheading component for sections
 * Use this to subtitle groups of cards or sections within a page.
 * Matches the styling of ElegantCard headers.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content of the subheading (can be string or nodes)
 * @param {string} [props.className] - Additional classes
 */
export default function Subheading({ children, className = '' }) {
  return (
    <div className={`px-1 py-2 ${className}`}>
      <h4 className="text-base font-semibold text-muted-foreground uppercase tracking-widest">
        {children}
      </h4>
    </div>
  );
}
