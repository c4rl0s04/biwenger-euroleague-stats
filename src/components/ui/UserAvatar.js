'use client';

import Image from 'next/image';
import PropTypes from 'prop-types';

/**
 * Optimized User Avatar Component
 * Uses Next.js Image for automatic optimization and lazy loading
 *
 * @param {string} src - Avatar image URL
 * @param {string} alt - Alt text for accessibility
 * @param {number} size - Avatar size in pixels (default: 24)
 * @param {string} className - Additional CSS classes
 */
export default function UserAvatar({ src, alt, size = 24, className = '' }) {
  // Fallback to initials if no image
  if (!src) {
    const initial = alt?.charAt(0)?.toUpperCase() || '?';
    return (
      <div
        className={`rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {initial}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt || 'User avatar'}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      unoptimized={src.includes('localhost')}
    />
  );
}

UserAvatar.propTypes = {
  /** Avatar image URL */
  src: PropTypes.string,
  /** Alt text for accessibility */
  alt: PropTypes.string,
  /** Avatar size in pixels */
  size: PropTypes.number,
  /** Additional CSS classes */
  className: PropTypes.string,
};
