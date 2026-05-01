'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Truck,
  Package,
  MapPin,
  Clock,
  BoxIcon,
  Search,
  Check,
  AlertCircle,
  UserCheck,
  Phone,
  Route,
  ChevronRight,
  Bike,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatPeso, formatNumber } from '@/lib/utils';

import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { orders as allOrders, drivers, customers, type DeliveryRoute, type DeliveryStop } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Order = (typeof allOrders)[number];
type Driver = (typeof drivers)[number];
type Customer = (typeof customers)[number];

// Helper: find customer by order customer name
function findCustomer(orderCustomer: string): Customer | undefined {
  return customers.find((c) => c.name === orderCustomer);
}

// Only show orders that can be delivered (pending or processing)
const eligibleStatuses: Order['status'][] = ['pending', 'processing'];

export default function CreateDeliveryPage() {
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const returnTo = usePageContext((s) => s.returnTo);

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter eligible orders
  const eligibleOrders = useMemo(() => {
    return allOrders.filter((o) => eligibleStatuses.includes(o.status));
  }, []);

  // Further filter by search and status
  const filteredOrders = useMemo(() => {
    let result = eligibleOrders;

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q)
      );
    }

    return result;
  }, [eligibleOrders, searchQuery, statusFilter]);

  // Available drivers (not offline)
  const availableDrivers = useMemo(() => {
    return drivers.filter((d) => d.status !== 'offline');
  }, []);

  const selectedDriver = useMemo(() => {
    if (!selectedDriverId) return null;
    return drivers.find((d) => d.id === selectedDriverId) ?? null;
  }, [selectedDriverId]);

  // Selected orders with enriched data
  const selectedOrders = useMemo(() => {
    return filteredOrders
      .filter((o) => selectedOrderIds.has(o.id))
      .map((order) => {
        const cust = findCustomer(order.customer);
        return { order, customer: cust ?? null };
      });
  }, [filteredOrders, selectedOrderIds]);

  // Summary calculations
  const totalItems = selectedOrders.reduce((sum, { order }) => sum + order.items, 0);
  const totalValue = selectedOrders.reduce((sum, { order }) => sum + order.total, 0);

  // Toggle order selection
  const toggleOrder = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  // Select all visible
  const selectAllVisible = useCallback(() => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      filteredOrders.forEach((o) => next.add(o.id));
      return next;
    });
  }, [filteredOrders]);

  // Deselect all
  const deselectAll = useCallback(() => {
    setSelectedOrderIds(new Set());
  }, []);

  // Submit delivery
  const handleSubmit = useCallback(() => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order to deliver');
      return;
    }
    if (!selectedDriverId) {
      toast.error('Please assign a driver');
      return;
    }

    const driver = drivers.find((d) => d.id === selectedDriverId);
    if (!driver) return;

    // Generate route ID
    const maxDelNum = 1092; // from mock data
    const newRouteId = `DEL-${maxDelNum + 1}`;

    // Build stops from selected orders
    const now = new Date();
    const baseTime = new Date(now);
    baseTime.setHours(9, 0, 0, 0);

    const stops: DeliveryStop[] = selectedOrders.map(({ order, customer }, index) => {
      const estArrival = new Date(baseTime.getTime() + index * 90 * 60 * 1000);
      const hours = estArrival.getHours();
      const minutes = estArrival.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const eta = `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;

      return {
        id: `S-${Date.now()}-${index}`,
        orderId: order.id,
        customer: order.customer,
        address: customer?.address ?? `${index + 1} Delivery St, City, State`,
        status: 'pending' as const,
        items: order.items,
        total: order.total,
        deliveredAt: null,
        distanceFromPrev: index === 0 ? 10.5 + Math.random() * 5 : 5 + Math.random() * 8,
        estimatedArrival: eta,
      };
    });

    const totalDistance = stops.reduce((sum, s) => sum + s.distanceFromPrev, 0);

    const newRoute: DeliveryRoute = {
      id: newRouteId,
      driver: driver.name,
      vehicle: driver.vehicle,
      status: 'pending',
      stops,
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      totalOrders: stops.length,
      totalValue: parseFloat(totalValue.toFixed(2)),
      startedAt: null,
      completedAt: null,
      currentStopIndex: 0,
    };

    // Dispatch delivery:created event so deliveries-page can pick it up
    const deliveryEvent = new CustomEvent('delivery:created', {
      detail: {
        route: newRoute,
        orderIds: Array.from(selectedOrderIds),
      },
    });
    window.dispatchEvent(deliveryEvent);

    toast.success(
      `Delivery ${newRouteId} created with ${stops.length} stops for ${driver.name}`
    );
    setCurrentView('deliveries');
  }, [selectedOrders, selectedOrderIds, selectedDriverId, totalValue, setCurrentView]);

  const handleGoBack = useCallback(() => {
    setCurrentView(returnTo === 'deliveries' ? 'deliveries' : 'deliveries');
  }, [returnTo, setCurrentView]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Create Delivery
                </h1>
                <p className="text-sm text-muted-foreground">
                  Select orders, assign a driver &amp; create a delivery route
                </p>
              </div>
            </div>
            <Button
              className="gap-2"
              onClick={handleSubmit}
              disabled={selectedOrders.length === 0 || !selectedDriverId}
            >
              <Route className="h-4 w-4" />
              Create Route
            </Button>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filters */}
            <FadeIn delay={0.05}>
              <AnimatedCard>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      Select Orders to Deliver
                    </h2>
                    <div className="flex items-center gap-2">
                      {selectedOrderIds.size > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          {selectedOrderIds.size} selected
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={selectAllVisible}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={deselectAll}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search by order ID or customer..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AnimatedCard>
            </FadeIn>

            {/* Order List */}
            <FadeIn delay={0.1}>
              <div className="space-y-2">
                {filteredOrders.length === 0 ? (
                  <AnimatedCard>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No eligible orders found
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Only pending or processing orders can be assigned to a delivery
                      </p>
                    </div>
                  </AnimatedCard>
                ) : (
                  <StaggerContainer staggerDelay={0.03}>
                    {filteredOrders.map((order) => {
                      const isSelected = selectedOrderIds.has(order.id);
                      const customer = findCustomer(order.customer);

                      return (
                        <StaggerItem key={order.id}>
                          <motion.div
                            layout
                            className={cn(
                              'rounded-lg border bg-background p-4 cursor-pointer transition-all duration-150 hover:shadow-sm',
                              isSelected
                                ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                : 'hover:border-border/80'
                            )}
                            onClick={() => toggleOrder(order.id)}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className="pt-0.5">
                                <div
                                  className={cn(
                                    'flex h-5 w-5 items-center justify-center rounded border-2 transition-colors',
                                    isSelected
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-muted-foreground/30 bg-background'
                                  )}
                                >
                                  {isSelected && <Check className="h-3 w-3" />}
                                </div>
                              </div>

                              {/* Order Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-semibold text-primary">
                                    {order.id}
                                  </span>
                                  <StatusBadge status={order.status} />
                                  <PriorityBadge priority={order.priority} />
                                  {(() => {
                                    const dt = (order as Record<string, unknown>).deliveryType as string | undefined;
                                    if (dt === 'lalamove') {
                                      return (
                                        <Badge variant="outline" className="gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800 text-[10px]">
                                          <Bike className="h-3 w-3" />
                                          Lalamove
                                        </Badge>
                                      );
                                    }
                                    return (
                                      <Badge variant="outline" className="gap-1 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800 text-[10px]">
                                        <Truck className="h-3 w-3" />
                                        Truck
                                      </Badge>
                                    );
                                  })()}
                                </div>

                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {order.customer
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')
                                      .slice(0, 2)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {order.customer}
                                    </p>
                                    {customer && (
                                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1 truncate">
                                          <MapPin className="h-3 w-3 shrink-0" />
                                          {customer.address}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Stats Row */}
                                <div className="flex items-center gap-4 mt-2.5 ml-9 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <BoxIcon className="h-3 w-3" />
                                    {order.items} items
                                  </span>
                                  <span className="flex items-center gap-1 font-semibold text-foreground">
                                    <span className="text-xs">₱</span>
                                    {formatNumber(order.total)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {order.date}
                                  </span>
                                </div>
                              </div>

                              {/* Arrow indicator */}
                              <div className="pt-1">
                                <ChevronRight
                                  className={cn(
                                    'h-4 w-4 transition-colors',
                                    isSelected
                                      ? 'text-primary'
                                      : 'text-muted-foreground/30'
                                  )}
                                />
                              </div>
                            </div>
                          </motion.div>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Right Column: Delivery Summary */}
          <div className="space-y-6">
            <FadeIn delay={0.15}>
              <div className="sticky top-6 space-y-4">
                {/* Driver Assignment */}
                <AnimatedCard>
                  <div className="space-y-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      Assign Driver
                    </h2>

                    <div className="space-y-2">
                      <Label htmlFor="driver-select">
                        Driver <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={selectedDriverId}
                        onValueChange={setSelectedDriverId}
                      >
                        <SelectTrigger id="driver-select">
                          <SelectValue placeholder="Select a driver..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              <span className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'h-2 w-2 rounded-full',
                                    driver.status === 'available'
                                      ? 'bg-green-500'
                                      : 'bg-blue-500'
                                  )}
                                />
                                <span>{driver.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({driver.vehicle})
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Selected Driver Card */}
                    {selectedDriver && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className="rounded-lg border bg-muted/30 p-3 space-y-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {selectedDriver.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {selectedDriver.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {selectedDriver.vehicle}
                            </p>
                          </div>
                          <StatusBadge
                            status={selectedDriver.status === 'available' ? 'available' : 'on_delivery'}
                            pulse={selectedDriver.status === 'on_delivery'}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-[52px]">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{selectedDriver.phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Truck className="h-3 w-3 shrink-0" />
                            <span>{selectedDriver.completedToday} today</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {!selectedDriverId && (
                      <p className="text-xs text-muted-foreground">
                        Select a driver to assign this delivery route
                      </p>
                    )}
                  </div>
                </AnimatedCard>

                {/* Route Summary */}
                <AnimatedCard>
                  <div className="space-y-4">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Route className="h-4 w-4 text-muted-foreground" />
                      Route Summary
                    </h2>

                    {/* Validation warnings */}
                    {selectedOrders.length === 0 && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>Select at least one order from the list</span>
                      </div>
                    )}

                    {selectedOrders.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Orders
                          </span>
                          <span className="font-medium">
                            {selectedOrders.length} stops
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total Items
                          </span>
                          <span className="font-medium">{totalItems}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Total Value
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatPeso(totalValue)}
                          </span>
                        </div>

                        <Separator />

                        {/* Selected Orders Detail */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Delivery Stops
                          </p>
                          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                            <AnimatePresence>
                              {selectedOrders.map(({ order, customer }, idx) => (
                                <motion.div
                                  key={order.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  transition={{ duration: 0.15 }}
                                  className="flex items-start gap-2 rounded-md border p-2.5"
                                >
                                  {/* Stop number */}
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-semibold font-mono text-primary">
                                        {order.id}
                                      </span>
                                      <StatusBadge status={order.status} />
                                      {(() => {
                                        const dt = (order as Record<string, unknown>).deliveryType as string | undefined;
                                        if (dt === 'lalamove') {
                                          return (
                                            <Badge variant="outline" className="gap-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800 text-[10px] px-1 py-0">
                                              <Bike className="h-2.5 w-2.5" />
                                              Lalamove
                                            </Badge>
                                          );
                                        }
                                        return (
                                          <Badge variant="outline" className="gap-0.5 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800 text-[10px] px-1 py-0">
                                            <Truck className="h-2.5 w-2.5" />
                                            Truck
                                          </Badge>
                                        );
                                      })()}
                                    </div>
                                    <p className="text-sm font-medium truncate">
                                      {order.customer}
                                    </p>
                                    {customer && (
                                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        {customer.address}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <BoxIcon className="h-3 w-3" />
                                        {order.items} items
                                      </span>
                                      <span className="flex items-center gap-1 font-medium text-foreground">
                                        <span className="text-xs">₱</span>
                                        {formatNumber(order.total)}
                                      </span>
                                    </div>
                                  </div>
                                  {/* Remove button */}
                                  <button
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors mt-0.5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleOrder(order.id);
                                    }}
                                    aria-label={`Remove ${order.id}`}
                                  >
                                    ×
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      className="w-full gap-2"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={selectedOrders.length === 0 || !selectedDriverId}
                    >
                      <Route className="h-4 w-4" />
                      Create Delivery Route
                      {selectedOrders.length > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-5 px-1.5"
                        >
                          {selectedOrders.length}
                        </Badge>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleGoBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </AnimatedCard>

                {/* Tips */}
                <AnimatedCard delay={0.2}>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Tips
                    </h3>
                    <ul className="text-xs text-muted-foreground/80 space-y-1.5">
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        Select multiple orders to create a multi-stop route
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        Only pending/processing orders are available
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        Order statuses will update to &quot;Shipped&quot; automatically
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        The driver will deliver to each customer in sequence
                      </li>
                    </ul>
                  </div>
                </AnimatedCard>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
