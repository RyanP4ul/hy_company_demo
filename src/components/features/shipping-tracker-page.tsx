'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deliveries as initialRoutes, type DeliveryRoute, type DeliveryStop } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Ship,
  MapPin,
  Clock,
  Package,
  Truck,
  User,
  CheckCircle2,
  Circle,
  ArrowRight,
  Search,
  Navigation,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// ─── Pulse Dot ──────────────────────────────────────────────────────────────────

function PulseDot({ color = 'bg-blue-500' }: { color?: string }) {
  return (
    <span className="relative flex size-3">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', color)} />
      <span className={cn('relative inline-flex size-3 rounded-full', color)} />
    </span>
  );
}

// ─── Journey Strip ──────────────────────────────────────────────────────────────

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
            {/* Stop dot */}
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

            {/* Connecting line */}
            {!isLast && (
              <div className={cn('mx-1 h-0.5 w-6 sm:w-10', lineColor)} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stop Detail ────────────────────────────────────────────────────────────────

function StopDetail({ stop, index }: { stop: DeliveryStop; index: number }) {
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
          {stop.notes && (
            <p className="mt-1 text-xs italic text-amber-600 dark:text-amber-400">
              Note: {stop.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tracking Card ──────────────────────────────────────────────────────────────

function TrackingCard({ route }: { route: DeliveryRoute }) {
  const delivered = getDeliveredCount(route.stops);
  const total = route.stops.length;
  const progressPercent = Math.round((delivered / total) * 100);
  const currentStop = getCurrentStop(route);

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    in_transit: { label: 'In Transit', variant: 'default', className: 'bg-blue-600 text-white hover:bg-blue-700' },
    pending: { label: 'Pending', variant: 'secondary', className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-200' },
  };

  const cfg = statusConfig[route.status] ?? statusConfig.pending;

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
                <p className="text-sm font-semibold">{currentStop.customer}</p>
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
                <span className="text-xs font-semibold tabular-nums">{delivered}/{total} stops completed</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>

            {/* Stop List (Expandable Accordion) */}
            <Accordion type="single" collapsible className="px-4">
              <AccordionItem value="stops" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    <Package className="size-4 text-muted-foreground" />
                    All Stops ({total})
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
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

// ─── Stats Summary ──────────────────────────────────────────────────────────────

function StatsSummary({ routes }: { routes: DeliveryRoute[] }) {
  const inTransit = routes.filter((r) => r.status === 'in_transit').length;
  const pending = routes.filter((r) => r.status === 'pending').length;
  const completedToday = routes.filter((r) => r.status === 'delivered').length;
  const totalStops = routes.reduce((sum, r) => sum + r.stops.length, 0);

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
      label: 'Completed Today',
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
          <p className="text-lg font-semibold">No active deliveries</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasSearch
              ? 'No routes match your search criteria. Try adjusting your search.'
              : 'All deliveries have been completed. Check back later for new routes.'}
          </p>
        </div>
      </div>
    </AnimatedCard>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function ShippingTrackerPage() {
  const [routes] = useState<DeliveryRoute[]>(initialRoutes);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

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
  const completedRoutes = filteredRoutes.filter((r) => r.status === 'delivered');

  const currentDisplay = activeTab === 'active' ? activeRoutes : completedRoutes;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Shipping Tracker</h1>
                <p className="text-sm text-muted-foreground">
                  Track all active deliveries in real-time
                </p>
              </div>
            </div>
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
                    <TrackingCard key={route.id} route={route} />
                  ))}
                </StaggerContainer>
              </motion.div>
            )}
          </AnimatePresence>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
