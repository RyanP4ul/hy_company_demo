'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { drivers as initialDrivers } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { StatusBadge } from '@/components/shared/status-badge';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Phone,
  Truck,
  PackageCheck,
  Wifi,
  WifiOff,
  Navigation,
  Plus,
  MoreVertical,
  Pencil,
  Archive,
  MapPin,
  LayoutGrid,
  LayoutList,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';

type DriverStatus = 'available' | 'on_delivery' | 'offline';

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  vehicle: string;
  completedToday: number;
  totalDeliveries: number;
}

interface DriverFormData {
  name: string;
  phone: string;
  vehicle: string;
  status: DriverStatus;
}

const defaultFormData: DriverFormData = {
  name: '',
  phone: '',
  vehicle: '',
  status: 'available',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function generateDriverId(existingDrivers: Driver[]): string {
  const maxNum = existingDrivers.reduce((max, d) => {
    const match = d.id.match(/DRV-(\d+)/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return `DRV-${String(maxNum + 1).padStart(3, '0')}`;
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

const statusConfig: Record<DriverStatus, { label: string; icon: typeof Wifi; color: string; bg: string; border: string }> = {
  available: {
    label: 'Available',
    icon: Wifi,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800',
  },
  on_delivery: {
    label: 'On Delivery',
    icon: Navigation,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  offline: {
    label: 'Offline',
    icon: WifiOff,
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/50',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

function StatusSummaryCards({ data }: { data: Driver[] }) {
  const available = data.filter((d) => d.status === 'available').length;
  const onDelivery = data.filter((d) => d.status === 'on_delivery').length;
  const offline = data.filter((d) => d.status === 'offline').length;
  const total = data.length;
  const summaries = [
    {
      label: 'Total Drivers',
      count: total,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Available',
      count: available,
      icon: Wifi,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'On Delivery',
      count: onDelivery,
      icon: Navigation,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Offline',
      count: offline,
      icon: WifiOff,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-500/10',
    },
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
              <p className={cn('mt-0.5 text-xl font-bold', item.color)}>{item.count}</p>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
}

function DriverCard({
  driver,
  onEdit,
  onArchive,
  onView,
}: {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onArchive: (driver: Driver) => void;
  onView: (driver: Driver) => void;
}) {
  const cfg = statusConfig[driver.status];

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card className="group/card relative h-full cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-md" onClick={() => onView(driver)}>
          {/* Status indicator bar */}
          <div className={cn('absolute left-0 top-0 h-full w-1', driver.status === 'available' ? 'bg-green-500' : driver.status === 'on_delivery' ? 'bg-blue-500' : 'bg-gray-400')} />

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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(driver); }}>
                  <Users className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(driver); }}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onArchive(driver); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="mr-2 size-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="p-5 pl-5">
            {/* Driver header */}
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {getInitials(driver.name)}
                  </AvatarFallback>
                </Avatar>
                {/* Online indicator */}
                {(driver.status === 'available' || driver.status === 'on_delivery') && (
                  <span className={cn(
                    'absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-background',
                    driver.status === 'available' ? 'bg-green-500' : 'bg-blue-500'
                  )} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold">{driver.name}</h3>
                </div>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{driver.id}</p>
              </div>
            </div>

            {/* Status & Vehicle */}
            <div className="mt-4 flex items-center gap-3">
              <StatusBadge status={driver.status} pulse={driver.status !== 'offline'} />
              <Badge variant="outline" className="gap-1 text-xs">
                <Truck className="size-3" />
                {driver.vehicle}
              </Badge>
            </div>

            {/* Divider */}
            <Separator className="my-4" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <PackageCheck className="size-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-lg font-bold tabular-nums">{driver.completedToday}</span>
                </div>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold tabular-nums">{driver.totalDeliveries.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

function DriverFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: DriverFormData;
  setFormData: React.Dispatch<React.SetStateAction<DriverFormData>>;
  onSubmit: () => void;
  mode: 'add' | 'edit';
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Driver' : 'Edit Driver'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details to add a new driver to the fleet.'
              : 'Update the driver information below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="driver-name">Full Name</Label>
            <Input
              id="driver-name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="driver-phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="driver-phone"
                placeholder="e.g. +1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="driver-vehicle">Vehicle</Label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="driver-vehicle"
                placeholder="e.g. Van #6"
                value={formData.vehicle}
                onChange={(e) => setFormData((prev) => ({ ...prev, vehicle: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="driver-status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value as DriverStatus }))
              }
            >
              <SelectTrigger id="driver-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_delivery">On Delivery</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>


        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name.trim() || !formData.phone.trim() || !formData.vehicle.trim()}
          >
            {mode === 'add' ? 'Add Driver' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDriverDialog({
  open,
  onOpenChange,
  driver,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
  onConfirm: () => void;
}) {
  if (!driver) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Driver</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <span className="font-semibold">{driver.name}</span>?
            Archived items can be restored from the Archived page. All delivery records for this driver will remain intact.
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

export default function DriversPage() {
  const [data, setData] = useState<Driver[]>(initialDrivers as Driver[]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<DriverFormData>({ ...defaultFormData });
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [archivingDriver, setArchivingDriver] = useState<Driver | null>(null);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailDriver, setDetailDriver] = useState<Driver | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Search & filter
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting for table view
  const [sorting, setSorting] = useState<SortingState>([]);

  // Listen for search navigation to auto-open driver detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'driver') {
        setData((prev) => {
          const driver = prev.find((d) => d.id === target.id);
          if (driver) {
            setDetailDriver(driver);
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

  // Listen for restored drivers from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setData((prev) => [...prev, restoredData as Driver]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    return result;
  }, [data, statusFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<Driver>[]>(
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
            Driver <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => {
          const driver = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(driver.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{driver.name}</p>
                <p className="text-xs text-muted-foreground">{driver.phone}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        accessorKey: 'vehicle',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Vehicle <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Truck className="size-3.5 text-muted-foreground" />
            <span>{getValue() as string}</span>
          </div>
        ),
      },
      {
        accessorKey: 'completedToday',
        header: 'Today',
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'totalDeliveries',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Total <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => <span className="font-semibold tabular-nums">{(getValue() as number).toLocaleString()}</span>,
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const driver = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(driver); }}>
                  <Users className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(driver); }}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleOpenArchive(driver); }}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setEditingDriver(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setDialogMode('edit');
    setFormData({
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      status: driver.status,
    });
    setEditingDriver(driver);
    setDialogOpen(true);
  };

  const handleViewDetail = (driver: Driver) => {
    setDetailDriver(driver);
    setDetailOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.vehicle.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (dialogMode === 'add') {
      const newDriver: Driver = {
        id: generateDriverId(data),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        vehicle: formData.vehicle.trim(),
        status: formData.status,
        completedToday: 0,
        totalDeliveries: 0,
      };
      setData((prev) => [...prev, newDriver]);
      toast.success(`Driver "${newDriver.name}" added successfully.`);
    } else if (editingDriver) {
      setData((prev) =>
        prev.map((d) =>
          d.id === editingDriver.id
            ? {
                ...d,
                name: formData.name.trim(),
                phone: formData.phone.trim(),
                vehicle: formData.vehicle.trim(),
                status: formData.status,
              }
            : d
        )
      );
      // Update detail drawer if viewing the same driver
      setDetailDriver((prev) =>
        prev && prev.id === editingDriver.id
          ? { ...prev, name: formData.name.trim(), phone: formData.phone.trim(), vehicle: formData.vehicle.trim(), status: formData.status }
          : prev
      );
      toast.success(`Driver "${formData.name.trim()}" updated successfully.`);
    }

    setDialogOpen(false);
  };

  const handleOpenArchive = (driver: Driver) => {
    setArchivingDriver(driver);
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!archivingDriver) return;
    const name = archivingDriver.name;
    archiveStore.archiveItem('driver', archivingDriver, archivingDriver.id, archivingDriver.name);
    setData((prev) => prev.filter((d) => d.id !== archivingDriver.id));
    if (detailDriver?.id === archivingDriver.id) {
      setDetailDriver(null);
      setDetailOpen(false);
    }
    setArchiveDialogOpen(false);
    setArchivingDriver(null);
    toast.success(`Driver "${name}" archived successfully.`);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor and manage your delivery fleet
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="size-4" />
              Add Driver
            </Button>
          </div>
        </FadeIn>

        {/* Status Summary */}
        <FadeIn delay={0.05}>
          <StatusSummaryCards data={data} />
        </FadeIn>

        {/* Search & Filter Bar */}
        <FadeIn delay={0.1}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search drivers by name, ID, or vehicle..."
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
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_delivery">On Delivery</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
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
                  <Users className="size-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">No drivers found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {globalFilter || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Get started by adding your first driver.'}
                  </p>
                </div>
                {!globalFilter && statusFilter === 'all' && (
                  <Button className="gap-2" onClick={handleOpenAdd}>
                    <Plus className="size-4" />
                    Add Driver
                  </Button>
                )}
              </div>
            </AnimatedCard>
          ) : viewMode === 'grid' ? (
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
              {filteredData.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
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
                          <p className="text-muted-foreground">No drivers found.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {data.length} drivers
                </p>
              </div>
            </AnimatedCard>
          )}
        </FadeIn>

        {/* Add/Edit Dialog */}
        <DriverFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          mode={dialogMode}
        />

        {/* Archive Confirmation Dialog */}
        <ArchiveDriverDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          driver={archivingDriver}
          onConfirm={handleConfirmArchive}
        />

        {/* Driver Detail Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
            {detailDriver && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                          {getInitials(detailDriver.name)}
                        </AvatarFallback>
                      </Avatar>
                      {(detailDriver.status === 'available' || detailDriver.status === 'on_delivery') && (
                        <span className={cn(
                          'absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-background',
                          detailDriver.status === 'available' ? 'bg-green-500' : 'bg-blue-500'
                        )} />
                      )}
                    </div>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailDriver.name}</SheetTitle>
                      <SheetDescription>{detailDriver.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge status={detailDriver.status} pulse={detailDriver.status !== 'offline'} />
                    <Badge variant="outline" className="gap-1">
                      <Truck className="size-3" />
                      {detailDriver.vehicle}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <PackageCheck className="size-4 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-bold tabular-nums">{detailDriver.completedToday}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Today</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className="size-4 text-primary" />
                      </div>
                      <span className="text-xl font-bold tabular-nums">{detailDriver.totalDeliveries.toLocaleString()}</span>
                      <p className="mt-1 text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Contact Information
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Phone className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{detailDriver.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Mail className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">
                            {detailDriver.name.toLowerCase().replace(/\s+/g, '.')}@hyops.com
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Base Location</p>
                          <p className="text-sm font-medium">Warehouse Main Hub</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Fleet Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Fleet Information
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Vehicle</span>
                        <span className="text-sm font-medium flex items-center gap-1.5">
                          <Truck className="size-3.5 text-muted-foreground" />
                          {detailDriver.vehicle}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={detailDriver.status} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg. Deliveries/Day</span>
                        <span className="text-sm font-medium tabular-nums">
                          {detailDriver.totalDeliveries > 0
                            ? Math.max(1, Math.round(detailDriver.totalDeliveries / 30))
                            : 0}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          96%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Status Toggle */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={detailDriver.status === 'available' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setData((prev) => prev.map((d) => d.id === detailDriver.id ? { ...d, status: 'available' } : d));
                          setDetailDriver((prev) => prev ? { ...prev, status: 'available' } : prev);
                          toast.success(`${detailDriver.name} is now Available`);
                        }}
                      >
                        <Wifi className="size-3.5" />
                        Available
                      </Button>
                      <Button
                        variant={detailDriver.status === 'on_delivery' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setData((prev) => prev.map((d) => d.id === detailDriver.id ? { ...d, status: 'on_delivery' } : d));
                          setDetailDriver((prev) => prev ? { ...prev, status: 'on_delivery' } : prev);
                          toast.success(`${detailDriver.name} is now On Delivery`);
                        }}
                      >
                        <Navigation className="size-3.5" />
                        On Delivery
                      </Button>
                      <Button
                        variant={detailDriver.status === 'offline' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setData((prev) => prev.map((d) => d.id === detailDriver.id ? { ...d, status: 'offline' } : d));
                          setDetailDriver((prev) => prev ? { ...prev, status: 'offline' } : prev);
                          toast.success(`${detailDriver.name} is now Offline`);
                        }}
                      >
                        <WifiOff className="size-3.5" />
                        Offline
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setDetailOpen(false);
                          handleOpenEdit(detailDriver);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit Profile
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
