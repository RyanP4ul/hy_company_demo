'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import React from 'react';

interface AnimatedButtonProps extends ButtonProps {
  enableMotion?: boolean;
}

export function AnimatedButton({
  children,
  className,
  enableMotion = true,
  disabled,
  ...props
}: AnimatedButtonProps) {
  if (!enableMotion) {
    return (
      <Button className={className} disabled={disabled} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ duration: 0.15 }}
      className="inline-block"
    >
      <Button className={cn('transition-shadow duration-150', className)} disabled={disabled} {...props}>
        {children}
      </Button>
    </motion.div>
  );
}

// Loading Spinner
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn('h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    />
  );
}

// Skeleton component with shimmer
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton-shimmer rounded', className)}
      style={{ width, height }}
    />
  );
}

// Page Transition Wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for children animations
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.05,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
    >
      {children}
    </motion.div>
  );
}

// Fade in on scroll / mount
export function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}
