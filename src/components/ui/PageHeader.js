import React from 'react';

/**
 * Standard Page Header component
 * Matches the design of the Dashboard header with a gradient pill and large display text.
 *
 * @param {Object} props
 * @param {string} props.title - Main title text
 * @param {string} [props.description] - Optional description text below the title
 * @param {string} [props.className] - Additional classes
 */
export default function PageHeader({ title, description, className = '' }) {
  return (
    <div className={`container mx-auto px-4 pt-12 pb-2 relative z-10 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-display mb-4 flex items-center gap-4">
          <span className="w-1.5 h-12 bg-gradient-to-b from-primary to-orange-400 rounded-full"></span>
          <span className="text-gradient">{title}</span>
        </h1>
        {description && (
          <p className="text-muted-foreground text-lg w-full border-b border-border/50 pb-6">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
