'use client';

export default function FadeIn({ children, delay = 0, className = '', duration = 600 }) {
  return (
    <div
      className={`opacity-0 animate-fade-in-up ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}
