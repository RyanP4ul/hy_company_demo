'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import React from 'react';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  contentClassName?: string;
  headerAction?: React.ReactNode;
  delay?: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export function AnimatedCard({
  children,
  title,
  description,
  contentClassName,
  headerAction,
  delay = 0,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn('group', className)}
      {...props}
    >
      <Card className="h-full transition-shadow duration-200 hover:shadow-md">
        {title && (
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            {headerAction}
          </CardHeader>
        )}
        <CardContent className={cn(title ? 'pt-0' : 'pt-6', contentClassName)}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// KPI Card variant
interface KPICardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  delay?: number;
}

export function KPICard({ title, value, change, trend, icon, delay = 0 }: KPICardProps) {
  const isPositive = trend === 'up';

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <Card className="h-full transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={cn(
                'font-medium',
                isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {change}
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Skeleton Card
export function SkeletonCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="skeleton-shimmer h-4 w-24 rounded" />
      </CardHeader>
      <CardContent>
        <div className="skeleton-shimmer h-8 w-32 rounded" />
        <div className="mt-2 skeleton-shimmer h-3 w-40 rounded" />
      </CardContent>
    </Card>
  );
}
