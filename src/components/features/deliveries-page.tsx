'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Route,
  Eye,
  Archive,
  Search,
  CheckCircle2,
  Navigation,
  Plus,
  CalendarClock,
  MapPin,
  Clock,
  User,
  Circle,
  ChevronDown,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { useSearchStore } from '@/stores/search';
import { useArchiveStore } from '@/stores/archive';
import {
  deliveries as initialRoutes,
  orders,
  type DeliveryRoute,
  type DeliveryStop,
} from '@/lib/mock-data';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function getDeliveredCount(stops: DeliveryStop[]): number {
  return stops.filter((s) => s.status === 'delivered').length;
}

function getCurrentStop(route: DeliveryRoute): DeliveryStop | null {
  if (route.status !== 'in_transit') return null;
  return route.stops.find((s) => s.status === 'in_transit') ?? null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP', symbol: '₱' }).format(value);
}

function getOrderPaymentStatus(orderId: string): 'paid' | 'unpaid' | undefined {
  const order = orders.find((o) => o.id === orderId);
  return order?.paymentStatus;
}

// ─── Pulse Dot ──────────────────────────────────────────────────────────────────

function PulseDot({ color = 'bg-blue-500' }: { color?: string }) {
  return (
    <span className="relative flex size-3">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', color)} />
      <span className={cn('relative inline-flex size-3 rounded-full', color)} />
    </span>
  );
}

// ─── Journey Strip (from Shipping Tracker) ──────────────────────────────────────

