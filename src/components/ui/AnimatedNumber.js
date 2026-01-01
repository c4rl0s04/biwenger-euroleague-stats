'use client';

import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';

/**
 * AnimatedNumber - A component that animates numbers counting up/down
 * Uses framer-motion for smooth spring-based animations
 * 
 * @param {number} value - The target number to animate to
 * @param {string} className - Additional CSS classes
 * @param {number} duration - Animation duration in seconds (default: 1)
 * @param {string} prefix - Text before the number (e.g., "€")
 * @param {string} suffix - Text after the number (e.g., "pts")
 * @param {number} decimals - Number of decimal places (default: 0)
 * @param {boolean} animateOnView - Only animate when visible (default: true)
 */
export default function AnimatedNumber({
  value,
  className = '',
  duration = 1,
  prefix = '',
  suffix = '',
  decimals = 0,
  animateOnView = true,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  // Spring animation for smooth counting
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });

  // Transform the spring value to the target
  const display = useTransform(spring, (latest) => {
    if (decimals > 0) {
      return latest.toFixed(decimals);
    }
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    // Start animation when in view (or immediately if animateOnView is false)
    if (!animateOnView || isInView) {
      spring.set(value);
    }
  }, [spring, value, isInView, animateOnView]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

/**
 * AnimatedCounter - A simpler version for quick counting animations
 * Good for dashboard KPIs
 */
export function AnimatedCounter({ 
  value, 
  className = '',
  formatOptions = {},
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  const spring = useSpring(0, { stiffness: 75, damping: 25 });
  
  const display = useTransform(spring, (latest) => {
    return Math.round(latest).toLocaleString('es-ES', formatOptions);
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [spring, value, isInView]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}
