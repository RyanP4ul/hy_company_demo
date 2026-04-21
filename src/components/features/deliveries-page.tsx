'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Package,
  Route,
  Eye,
  Archive,
  Search,
  CheckCircle2,
  DollarSign,
  Navigation,
  Plus,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { useSearchStore } from '@/stores/search';
import { useArchiveStore } from '@/stores/archive';
import {
  deliveries as initialDeliveries,
  type DeliveryRoute,
  type DeliveryStop,
  type StopStatus,
} from '@/lib/mock-data';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

/* ---------- Status Mapping ---------- */

const routeStatusMap: Record<
  DeliveryRoute['status'],
  'in_transit' | 'delivered' | 'pending'
> = {
  in_transit: 'on_delivery',
  delivered: 'delivered',
  pending: 'pending',
};

type StatusFilter = 'all' | 'active' | 'completed' | 'pending';

/* ---------- Reschedule Dialog Component ---------- */

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
            ({route?.driver} &middot; {route?.vehicle})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Current schedule info */}
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

          {/* New date */}
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

          {/* New time */}
          <div className="grid gap-2">
            <Label htmlFor="reschedule-time">New Time</Label>
            <Input
              id="reschedule-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>

          {/* Preview */}
          {formattedSchedule && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">New Schedule</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{formattedSchedule}</p>
            </div>
          )}

          {/* Reason */}
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

/* ---------- Journey Strip Components ---------- */

