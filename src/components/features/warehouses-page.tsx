'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { warehouses as initialWarehouses, type Warehouse, type WarehouseStatus, type WarehouseType } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { StatusBadge } from '@/components/shared/status-badge';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Warehouse as WarehouseIcon, Plus, MoreVertical, Pencil, Archive, MapPin, Package, Phone, LayoutGrid, LayoutList, Search, ArrowUpDown, ArrowUp, ArrowDown, Building2, Snowflake, TruckIcon, BarChart3, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';

// ─── Combobox Options ───────────────────────────────────────────────────

const typeOptions: ComboboxOption[] = [
  { value: 'main', label: 'Main Warehouse', icon: WarehouseIcon },
  { value: 'regional', label: 'Regional', icon: Building2 },
  { value: 'fulfillment', label: 'Fulfillment Center', icon: TruckIcon },
  { value: 'cold_storage', label: 'Cold Storage', icon: Snowflake },
];

const statusOptions: ComboboxOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

// ─── Status Config ──────────────────────────────────────────────────────

const statusConfig: Record<WarehouseStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500' },
  inactive: { label: 'Inactive', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-400' },
  maintenance: { label: 'Maintenance', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' },
};

const typeLabels: Record<WarehouseType, string> = {
  main: 'Main Warehouse',
  regional: 'Regional',
  fulfillment: 'Fulfillment',
  cold_storage: 'Cold Storage',
};

// ─── Helpers ────────────────────────────────────────────────────────────

interface WarehouseFormData {
  name: string;
  address: string;
  city: string;
  type: WarehouseType;
  status: WarehouseStatus;
  capacity: string;
  manager: string;
  contactPhone: string;
}

const defaultFormData: WarehouseFormData = {
  name: '',
  address: '',
  city: '',
  type: 'main',
  status: 'active',
  capacity: '',
  manager: '',
  contactPhone: '',
};

function generateWarehouseId(existing: Warehouse[]): string {
  const maxNum = existing.reduce((max, w) => {
    const match = w.id.match(/WH-(\d+)/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return `WH-${String(maxNum + 1).padStart(3, '0')}`;
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

// ─── Utilization Bar ────────────────────────────────────────────────────

function UtilizationBar({ utilized, capacity }: { utilized: number; capacity: number }) {
  const pct = capacity > 0 ? Math.round((utilized / capacity) * 100) : 0;
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Utilization</span>
        <span className={cn('font-semibold', pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-green-600')}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{utilized.toLocaleString()} / {capacity.toLocaleString()} units</p>
    </div>
  );
}

// ─── Summary Cards ──────────────────────────────────────────────────────

function SummaryCards({ data }: { data: Warehouse[] }) {
  const total = data.length;
  const active = data.filter((w) => w.status === 'active').length;
  const maintenance = data.filter((w) => w.status === 'maintenance').length;
  const avgUtil = total > 0
    ? Math.round(data.reduce((sum, w) => sum + (w.capacity > 0 ? (w.utilized / w.capacity) * 100 : 0), 0) / total)
    : 0;

  const summaries = [
    { label: 'Total Warehouses', count: total, icon: WarehouseIcon, color: 'text-primary', bg: 'bg-primary/10', isPercent: false },
    { label: 'Active', count: active, icon: Package, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', isPercent: false },
    { label: 'In Maintenance', count: maintenance, icon: Wrench, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', isPercent: false },
    { label: 'Avg. Utilization', count: avgUtil, icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10', isPercent: true },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {summaries.map((item, index) => (
        <AnimatedCard key={item.label} delay={index * 0.05}>
          <div className="flex items-center gap-4">
            <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', item.bg)}>
              <item.icon className={cn('size-5', item.color)} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={cn('mt-0.5 text-xl font-bold', item.color)}>
                {item.isPercent ? `${item.count}%` : item.count}
              </p>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
}

// ─── Warehouse Card ─────────────────────────────────────────────────────

function WarehouseCard({
  warehouse,
  onEdit,
  onArchive,
  onView,
}: {
  warehouse: Warehouse;
  onEdit: (warehouse: Warehouse) => void;
  onArchive: (warehouse: Warehouse) => void;
  onView: (warehouse: Warehouse) => void;
}) {
  const cfg = statusConfig[warehouse.status];

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card
          className="group/card relative h-full cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-md"
          onClick={() => onView(warehouse)}
        >
          {/* Status indicator bar */}
          <div className={cn('absolute left-0 top-0 h-full w-1', cfg.bg)} />

          {/* Action dropdown */}
          <div className="absolute right-2 top-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 transition-opacity group-hover/card:opacity-100 focus:opacity-100"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(warehouse); }}>
                  <WarehouseIcon className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(warehouse); }}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onArchive(warehouse); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="mr-2 size-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="p-5 pl-5">
            {/* Header */}
            <div className="flex items-start justify-between pr-8">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold">{warehouse.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{warehouse.id}</p>
              </div>
            </div>

            {/* Location */}
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{warehouse.city}</span>
            </div>

            {/* Status & Type badges */}
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className={cn('text-xs', cfg.color)}>
                {cfg.label}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                {warehouse.type === 'main' && <WarehouseIcon className="size-3" />}
                {warehouse.type === 'regional' && <Building2 className="size-3" />}
                {warehouse.type === 'fulfillment' && <TruckIcon className="size-3" />}
                {warehouse.type === 'cold_storage' && <Snowflake className="size-3" />}
                {typeLabels[warehouse.type]}
              </Badge>
            </div>

            {/* Divider */}
            <Separator className="my-4" />

            {/* Utilization Bar */}
            <UtilizationBar utilized={warehouse.utilized} capacity={warehouse.capacity} />

            {/* Footer info */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate">{warehouse.manager}</span>
              <span>{warehouse.capacity.toLocaleString()} units</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

// ─── Form Dialog ────────────────────────────────────────────────────────

function WarehouseFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: WarehouseFormData;
  setFormData: React.Dispatch<React.SetStateAction<WarehouseFormData>>;
  onSubmit: () => void;
  mode: 'add' | 'edit';
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Warehouse' : 'Edit Warehouse'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details to add a new warehouse.'
              : 'Update the warehouse information below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="wh-name">Warehouse Name</Label>
            <Input
              id="wh-name"
              placeholder="e.g. Warehouse G"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wh-address">Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="wh-address"
                placeholder="e.g. 100 Commerce Blvd"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wh-city">City</Label>
            <Input
              id="wh-city"
              placeholder="e.g. New York"
              value={formData.city}
              onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Type</Label>
              <Combobox
                options={typeOptions}
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as WarehouseType }))}
                placeholder="Select type..."
                searchPlaceholder="Search types..."
                emptyMessage="No type found."
              />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Combobox
                options={statusOptions}
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as WarehouseStatus }))}
                placeholder="Select status..."
                searchPlaceholder="Search statuses..."
                emptyMessage="No status found."
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wh-capacity">Capacity (units)</Label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="wh-capacity"
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={formData.capacity}
                onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wh-manager">Manager</Label>
            <Input
              id="wh-manager"
              placeholder="e.g. John Doe"
              value={formData.manager}
              onChange={(e) => setFormData((prev) => ({ ...prev, manager: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wh-phone">Contact Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="wh-phone"
                placeholder="e.g. +1 (555) 000-0000"
                value={formData.contactPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.manager.trim() || !formData.capacity}
          >
            {mode === 'add' ? 'Add Warehouse' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Archive Dialog ─────────────────────────────────────────────────────

function ArchiveWarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
  onConfirm: () => void;
}) {
  if (!warehouse) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Warehouse</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <span className="font-semibold">{warehouse.name}</span>?
            Archived items can be restored from the Archived page. All inventory records for this warehouse will remain intact.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function WarehousesPage() {
  const [data, setData] = useState<Warehouse[]>(initialWarehouses as Warehouse[]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<WarehouseFormData>({ ...defaultFormData });
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [archivingWarehouse, setArchivingWarehouse] = useState<Warehouse | null>(null);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailWarehouse, setDetailWarehouse] = useState<Warehouse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Search & filter
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting for table view
  const [sorting, setSorting] = useState<SortingState>([]);

  // Listen for search navigation
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'warehouse') {
        setData((prev) => {
          const warehouse = prev.find((w) => w.id === target.id);
          if (warehouse) {
            setDetailWarehouse(warehouse);
            setDetailOpen(true);
          }
          return prev;
        });
        clearSearchTarget();
      }
    };
    window.addEventListener('search:navigate', handler);
    return () => window.removeEventListener('search:navigate', handler);
  }, [clearSearchTarget]);

  // Listen for restored warehouses
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setData((prev) => [...prev, restoredData as Warehouse]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'all') {
      result = result.filter((w) => w.status === statusFilter);
    }
    return result;
  }, [data, statusFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<Warehouse>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            ID <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => <span className="font-mono text-xs font-semibold text-primary">{getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Name <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => {
          const wh = row.original;
          return (
            <div>
              <p className="font-medium">{wh.name}</p>
              <p className="text-xs text-muted-foreground">{wh.address}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'city',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            City <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="size-3.5 text-muted-foreground" />
            <span>{getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const type = getValue() as WarehouseType;
          return (
            <Badge variant="outline" className="gap-1 text-xs">
              {type === 'main' && <WarehouseIcon className="size-3" />}
              {type === 'regional' && <Building2 className="size-3" />}
              {type === 'fulfillment' && <TruckIcon className="size-3" />}
              {type === 'cold_storage' && <Snowflake className="size-3" />}
              {typeLabels[type]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'capacity',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Capacity <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => <span className="font-semibold tabular-nums">{(getValue() as number).toLocaleString()}</span>,
      },
      {
        accessorKey: 'utilization',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Utilization <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => {
          const wh = row.original;
          const pct = wh.capacity > 0 ? Math.round((wh.utilized / wh.capacity) * 100) : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 rounded-full bg-muted">
                <div
                  className={cn(
                    'h-full rounded-full',
                    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={cn(
                'text-xs font-semibold tabular-nums',
                pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-600' : 'text-green-600'
              )}>
                {pct}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as WarehouseStatus;
          const cfg = statusConfig[status];
          return (
            <Badge variant="outline" className={cn('text-xs', cfg.color)}>
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const warehouse = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(warehouse); }}>
                  <WarehouseIcon className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(warehouse); }}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleOpenArchive(warehouse); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="mr-2 size-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Handlers
  const handleOpenAdd = () => {
    setDialogMode('add');
    setFormData({ ...defaultFormData });
    setEditingWarehouse(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (warehouse: Warehouse) => {
    setDialogMode('edit');
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      city: warehouse.city,
      type: warehouse.type,
      status: warehouse.status,
      capacity: String(warehouse.capacity),
      manager: warehouse.manager,
      contactPhone: warehouse.contactPhone,
    });
    setEditingWarehouse(warehouse);
    setDialogOpen(true);
  };

  const handleViewDetail = (warehouse: Warehouse) => {
    setDetailWarehouse(warehouse);
    setDetailOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.city.trim() || !formData.manager.trim() || !formData.capacity) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const capacityNum = parseInt(formData.capacity);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      toast.error('Capacity must be a positive number.');
      return;
    }

    if (dialogMode === 'add') {
      const newWarehouse: Warehouse = {
        id: generateWarehouseId(data),
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        type: formData.type,
        status: formData.status,
        capacity: capacityNum,
        utilized: 0,
        manager: formData.manager.trim(),
        contactPhone: formData.contactPhone.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };
      setData((prev) => [...prev, newWarehouse]);
      toast.success(`Warehouse "${newWarehouse.name}" added successfully.`);
    } else if (editingWarehouse) {
      setData((prev) =>
        prev.map((w) =>
          w.id === editingWarehouse.id
            ? {
                ...w,
                name: formData.name.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                type: formData.type,
                status: formData.status,
                capacity: capacityNum,
                manager: formData.manager.trim(),
                contactPhone: formData.contactPhone.trim(),
              }
            : w
        )
      );
      // Update detail drawer if viewing the same warehouse
      setDetailWarehouse((prev) =>
        prev && prev.id === editingWarehouse.id
          ? {
              ...prev,
              name: formData.name.trim(),
              address: formData.address.trim(),
              city: formData.city.trim(),
              type: formData.type,
              status: formData.status,
              capacity: capacityNum,
              manager: formData.manager.trim(),
              contactPhone: formData.contactPhone.trim(),
            }
          : prev
      );
      toast.success(`Warehouse "${formData.name.trim()}" updated successfully.`);
    }

    setDialogOpen(false);
  };

  const handleOpenArchive = (warehouse: Warehouse) => {
    setArchivingWarehouse(warehouse);
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!archivingWarehouse) return;
    const name = archivingWarehouse.name;
    archiveStore.archiveItem('warehouse', archivingWarehouse, archivingWarehouse.id, archivingWarehouse.name);
    setData((prev) => prev.filter((w) => w.id !== archivingWarehouse.id));
    if (detailWarehouse?.id === archivingWarehouse.id) {
      setDetailWarehouse(null);
      setDetailOpen(false);
    }
    setArchiveDialogOpen(false);
    setArchivingWarehouse(null);
    toast.success(`Warehouse "${name}" archived successfully.`);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <WarehouseIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your storage locations and capacity
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="size-4" />
              Add Warehouse
            </Button>
          </div>
        </FadeIn>

        {/* Summary Cards */}
        <FadeIn delay={0.05}>
          <SummaryCards data={data} />
        </FadeIn>

        {/* Search & Filter Bar */}
        <FadeIn delay={0.1}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search warehouses by name, ID, or city..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <div className="hidden items-center rounded-lg border p-1 sm:flex">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="size-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="size-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="size-8"
                    onClick={() => setViewMode('table')}
                  >
                    <LayoutList className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Content */}
        <FadeIn delay={0.15}>
          {filteredData.length === 0 ? (
            <AnimatedCard>
              <div className="flex flex-col items-center gap-4 py-12">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <WarehouseIcon className="size-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">No warehouses found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {globalFilter || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Get started by adding your first warehouse.'}
                  </p>
                </div>
                {!globalFilter && statusFilter === 'all' && (
                  <Button className="gap-2" onClick={handleOpenAdd}>
                    <Plus className="size-4" />
                    Add Warehouse
                  </Button>
                )}
              </div>
            </AnimatedCard>
          ) : viewMode === 'grid' ? (
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
              {filteredData.map((warehouse) => (
                <WarehouseCard
                  key={warehouse.id}
                  warehouse={warehouse}
                  onEdit={handleOpenEdit}
                  onArchive={handleOpenArchive}
                  onView={handleViewDetail}
                />
              ))}
            </StaggerContainer>
          ) : (
            <AnimatedCard contentClassName="p-0">
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="cursor-pointer transition-colors duration-150 hover:bg-muted/80"
                          onClick={() => handleViewDetail(row.original)}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <p className="text-muted-foreground">No warehouses found.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {data.length} warehouses
                </p>
              </div>
            </AnimatedCard>
          )}
        </FadeIn>

        {/* Add/Edit Dialog */}
        <WarehouseFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          mode={dialogMode}
        />

        {/* Archive Confirmation Dialog */}
        <ArchiveWarehouseDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          warehouse={archivingWarehouse}
          onConfirm={handleConfirmArchive}
        />

        {/* Warehouse Detail Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
            {detailWarehouse && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-xl bg-primary/10">
                      <WarehouseIcon className="size-7 text-primary" />
                    </div>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailWarehouse.name}</SheetTitle>
                      <SheetDescription>{detailWarehouse.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-xs', statusConfig[detailWarehouse.status].color)}>
                      {statusConfig[detailWarehouse.status].label}
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-xs">
                      {detailWarehouse.type === 'main' && <WarehouseIcon className="size-3" />}
                      {detailWarehouse.type === 'regional' && <Building2 className="size-3" />}
                      {detailWarehouse.type === 'fulfillment' && <TruckIcon className="size-3" />}
                      {detailWarehouse.type === 'cold_storage' && <Snowflake className="size-3" />}
                      {typeLabels[detailWarehouse.type]}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* Utilization */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <UtilizationBar utilized={detailWarehouse.utilized} capacity={detailWarehouse.capacity} />
                  </div>

                  <Separator />

                  {/* Capacity Stats */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Capacity Stats
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Capacity</span>
                        <span className="text-sm font-semibold tabular-nums">{detailWarehouse.capacity.toLocaleString()} units</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Utilized</span>
                        <span className="text-sm font-semibold tabular-nums">{detailWarehouse.utilized.toLocaleString()} units</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Available</span>
                        <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                          {(detailWarehouse.capacity - detailWarehouse.utilized).toLocaleString()} units
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Location Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Location
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">{detailWarehouse.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Building2 className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">City</p>
                          <p className="text-sm font-medium">{detailWarehouse.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Created</p>
                          <p className="text-sm font-medium">{detailWarehouse.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Manager Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Manager
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <WarehouseIcon className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="text-sm font-medium">{detailWarehouse.manager}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Phone className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Phone</p>
                          <p className="text-sm font-medium">{detailWarehouse.contactPhone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          handleOpenEdit(detailWarehouse);
                          setDetailOpen(false);
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          handleOpenArchive(detailWarehouse);
                          setDetailOpen(false);
                        }}
                      >
                        <Archive className="size-4" />
                        Archive
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
