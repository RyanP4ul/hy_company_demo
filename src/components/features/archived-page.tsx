'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Archive,
  Package,
  ShoppingCart,
  Truck,
  Users,
  UserCheck,
  Search,
  RotateCcw,
  Trash2,
  XCircle,
  Inbox,
  Eye,
  Phone,
  Mail,
  MapPin,
  Star,
  Clock,
  Warehouse,
  BarChart3,
  Navigation,
  Calendar,
  Hash,
  User,
  Shield,
  Gauge,
  CheckCircle2,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/peso-sign';
import { toast } from 'sonner';
import { formatDistanceToNow, parseISO } from 'date-fns';

import { useArchiveStore, type ArchivedEntityType, type ArchivedItem } from '@/stores/archive';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn, formatPeso } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Type configuration
// ---------------------------------------------------------------------------
const typeConfig: Record<
  ArchivedEntityType,
  {
    label: string;
    color: string;
    badgeClass: string;
    iconClass: string;
    icon: React.ElementType;
  }
> = {
  inventory: {
    label: 'Inventory',
    color: 'text-orange-600 dark:text-orange-400',
    badgeClass: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
    iconClass: 'text-orange-600 dark:text-orange-400',
    icon: Package,
  },
  order: {
    label: 'Order',
    color: 'text-blue-600 dark:text-blue-400',
    badgeClass: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    iconClass: 'text-blue-600 dark:text-blue-400',
    icon: ShoppingCart,
  },
  delivery: {
    label: 'Delivery',
    color: 'text-green-600 dark:text-green-400',
    badgeClass: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
    iconClass: 'text-green-600 dark:text-green-400',
    icon: Truck,
  },
  user: {
    label: 'User',
    color: 'text-purple-600 dark:text-purple-400',
    badgeClass: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
    iconClass: 'text-purple-600 dark:text-purple-400',
    icon: Users,
  },
  driver: {
    label: 'Driver',
    color: 'text-amber-600 dark:text-amber-400',
    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    iconClass: 'text-amber-600 dark:text-amber-400',
    icon: UserCheck,
  },
};