function StopCircle({
  stop,
  index,
  isLast,
}: {
  stop: DeliveryStop;
  index: number;
  isLast: boolean;
}) {
  const isDelivered = stop.status === 'delivered';
  const isInTransit = stop.status === 'in_transit';
  const nextDelivered = isDelivered;

  return (
    <div className="flex items-center shrink-0">
      {/* Stop circle and label */}
      <div className="flex flex-col items-center gap-1.5">
        {/* Circle */}
        <div
          className={cn(
            'relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
            isDelivered &&
              'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-500',
            isInTransit &&
              'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500',
            !isDelivered &&
              !isInTransit &&
              'border-muted-foreground/30 bg-background text-muted-foreground'
          )}
        >
          {isDelivered ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isInTransit ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
          ) : (
            <span className="text-[10px]">{index + 1}</span>
          )}
        </div>
        {/* Customer name + status dot */}
        <div className="flex flex-col items-center gap-0.5 w-16 text-center">
          <span
            className="text-[11px] leading-tight font-medium truncate w-full"
            title={stop.customer}
          >
            {stop.customer}
          </span>
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full shrink-0',
              isDelivered && 'bg-green-500',
              isInTransit && 'bg-blue-500',
              !isDelivered && !isInTransit && 'bg-muted-foreground/30'
            )}
          />
        </div>
      </div>

      {/* Connecting line */}
      {!isLast && (
        <div className="mx-1 mb-5">
          <div
            className={cn(
              'w-10 h-0.5',
              nextDelivered
                ? 'bg-green-400 dark:bg-green-600'
                : isInTransit
                  ? 'border-t-2 border-dashed border-blue-400 dark:border-blue-500'
                  : 'bg-muted-foreground/15'
            )}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Route Card Component ---------- */

function RouteCard({
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
  const deliveredStops = route.stops.filter(
    (s) => s.status === 'delivered'
  ).length;
  const totalStops = route.stops.length;
  const progressPct = Math.round((deliveredStops / totalStops) * 100);
  const isActive = route.status === 'in_transit';
  const isDelivered = route.status === 'delivered';
  const isPending = route.status === 'pending';

  const statusBg: Record<string, string> = {
    in_transit: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  };

  const progressColor: Record<string, string> = {
    in_transit: '[&>div]:bg-blue-500',
    delivered: '[&>div]:bg-green-500',
    pending: '[&>div]:bg-amber-500',
  };

  const progressText = isDelivered
    ? 'Route Complete'
    : isActive
      ? `${deliveredStops} of ${totalStops} stops completed`
      : `${totalStops} stops scheduled`;

  return (
    <AnimatedCard className="overflow-hidden">
      <div className="p-4 sm:p-5 space-y-4">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3">
          {/* Left: Route info */}
          <div className="flex items-start gap-3 min-w-0">
            {/* Route ID badge */}
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-mono font-bold shrink-0',
                statusBg[route.status]
              )}
            >
              {route.id}
            </span>
            <div className="min-w-0 flex-1">
              {/* Driver + vehicle */}
              <p className="text-sm text-muted-foreground truncate">
                {route.driver} &middot; {route.vehicle}
              </p>
              {/* Status badge */}
              <div className="mt-1">
                <StatusBadge
                  status={routeStatusMap[route.status]}
                  pulse={isActive}
                />
              </div>
            </div>
          </div>

          {/* Right: Actions */}
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
            {/* Reschedule - only for pending and in_transit */}
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
                  className="h-8 w-8 text-muted-foreground/50 hover:text-primary hover:bg-primary/10"
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
                    <span className="font-semibold text-foreground">
                      {route.id}
                    </span>{' '}
                    ({route.stops.length} stops, driver: {route.driver})?
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

        {/* Horizontal Journey Strip */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex items-start min-w-max py-1">
            {route.stops.map((stop, idx) => (
              <StopCircle
                key={stop.id}
                stop={stop}
                index={idx}
                isLast={idx === route.stops.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Rescheduled badge */}
        {route.rescheduledDate && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-3 py-1.5">
            <CalendarClock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Rescheduled: {new Date(route.rescheduledDate + 'T' + (route.rescheduledTime || '08:00')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {route.rescheduledTime || '08:00'}
            </span>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="flex items-center gap-4">
          {/* Left: progress text */}
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            {progressText}
          </span>
          {/* Center: progress bar */}
          <div className="flex-1 min-w-0">
            <Progress
              value={progressPct}
              className={cn('h-1.5', progressColor[route.status] || '')}
            />
          </div>
          {/* Right: distance + value */}
          <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Route className="h-3 w-3" />
              {route.totalDistance} km
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {route.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}

/* ---------- Compact Stat Item ---------- */

function CompactStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Truck;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-base font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ---------- Main Deliveries Page ---------- */

export default function DeliveriesPage() {
  const [data, setData] = useState<DeliveryRoute[]>(initialDeliveries);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const setSelectedDeliveryId = usePageContext((s) => s.setSelectedDeliveryId);
  const setReturnTo = usePageContext((s) => s.setReturnTo);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);

  // Computed stats
  const activeCount = data.filter((d) => d.status === 'in_transit').length;
  const totalDelivered = data.reduce(
    (acc, r) => acc + r.stops.filter((s) => s.status === 'delivered').length,
    0
  );
  const totalDistance = data.reduce((acc, r) => acc + r.totalDistance, 0);

  // Filter logic
  const filteredRoutes = useMemo(() => {
    let result = data;

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter((r) => r.status === 'in_transit');
    } else if (statusFilter === 'completed') {
      result = result.filter((r) => r.status === 'delivered');
    } else if (statusFilter === 'pending') {
      result = result.filter((r) => r.status === 'pending');
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.driver.toLowerCase().includes(q) ||
          r.vehicle.toLowerCase().includes(q) ||
          r.stops.some(
            (s) =>
              s.customer.toLowerCase().includes(q) ||
              s.address.toLowerCase().includes(q) ||
              s.orderId.toLowerCase().includes(q)
          )
      );
    }

    return result;
  }, [data, searchQuery, statusFilter]);

  // Listen for search navigation to auto-navigate to delivery detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'delivery') {
        setData((prev) => {
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
        setData((prev) => [...prev, restoredData as DeliveryRoute]);
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
        setData((prev) => [route as DeliveryRoute, ...prev]);
      }
    };
    window.addEventListener('delivery:created', handleDeliveryCreated);
    return () => window.removeEventListener('delivery:created', handleDeliveryCreated);
  }, []);

  const handleArchive = (route: DeliveryRoute) => {
    archiveStore.archiveItem('delivery', route, route.id, route.id);
    setData((prev) => prev.filter((d) => d.id !== route.id));
    toast.success(`Route ${route.id} archived successfully`);
  };

  // Reschedule state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reschedulingRoute, setReschedulingRoute] = useState<DeliveryRoute | null>(null);

  const openRescheduleDialog = (route: DeliveryRoute) => {
    setReschedulingRoute(route);
    setRescheduleOpen(true);
  };

  const handleReschedule = (routeId: string, newDate: string, newTime: string, reason: string) => {
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
    setData((prev) =>
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
  };

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
      <div className="space-y-5">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-stop route tracking &amp; management
              </p>
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

        {/* Compact Stats Row */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CompactStat
              icon={Route}
              label="Total Routes"
              value={data.length}
              color="bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300"
            />
            <CompactStat
              icon={Navigation}
              label="Active Now"
              value={activeCount}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <CompactStat
              icon={CheckCircle2}
              label="Stops Delivered"
              value={totalDelivered}
              color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <CompactStat
              icon={Truck}
              label="Total Distance"
              value={`${totalDistance.toFixed(1)} km`}
              color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            />
          </div>
        </FadeIn>

        {/* Search + Filter Bar */}
        <FadeIn delay={0.1}>
          <AnimatedCard>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, driver, vehicle, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              {/* Status filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val as StatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Route Cards */}
        <StaggerContainer className="space-y-4" staggerDelay={0.06}>
          {filteredRoutes.map((route) => (
            <StaggerItem key={route.id}>
              <RouteCard
                route={route}
                onViewDetail={handleViewDetail}
                onArchive={handleArchive}
                onReschedule={openRescheduleDialog}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Empty state — no data */}
        {data.length === 0 && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No delivery routes</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                All delivery routes have been archived.
              </p>
            </div>
          </FadeIn>
        )}

        {/* Empty state — filtered results */}
        {data.length > 0 && filteredRoutes.length === 0 && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No matching routes</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          </FadeIn>
        )}

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
