'use client';

import { cn } from '@/lib/utils';
import {
  Clock,
  Loader2,
  Truck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCallback } from 'react';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface StepConfig {
  key: OrderStatus;
  label: string;
  icon: typeof Clock;
  activeColor: string;      // text color when current
  activeBg: string;          // bg color when current
  activeBorder: string;      // border color when current
  completedRing: string;     // ring color for completed step glow
}

const STEPS: StepConfig[] = [
  {
    key: 'pending',
    label: 'Pending',
    icon: Clock,
    activeColor: 'text-amber-600 dark:text-amber-400',
    activeBg: 'bg-amber-50 dark:bg-amber-950/50',
    activeBorder: 'border-amber-400 dark:border-amber-500',
    completedRing: 'ring-amber-300/40 dark:ring-amber-700/40',
  },
  {
    key: 'processing',
    label: 'Processing',
    icon: Loader2,
    activeColor: 'text-blue-600 dark:text-blue-400',
    activeBg: 'bg-blue-50 dark:bg-blue-950/50',
    activeBorder: 'border-blue-400 dark:border-blue-500',
    completedRing: 'ring-blue-300/40 dark:ring-blue-700/40',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    icon: Truck,
    activeColor: 'text-violet-600 dark:text-violet-400',
    activeBg: 'bg-violet-50 dark:bg-violet-950/50',
    activeBorder: 'border-violet-400 dark:border-violet-500',
    completedRing: 'ring-violet-300/40 dark:ring-violet-700/40',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: CheckCircle2,
    activeColor: 'text-green-600 dark:text-green-400',
    activeBg: 'bg-green-50 dark:bg-green-950/50',
    activeBorder: 'border-green-400 dark:border-green-500',
    completedRing: 'ring-green-300/40 dark:ring-green-700/40',
  },
];

// Strict sequential progression
const PROGRESSION: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered'];

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
  onChangeStatus: (newStatus: OrderStatus) => void;
  /** If true, clicking next step will change status. If false, read-only display. */
  interactive?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { circle: 'h-8 w-8', icon: 'h-3.5 w-3.5', label: 'text-[11px]', connectorTop: 'top-4', iconSize: 'h-3 w-3' },
  md: { circle: 'h-10 w-10', icon: 'h-4 w-4', label: 'text-xs', connectorTop: 'top-5', iconSize: 'h-3.5 w-3.5' },
  lg: { circle: 'h-12 w-12', icon: 'h-5 w-5', label: 'text-sm', connectorTop: 'top-6', iconSize: 'h-4 w-4' },
} as const;

export function OrderStatusStepper({
  currentStatus,
  onChangeStatus,
  interactive = true,
  size = 'md',
}: OrderStatusStepperProps) {
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = PROGRESSION.indexOf(currentStatus);
  const canAdvance = interactive && !isCancelled && currentIndex >= 0 && currentIndex < PROGRESSION.length - 1;
  const canCancel = interactive && !isCancelled && currentStatus !== 'delivered';
  const sz = sizeConfig[size];

  const handleAdvance = useCallback(() => {
    if (!canAdvance || currentIndex < 0) return;
    const nextStatus = PROGRESSION[currentIndex + 1];
    onChangeStatus(nextStatus);
  }, [canAdvance, currentIndex, onChangeStatus]);

  const handleCancel = useCallback(() => {
    if (!canCancel) return;
    onChangeStatus('cancelled');
  }, [canCancel, onChangeStatus]);

  const nextStep = currentIndex >= 0 && currentIndex < PROGRESSION.length - 1 ? STEPS[currentIndex + 1] : null;

  return (
    <div className="w-full">
      {isCancelled ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-red-200 bg-red-50/80 px-4 py-3 dark:border-red-800 dark:bg-red-950/30"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
            <XCircle className="h-4.5 w-4.5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              Order Cancelled
            </p>
            <p className="text-xs text-red-500/70 dark:text-red-400/60">
              This order has been cancelled and cannot be updated.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {/* Horizontal steps */}
          <div className="flex items-start w-full">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isNext = idx === currentIndex + 1;
              const isFuture = idx > currentIndex + 1;
              const Icon = step.icon;
              const clickable = interactive && isNext;

              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {/* Connector line */}
                  {idx > 0 && (
                    <div
                      className={cn(
                        'absolute h-0.5 w-full left-1/2 z-0 transition-colors duration-500',
                        sz.connectorTop,
                        idx <= currentIndex
                          ? 'bg-primary/40'
                          : 'bg-border'
                      )}
                    />
                  )}

                  {/* Step button */}
                  <motion.button
                    type="button"
                    whileTap={clickable ? { scale: 0.92 } : undefined}
                    onClick={clickable ? handleAdvance : undefined}
                    className={cn(
                      'relative z-10 flex flex-col items-center gap-1.5 group outline-none',
                      !clickable && 'pointer-events-none'
                    )}
                  >
                    {/* Circle */}
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full border-2 transition-all duration-300',
                        sz.circle,
                        // Completed
                        isCompleted && [
                          'border-primary bg-primary text-primary-foreground',
                          `ring-4 ring-primary/10`,
                        ],
                        // Current step
                        isCurrent && [
                          step.activeBorder,
                          step.activeBg,
                          step.activeColor,
                          `ring-4 ring-offset-2 ring-offset-background`,
                          step.completedRing,
                        ],
                        // Next step (clickable)
                        isNext && clickable && [
                          'border-dashed border-muted-foreground/40 bg-muted/50 text-muted-foreground/60',
                          'hover:border-primary hover:bg-primary/5 hover:text-primary',
                          'cursor-pointer',
                        ],
                        // Future step
                        isFuture && [
                          'border-border bg-muted/30 text-muted-foreground/40',
                        ],
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className={sz.icon} />
                      ) : (
                        <Icon className={cn(
                          sz.icon,
                          isNext && clickable && 'group-hover:animate-pulse',
                        )} />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'font-medium whitespace-nowrap transition-colors duration-200',
                        sz.label,
                        isCompleted && 'text-primary',
                        isCurrent && step.activeColor,
                        isNext && clickable && 'text-muted-foreground group-hover:text-primary',
                        isFuture && 'text-muted-foreground/40',
                      )}
                    >
                      {step.label}
                    </span>

                    {/* Hover hint */}
                    {isNext && clickable && (
                      <span className="absolute -bottom-5 text-[10px] font-medium text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Click to advance
                      </span>
                    )}
                  </motion.button>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          {interactive && (canAdvance || canCancel) && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {canAdvance && nextStep && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdvance}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border-2 px-3.5 py-1.5',
                    'text-xs font-medium transition-all duration-200',
                    nextStep.activeBorder,
                    nextStep.activeBg,
                    nextStep.activeColor,
                    'hover:shadow-md active:shadow-sm',
                  )}
                >
                  <nextStep.icon className={sz.iconSize} />
                  Advance to {nextStep.label}
                </motion.button>
              )}
              {canCancel && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCancel}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border-2 border-red-200 bg-red-50/80 px-3.5 py-1.5',
                    'text-xs font-medium text-red-600 transition-all duration-200',
                    'hover:bg-red-100 hover:border-red-300 hover:shadow-md',
                    'dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
                    'dark:hover:bg-red-950/50 dark:hover:border-red-700',
                    'active:shadow-sm',
                  )}
                >
                  <XCircle className={sz.iconSize} />
                  Cancel Order
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