const allTypes: ArchivedEntityType[] = ['inventory', 'order', 'delivery', 'user', 'driver'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatArchivedDate(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

function getInitials(name: string): string {
  return name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function DetailRow({ icon: Icon, label, value, mono }: { icon?: React.ElementType; label: string; value: string | number | null | undefined; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <span className={cn('text-sm font-medium', mono && 'font-mono text-xs')}>{String(value)}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail View Components — one per entity type
// ---------------------------------------------------------------------------

function InventoryDetailView({ data }: { data: Record<string, unknown> }) {
  const statusColors: Record<string, string> = {
    in_stock: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
    low_stock: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    out_of_stock: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
          <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="font-semibold">{String(data.name)}</h3>
          <p className="text-xs text-muted-foreground font-mono">{String(data.id)}</p>
        </div>
      </div>
      <Separator />
      <DetailRow icon={Hash} label="Warehouse" value={String(data.warehouse)} />
      <DetailRow icon={BarChart3} label="Types" value={String(data.types ? `${(data.types as unknown[]).length} type(s)` : '-')} />
      <DetailRow icon={Package} label="Status" value={data.status ? String(data.status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : undefined} />
      <DetailRow icon={Calendar} label="Last Updated" value={String(data.lastUpdated)} />
      {data.status && (
        <div className="pt-2">
          <Badge variant="outline" className={statusColors[String(data.status)] || ''}>
            {String(data.status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        </div>
      )}
    </div>
  );
}

function OrderDetailView({ data }: { data: Record<string, unknown> }) {
  const priorityColors: Record<string, string> = {
    high: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
    medium: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    low: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  };
  const statusColors: Record<string, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
    processing: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    shipped: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
    delivered: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
    cancelled: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="font-semibold">{String(data.customer)}</h3>
          <p className="text-xs text-muted-foreground font-mono">{String(data.id)}</p>
        </div>
      </div>
      <Separator />
      <DetailRow icon={Package} label="Items" value={data.items ? `${data.items} items` : undefined} />
      <DetailRow icon={PesoSign} label="Total" value={data.total ? formatPeso(Number(data.total)) : undefined} />
      <DetailRow icon={Calendar} label="Date" value={String(data.date)} />
      <div className="flex items-center gap-3 pt-2">
        {data.status && (
          <Badge variant="outline" className={statusColors[String(data.status)] || ''}>
            {String(data.status).charAt(0).toUpperCase() + String(data.status).slice(1)}
          </Badge>
        )}
        {data.priority && (
          <Badge variant="outline" className={priorityColors[String(data.priority)] || ''}>
            {String(data.priority).charAt(0).toUpperCase() + String(data.priority).slice(1)}
          </Badge>
        )}
      </div>
      {data.driverName && (
        <div className="pt-2">
          <DetailRow icon={Truck} label="Assigned Driver" value={String(data.driverName)} />
        </div>
      )}
    </div>
  );
}

function DeliveryDetailView({ data }: { data: Record<string, unknown> }) {
  const progress = typeof data.progress === 'number' ? data.progress : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
          <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="font-semibold">{String(data.id)}</h3>
          <p className="text-xs text-muted-foreground">Order: {String(data.orderId)}</p>
        </div>
      </div>
      <Separator />
      <DetailRow icon={User} label="Driver" value={String(data.driver)} />
      <DetailRow icon={MapPin} label="Destination" value={String(data.destination)} />
      <DetailRow icon={Clock} label="ETA" value={String(data.eta)} />
      <DetailRow icon={Gauge} label="Progress" value={`${progress}%`} />

      {/* Progress bar */}
      <div className="pt-2">
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <DetailRow icon={Clock} label="Started At" value={data.startedAt ? String(data.startedAt) : 'Not started'} />
      <DetailRow icon={CheckCircle2} label="Completed At" value={data.completedAt ? String(data.completedAt) : 'N/A'} />
    </div>
  );
}

function UserDetailView({ data }: { data: Record<string, unknown> }) {
  const roleColors: Record<string, string> = {
    Admin: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
    Manager: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    Staff: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
    Driver: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
    Viewer: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
          <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
            {getInitials(String(data.name))}
          </span>
        </div>
        <div>
          <h3 className="font-semibold">{String(data.name)}</h3>
          <p className="text-xs text-muted-foreground font-mono">{String(data.id)}</p>
        </div>
      </div>
      <Separator />
      <DetailRow icon={Mail} label="Email" value={String(data.email)} />
      <DetailRow icon={Shield} label="Role" value={String(data.role)} />
      <DetailRow icon={Clock} label="Last Active" value={String(data.lastActive)} />
      {data.role && (
        <div className="pt-2">
          <Badge variant="outline" className={roleColors[String(data.role)] || ''}>
            {String(data.role)}
          </Badge>
        </div>
      )}
    </div>
  );
}

function DriverDetailView({ data }: { data: Record<string, unknown> }) {
  const rating = typeof data.rating === 'number' ? data.rating : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {getInitials(String(data.name))}
          </span>
        </div>
        <div>
          <h3 className="font-semibold">{String(data.name)}</h3>
          <p className="text-xs text-muted-foreground font-mono">{String(data.id)}</p>
        </div>
      </div>
      <Separator />
      <DetailRow icon={Phone} label="Phone" value={String(data.phone)} />
      <DetailRow icon={Truck} label="Vehicle" value={String(data.vehicle)} />
      <DetailRow icon={Package} label="Completed Today" value={data.completedToday ? Number(data.completedToday) : undefined} />
      <DetailRow icon={Navigation} label="Total Deliveries" value={data.totalDeliveries ? Number(data.totalDeliveries).toLocaleString() : undefined} />

      {/* Star rating */}
      <div className="flex items-center justify-between py-2.5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-3.5 w-3.5" />
          Rating
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                'h-3.5',
                i < Math.floor(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : i < rating
                    ? 'fill-yellow-400/50 text-yellow-400'
                    : 'fill-none text-muted-foreground/30'
              )}
            />
          ))}
          <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
        </div>
      </div>

      {data.status && (
        <div className="pt-2">
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {String(data.status).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Badge>
        </div>
      )}
    </div>
  );
}

// Map type → detail component
const detailViews: Record<ArchivedEntityType, React.ComponentType<{ data: Record<string, unknown> }>> = {
  inventory: InventoryDetailView,
  order: OrderDetailView,
  delivery: DeliveryDetailView,
  user: UserDetailView,
  driver: DriverDetailView,
};

// ---------------------------------------------------------------------------
// Main Archived Page
// ---------------------------------------------------------------------------
export default function ArchivedPage() {
  const { items, restoreItem, permanentlyDelete, clearAll } = useArchiveStore();

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [restoreTarget, setRestoreTarget] = useState<ArchivedItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ArchivedItem | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [viewingItem, setViewingItem] = useState<ArchivedItem | null>(null);

  // ------- Derived data -------
  const countsByType = useMemo(() => {
    const counts: Record<ArchivedEntityType, number> = {
      inventory: 0, order: 0, delivery: 0, user: 0, driver: 0,
    };
    for (const item of items) counts[item.type]++;
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (typeFilter !== 'all') {
      result = result.filter((item) => item.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, typeFilter, searchQuery]);

  // ------- Handlers -------
  const confirmRestore = useCallback(() => {
    if (!restoreTarget) return;
    const restored = restoreItem(restoreTarget.type, restoreTarget.id);
    if (restored) {
      window.dispatchEvent(
        new CustomEvent('archive:restored', {
          detail: { type: restored.type, id: restored.id, data: restored.data },
        })
      );
      toast.success('Item restored');
      setViewingItem(null);
    }
    setRestoreTarget(null);
  }, [restoreTarget, restoreItem]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    permanentlyDelete(deleteTarget.type, deleteTarget.id);
    toast.success('Item permanently deleted');
    setDeleteTarget(null);
  }, [deleteTarget, permanentlyDelete]);

  const handleClearAll = useCallback(() => {
    if (typeFilter !== 'all') {
      clearAll(typeFilter as ArchivedEntityType);
      toast.success(`${typeConfig[typeFilter as ArchivedEntityType].label} archive cleared`);
    } else {
      clearAll();
      toast.success('All archived items cleared');
    }
    setShowClearAllDialog(false);
  }, [typeFilter, clearAll]);

  // Detail view component for the viewing item
  const DetailComponent = viewingItem ? detailViews[viewingItem.type] : null;
  const viewingConfig = viewingItem ? typeConfig[viewingItem.type] : null;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ---- Page Header ---- */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Archive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Archived</h1>
                <p className="text-sm text-muted-foreground">
                  View and manage archived items
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowClearAllDialog(true)}
              disabled={items.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </FadeIn>

        {/* ---- Summary Cards ---- */}
        <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {allTypes.map((type, index) => {
            const config = typeConfig[type];
            const Icon = config.icon;
            const count = countsByType[type];
            return (
              <StaggerItem key={type}>
                <AnimatedCard delay={index * 0.05}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                      <p className={cn('mt-1 text-2xl font-bold', config.color)}>{count}</p>
                    </div>
                    <div className={cn('rounded-lg p-2.5', config.badgeClass.replace(/text-\S+/g, '').trim() || 'bg-muted')}>
                      <Icon className={cn('h-5 w-5', config.iconClass)} />
                    </div>
                  </div>
                </AnimatedCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* ---- Filter Bar ---- */}
        <FadeIn delay={0.2}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {allTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeConfig[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* ---- Archived Items List ---- */}
        <FadeIn delay={0.3}>
          {filteredItems.length > 0 ? (
            <StaggerContainer className="grid gap-3">
              {filteredItems.map((item) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                return (
                  <StaggerItem key={`${item.type}-${item.id}`}>
                    <AnimatedCard>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left side – info */}
                        <div className="flex items-start gap-3 sm:items-center">
                          <div
                            className={cn(
                              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:mt-0',
                              config.badgeClass.replace(/text-\S+/g, '').trim() || 'bg-muted'
                            )}
                          >
                            <Icon className={cn('h-4 w-4', config.iconClass)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate font-semibold">
                                {item.label || 'Untitled'}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn('shrink-0 text-[11px] font-medium', config.badgeClass)}
                              >
                                {config.label}
                              </Badge>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                              <span className="font-mono">{item.id}</span>
                              <span className="hidden sm:inline" aria-hidden="true">&middot;</span>
                              <span>Archived {formatArchivedDate(item.archivedAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right side – actions */}
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => setViewingItem(item)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setRestoreTarget(item)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          ) : (
            <AnimatedCard>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Inbox className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No archived items</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {searchQuery || typeFilter !== 'all'
                    ? 'No archived items match your current filters. Try adjusting your search or filter.'
                    : 'Items that you archive from other pages will appear here.'}
                </p>
                {(searchQuery || typeFilter !== 'all') && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
                  >
                    <XCircle className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </AnimatedCard>
          )}
        </FadeIn>

        {/* ---- View Detail Dialog ---- */}
        <Dialog open={viewingItem !== null} onOpenChange={(open) => { if (!open) setViewingItem(null); }}>
          <DialogContent className="sm:max-w-[480px]">
            {viewingItem && viewingConfig && DetailComponent && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg">View Details</DialogTitle>
                    <Badge variant="outline" className={cn('text-[11px]', viewingConfig.badgeClass)}>
                      {viewingConfig.label}
                    </Badge>
                  </div>
                  <DialogDescription>
                    Archived {formatArchivedDate(viewingItem.archivedAt)}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <DetailComponent data={viewingItem.data} />
                  </div>
                </div>
                <Separator />
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => { setRestoreTarget(viewingItem); }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    className="gap-1.5"
                    onClick={() => { setDeleteTarget(viewingItem); setViewingItem(null); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Permanently
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ---- Restore Confirmation Dialog ---- */}
        <AlertDialog open={restoreTarget !== null} onOpenChange={(open) => { if (!open) setRestoreTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to restore{' '}
                <span className="font-semibold text-foreground">{restoreTarget?.label || restoreTarget?.id}</span>{' '}
                ({restoreTarget ? typeConfig[restoreTarget.type].label : ''})? It will be moved back to its original location.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRestoreTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestore}>Restore</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ---- Delete Confirmation Dialog ---- */}
        <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Permanently</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete{' '}
                <span className="font-semibold text-foreground">{deleteTarget?.label || deleteTarget?.id}</span>{' '}
                ({deleteTarget ? typeConfig[deleteTarget.type].label : ''})? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ---- Clear All Confirmation Dialog ---- */}
        <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Archived Items</AlertDialogTitle>
              <AlertDialogDescription>
                {typeFilter !== 'all' ? (
                  <>Are you sure you want to clear all archived{' '}
                    <span className="font-semibold text-foreground">{typeConfig[typeFilter as ArchivedEntityType].label}</span>{' '}
                    items? This action cannot be undone.</>
                ) : (
                  <>Are you sure you want to clear <strong>all</strong> archived items ({items.length})? This action cannot be undone.</>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowClearAllDialog(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearAll}>Clear All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
