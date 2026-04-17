'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  Navigation,
  User,
  Phone,
  Hash,
  Route,
  Gauge,
  Plus,
  Minus,
  Warehouse,
  AlertCircle,
  ChevronDown,
  Star,
  MapPinned,
  StickyNote,
  ArrowRight,
} from 'lucide-react';

import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { deliveries, type DeliveryRoute, type DeliveryStop, orders, drivers } from '@/lib/mock-data';
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/* ---------- Constants ---------- */

const MAP_POSITIONS: { x: number; y: number }[] = [
  { x: 40, y: 200 },   // Warehouse
  { x: 130, y: 155 },  // Stop 1
  { x: 220, y: 100 },  // Stop 2
  { x: 310, y: 140 },  // Stop 3
  { x: 400, y: 60 },   // Stop 4
];

/* ---------- GPS Map with Multi-Stop Waypoints ---------- */

function MultiStopGPSMap({ route, onSelectStop }: { route: DeliveryRoute; onSelectStop: (stop: DeliveryStop) => void }) {
  const isDelivered = route.status === 'delivered';
  const isPending = route.status === 'pending';
  const isInTransit = route.status === 'in_transit';

  const deliveredCount = route.stops.filter(s => s.status === 'delivered').length;
  const progressPct = Math.round((deliveredCount / route.stops.length) * 100);

  // Build route line segments: completed portion is solid green, remaining is dashed blue
  const completedLinePoints = useMemo(() => {
    const pts: string[] = [];
    pts.push(`${MAP_POSITIONS[0].x},${MAP_POSITIONS[0].y}`);
    for (let i = 0; i < route.stops.length; i++) {
      if (route.stops[i].status === 'delivered' || route.stops[i].status === 'in_transit') {
        pts.push(`${MAP_POSITIONS[i + 1].x},${MAP_POSITIONS[i + 1].y}`);
      }
    }
    return pts.join(' ');
  }, [route.stops]);

  const remainingLinePoints = useMemo(() => {
    const pts: string[] = [];
    // Start from the current or last delivered stop
    let startIdx = 0;
    for (let i = 0; i < route.stops.length; i++) {
      if (route.stops[i].status === 'in_transit') {
        startIdx = i;
        break;
      }
      if (route.stops[i].status === 'pending' && startIdx === 0) {
        startIdx = i;
        break;
      }
    }
    // If all delivered, no remaining
    if (route.stops.every(s => s.status === 'delivered')) return '';
    // Start from the stop before current index
    const fromIdx = route.stops.findIndex(s => s.status === 'in_transit');
    if (fromIdx >= 0) {
      pts.push(`${MAP_POSITIONS[fromIdx].x},${MAP_POSITIONS[fromIdx].y}`);
    } else {
      pts.push(`${MAP_POSITIONS[startIdx].x},${MAP_POSITIONS[startIdx].y}`);
    }
    for (let i = startIdx + 1; i < route.stops.length; i++) {
      pts.push(`${MAP_POSITIONS[i + 1].x},${MAP_POSITIONS[i + 1].y}`);
    }
    return pts.join(' ');
  }, [route.stops]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10" style={{ height: 400 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950" />

      {/* Map watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[5]">
        <span className="text-[13px] font-bold uppercase tracking-[0.35em] text-white/[0.06] select-none">
          Map Preview
        </span>
      </div>

      {/* Simulated map blocks */}
      <div className="absolute inset-0 overflow-hidden">
        {[50, 100, 150, 200, 250].map((y) => (
          <div key={`h-${y}`} className="absolute left-0 right-0 border-t border-white/[0.04]" style={{ top: `${y * 0.48}px` }} />
        ))}
        {[70, 140, 210, 280, 350, 420].map((x) => (
          <div key={`v-${x}`} className="absolute top-0 bottom-0 border-l border-white/[0.04]" style={{ left: `${x}px` }} />
        ))}
        <div className="absolute top-[30px] left-[120px] w-[80px] h-[50px] rounded bg-white/[0.02] border border-white/[0.03]" />
        <div className="absolute top-[100px] left-[240px] w-[60px] h-[70px] rounded bg-white/[0.02] border border-white/[0.03]" />
        <div className="absolute top-[60px] left-[320px] w-[90px] h-[40px] rounded bg-white/[0.02] border border-white/[0.03]" />
        <div className="absolute top-[140px] left-[160px] w-[70px] h-[50px] rounded bg-white/[0.02] border border-white/[0.03]" />
        <div className="absolute top-[170px] left-[340px] w-[55px] h-[45px] rounded bg-white/[0.02] border border-white/[0.03]" />
      </div>

      <svg viewBox="0 0 500 240" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="0" y1="180" x2="500" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="125" y1="0" x2="125" y2="240" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="250" y1="0" x2="250" y2="240" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1="375" y1="0" x2="375" y2="240" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* Completed route line (solid green) */}
        {completedLinePoints && (
          <polyline
            points={completedLinePoints}
            fill="none"
            stroke={isDelivered ? 'rgba(34,197,94,0.8)' : 'rgba(34,197,94,0.85)'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Remaining route line (dashed blue) */}
        {remainingLinePoints && !isDelivered && (
          <polyline
            points={remainingLinePoints}
            fill="none"
            stroke="rgba(99,102,241,0.35)"
            strokeWidth="3"
            strokeDasharray="8,5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="26" dur="1.5s" repeatCount="indefinite" />
          </polyline>
        )}

        {/* Pending-only full route (dashed gray) */}
        {isPending && (
          <polyline
            points={MAP_POSITIONS.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="2.5"
            strokeDasharray="6,6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Warehouse marker */}
        <g transform={`translate(${MAP_POSITIONS[0].x - 14}, ${MAP_POSITIONS[0].y - 12})`}>
          <rect x="0" y="0" width="28" height="22" rx="3" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.4)" strokeWidth="1" />
          <text x="14" y="15" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="9" fontWeight="600">W</text>
          <text x="14" y="34" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">Start</text>
        </g>

        {/* Stop markers */}
        {route.stops.map((stop, idx) => {
          const pos = MAP_POSITIONS[idx + 1];
          if (!pos) return null;
          const isThisDelivered = stop.status === 'delivered';
          const isThisCurrent = stop.status === 'in_transit';
          const isThisPending = stop.status === 'pending';

          return (
            <g
              key={stop.id}
              className="cursor-pointer"
              onClick={() => onSelectStop(stop)}
            >
              {/* Delivered: green filled */}
              {isThisDelivered && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="14" fill="rgba(34,197,94,0.12)" />
                  <circle cx={pos.x} cy={pos.y} r="12" fill="rgba(34,197,94,0.9)" />
                  <polyline
                    points={`${pos.x - 4},${pos.y} ${pos.x - 1},${pos.y + 3} ${pos.x + 4},${pos.y - 3}`}
                    fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <text x={pos.x} y={pos.y - 20} textAnchor="middle" fill="rgba(34,197,94,0.7)" fontSize="8" fontWeight="600">
                    Stop {idx + 1}
                  </text>
                </>
              )}

              {/* In transit: pulsing blue */}
              {isThisCurrent && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="10" fill="rgba(99,102,241,0.25)">
                    <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="16" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="1">
                    <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="12" fill="rgba(99,102,241,0.9)" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                    {idx + 1}
                  </text>
                  <text x={pos.x} y={pos.y - 20} textAnchor="middle" fill="rgba(99,102,241,0.8)" fontSize="8" fontWeight="600">
                    Stop {idx + 1}
                  </text>
                </>
              )}

              {/* Pending: gray */}
              {isThisPending && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="12" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="10" fontWeight="600">
                    {idx + 1}
                  </text>
                  <text x={pos.x} y={pos.y - 20} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="8" fontWeight="600">
                    Stop {idx + 1}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Route info overlay */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex flex-col gap-1.5 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 px-3 py-2 text-[11px] text-white/80 min-w-[130px]">
          <div className="flex items-center gap-1.5">
            <Route className="h-3 w-3 text-white/50" />
            <span>{isPending ? `${route.totalDistance} km planned` : `${route.totalDistance} km total`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-white/50" />
            <span>{isDelivered ? 'Completed' : isPending ? 'Scheduled' : `${route.stops.length - deliveredCount} stops left`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3 w-3 text-white/50" />
            <span>{isPending ? '-- km/h' : `${(35 + Math.random() * 15).toFixed(0)} km/h`}</span>
          </div>
        </div>
      </div>

      {/* LIVE / Scheduled / Complete badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
          isInTransit ? 'border-red-500/30 bg-red-500/15 text-red-400'
            : isDelivered ? 'border-green-500/30 bg-green-500/15 text-green-400'
            : 'border-amber-500/30 bg-amber-500/15 text-amber-400'
        )}>
          {isInTransit && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
          )}
          {isInTransit ? 'Live' : isDelivered ? 'Complete' : 'Scheduled'}
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-12 left-3 right-14 z-10">
        <div className="rounded-lg bg-black/50 backdrop-blur-md border border-white/10 px-3 py-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Route Progress</span>
            <span className="text-[11px] font-bold text-white/80 tabular-nums">{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-1.5" />
          <div className="flex justify-between mt-1.5 text-[9px] text-white/40">
            <span>{deliveredCount}/{route.stops.length} stops</span>
            <span>{isDelivered ? 'All delivered' : isPending ? 'Not started' : `${route.stops.length - deliveredCount} remaining`}</span>
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-0.5">
        <button className="flex h-7 w-7 items-center justify-center rounded-md bg-black/50 border border-white/10 text-white/60 hover:text-white hover:bg-black/70 transition-colors backdrop-blur-sm" aria-label="Zoom in">
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-md bg-black/50 border border-white/10 text-white/60 hover:text-white hover:bg-black/70 transition-colors backdrop-blur-sm" aria-label="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Driver name */}
      {isInTransit && (
        <div className="absolute bottom-3 left-3 z-10">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[11px] text-white/70">
            <Truck className="h-3 w-3 text-blue-400" />
            {route.driver}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sequential Stop Tracker ---------- */

function StopTracker({
  stops,
  selectedStopId,
  onSelectStop,
}: {
  stops: DeliveryStop[];
  selectedStopId: string | null;
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  return (
    <div className="relative pl-7">
      {/* Vertical line */}
      <div className="absolute left-[13px] top-1 bottom-1 w-0.5 bg-border" />

      {stops.map((stop, idx) => {
        const isDelivered = stop.status === 'delivered';
        const isCurrent = stop.status === 'in_transit';
        const isSelected = stop.id === selectedStopId;

        return (
          <motion.div
            key={stop.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.06, ease: 'easeOut' }}
            className={cn(
              'relative pb-4 last:pb-0 group cursor-pointer',
              isSelected && 'pb-5'
            )}
            onClick={() => onSelectStop(stop)}
          >
            {/* Marker circle */}
            <div className={cn(
              'absolute -left-7 top-0 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 z-10 transition-all',
              isDelivered
                ? 'border-green-500 bg-green-500 text-white'
                : isCurrent
                  ? 'border-blue-500 bg-blue-500 text-white animate-pulse'
                  : 'border-muted-foreground/30 bg-background text-muted-foreground/50',
              isSelected && 'ring-2 ring-primary/30 ring-offset-1'
            )}>
              {isDelivered ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : isCurrent ? (
                <Navigation className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3 w-3" />
              )}
            </div>

            {/* Stop card */}
            <div className={cn(
              'flex items-start justify-between rounded-lg border px-3 py-2.5 transition-all',
              isSelected
                ? 'border-primary/30 bg-primary/5 shadow-sm'
                : 'border-transparent hover:border-border hover:bg-muted/30'
            )}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={cn(
                    'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                    isDelivered ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : isCurrent ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {idx + 1}
                  </span>
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isDelivered ? 'text-foreground' : isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  )}>
                    {stop.customer}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate pl-7">{stop.address}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0 ml-3">
                <StatusBadge
                  status={isDelivered ? 'delivered' : isCurrent ? 'on_delivery' : 'pending'}
                  pulse={isCurrent}
                />
                {stop.deliveredAt && (
                  <span className="text-[10px] text-muted-foreground">{stop.deliveredAt.split(' ')[1]}</span>
                )}
                {!isDelivered && (
                  <span className="text-[10px] text-muted-foreground">ETA {stop.estimatedArrival}</span>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ---------- Proximity Combobox ---------- */

function ProximityCombobox({
  stops,
  onSelectStop,
}: {
  stops: DeliveryStop[];
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  const [open, setOpen] = useState(false);

  // Filter to only pending stops and sort by distance (nearest first)
  const pendingStops = useMemo(() => {
    return stops
      .filter(s => s.status === 'pending' || s.status === 'in_transit')
      .sort((a, b) => a.distanceFromPrev - b.distanceFromPrev);
  }, [stops]);

  const inTransitStop = stops.find(s => s.status === 'in_transit');

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Navigation className="h-4 w-4 text-muted-foreground" />
        Next Destination
      </h3>
      {pendingStops.length === 0 && !inTransitStop ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-6 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
          All stops completed
        </div>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between font-normal"
            >
              {inTransitStop
                ? (
                  <span className="flex items-center gap-2 text-left truncate">
                    <Navigation className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{inTransitStop.customer} — {inTransitStop.address.split(',')[0]}</span>
                  </span>
                )
                : (
                  <span className="flex items-center gap-2 text-left truncate">
                    <MapPinned className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">Select next destination...</span>
                  </span>
                )
              }
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search stops..." />
              <CommandList>
                <CommandEmpty>No stops found.</CommandEmpty>
                <CommandGroup heading="Upcoming Stops (nearest first)">
                  {pendingStops.map((stop) => (
                    <CommandItem
                      key={stop.id}
                      value={`${stop.customer} ${stop.address}`}
                      onSelect={() => {
                        onSelectStop(stop);
                        setOpen(false);
                      }}
                      className="flex-col items-start gap-1 py-2.5"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className={cn(
                          'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                          stop.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {stops.indexOf(stop) + 1}
                        </span>
                        <span className="font-medium text-sm truncate flex-1">{stop.customer}</span>
                        {stop.status === 'in_transit' && (
                          <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 shrink-0">Current</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 pl-7 text-xs text-muted-foreground">
                        <span className="truncate">{stop.address.split(',')[0]}</span>
                        <span className="shrink-0 flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {stop.distanceFromPrev} km
                        </span>
                        <span className="shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {stop.estimatedArrival}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/* ---------- Stop Details Panel ---------- */

function StopDetailPanel({
  stop,
  routeStatus,
  onMarkDelivered,
}: {
  stop: DeliveryStop | null;
  routeStatus: string;
  onMarkDelivered: () => void;
}) {
  // Find related order for items (hook-safe: before early return)
  const relatedOrder = stop ? orders.find(o => o.id === stop.orderId) : null;

  // Generate mock order items (hook-safe: before early return)
  const orderItems = useMemo(() => {
    if (!stop) return [];
    if (!relatedOrder) {
      const productNames = [
        'Widget Pro X200', 'Smart Sensor V3', 'Premium Widget XL',
        'Basic Connector Kit', 'USB-C Hub Adapter', 'Wireless Charger Pad',
        'Noise Cancelling Buds', 'Mechanical Keyboard',
      ];
      return productNames.slice(0, Math.min(stop.items, 6)).map((name, idx) => ({
        name,
        productId: `SKU-${String(idx + 1).padStart(3, '0')}`,
        qty: Math.max(1, Math.floor(stop.items / 3)),
        price: [149.99, 89.99, 249.99, 29.99, 44.99, 59.99, 129.99, 159.99][idx],
      }));
    }
    const productNames = [
      'Widget Pro X200', 'Smart Sensor V3', 'Premium Widget XL',
      'Basic Connector Kit', 'USB-C Hub Adapter', 'Wireless Charger Pad',
      'Noise Cancelling Buds', 'Mechanical Keyboard',
    ];
    return productNames.slice(0, Math.min(relatedOrder.items, 6)).map((name, idx) => ({
      name,
      productId: `SKU-${String(idx + 1).padStart(3, '0')}`,
      qty: Math.max(1, Math.floor(Math.random() * 5) + 1),
      price: [149.99, 89.99, 249.99, 29.99, 44.99, 59.99, 129.99, 159.99][idx],
    }));
  }, [stop, relatedOrder]);

  if (!stop) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MapPin className="h-8 w-8 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Select a stop to view details</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Click on a marker or timeline item</p>
      </div>
    );
  }

  const isCurrent = stop.status === 'in_transit';
  const isDelivered = stop.status === 'delivered';

  const itemsTotal = orderItems.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <div className="space-y-4">
      {/* Stop header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{stop.customer}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{stop.orderId}</p>
        </div>
        <StatusBadge
          status={isDelivered ? 'delivered' : isCurrent ? 'on_delivery' : 'pending'}
          pulse={isCurrent}
        />
      </div>

      <Separator />

      {/* Customer info */}
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="text-sm font-medium">{stop.address}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Estimated Arrival</p>
            <p className="text-sm font-medium">{stop.estimatedArrival}</p>
          </div>
        </div>

        {stop.deliveredAt && (
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Delivered At</p>
              <p className="text-sm font-medium">{stop.deliveredAt}</p>
            </div>
          </div>
        )}

        {stop.distanceFromPrev > 0 && (
          <div className="flex items-start gap-2.5">
            <Route className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Distance from Previous</p>
              <p className="text-sm font-medium">{stop.distanceFromPrev} km</p>
            </div>
          </div>
        )}
      </div>

      {/* Delivery notes */}
      {stop.notes && (
        <>
          <Separator />
          <div className="flex items-start gap-2.5">
            <StickyNote className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 flex-1">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Delivery Notes</p>
              <p className="text-sm text-amber-900 dark:text-amber-200">{stop.notes}</p>
            </div>
          </div>
        </>
      )}

      {/* Order items */}
      <Separator />
      <div className="space-y-3">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Order Items
          <Badge variant="secondary" className="text-[10px]">{stop.items} items</Badge>
        </h4>

        <div className="space-y-1.5">
          {orderItems.slice(0, 4).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-md border px-2.5 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.productId}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs font-semibold tabular-nums">${(item.qty * item.price).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">x{item.qty}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-2">
          <span className="text-xs font-medium text-muted-foreground">Stop Total</span>
          <span className="text-sm font-bold tabular-nums">${stop.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Mark as Delivered button */}
      {isCurrent && (
        <>
          <Separator />
          <Button className="w-full gap-2" onClick={onMarkDelivered}>
            <CheckCircle2 className="h-4 w-4" />
            Mark as Delivered
          </Button>
        </>
      )}
    </div>
  );
}

/* ---------- Driver Info Card ---------- */

function DriverInfoCard({ route }: { route: DeliveryRoute }) {
  const driver = drivers.find(d => d.name === route.driver);

  if (!driver) return null;

  const initials = route.driver.split(' ').map(n => n[0]).join('');

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        Driver
      </h3>

      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11">
          <AvatarFallback className={cn(
            route.status === 'in_transit'
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              : 'bg-muted text-primary'
          )}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{route.driver}</p>
          <Badge variant="outline" className={cn(
            'text-[10px]',
            driver.status === 'on_delivery' ? 'border-blue-200 text-blue-700 dark:text-blue-400'
              : driver.status === 'available' ? 'border-green-200 text-green-700 dark:text-green-400'
              : 'border-gray-200 text-gray-500 dark:text-gray-400'
          )}>
            {driver.status === 'on_delivery' ? 'On Delivery'
              : driver.status === 'available' ? 'Available' : 'Offline'}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{driver.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Truck className="h-3.5 w-3.5" />
          <span>{route.vehicle}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Rating</span>
          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {driver.rating}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Today&apos;s Deliveries</span>
          <span className="font-semibold">{driver.completedToday}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total Deliveries</span>
          <span className="font-semibold">{driver.totalDeliveries.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Route Summary ---------- */

function RouteSummary({ route }: { route: DeliveryRoute }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Hash className="h-4 w-4 text-muted-foreground" />
        Route Summary
      </h3>
      <div className="space-y-2.5">
        <div className="flex items-start gap-2.5">
          <Hash className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Route ID</p>
            <p className="text-sm font-mono font-semibold">{route.id}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Total Stops</p>
            <p className="text-sm font-medium">{route.stops.length} stops</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Route className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Total Distance</p>
            <p className="text-sm font-medium">{route.totalDistance} km</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Package className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-sm font-semibold tabular-nums">${route.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {route.startedAt && (
          <div className="flex items-start gap-2.5">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Started At</p>
              <p className="text-sm">{route.startedAt}</p>
            </div>
          </div>
        )}

        {route.completedAt && (
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Completed At</p>
              <p className="text-sm">{route.completedAt}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Main Delivery Detail Page ---------- */

export default function DeliveryDetailPage() {
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const selectedDeliveryId = usePageContext((s) => s.selectedDeliveryId);
  const returnTo = usePageContext((s) => s.returnTo);

  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [localStops, setLocalStops] = useState<DeliveryStop[] | null>(null);

  const delivery = useMemo(
    () => deliveries.find((d) => d.id === selectedDeliveryId),
    [selectedDeliveryId]
  );

  // Use local stops for mark-as-delivered functionality
  const routeStops = localStops || delivery?.stops || [];

  const handleGoBack = useCallback(() => {
    setCurrentView(returnTo === 'deliveries' ? 'deliveries' : 'deliveries');
  }, [setCurrentView, returnTo]);

  const handleSelectStop = useCallback((stop: DeliveryStop) => {
    setSelectedStop(stop);
  }, []);

  const handleMarkDelivered = useCallback(() => {
    if (!delivery || !selectedStop) return;
    const now = new Date();
    const deliveredAt = now.toISOString().slice(0, 16).replace('T', ' ');
    const updatedStops = routeStops.map(s =>
      s.id === selectedStop.id
        ? { ...s, status: 'delivered' as const, deliveredAt }
        : s
    );
    setLocalStops(updatedStops);
    // Also update the selected stop
    const updatedStop = updatedStops.find(s => s.id === selectedStop.id);
    setSelectedStop(updatedStop || null);
  }, [delivery, selectedStop, routeStops]);

  if (!delivery) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Delivery Not Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The delivery you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button className="mt-6 gap-2" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Deliveries
          </Button>
        </div>
      </PageTransition>
    );
  }

  const isActive = delivery.status === 'in_transit';
  const isDelivered = delivery.status === 'delivered';
  const deliveredCount = routeStops.filter(s => s.status === 'delivered').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back Button + Route Header */}
        <FadeIn>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                isActive ? 'bg-blue-100 dark:bg-blue-900/30'
                  : isDelivered ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              )}>
                <Truck className={cn(
                  'h-5 w-5',
                  isActive ? 'text-blue-600 dark:text-blue-400'
                    : isDelivered ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                )} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight">{delivery.id}</h1>
                  <StatusBadge
                    status={isActive ? 'on_delivery' : isDelivered ? 'delivered' : 'pending'}
                    pulse={isActive}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                  {delivery.driver} · {delivery.vehicle} · {deliveredCount}/{routeStops.length} stops delivered
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): GPS Map + Stop Tracker */}
          <div className="lg:col-span-2 space-y-6">
            {/* GPS Map */}
            <FadeIn delay={0.1}>
              <AnimatedCard contentClassName="p-0 overflow-hidden">
                <div className="p-4 pb-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {isActive ? 'Live GPS Tracking' : isDelivered ? 'Completed Route' : 'Planned Route'}
                  </h2>
                </div>
                <MultiStopGPSMap route={{ ...delivery, stops: routeStops }} onSelectStop={handleSelectStop} />
              </AnimatedCard>
            </FadeIn>

            {/* Stop Tracker */}
            <FadeIn delay={0.15}>
              <AnimatedCard>
                <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  Stop Tracker
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {deliveredCount}/{routeStops.length}
                  </Badge>
                </h2>
                <StopTracker
                  stops={routeStops}
                  selectedStopId={selectedStop?.id || null}
                  onSelectStop={handleSelectStop}
                />
              </AnimatedCard>
            </FadeIn>
          </div>

          {/* Right Column (1 col, sticky): Details */}
          <div className="space-y-6">
            <FadeIn delay={0.12}>
              <div className="lg:sticky lg:top-6 space-y-4">
                {/* Proximity Combobox */}
                <AnimatedCard>
                  <ProximityCombobox stops={routeStops} onSelectStop={handleSelectStop} />
                </AnimatedCard>

                {/* Selected Stop Details */}
                <AnimatedCard delay={0.15}>
                  <StopDetailPanel
                    stop={selectedStop}
                    routeStatus={delivery.status}
                    onMarkDelivered={handleMarkDelivered}
                  />
                </AnimatedCard>

                {/* Driver Info */}
                <AnimatedCard delay={0.18}>
                  <DriverInfoCard route={{ ...delivery, stops: routeStops }} />
                </AnimatedCard>

                {/* Route Summary */}
                <AnimatedCard delay={0.22}>
                  <RouteSummary route={{ ...delivery, stops: routeStops }} />
                </AnimatedCard>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
