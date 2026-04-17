'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Navigation,
  Archive,
  Eye,
  Route,
  BarChart3,
  Gauge,
  PackageCheck,
  Users,
  ChevronDown,
  ChevronUp,
  DollarSign,
  BoxIcon,
  Plus,
  Search,
  X,
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
import { Badge } from '@/components/ui/badge';
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

/* ---------- Status Mapping ---------- */

const routeStatusMap: Record<
  DeliveryRoute['status'],
  'in_transit' | 'delivered' | 'pending'
> = {
  in_transit: 'on_delivery',
  delivered: 'delivered',
  pending: 'pending',
};

const stopStatusIcon: Record<
  StopStatus,
  { icon: typeof CheckCircle2; className: string }
> = {
  delivered: {
    icon: CheckCircle2,
    className: 'text-green-500 dark:text-green-400',
  },
  in_transit: {
    icon: Navigation,
    className: 'text-blue-500 dark:text-blue-400',
  },
  pending: {
    icon: Circle,
    className: 'text-muted-foreground/40',
  },
};

/* ---------- Stop number circled characters ---------- */

const circledNumbers = ['\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465', '\u2466'];

/* ---------- Stat Card Component ---------- */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Truck;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <AnimatedCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
          {sub && (
            <p className="text-xs text-muted-foreground/70">{sub}</p>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}

/* ---------- Stop Row Component ---------- */

function StopRow({
  stop,
  index,
  totalStops,
  isLast,
}: {
  stop: DeliveryStop;
  index: number;
  totalStops: number;
  isLast: boolean;
}) {
  const statusConf = stopStatusIcon[stop.status];
  const StatusIcon = statusConf.icon;
  const isInTransit = stop.status === 'in_transit';

  return (
    <div className="relative flex gap-3">
      {/* Left: sequential line + icon */}
      <div className="flex flex-col items-center">
        {/* Stop number circle */}
        <div
          className={cn(
            'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold',
            stop.status === 'delivered'
              ? 'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-500'
              : isInTransit
                ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-500'
                : 'border-muted-foreground/25 bg-background text-muted-foreground/60'
          )}
        >
          {stop.status === 'delivered' ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : isInTransit ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
          ) : (
            <span>{circledNumbers[index] || index + 1}</span>
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 min-h-[16px]',
              stop.status === 'delivered'
                ? 'bg-green-300 dark:bg-green-700'
                : 'bg-muted-foreground/15'
            )}
          />
        )}
      </div>

      {/* Right: stop content */}
      <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0')}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">
                {stop.customer}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] font-mono px-1.5 py-0"
              >
                {stop.orderId}
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{stop.address}</span>
            </div>
          </div>

          {/* Status badge + ETA */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge
              status={
                stop.status === 'delivered'
                  ? 'delivered'
                  : stop.status === 'in_transit'
                    ? 'on_delivery'
                    : 'pending'
              }
              pulse={isInTransit}
            />
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {stop.estimatedArrival}
            </span>
          </div>
        </div>

        {/* Items + value row */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BoxIcon className="h-3 w-3" />
            {stop.items} items
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            {stop.total.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </span>
          {stop.deliveredAt && (
            <span className="text-green-600 dark:text-green-400">
              Delivered {stop.deliveredAt.split(' ')[1]}
            </span>
          )}
          {stop.notes && (
            <span className="text-amber-600 dark:text-amber-400 truncate" title={stop.notes}>
              {stop.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Route Card Component ---------- */

function RouteCard({
  route,
  onViewDetail,
  onArchive,
}: {
  route: DeliveryRoute;
  onViewDetail: (id: string, e?: React.MouseEvent) => void;
  onArchive: (route: DeliveryRoute) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const deliveredStops = route.stops.filter(
    (s) => s.status === 'delivered'
  ).length;
  const totalStops = route.stops.length;
  const progressPct = Math.round((deliveredStops / totalStops) * 100);
  const isActive = route.status === 'in_transit';
  const isDelivered = route.status === 'delivered';

  return (
    <AnimatedCard className="overflow-hidden">
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Route info */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : isDelivered
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
              )}
            >
              <Truck
                className={cn(
                  'h-5 w-5',
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : isDelivered
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                )}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{route.id}</span>
                {isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{route.driver}</span>
                <span className="text-muted-foreground/50">&middot;</span>
                <Truck className="h-3 w-3" />
                <span>{route.vehicle}</span>
                <span className="text-muted-foreground/50">&middot;</span>
                <Route className="h-3 w-3" />
                <span>{route.totalDistance} km</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge
                  status={routeStatusMap[route.status]}
                  pulse={isActive}
                />
                <Badge
                  variant="outline"
                  className="text-xs bg-muted/50"
                >
                  {deliveredStops}/{totalStops} stops
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {route.totalValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                  })}
                </span>
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

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">
              {isDelivered
                ? 'Route Complete'
                : isActive
                  ? `${deliveredStops} of ${totalStops} stops completed`
                  : `${totalStops} stops scheduled`}
            </span>
            <span className="font-semibold">{progressPct}%</span>
          </div>
          <Progress
            value={progressPct}
            className={cn(
              'h-2',
              isDelivered && '[&>div]:bg-green-500',
              isActive && '[&>div]:bg-blue-500'
            )}
          />
        </div>

        {/* Expand toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide stops
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Show {totalStops} stops
            </>
          )}
        </Button>
      </div>

      {/* Expanded Stops List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="border-t px-4 pt-3 pb-4">
              {route.stops.map((stop, idx) => (
                <StopRow
                  key={stop.id}
                  stop={stop}
                  index={idx}
                  totalStops={totalStops}
                  isLast={idx === route.stops.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedCard>
  );
}

/* ---------- Main Deliveries Page ---------- */

export default function DeliveriesPage() {
  const [data, setData] = useState<DeliveryRoute[]>(initialDeliveries);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const setSelectedDeliveryId = usePageContext((s) => s.setSelectedDeliveryId);
  const setReturnTo = usePageContext((s) => s.setReturnTo);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);

  // Computed stats
  const activeCount = data.filter((d) => d.status === 'in_transit').length;
  const completedCount = data.filter((d) => d.status === 'delivered').length;
  const pendingCount = data.filter((d) => d.status === 'pending').length;
  const totalStops = data.reduce((acc, r) => acc + r.stops.length, 0);
  const totalDelivered = data.reduce(
    (acc, r) => acc + r.stops.filter((s) => s.status === 'delivered').length,
    0
  );
  const totalDistance = data.reduce((acc, r) => acc + r.totalDistance, 0);

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

  // Filter routes by search and status
  const filteredData = data.filter((route) => {
    // Status filter
    if (statusFilter !== 'all' && route.status !== statusFilter) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        route.id.toLowerCase().includes(q) ||
        route.driver.toLowerCase().includes(q) ||
        route.vehicle.toLowerCase().includes(q) ||
        route.stops.some((stop) => stop.customer.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all';

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
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-stop route tracking &amp; management
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() => {
                  setReturnTo('deliveries');
                  setCurrentView('create-delivery');
                }}
              >
                <Plus className="h-4 w-4" />
                Create Delivery
              </Button>
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                {activeCount} Active
              </Badge>
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {completedCount} Completed
              </Badge>
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
              >
                <Clock className="h-3 w-3 mr-1" />
                {pendingCount} Pending
              </Badge>
            </div>
          </div>
        </FadeIn>

        {/* Stats Summary */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard
              icon={BarChart3}
              label="Total Routes"
              value={data.length}
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
            />
            <StatCard
              icon={Truck}
              label="Active"
              value={activeCount}
              sub="In transit now"
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            />
            <StatCard
              icon={MapPin}
              label="Total Stops"
              value={totalStops}
              sub={`${totalDelivered} delivered`}
              color="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            />
            <StatCard
              icon={PackageCheck}
              label="Delivered"
              value={totalDelivered}
              sub={totalStops > 0 ? `${Math.round((totalDelivered / totalStops) * 100)}% rate` : '--'}
              color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
            />
            <StatCard
              icon={Gauge}
              label="Total Distance"
              value={`${totalDistance.toFixed(1)} km`}
              sub="All routes"
              color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
            />
          </div>
        </FadeIn>

        {/* Search & Filter Bar */}
        <FadeIn delay={0.1}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search routes by ID, driver, vehicle, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Route Cards */}
        <StaggerContainer className="space-y-4" staggerDelay={0.08}>
          {filteredData.map((route) => (
            <StaggerItem key={route.id}>
              <RouteCard
                route={route}
                onViewDetail={handleViewDetail}
                onArchive={handleArchive}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Empty state - no routes at all */}
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

        {/* Empty state - filters match nothing */}
        {data.length > 0 && filteredData.length === 0 && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No routes match your search</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your search query or status filter.
              </p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            </div>
          </FadeIn>
        )}
      </div>
    </PageTransition>
  );
}
