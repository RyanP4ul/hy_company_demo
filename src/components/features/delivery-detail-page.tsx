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
  Navigation,
  User,
  Phone,
  Hash,
  Route,
  AlertCircle,
  ChevronDown,
  Star,
  MapPinned,
  StickyNote,
  Warehouse,
  MessageSquare,
  XCircle,
  CalendarClock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { deliveries, type DeliveryRoute, type DeliveryStop, orders, drivers } from '@/lib/mock-data';
import { StatusBadge } from '@/components/shared/status-badge';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/* ================================================================
   CONSTANTS
   ================================================================ */

const MAP_POSITIONS: { x: number; y: number }[] = [
  { x: 40, y: 200 },
  { x: 130, y: 155 },
  { x: 220, y: 100 },
  { x: 310, y: 140 },
  { x: 400, y: 60 },
];

/* ================================================================
   JOURNEY STRIP — Horizontal dot-and-line progress
   ================================================================ */

function JourneyStrip({
  stops,
  selectedStopId,
  onSelectStop,
}: {
  stops: DeliveryStop[];
  selectedStopId: string | null;
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  return (
    <div className="overflow-x-auto pb-1 -mb-1">
      <div className="flex items-center gap-0 min-w-max px-1">
        {/* Warehouse origin */}
        <button
          className="flex flex-col items-center shrink-0 cursor-default"
          tabIndex={-1}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
            <Warehouse className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">Origin</span>
        </button>

        {stops.map((stop, idx) => {
          const isDelivered = stop.status === 'delivered';
          const isCurrent = stop.status === 'in_transit';
          const isSelected = stop.id === selectedStopId;

          return (
            <div key={stop.id} className="flex items-center shrink-0">
              {/* Connecting line */}
              <div className="w-8 h-0.5 -ml-0.5 -mr-0.5">
                <div
                  className={cn(
                    'w-full h-full rounded-full transition-colors',
                    isDelivered
                      ? 'bg-green-500'
                      : isCurrent
                        ? 'bg-blue-400'
                        : 'bg-border'
                  )}
                />
              </div>

              {/* Stop dot */}
              <button
                onClick={() => onSelectStop(stop)}
                className={cn(
                  'flex flex-col items-center shrink-0 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all border-2',
                    isDelivered
                      ? 'bg-green-500 border-green-500 text-white'
                      : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                        : isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'bg-background border-border text-muted-foreground group-hover:border-muted-foreground/40',
                  )}
                >
                  {isDelivered ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] mt-1 max-w-[60px] truncate transition-colors',
                    isSelected
                      ? 'text-foreground font-medium'
                      : isCurrent
                        ? 'text-blue-600 dark:text-blue-400 font-medium'
                        : isDelivered
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                  )}
                >
                  {stop.customer.split(' ')[0]}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   SIMPLIFIED GPS MAP — Light, clean design
   ================================================================ */

function SimplifiedGPSMap({
  route,
  onSelectStop,
}: {
  route: DeliveryRoute;
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  const isDelivered = route.status === 'delivered';
  const isPending = route.status === 'pending';
  const isInTransit = route.status === 'in_transit';

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
    if (route.stops.every(s => s.status === 'delivered')) return '';
    const pts: string[] = [];
    const fromIdx = route.stops.findIndex(s => s.status === 'in_transit');
    if (fromIdx >= 0) {
      pts.push(`${MAP_POSITIONS[fromIdx].x},${MAP_POSITIONS[fromIdx].y}`);
    } else {
      const firstPending = route.stops.findIndex(s => s.status === 'pending');
      if (firstPending >= 0) {
        pts.push(`${MAP_POSITIONS[firstPending].x},${MAP_POSITIONS[firstPending].y}`);
      }
    }
    const startIdx = route.stops.findIndex(s => s.status === 'in_transit');
    for (let i = (startIdx >= 0 ? startIdx : 0) + 1; i < route.stops.length; i++) {
      pts.push(`${MAP_POSITIONS[i + 1].x},${MAP_POSITIONS[i + 1].y}`);
    }
    return pts.join(' ');
  }, [route.stops]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-slate-100 dark:bg-slate-800"
      style={{ height: 320 }}
    >
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[40, 80, 120, 160, 200, 240, 280].map((y) => (
          <div
            key={`h-${y}`}
            className="absolute left-0 right-0 border-t border-slate-200/60 dark:border-slate-700/40"
            style={{ top: `${y * 0.46}px` }}
          />
        ))}
        {[70, 140, 210, 280, 350, 420].map((x) => (
          <div
            key={`v-${x}`}
            className="absolute top-0 bottom-0 border-l border-slate-200/60 dark:border-slate-700/40"
            style={{ left: `${x}px` }}
          />
        ))}
        {/* Subtle block shapes for map feel */}
        <div className="absolute top-[20px] left-[100px] w-[70px] h-[40px] rounded-md bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="absolute top-[80px] left-[220px] w-[50px] h-[60px] rounded-md bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="absolute top-[50px] left-[300px] w-[80px] h-[35px] rounded-md bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="absolute top-[130px] left-[150px] w-[60px] h-[45px] rounded-md bg-slate-200/50 dark:bg-slate-700/30" />
        <div className="absolute top-[160px] left-[330px] w-[50px] h-[40px] rounded-md bg-slate-200/50 dark:bg-slate-700/30" />
      </div>

      <svg
        viewBox="0 0 500 240"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Completed route line (solid green) */}
        {completedLinePoints && (
          <polyline
            points={completedLinePoints}
            fill="none"
            stroke="rgba(34,197,94,0.7)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Remaining route line (dashed blue) */}
        {remainingLinePoints && !isDelivered && (
          <polyline
            points={remainingLinePoints}
            fill="none"
            stroke="rgba(59,130,246,0.45)"
            strokeWidth="2.5"
            strokeDasharray="8,5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="26"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </polyline>
        )}

        {/* Pending-only full route (dashed gray) */}
        {isPending && (
          <polyline
            points={MAP_POSITIONS.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="2"
            strokeDasharray="6,6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Warehouse marker */}
        <g transform={`translate(${MAP_POSITIONS[0].x - 14}, ${MAP_POSITIONS[0].y - 12})`}>
          <rect
            x="0" y="0" width="28" height="22" rx="3"
            fill="rgba(148,163,184,0.2)"
            stroke="rgba(148,163,184,0.5)"
            strokeWidth="1"
          />
          <text x="14" y="15" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="9" fontWeight="600">
            W
          </text>
          <text x="14" y="34" textAnchor="middle" fill="rgba(100,116,139,0.5)" fontSize="8">
            Start
          </text>
        </g>

        {/* Stop markers */}
        {route.stops.map((stop, idx) => {
          const pos = MAP_POSITIONS[idx + 1];
          if (!pos) return null;
          const isThisDelivered = stop.status === 'delivered';
          const isThisCurrent = stop.status === 'in_transit';
          const isThisPending = stop.status === 'pending';

          return (
            <g key={stop.id} className="cursor-pointer" onClick={() => onSelectStop(stop)}>
              {/* Delivered: green filled */}
              {isThisDelivered && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="13" fill="rgba(34,197,94,0.15)" />
                  <circle cx={pos.x} cy={pos.y} r="11" fill="rgba(34,197,94,0.85)" />
                  <polyline
                    points={`${pos.x - 4},${pos.y} ${pos.x - 1},${pos.y + 3} ${pos.x + 4},${pos.y - 3}`}
                    fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                  <text x={pos.x} y={pos.y - 18} textAnchor="middle" fill="rgba(34,197,94,0.7)" fontSize="8" fontWeight="600">
                    Stop {idx + 1}
                  </text>
                </>
              )}

              {/* In transit: pulsing blue */}
              {isThisCurrent && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="10" fill="rgba(59,130,246,0.2)">
                    <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r="11" fill="rgba(59,130,246,0.85)" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                    {idx + 1}
                  </text>
                  <text x={pos.x} y={pos.y - 18} textAnchor="middle" fill="rgba(59,130,246,0.7)" fontSize="8" fontWeight="600">
                    Stop {idx + 1}
                  </text>
                </>
              )}

              {/* Pending: gray */}
              {isThisPending && (
                <>
                  <circle cx={pos.x} cy={pos.y} r="11" fill="rgba(148,163,184,0.15)" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" />
                  <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="10" fontWeight="600">
                    {idx + 1}
                  </text>
                  <text x={pos.x} y={pos.y - 18} textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="8" fontWeight="600">
                    Stop {idx + 1}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      {/* Route ID badge — top-left */}
      <div className="absolute top-3 left-3 z-10">
        <div className="rounded-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border px-2.5 py-1 text-xs font-mono font-semibold text-foreground">
          {route.id}
        </div>
      </div>

      {/* LIVE / Scheduled / Complete badge — top-right */}
      <div className="absolute top-3 right-3 z-10">
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
            isInTransit
              ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : isDelivered
                ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
          )}
        >
          {isInTransit && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
            </span>
          )}
          {isInTransit ? 'Live' : isDelivered ? 'Complete' : 'Scheduled'}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   STOP CARDS GRID — 2-column on desktop, 1-column on mobile
   ================================================================ */

function StopCardsGrid({
  stops,
  selectedStopId,
  onSelectStop,
}: {
  stops: DeliveryStop[];
  selectedStopId: string | null;
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {stops.map((stop, idx) => {
        const isDelivered = stop.status === 'delivered';
        const isCurrent = stop.status === 'in_transit';
        const isSelected = stop.id === selectedStopId;

        return (
          <motion.button
            key={stop.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04, ease: 'easeOut' }}
            onClick={() => onSelectStop(stop)}
            className={cn(
              'relative text-left rounded-lg border bg-card p-3.5 transition-all hover:shadow-sm cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isDelivered && 'border-l-2 border-l-green-500',
              isCurrent && 'border-l-2 border-l-blue-500',
              isSelected
                ? 'border-primary/40 shadow-sm ring-1 ring-primary/20'
                : 'border-border hover:border-muted-foreground/30',
            )}
          >
            {/* Pulse animation for in-transit */}
            {isCurrent && (
              <div className="absolute -left-[1px] top-3 bottom-3 w-0.5 bg-blue-400 rounded-full">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-pulse opacity-60" />
              </div>
            )}

            {/* Header row: number + name + status */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0',
                  isDelivered
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : isCurrent
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isDelivered ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  idx + 1
                )}
              </span>
              <p
                className={cn(
                  'text-sm font-medium truncate flex-1',
                  isCurrent ? 'text-foreground' : isDelivered ? 'text-foreground/80' : 'text-muted-foreground'
                )}
              >
                {stop.customer}
              </p>
              {isCurrent && (
                <Badge
                  variant="outline"
                  className="text-[9px] border-blue-200 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 shrink-0 animate-pulse"
                >
                  Active
                </Badge>
              )}
            </div>

            {/* Address */}
            <p className="text-xs text-muted-foreground truncate mb-2 pl-8">
              {stop.address}
            </p>

            {/* Meta row: items + value + time */}
            <div className="flex items-center gap-3 pl-8 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {stop.items}
              </span>
              <span className="font-medium tabular-nums">${stop.total.toFixed(0)}</span>

              {/* Notes indicator */}
              {stop.notes && (
                <span className="flex items-center gap-0.5 text-amber-500">
                  <MessageSquare className="h-3 w-3" />
                </span>
              )}

              <span className="ml-auto shrink-0">
                {isDelivered && stop.deliveredAt ? (
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {stop.deliveredAt.split(' ')[1] || stop.deliveredAt}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {stop.estimatedArrival}
                  </span>
                )}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ================================================================
   PROXIMITY COMBOBOX
   ================================================================ */

function ProximityCombobox({
  stops,
  onSelectStop,
}: {
  stops: DeliveryStop[];
  onSelectStop: (stop: DeliveryStop) => void;
}) {
  const [open, setOpen] = useState(false);

  const pendingStops = useMemo(() => {
    return stops
      .filter(s => s.status === 'pending' || s.status === 'in_transit')
      .sort((a, b) => a.distanceFromPrev - b.distanceFromPrev);
  }, [stops]);

  const inTransitStop = stops.find(s => s.status === 'in_transit');

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Navigation className="h-3.5 w-3.5" />
        Next Destination
      </h3>
      {pendingStops.length === 0 && !inTransitStop ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-5 text-sm text-muted-foreground">
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
              {inTransitStop ? (
                <span className="flex items-center gap-2 text-left truncate">
                  <Navigation className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">
                    {inTransitStop.customer} — {inTransitStop.address.split(',')[0]}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2 text-left truncate">
                  <MapPinned className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">Select next destination...</span>
                </span>
              )}
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
                        <span
                          className={cn(
                            'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                            stop.status === 'in_transit'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {stops.indexOf(stop) + 1}
                        </span>
                        <span className="font-medium text-sm truncate flex-1">{stop.customer}</span>
                        {stop.status === 'in_transit' && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-blue-200 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 shrink-0"
                          >
                            Current
                          </Badge>
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

/* ================================================================
   STOP DETAIL PANEL — Simplified
   ================================================================ */

function StopDetailPanel({
  stop,
  onMarkDelivered,
}: {
  stop: DeliveryStop | null;
  onMarkDelivered: () => void;
}) {
  const relatedOrder = stop ? orders.find(o => o.id === stop.orderId) : null;

  const orderItems = useMemo(() => {
    if (!stop) return [];
    const productNames = [
      'Widget Pro X200', 'Smart Sensor V3', 'Premium Widget XL',
      'Basic Connector Kit', 'USB-C Hub Adapter', 'Wireless Charger Pad',
      'Noise Cancelling Buds', 'Mechanical Keyboard',
    ];
    const count = relatedOrder ? relatedOrder.items : stop.items;
    return productNames.slice(0, Math.min(count, 6)).map((name, idx) => ({
      name,
      productId: `SKU-${String(idx + 1).padStart(3, '0')}`,
      qty: relatedOrder
        ? Math.max(1, Math.floor(Math.random() * 5) + 1)
        : Math.max(1, Math.floor(stop.items / 3)),
      price: [149.99, 89.99, 249.99, 29.99, 44.99, 59.99, 129.99, 159.99][idx],
    }));
  }, [stop, relatedOrder]);

  if (!stop) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MapPin className="h-7 w-7 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Select a stop to view details</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">
          Click on a map marker or card
        </p>
      </div>
    );
  }

  const isCurrent = stop.status === 'in_transit';
  const isDelivered = stop.status === 'delivered';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{stop.customer}</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">{stop.orderId}</p>
        </div>
        <StatusBadge
          status={isDelivered ? 'delivered' : isCurrent ? 'on_delivery' : 'pending'}
          pulse={isCurrent}
        />
      </div>

      {/* Info rows */}
      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-muted-foreground truncate">{stop.address}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          {isDelivered && stop.deliveredAt ? (
            <span>
              Delivered <span className="font-medium text-foreground">{stop.deliveredAt}</span>
            </span>
          ) : (
            <span>
              ETA <span className="font-medium text-foreground">{stop.estimatedArrival}</span>
            </span>
          )}
        </div>
      </div>

      {/* Delivery notes */}
      {stop.notes && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <StickyNote className="h-3.5 w-3.5 text-amber-500" />
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Notes
            </p>
          </div>
          <p className="text-sm text-amber-900 dark:text-amber-200">{stop.notes}</p>
        </div>
      )}

      {/* Order items */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Order Items ({stop.items})
        </p>
        <div className="space-y-1">
          {orderItems.slice(0, 4).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md border px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                  <Package className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.productId}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className="text-xs font-semibold tabular-nums">
                  ${(item.qty * item.price).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">x{item.qty}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-bold tabular-nums">${stop.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Mark as Delivered */}
      {isCurrent && (
        <Button className="w-full gap-2" onClick={onMarkDelivered}>
          <CheckCircle2 className="h-4 w-4" />
          Mark as Delivered
        </Button>
      )}
    </div>
  );
}

/* ================================================================
   DRIVER INFO CARD — Simplified compact layout
   ================================================================ */

function DriverInfoCard({ route }: { route: DeliveryRoute }) {
  const driver = drivers.find(d => d.name === route.driver);

  if (!driver) return null;

  const initials = route.driver
    .split(' ')
    .map(n => n[0])
    .join('');

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Driver
      </h3>

      {/* Compact horizontal: avatar + name + badge */}
      <div className="flex items-center gap-2.5">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            className={cn(
              route.status === 'in_transit'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-muted text-foreground'
            )}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{route.driver}</p>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              driver.status === 'on_delivery'
                ? 'border-blue-200 text-blue-700 dark:text-blue-400'
                : driver.status === 'available'
                  ? 'border-green-200 text-green-700 dark:text-green-400'
                  : 'border-gray-200 text-gray-500 dark:text-gray-400'
            )}
          >
            {driver.status === 'on_delivery'
              ? 'On Delivery'
              : driver.status === 'available'
                ? 'Available'
                : 'Offline'}
          </Badge>
        </div>
      </div>

      {/* Compact 2-column grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{driver.phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Truck className="h-3 w-3 shrink-0" />
          <span className="truncate">{route.vehicle}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
          <span className="font-medium text-amber-600 dark:text-amber-400">
            {driver.rating}
          </span>
        </div>
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground">{driver.completedToday}</span> today
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   ROUTE SUMMARY — Compact key-value grid
   ================================================================ */

function RouteSummary({ route }: { route: DeliveryRoute }) {
  const gridItems = useMemo(() => {
    const items: { label: string; value: string; className?: string }[] = [
      { label: 'Route ID', value: route.id, className: 'font-mono' },
      { label: 'Stops', value: `${route.stops.length}` },
      { label: 'Distance', value: `${route.totalDistance} km` },
      {
        label: 'Value',
        value: `$${route.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        className: 'font-semibold',
      },
    ];
    if (route.startedAt) items.push({ label: 'Started', value: route.startedAt });
    if (route.completedAt)
      items.push({
        label: 'Completed',
        value: route.completedAt,
        className: 'text-green-600 dark:text-green-400',
      });
    return items;
  }, [route]);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Route Summary
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {gridItems.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="text-muted-foreground">{item.label}</p>
            <p className={cn('font-medium truncate', item.className)}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   CANCEL ORDER DIALOG
   ================================================================ */

const CANCEL_REASONS = [
  { value: 'customer_request', label: 'Customer Request', icon: '👤' },
  { value: 'weather', label: 'Weather Conditions', icon: '🌧️' },
  { value: 'vehicle_issue', label: 'Vehicle Issue', icon: '🔧' },
  { value: 'traffic', label: 'Severe Traffic / Road Closure', icon: '🚧' },
  { value: 'stock_unavailable', label: 'Stock Unavailable', icon: '📦' },
  { value: 'duplicate', label: 'Duplicate Order', icon: '📋' },
  { value: 'other', label: 'Other', icon: '📝' },
];

function CancelOrderDialog({
  routeId,
  open,
  onOpenChange,
  onConfirm,
}: {
  routeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, notes: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!reason) return;
    const reasonLabel = CANCEL_REASONS.find(r => r.value === reason)?.label || reason;
    onConfirm(reasonLabel, notes);
    setReason('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancel Delivery
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel route <span className="font-semibold text-foreground">{routeId}</span>? This action will notify the driver and all customers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Reason Select */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason" className="text-sm font-medium">
              Cancellation Reason <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="cancel-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="flex items-center gap-2">
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="cancel-notes" className="text-sm font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="cancel-notes"
              placeholder="Provide any additional details about the cancellation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Warning Notice */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p className="font-medium">This action cannot be undone</p>
                <p className="mt-0.5 text-amber-600 dark:text-amber-400">
                  The driver and all customers on this route will be notified.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Keep Route
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason}
            className="flex-1 sm:flex-none gap-2"
          >
            <XCircle className="h-4 w-4" />
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================
   RESCHEDULE DIALOG
   ================================================================ */

function RescheduleDialog({
  routeId,
  currentSchedule,
  open,
  onOpenChange,
  onConfirm,
}: {
  routeId: string;
  currentSchedule: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newDate: string, newTime: string, reason: string) => void;
}) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!newDate) return;
    onConfirm(newDate, newTime, reason);
    setNewDate('');
    setNewTime('08:00');
    setReason('');
    onOpenChange(false);
  };

  // Default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-500" />
            Reschedule Delivery
          </DialogTitle>
          <DialogDescription>
            Reschedule route <span className="font-semibold text-foreground">{routeId}</span> to a new date and time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Schedule Info */}
          <div className="rounded-lg border bg-muted/40 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Current Schedule</p>
            <p className="text-sm font-medium mt-0.5">{currentSchedule || 'Not yet scheduled'}</p>
          </div>

          {/* New Date */}
          <div className="space-y-2">
            <Label htmlFor="reschedule-date" className="text-sm font-medium">
              New Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reschedule-date"
              type="date"
              min={minDate}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* New Time */}
          <div className="space-y-2">
            <Label htmlFor="reschedule-time" className="text-sm font-medium">
              Start Time
            </Label>
            <Input
              id="reschedule-time"
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Reason for Reschedule */}
          <div className="space-y-2">
            <Label htmlFor="reschedule-reason" className="text-sm font-medium">
              Reason for Reschedule (Optional)
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reschedule-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="weather">Weather Delay</SelectItem>
                <SelectItem value="driver_unavailable">Driver Unavailable</SelectItem>
                <SelectItem value="stock_not_ready">Stock Not Ready</SelectItem>
                <SelectItem value="high_demand">High Order Volume</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!newDate}
            className="flex-1 sm:flex-none gap-2"
          >
            <CalendarClock className="h-4 w-4" />
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Stop count for the cancel dialog warning — set dynamically
/* ================================================================
   MAIN DELIVERY DETAIL PAGE
   ================================================================ */

export default function DeliveryDetailPage() {
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const selectedDeliveryId = usePageContext((s) => s.selectedDeliveryId);
  const returnTo = usePageContext((s) => s.returnTo);

  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [localStops, setLocalStops] = useState<DeliveryStop[] | null>(null);
  const [localRouteStatus, setLocalRouteStatus] = useState<string | null>(null);
  const [localCancelledAt, setLocalCancelledAt] = useState<string | null>(null);
  const [localCancelReason, setLocalCancelReason] = useState<string | null>(null);
  const [localRescheduledDate, setLocalRescheduledDate] = useState<string | null>(null);

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);

  const delivery = useMemo(
    () => deliveries.find((d) => d.id === selectedDeliveryId),
    [selectedDeliveryId]
  );

  // Current schedule info for reschedule dialog
  const currentSchedule = useMemo(() => {
    if (!delivery) return '';
    if (delivery.startedAt) return delivery.startedAt;
    return delivery.stops[0]?.estimatedArrival || '';
  }, [delivery]);

  // Effective route status (local override or original)
  const routeStatus = localRouteStatus || delivery?.status || 'pending';
  const routeCancelledAt = localCancelledAt || delivery?.cancelledAt || null;
  const routeCancelReason = localCancelReason || delivery?.cancelReason || null;
  const routeRescheduledDate = localRescheduledDate || null;

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
    const updatedStop = updatedStops.find(s => s.id === selectedStop.id);
    setSelectedStop(updatedStop || null);
    toast.success(`Stop delivered: ${selectedStop.customer}`);
  }, [delivery, selectedStop, routeStops]);

  // Cancel Order handler
  const handleCancelOrder = useCallback((reason: string, notes: string) => {
    if (!delivery) return;
    const now = new Date();
    const cancelledAt = now.toISOString().slice(0, 16).replace('T', ' ');
    const fullReason = notes ? `${reason}: ${notes}` : reason;
    setLocalRouteStatus('cancelled');
    setLocalCancelledAt(cancelledAt);
    setLocalCancelReason(fullReason);
    toast.success(`Route ${delivery.id} has been cancelled`, {
      description: `Reason: ${reason}`,
    });
  }, [delivery]);

  // Reschedule handler
  const handleReschedule = useCallback((newDate: string, newTime: string, reason: string) => {
    if (!delivery) return;
    const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    const formattedTime = new Date(`2000-01-01T${newTime}`).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
    const scheduledDate = `${formattedDate} at ${formattedTime}`;
    setLocalRescheduledDate(scheduledDate);
    const reasonText = reason ? ` (${reason.replace(/_/g, ' ')})` : '';
    toast.success(`Route ${delivery.id} rescheduled`, {
      description: `New schedule: ${scheduledDate}${reasonText}`,
    });
  }, [delivery]);

  // Determine if actions should be shown
  const canCancelOrReschedule = routeStatus === 'pending' || routeStatus === 'in_transit';
  const isCancelled = routeStatus === 'cancelled';
  const isDeliveredRoute = routeStatus === 'delivered';
  const isActive = routeStatus === 'in_transit';
  const isPending = routeStatus === 'pending';

  // ---------- Not Found State ----------
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

  const deliveredCount = routeStops.filter(s => s.status === 'delivered').length;

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* ====== TOP SECTION: Route Header Bar ====== */}
        <FadeIn>
          <div className="space-y-3">
            {/* Line 1: Back + Route ID + Status + Driver + Vehicle */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <h1 className="text-lg font-bold tracking-tight shrink-0">{delivery.id}</h1>

              <StatusBadge
                status={isCancelled ? 'cancelled' : isActive ? 'on_delivery' : isPending ? 'pending' : 'delivered'}
                pulse={isActive}
              />

              {/* Action Buttons — Cancel / Reschedule */}
              {canCancelOrReschedule && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex gap-1.5 text-xs h-8 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    onClick={() => setRescheduleDialogOpen(true)}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex gap-1.5 text-xs h-8 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancel Order
                  </Button>
                </div>
              )}

              {/* Cancelled badge */}
              {isCancelled && (
                <div className="ml-auto">
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 gap-1">
                    <XCircle className="h-3 w-3" />
                    Cancelled
                  </Badge>
                </div>
              )}

              {/* Rescheduled badge */}
              {routeRescheduledDate && canCancelOrReschedule && (
                <div className="ml-auto">
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400 gap-1">
                    <CalendarClock className="h-3 w-3" />
                    Rescheduled
                  </Badge>
                </div>
              )}

              {/* Delivered badge */}
              {isDeliveredRoute && (
                <div className="ml-auto">
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </Badge>
                </div>
              )}

              <div className="hidden sm:flex items-center gap-1.5 ml-2 text-sm text-muted-foreground shrink-0">
                <User className="h-3.5 w-3.5" />
                <span>{delivery.driver}</span>
                <Separator orientation="vertical" className="h-4 mx-1" />
                <Truck className="h-3.5 w-3.5" />
                <span>{delivery.vehicle}</span>
              </div>
            </div>

            {/* Mobile driver/vehicle info + mobile action buttons */}
            <div className="flex sm:hidden items-center justify-between pl-11 pr-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{delivery.driver}</span>
                <span className="mx-1">·</span>
                <Truck className="h-3 w-3" />
                <span>{delivery.vehicle}</span>
              </div>
              {canCancelOrReschedule && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                    onClick={() => setRescheduleDialogOpen(true)}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Cancelled Info Banner */}
            {isCancelled && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 px-3.5 py-2.5">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">
                      This delivery has been cancelled
                    </p>
                    {routeCancelReason && (
                      <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
                        Reason: {routeCancelReason}
                      </p>
                    )}
                    {routeCancelledAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Cancelled at: {routeCancelledAt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rescheduled Info Banner */}
            {routeRescheduledDate && canCancelOrReschedule && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 px-3.5 py-2.5">
                <div className="flex items-start gap-2">
                  <CalendarClock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      Delivery rescheduled
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400/80 mt-0.5">
                      New schedule: {routeRescheduledDate}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isCancelled && (
              <JourneyStrip
                stops={routeStops}
                selectedStopId={selectedStop?.id || null}
                onSelectStop={handleSelectStop}
              />
            )}
          </div>
        </FadeIn>

        <Separator />

        {/* ====== 2-COLUMN LAYOUT ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Map + Stop Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Simplified GPS Map */}
            <FadeIn delay={0.05}>
              <SimplifiedGPSMap
                route={{ ...delivery, stops: routeStops }}
                onSelectStop={handleSelectStop}
              />
            </FadeIn>

            {/* Stop Cards Grid */}
            <FadeIn delay={0.1}>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold">Stops</h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {deliveredCount}/{routeStops.length} delivered
                  </Badge>
                </div>
                <StopCardsGrid
                  stops={routeStops}
                  selectedStopId={selectedStop?.id || null}
                  onSelectStop={handleSelectStop}
                />
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Detail Panel (sticky) */}
          <div className="lg:col-span-1">
            <FadeIn delay={0.08}>
              <div className="lg:sticky lg:top-6 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 custom-scrollbar">
                {/* Proximity Combobox */}
                <div className="rounded-xl border bg-card p-4">
                  <ProximityCombobox stops={routeStops} onSelectStop={handleSelectStop} />
                </div>

                {/* Stop Detail Panel */}
                <div className="rounded-xl border bg-card p-4">
                  <StopDetailPanel
                    stop={selectedStop}
                    onMarkDelivered={handleMarkDelivered}
                  />
                </div>

                {/* Driver Info */}
                <div className="rounded-xl border bg-card p-4">
                  <DriverInfoCard route={{ ...delivery, stops: routeStops }} />
                </div>

                {/* Route Summary */}
                <div className="rounded-xl border bg-card p-4">
                  <RouteSummary route={{ ...delivery, stops: routeStops }} />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        routeId={delivery.id}
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelOrder}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        routeId={delivery.id}
        currentSchedule={currentSchedule}
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        onConfirm={handleReschedule}
      />
    </PageTransition>
  );
}
