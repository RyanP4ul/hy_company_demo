'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Package, MapPin, Clock, Search, StickyNote,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { orders, inventoryItems, type DeliveryStop, type DeliveryRoute } from '@/lib/mock-data';
import { formatPeso } from '@/lib/utils';

const ITEMS_PER_PAGE = 5;

interface DrawerProps {
  stop: DeliveryStop | null;
  route: DeliveryRoute | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StopDetailDrawer({ stop, route, open, onOpenChange }: DrawerProps) {
  const [itemSearch, setItemSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [prevStopId, setPrevStopId] = useState<string | undefined>(undefined);

  // Reset search and page when stop changes
  const stopId = stop?.id;
  if (stopId !== prevStopId) {
    setPrevStopId(stopId);
    if (itemSearch !== '') setItemSearch('');
    if (currentPage !== 1) setCurrentPage(1);
  }

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setItemSearch(e.target.value);
    setCurrentPage(1);
  }, []);

  const allItems = useMemo(() => {
    if (!stop) return [];
    const order = orders.find(o => o.id === stop.orderId);
    const count = order ? order.items : stop.items;
    const items: { name: string; sku: string; price: number; typeName: string; qty: number }[] = [];
    let remaining = count;
    for (const product of inventoryItems) {
      if (remaining <= 0) break;
      for (const type of product.types) {
        if (remaining <= 0) break;
        const qty = Math.max(1, Math.min(Math.floor((stop.items * (1 + items.length * 0.3)) / count) + 1, remaining));
        items.push({
          name: product.name,
          sku: product.id,
          price: type.price,
          typeName: type.name,
          qty,
        });
        remaining -= qty;
      }
    }
    return items;
  }, [stop]);

  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return allItems;
    const q = itemSearch.toLowerCase().trim();
    return allItems.filter(item => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
  }, [allItems, itemSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const pageItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (!stop || !route) return null;

  const isDelivered = stop.status === 'delivered';
  const total = stop.total.toFixed(2);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pr-6">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {stop.customer}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {stop.orderId} · {stop.address.split(',')[0]}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Stop info */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {isDelivered ? (
                <span>Delivered <span className="font-medium text-foreground">{stop.deliveredAt}</span></span>
              ) : (
                <span>ETA <span className="font-medium text-foreground">{stop.estimatedArrival}</span></span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate">{stop.address}</span>
            </div>
            {stop.notes && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <StickyNote className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Notes</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-200">{stop.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Order Items ({filteredItems.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search items..." value={itemSearch} onChange={handleSearchChange} className="pl-8 h-8 text-xs" />
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {pageItems.length === 0 && (
                <div className="text-center py-6 text-sm text-muted-foreground">No items found</div>
              )}
              {pageItems.map((item) => (
                <div key={`${item.sku}-${item.typeName}`} className="flex items-center justify-between rounded-md border px-2.5 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sku} · {item.typeName}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-semibold tabular-nums">{'\u20B1'} {(item.qty * item.price).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">x{item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Page {currentPage} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Order Total</span>
              <span className="text-sm font-bold tabular-nums">{'\u20B1'} {total}</span>
            </div>
          </div>

          <Separator />

          {/* Route Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route Summary</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div><p className="text-muted-foreground">Route ID</p><p className="font-medium font-mono">{route.id}</p></div>
              <div><p className="text-muted-foreground">Stops</p><p className="font-medium">{route.stops.length}</p></div>
              <div><p className="text-muted-foreground">Distance</p><p className="font-medium">{route.totalDistance} km</p></div>
              <div><p className="text-muted-foreground">Value</p><p className="font-semibold">{formatPeso(route.totalValue)}</p></div>
              {route.startedAt && <div><p className="text-muted-foreground">Started</p><p className="font-medium truncate">{route.startedAt}</p></div>}
              {route.completedAt && <div><p className="text-muted-foreground">Completed</p><p className="font-medium text-green-600 dark:text-green-400 truncate">{route.completedAt}</p></div>}
            </div>
          </div>

          {/* Payment */}
          <StopPaymentBadge orderId={stop.orderId} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StopPaymentBadge({ orderId }: { orderId: string }) {
  const payStatus = orders.find(o => o.id === orderId)?.paymentStatus;
  if (!payStatus) return null;
  return (
    <Badge variant={payStatus === 'paid' ? 'default' : 'destructive'} className="w-full justify-center py-1">
      {payStatus === 'paid' ? 'Paid' : 'Unpaid'}
    </Badge>
  );
}
