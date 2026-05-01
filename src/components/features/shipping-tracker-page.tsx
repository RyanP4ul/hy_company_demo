'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Navigation,
  Route,
  Phone,
  Star,
  Warehouse,
  AlertTriangle,
  Wallet,
  Search,
  Filter,
  Eye,
} from 'lucide-react';

import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { deliveries, orders, drivers, type DeliveryRoute, type DeliveryStop } from '@/lib/mock-data';
import { StatusBadge } from '@/components/shared/status-badge';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn, formatPeso } from '@/lib/utils';

/* ================================================================
   CONSTANTS
   ================================================================ */

const MAP_POSITIONS: { x: number; y: number }[] = [
  { x: 40, y: 200 },
  { x: 140, y: 145 },
  { x: 240, y: 90 },
  { x: 330, y: 140 },
  { x: 420, y: 60 },
];

/* ================================================================
   MINI MAP — For each route card
   ================================================================ */

function MiniRouteMap({
  route,
  onSelectStop,
}: {
  route: DeliveryRoute;
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  const completedCount = route.stops.filter(s => s.status === 'delivered').length;
  const currentStop = route.stops.find(s => s.status === 'in_transit');
  const progress = route.stops.length > 0 ? (completedCount / route.stops.length) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-slate-100 dark:bg-slate-800 h-32">
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[40, 80, 120].map((y) => (
          <div key={`h-${y}`} className="absolute left-0 right-0 border-t border-slate-200/60 dark:border-slate-700/40" style={{ top: `${y * 0.43}px` }} />
        ))}
        {[80, 160, 240, 340].map((x) => (
          <div key={`v-${x}`} className="absolute top-0 bottom-0 border-l border-slate-200/60 dark:border-slate-700/40" style={{ left: `${x * 0.85}px` }} />
        ))}
      </div>

      <svg viewBox="0 0 500 240" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Completed route */}
        {completedCount > 0 && (
          <polyline
            points={MAP_POSITIONS.slice(0, completedCount + 1).map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(34,197,94,0.7)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Remaining route */}
        {currentStop && (
          <polyline
            points={MAP_POSITIONS.slice(completedCount).map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(59,130,246,0.45)"
            strokeWidth="2.5"
            strokeDasharray="8,5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="26" dur="1.5s" repeatCount="indefinite" />
          </polyline>
        )}

        {/* Warehouse */}
        <g transform={`translate(${MAP_POSITIONS[0].x - 12}, ${MAP_POSITIONS[0].y - 10})`}>
          <rect x="0" y="0" width="24" height="18" rx="3" fill="rgba(148,163,184,0.2)" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
          <text x="12" y="13" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="8" fontWeight="600">W</text>
        </g>

        {/* Stop markers */}
        {route.stops.map((stop, idx) => {
          const pos = MAP_POSITIONS[idx + 1];
          if (!pos) return null;

          return (
            <g key={stop.id} className="cursor-pointer" onClick={() => onSelectStop(stop)}>
              {stop.status === 'delivered' && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="10" fill="rgba(34,197,94,0.85)" />
                  <polyline points={`${pos.x - 3},${pos.y} ${pos.x - 1},${pos.y + 2} ${pos.x + 3},${pos.y - 2}`} fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </>
              )}
              {stop.status === 'in_transit' && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="8" fill="rgba(59,130,246,0.2)">
                    <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="9" fill="rgba(59,130,246,0.85)" />
                  <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="700">{idx + 1}</text>
                </>
              )}
              {stop.status === 'pending' && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="9" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" />
                  <text x={pos.x} y={pos.y + 3} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="8" fontWeight="600">{idx + 1}</text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Live badge */}
      <div className="absolute top-2 right-2">
        <div className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          </span>
          Live
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/5 dark:bg-white/5 px-3 py-1.5">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
          <span>{completedCount}/{route.stops.length} stops</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   STOP DETAIL SHEET CONTENT
   ================================================================ */

function StopDetailContent({ stop }: { stop: DeliveryStop }) {
  const relatedOrder = orders.find(o => o.id === stop.orderId);
  const isDelivered = stop.status === 'delivered';
  const isCurrent = stop.status === 'in_transit';

  const mockItems = useMemo(() => {
    const productNames = [
      'Widget Pro X200', 'Smart Sensor V3', 'Premium Widget XL',
      'Basic Connector Kit', 'USB-C Hub Adapter', 'Wireless Charger Pad',
    ];
    const count = relatedOrder ? relatedOrder.items : stop.items;
    return productNames.slice(0, Math.min(count, 4)).map((name, idx) => ({
      name,
      sku: `SKU-${String(idx + 1).padStart(3, '0')}`,
      qty: Math.max(1, Math.floor(stop.items / 3)),
      price: [149.99, 89.99, 249.99, 29.99, 44.99, 59.99][idx],
    }));
  }, [stop, relatedOrder]);

  return (
    <div className="space-y-4">
      {/* Stop header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
            isDelivered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : isCurrent ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-muted text-muted-foreground'
          )}>
            {isDelivered ? <CheckCircle2 className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-semibold">{stop.customer}</p>
            <p className="text-xs text-muted-foreground font-mono">{stop.orderId}</p>
          </div>
        </div>
        <StatusBadge status={isDelivered ? 'delivered' : isCurrent ? 'on_delivery' : 'pending'} pulse={isCurrent} />
      </div>

      {/* Payment status */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Payment</span>
        {relatedOrder?.paymentStatus === 'paid' ? (
          <Badge className="gap-0.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-1.5 py-0">
            <Wallet className="size-2.5" />Paid
          </Badge>
        ) : (
          <Badge className="gap-0.5 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] px-1.5 py-0">
            <AlertTriangle className="size-2.5" />Unpaid
          </Badge>
        )}
      </div>

      <Separator />

      {/* Address + Time */}
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{stop.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {isDelivered && stop.deliveredAt ? (
            <span>Delivered <span className="font-medium text-foreground">{stop.deliveredAt}</span></span>
          ) : (
            <span>ETA <span className="font-medium text-foreground">{stop.estimatedArrival}</span></span>
          )}
        </div>
      </div>

      {/* Notes */}
      {stop.notes && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">Notes</p>
          <p className="text-sm text-amber-900 dark:text-amber-200">{stop.notes}</p>
        </div>
      )}

      <Separator />

      {/* Order Items */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Order Items ({stop.items})
        </h4>
        <div className="space-y-1.5">
          {mockItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-md border px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted">
                  <Package className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.sku}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs font-semibold tabular-nums">₱{(item.qty * item.price).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">x{item.qty}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-bold tabular-nums">₱{stop.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN SHIPPING TRACKER PAGE
   ================================================================ */

export default function ShippingTrackerPage() {
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const setSelectedDeliveryId = usePageContext((s) => s.setSelectedDeliveryId);
  const setReturnTo = usePageContext((s) => s.setReturnTo);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_transit' | 'pending' | 'delivered'>('all');
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);

  // Get all active deliveries (in_transit + pending)
  const activeDeliveries = useMemo(() => {
    return deliveries.filter(d => d.status !== 'cancelled');
  }, []);

  // Apply filters
  const filteredDeliveries = useMemo(() => {
    let result = activeDeliveries;

    if (statusFilter !== 'all') {
      result = result.filter(d => d.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d =>
        d.id.toLowerCase().includes(q) ||
        d.driver.toLowerCase().includes(q) ||
        d.vehicle.toLowerCase().includes(q) ||
        d.stops.some(s =>
          s.customer.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.orderId.toLowerCase().includes(q)
        )
      );
    }

    return result;
  }, [activeDeliveries, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = activeDeliveries.length;
    const inTransit = activeDeliveries.filter(d => d.status === 'in_transit').length;
    const pending = activeDeliveries.filter(d => d.status === 'pending').length;
    const delivered = activeDeliveries.filter(d => d.status === 'delivered').length;
    const totalStops = activeDeliveries.reduce((sum, d) => sum + d.stops.length, 0);
    const completedStops = activeDeliveries.reduce((sum, d) => sum + d.stops.filter(s => s.status === 'delivered').length, 0);
    const totalValue = activeDeliveries.reduce((sum, d) => sum + d.totalValue, 0);
    return { total, inTransit, pending, delivered, totalStops, completedStops, totalValue };
  }, [activeDeliveries]);

  const handleViewRoute = (routeId: string) => {
    setSelectedDeliveryId(routeId);
    setReturnTo('shipping-tracker');
    setCurrentView('delivery-detail');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FadeIn>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Navigation className="h-6 w-6 text-blue-500" />
                Shipping Tracker
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track all deliveries in real-time as they ship to their destinations
              </p>
            </FadeIn>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FadeIn delay={0.02}>
            <AnimatedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.inTransit}</p>
                  <p className="text-xs text-muted-foreground">In Transit</p>
                </div>
              </div>
            </AnimatedCard>
          </FadeIn>
          <FadeIn delay={0.04}>
            <AnimatedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </AnimatedCard>
          </FadeIn>
          <FadeIn delay={0.06}>
            <AnimatedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stats.completedStops}/{stats.totalStops}</p>
                  <p className="text-xs text-muted-foreground">Stops Done</p>
                </div>
              </div>
            </AnimatedCard>
          </FadeIn>
          <FadeIn delay={0.08}>
            <AnimatedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">₱{(stats.totalValue / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </AnimatedCard>
          </FadeIn>
        </div>

        {/* Search & Filters */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search routes, drivers, customers, addresses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'in_transit', 'pending', 'delivered'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={statusFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    'text-xs',
                    statusFilter === filter && filter === 'in_transit' && 'bg-blue-600 hover:bg-blue-700',
                    statusFilter === filter && filter === 'pending' && 'bg-amber-600 hover:bg-amber-700',
                    statusFilter === filter && filter === 'delivered' && 'bg-green-600 hover:bg-green-700',
                  )}
                >
                  {filter === 'all' ? 'All' : filter === 'in_transit' ? 'In Transit' : filter === 'pending' ? 'Scheduled' : 'Completed'}
                </Button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Delivery Route Cards */}
        {filteredDeliveries.length === 0 ? (
          <FadeIn delay={0.12}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-lg">No deliveries found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? 'Try adjusting your search query' : 'No active deliveries at the moment'}
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid gap-4">
            <StaggerContainer>
              {filteredDeliveries.map((route, routeIdx) => {
                const driver = drivers.find(d => d.name === route.driver);
                const completedStops = route.stops.filter(s => s.status === 'delivered').length;
                const currentStop = route.stops.find(s => s.status === 'in_transit');
                const nextPending = route.stops.find(s => s.status === 'pending');
                const progress = route.stops.length > 0 ? (completedStops / route.stops.length) * 100 : 0;
                const isDelivered = route.status === 'delivered';
                const isInTransit = route.status === 'in_transit';

                const initials = route.driver.split(' ').map(n => n[0]).join('');

                return (
                  <StaggerItem key={route.id}>
                    <AnimatedCard className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        {/* Map column */}
                        <div className="lg:col-span-4">
                          <MiniRouteMap
                            route={route}
                            onSelectStop={(stop) => setSelectedStop(stop)}
                          />
                        </div>

                        {/* Details column */}
                        <div className="lg:col-span-5 space-y-3">
                          {/* Route header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-sm font-semibold">{route.id}</span>
                              <StatusBadge
                                status={isInTransit ? 'on_delivery' : route.status}
                                pulse={isInTransit}
                              />
                            </div>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Route className="h-3 w-3" />
                              {route.totalDistance} km
                            </Badge>
                          </div>

                          {/* Driver info */}
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn(
                                'text-xs font-semibold',
                                isInTransit ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : isDelivered ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-muted text-foreground'
                              )}>
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{route.driver}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{route.vehicle}</span>
                                {driver && (
                                  <>
                                    <span>·</span>
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                    <span>{driver.rating}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            {driver && (
                              <Button variant="ghost" size="icon" className="size-7">
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Journey strip */}
                          <div className="overflow-x-auto pb-1">
                            <div className="flex items-center gap-0 min-w-max">
                              {/* Origin */}
                              <div className="flex flex-col items-center shrink-0">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                  <Warehouse className="h-2.5 w-2.5" />
                                </div>
                              </div>

                              {route.stops.map((stop, idx) => (
                                <div key={stop.id} className="flex items-center shrink-0">
                                  {/* Line */}
                                  <div className="w-5 h-0.5 -ml-px -mr-px">
                                    <div className={cn(
                                      'w-full h-full rounded-full',
                                      stop.status === 'delivered' ? 'bg-green-500'
                                        : stop.status === 'in_transit' ? 'bg-blue-400'
                                          : 'bg-border'
                                    )} />
                                  </div>
                                  {/* Dot */}
                                  <button
                                    onClick={() => setSelectedStop(stop)}
                                    className="flex flex-col items-center shrink-0 cursor-pointer focus:outline-none"
                                  >
                                    <div className={cn(
                                      'flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold border-2',
                                      stop.status === 'delivered' ? 'bg-green-500 border-green-500 text-white'
                                        : stop.status === 'in_transit' ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                                          : 'bg-background border-border text-muted-foreground'
                                    )}>
                                      {stop.status === 'delivered' ? '✓' : idx + 1}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground max-w-[50px] truncate mt-0.5">
                                      {stop.customer.split(' ')[0]}
                                    </span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Current / Next destination */}
                          <div className="rounded-lg bg-muted/30 px-3 py-2">
                            {currentStop ? (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                  <Truck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Currently delivering to</p>
                                  <p className="font-medium truncate">{currentStop.customer} · {currentStop.address.split(',')[0]}</p>
                                </div>
                              </div>
                            ) : nextPending && !isDelivered ? (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                  <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">Next destination</p>
                                  <p className="font-medium truncate">{nextPending.customer} · ETA {nextPending.estimatedArrival}</p>
                                </div>
                              </div>
                            ) : isDelivered ? (
                              <div className="flex items-center gap-2 text-sm">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs text-muted-foreground">All stops completed</p>
                                  <p className="font-medium text-green-600 dark:text-green-400 truncate">
                                    {route.completedAt}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Right sidebar - Stop summary + Action */}
                        <div className="lg:col-span-3 space-y-3">
                          {/* Quick stats */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Orders</span>
                              <span className="font-medium">{route.totalOrders}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Value</span>
                              <span className="font-semibold tabular-nums">{formatPeso(route.totalValue)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Stops</span>
                              <span className="font-medium">{completedStops}/{route.stops.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Distance</span>
                              <span className="font-medium">{route.totalDistance} km</span>
                            </div>
                            {route.startedAt && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Started</span>
                                <span className="font-medium">{route.startedAt.split(' ')[1]}</span>
                              </div>
                            )}
                          </div>

                          <Separator />

                          {/* Stops quick list */}
                          <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                            {route.stops.map((stop, idx) => {
                              const ps = orders.find(o => o.id === stop.orderId)?.paymentStatus;
                              return (
                                <button
                                  key={stop.id}
                                  onClick={() => setSelectedStop(stop)}
                                  className="flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                  <div className={cn(
                                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                                    stop.status === 'delivered' ? 'bg-green-500 text-white'
                                      : stop.status === 'in_transit' ? 'bg-blue-500 text-white'
                                        : 'bg-muted text-muted-foreground'
                                  )}>
                                    {stop.status === 'delivered' ? '✓' : idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{stop.customer}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{stop.address.split(',')[0]}</p>
                                  </div>
                                  {ps === 'unpaid' && (
                                    <Badge className="border-0 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[8px] px-1 py-0 shrink-0">
                                      Unpaid
                                    </Badge>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          <Button
                            size="sm"
                            className="w-full gap-1.5"
                            onClick={() => handleViewRoute(route.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Route Details
                          </Button>
                        </div>
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        )}
      </div>

      {/* Stop Detail Sheet */}
      {selectedStop && (
        <>
          {/* Mobile overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSelectedStop(null)}
          />
          {/* Sheet panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-background border-l shadow-xl overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Stop Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setSelectedStop(null)}
                >
                  ×
                </Button>
              </div>
              <StopDetailContent stop={selectedStop} />
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}