function JourneyStrip({ stops }: { stops: DeliveryStop[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2 custom-scrollbar">
      {stops.map((stop, idx) => {
        const isLast = idx === stops.length - 1;
        const dotColor =
          stop.status === 'delivered'
            ? 'bg-green-500'
            : stop.status === 'in_transit'
              ? 'bg-blue-500'
              : 'bg-gray-300 dark:bg-gray-600';
        const lineColor =
          stop.status === 'delivered'
            ? 'bg-green-500'
            : 'bg-gray-200 dark:bg-gray-700';

        return (
          <div key={stop.id} className="flex items-center">
            <div className="relative flex flex-col items-center">
              {stop.status === 'in_transit' ? (
                <PulseDot color="bg-blue-500" />
              ) : stop.status === 'delivered' ? (
                <div className="flex size-3 items-center justify-center rounded-full bg-green-500">
                  <CheckCircle2 className="size-3 text-white" />
                </div>
              ) : (
                <Circle className="size-3 text-gray-300 dark:text-gray-600" />
              )}
              <span className="mt-1 hidden text-[10px] font-medium text-muted-foreground sm:block">
                {idx + 1}
              </span>
            </div>
            {!isLast && (
              <div className={cn('mx-1 h-0.5 w-6 sm:w-10', lineColor)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stop Detail (with payment status) ──────────────────────────────────────────

function StopDetail({ stop, index }: { stop: DeliveryStop; index: number }) {
  const paymentStatus = getOrderPaymentStatus(stop.orderId);

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    delivered: { label: 'Delivered', variant: 'outline', className: 'text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950' },
    in_transit: { label: 'In Transit', variant: 'outline', className: 'text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:bg-blue-950' },
    pending: { label: 'Pending', variant: 'outline', className: 'text-gray-600 border-gray-300 bg-gray-50 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-900' },
  };

  const cfg = statusConfig[stop.status] ?? statusConfig.pending;

  return (
    <div className="flex gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-col items-center">
        <div className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{stop.customer}</span>
          <Badge variant={cfg.variant} className={cn('text-[10px] px-1.5 py-0', cfg.className)}>
            {cfg.label}
          </Badge>
          {paymentStatus === 'paid' ? (
            <Badge className="gap-0.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-1.5 py-0">
              <Wallet className="size-2.5" />Paid
            </Badge>
          ) : paymentStatus === 'unpaid' ? (
            <Badge className="gap-0.5 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] px-1.5 py-0">
              <AlertTriangle className="size-2.5" />Unpaid
            </Badge>
          ) : null}
        </div>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3 shrink-0" />
          {stop.address}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="size-3" />
            {stop.items} items
          </span>
          <span className="flex items-center gap-1">
            <Navigation className="size-3" />
            {formatCurrency(stop.total)}
          </span>
          {stop.status === 'delivered' && stop.deliveredAt && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Clock className="size-3" />
              {stop.deliveredAt}
            </span>
          )}
          {stop.status !== 'delivered' && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              ETA: {stop.estimatedArrival}
            </span>
          )}
        </div>
        {stop.notes && (
          <p className="mt-1 text-xs italic text-amber-600 dark:text-amber-400">
            Note: {stop.notes}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Tracking Card (Shipping Tracker style) ─────────────────────────────────────

function TrackingCard({
  route,
  onViewDetail,
  onArchive,
  onReschedule,
}: {
  route: DeliveryRoute;
  onViewDetail: (id: string, e?: React.MouseEvent) => void;
  onArchive: (route: DeliveryRoute) => void;
  onReschedule: (route: DeliveryRoute) => void;
}) {
  const delivered = getDeliveredCount(route.stops);
  const total = route.stops.length;
  const progressPercent = Math.round((delivered / total) * 100);
  const currentStop = getCurrentStop(route);

  const isActive = route.status === 'in_transit';
  const isPending = route.status === 'pending';
  const isDelivered = route.status === 'delivered';

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    in_transit: { label: 'In Transit', variant: 'default', className: 'bg-blue-600 text-white hover:bg-blue-700' },
    pending: { label: 'Pending', variant: 'secondary', className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200' },
    delivered: { label: 'Delivered', variant: 'secondary', className: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200' },
    cancelled: { label: 'Cancelled', variant: 'destructive', className: '' },
  };

  const cfg = statusConfig[route.status] ?? statusConfig.pending;

  // Count paid/unpaid stops
  const paidStops = route.stops.filter((s) => getOrderPaymentStatus(s.orderId) === 'paid').length;
  const unpaidStops = route.stops.filter((s) => getOrderPaymentStatus(s.orderId) === 'unpaid').length;

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card className="h-full overflow-hidden transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-0">
            {/* Route Header */}
            <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Truck className="size-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{route.id}</h3>
                    <Badge variant={cfg.variant} className={cn('gap-1 text-[10px] px-1.5 py-0', cfg.className)}>
                      {route.status === 'in_transit' && <PulseDot color="bg-white" />}
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{route.driver} · {route.vehicle}</p>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground/70 hover:text-primary hover:bg-primary/10"
                  onClick={(e) => onViewDetail(route.id, e)}
                  aria-label="View delivery details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {(isPending || isActive) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground/70 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40"
                    onClick={(e) => { e.stopPropagation(); onReschedule(route); }}
                    aria-label="Reschedule delivery"
                  >
                    <CalendarClock className="h-4 w-4" />
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Archive Route</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to archive route{' '}
                        <span className="font-semibold text-foreground">{route.id}</span>?
                        Archived items can be restored from the Archived page.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onArchive(route)}>
                        Archive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Journey Strip */}
            <div className="border-b px-4 py-3">
              <JourneyStrip stops={route.stops} />
            </div>

            {/* Current Stop Info (if in_transit) */}
            {currentStop && (
              <div className="border-b bg-blue-50/50 px-4 py-3 dark:bg-blue-950/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Navigation className="size-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Current Stop
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{currentStop.customer}</p>
                  {(() => {
                    const ps = getOrderPaymentStatus(currentStop.orderId);
                    if (ps === 'paid') {
                      return (
                        <Badge className="gap-0.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-1.5 py-0">
                          <Wallet className="size-2.5" />Paid
                        </Badge>
                      );
                    }
                    if (ps === 'unpaid') {
                      return (
                        <Badge className="gap-0.5 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] px-1.5 py-0">
                          <AlertTriangle className="size-2.5" />Unpaid
                        </Badge>
                      );
                    }
                    return null;
                  })()}
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {currentStop.address}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <Clock className="size-3" />
                  ETA: {currentStop.estimatedArrival}
                </p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="border-b px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">Progress</span>
                <span className="text-xs font-semibold tabular-nums">
                  {isDelivered ? 'Complete' : `${delivered}/${total} stops`}
                </span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            {/* Rescheduled badge */}
            {route.rescheduledDate && (
              <div className="border-b px-4 py-2 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    Rescheduled: {new Date(route.rescheduledDate + 'T' + (route.rescheduledTime || '08:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {route.rescheduledTime || '08:00'}
                  </span>
                </div>
              </div>
            )}

            {/* Stop List (Expandable Accordion) */}
            <Accordion type="single" collapsible className="px-4">
              <AccordionItem value="stops" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    <Package className="size-4 text-muted-foreground" />
                    All Stops ({total})
                    {unpaidStops > 0 && (
                      <Badge className="gap-0.5 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] px-1.5 py-0 ml-1">
                        {unpaidStops} unpaid
                      </Badge>
                    )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-1">
                    {route.stops.map((stop, idx) => (
                      <StopDetail key={stop.id} stop={stop} index={idx} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Route Footer */}
            <div className="flex flex-wrap items-center gap-4 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="size-3.5" />
                {route.driver}
              </span>
              <span className="flex items-center gap-1">
                <Truck className="size-3.5" />
                {route.vehicle}
              </span>
              <span className="flex items-center gap-1">
                <Navigation className="size-3.5" />
                {route.totalDistance} km
              </span>
              <span className="flex items-center gap-1">
                <Package className="size-3.5" />
                {route.totalOrders} orders
              </span>
              <span className="flex items-center gap-1">
                <Wallet className="size-3.5" />
                {paidStops} paid · {unpaidStops} unpaid
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

// ─── Stats Summary (Shipping Tracker style) ─────────────────────────────────────

function StatsSummary({ routes }: { routes: DeliveryRoute[] }) {
  const inTransit = routes.filter((r) => r.status === 'in_transit').length;
  const pending = routes.filter((r) => r.status === 'pending').length;
  const completedToday = routes.filter((r) => r.status === 'delivered').length;
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);

  // Count total paid/unpaid across all stops
  const allPaid = routes.reduce((sum, r) => sum + r.stops.filter((s) => getOrderPaymentStatus(s.orderId) === 'paid').length, 0);
  const allUnpaid = routes.reduce((sum, r) => sum + r.stops.filter((s) => getOrderPaymentStatus(s.orderId) === 'unpaid').length, 0);

  const stats = [
    {
      label: 'In Transit',
      count: inTransit,
      icon: Truck,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      pulse: inTransit > 0,
    },
    {
      label: 'Pending',
      count: pending,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      pulse: false,
    },
    {
      label: 'Completed',
      count: completedToday,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      pulse: false,
    },
    {
      label: 'Total Stops',
      count: totalStops,
      icon: MapPin,
      color: 'text-primary',
      bg: 'bg-primary/10',
      pulse: false,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((item, index) => (
          <AnimatedCard key={item.label} delay={index * 0.05}>
            <div className="flex items-center gap-4">
              <div className={cn('relative flex size-10 shrink-0 items-center justify-center rounded-lg', item.bg)}>
                {item.pulse && (
                  <span className="absolute inset-0 animate-ping rounded-lg opacity-20 bg-blue-500" />
                )}
                <item.icon className={cn('relative size-5', item.color)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className={cn('mt-0.5 text-xl font-bold', item.color)}>{item.count}</p>
              </div>
            </div>
          </AnimatedCard>
        ))}
      </div>
      {/* Payment Summary Bar */}
      <AnimatedCard delay={0.2}>
        <div className="flex flex-wrap items-center justify-center gap-6 py-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
              <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid Orders</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{allPaid}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="size-3.5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unpaid Orders</p>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{allUnpaid}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Route className="size-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Distance</p>
              <p className="text-sm font-bold">
                {routes.reduce((sum, r) => sum + r.totalDistance, 0).toFixed(1)} km
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>
    </>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <AnimatedCard>
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Truck className="size-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">No delivery routes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSearch
              ? 'No routes match your search criteria. Try adjusting your search.'
              : 'All delivery routes have been archived. Create a new delivery to get started.'}
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

// ─── Reschedule Dialog ──────────────────────────────────────────────────────────

function RescheduleDialog({
  open,
  onOpenChange,
  route,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  route: DeliveryRoute | null;
  onConfirm: (routeId: string, newDate: string, newTime: string, reason: string) => void;
}) {
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [newDate, setNewDate] = useState(getDefaultDate);
  const [newTime, setNewTime] = useState('08:00');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!route) return;
    if (!newDate) {
      toast.error('Please select a new date');
      return;
    }
    onConfirm(route.id, newDate, newTime, reason);
    onOpenChange(false);
  };

  const formattedSchedule = newDate
    ? new Date(newDate + 'T' + newTime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) +
      ' at ' +
      new Date(newDate + 'T' + newTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Reschedule Delivery
          </DialogTitle>
          <DialogDescription>
            Choose a new schedule for route{' '}
            <span className="font-semibold text-foreground">{route?.id}</span>{' '}
            ({route?.driver} · {route?.vehicle})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-lg border border-muted bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Current Schedule</p>
            <p className="text-sm font-medium">
              {route?.scheduledDate
                ? new Date(route.scheduledDate + 'T' + (route.scheduledTime || '08:00')).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                  }) +
                  ' at ' +
                  new Date(route.scheduledDate + 'T' + (route.scheduledTime || '08:00')).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit', hour12: true,
                  })
                : 'Not yet scheduled'}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reschedule-date">New Date</Label>
            <Input
              id="reschedule-date"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reschedule-time">New Time</Label>
            <Input
              id="reschedule-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
          {formattedSchedule && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">New Schedule</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{formattedSchedule}</p>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="reschedule-reason">Reason (optional)</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reschedule-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="weather_delay">Weather Delay</SelectItem>
                <SelectItem value="driver_unavailable">Driver Unavailable</SelectItem>
                <SelectItem value="stock_not_ready">Stock Not Ready</SelectItem>
                <SelectItem value="high_order_volume">High Order Volume</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleConfirm}>
            <CalendarClock className="h-4 w-4" />
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function DeliveriesPage() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>(initialRoutes);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const setSelectedDeliveryId = usePageContext((s) => s.setSelectedDeliveryId);
  const setReturnTo = usePageContext((s) => s.setReturnTo);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);

  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reschedulingRoute, setReschedulingRoute] = useState<DeliveryRoute | null>(null);

  // Filter routes based on search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return routes;
    const q = searchQuery.toLowerCase();
    return routes.filter((route) => {
      const matchesDriver = route.driver.toLowerCase().includes(q);
      const matchesId = route.id.toLowerCase().includes(q);
      const matchesCustomer = route.stops.some((s) => s.customer.toLowerCase().includes(q));
      return matchesDriver || matchesId || matchesCustomer;
    });
  }, [routes, searchQuery]);

  // Split routes by status for tabs
  const activeRoutes = filteredRoutes.filter((r) => r.status === 'in_transit' || r.status === 'pending');
  const completedRoutes = filteredRoutes.filter((r) => r.status === 'delivered' || r.status === 'cancelled');

  const currentDisplay = activeTab === 'active' ? activeRoutes : completedRoutes;

  // Listen for search navigation to auto-navigate to delivery detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'delivery') {
        setRoutes((prev) => {
          const delivery = prev.find((d) => d.id === target.id);
          if (delivery) {
            setSelectedDeliveryId(delivery.id);
            setReturnTo('deliveries');
            setCurrentView('delivery-detail');
          }
          return prev;
        });
        clearSearchTarget();
      }
    };
    window.addEventListener('search:navigate', handler);
    return () => window.removeEventListener('search:navigate', handler);
  }, [clearSearchTarget, setSelectedDeliveryId, setReturnTo, setCurrentView]);

  // Listen for restored deliveries from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setRoutes((prev) => [...prev, restoredData as DeliveryRoute]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  // Listen for new deliveries created from the Create Delivery page
  useEffect(() => {
    const handleDeliveryCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { route } = customEvent.detail;
      if (route) {
        setRoutes((prev) => [route as DeliveryRoute, ...prev]);
      }
    };
    window.addEventListener('delivery:created', handleDeliveryCreated);
    return () => window.removeEventListener('delivery:created', handleDeliveryCreated);
  }, []);

  const handleArchive = useCallback((route: DeliveryRoute) => {
    archiveStore.archiveItem('delivery', route, route.id, route.id);
    setRoutes((prev) => prev.filter((d) => d.id !== route.id));
    toast.success(`Route ${route.id} archived successfully`);
  }, [archiveStore]);

  const openRescheduleDialog = useCallback((route: DeliveryRoute) => {
    setReschedulingRoute(route);
    setRescheduleOpen(true);
  }, []);

  const handleReschedule = useCallback((routeId: string, newDate: string, newTime: string, reason: string) => {
    const reasonLabels: Record<string, string> = {
      customer_request: 'Customer Request',
      weather_delay: 'Weather Delay',
      driver_unavailable: 'Driver Unavailable',
      stock_not_ready: 'Stock Not Ready',
      high_order_volume: 'High Order Volume',
      other: 'Other',
    };
    const formattedNewDate = new Date(newDate + 'T' + newTime).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    }) + ' at ' + new Date(newDate + 'T' + newTime).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    setRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId
          ? { ...r, rescheduledDate: newDate, rescheduledTime: newTime, rescheduleReason: reason }
          : r
      )
    );
    toast.success(
      `Route ${routeId} rescheduled to ${formattedNewDate}` +
        (reason ? ` (${reasonLabels[reason] || reason})` : '')
    );
  }, []);

  const handleViewDetail = useCallback(
    (deliveryId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedDeliveryId(deliveryId);
      setReturnTo('deliveries');
      setCurrentView('delivery-detail');
    },
    [setCurrentView, setSelectedDeliveryId, setReturnTo]
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
                <p className="text-sm text-muted-foreground">
                  Multi-stop route tracking &amp; management
                </p>
              </div>
            </div>
            <Button
              className="gap-2 w-fit"
              onClick={() => {
                setReturnTo('deliveries');
                setCurrentView('create-delivery');
              }}
            >
              <Plus className="h-4 w-4" />
              Create Delivery
            </Button>
          </div>
        </FadeIn>

        {/* Stats Summary */}
        <FadeIn delay={0.05}>
          <StatsSummary routes={routes} />
        </FadeIn>

        {/* Search & Tabs */}
        <FadeIn delay={0.1}>
          <AnimatedCard>
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by driver name, route ID, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                <Button
                  variant={activeTab === 'active' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setActiveTab('active')}
                >
                  <Truck className="size-3.5" />
                  Active
                  {activeRoutes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                      {activeRoutes.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === 'completed' ? 'default' : 'ghost'}
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => setActiveTab('completed')}
                >
                  <CheckCircle2 className="size-3.5" />
                  Completed
                  {completedRoutes.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-[10px]">
                      {completedRoutes.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Route Cards */}
        <FadeIn delay={0.15}>
          <AnimatePresence mode="wait">
            {currentDisplay.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EmptyState hasSearch={searchQuery.trim().length > 0} />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <StaggerContainer className="grid gap-4 md:grid-cols-2" staggerDelay={0.08}>
                  {currentDisplay.map((route) => (
                    <TrackingCard
                      key={route.id}
                      route={route}
                      onViewDetail={handleViewDetail}
                      onArchive={handleArchive}
                      onReschedule={openRescheduleDialog}
                    />
                  ))}
                </StaggerContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </FadeIn>

        {/* Reschedule Dialog */}
        <RescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          route={reschedulingRoute}
          onConfirm={handleReschedule}
        />
      </div>
    </PageTransition>
  );
}
