'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { drivers as initialDrivers } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { StatusBadge } from '@/components/shared/status-badge';
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
  Phone,
  Truck,
  Star,
  PackageCheck,
  Wifi,
  WifiOff,
  Navigation,
  Plus,
  MoreVertical,
  Pencil,
  Archive,
  Mail,
  MapPin,
  BarChart3,
  Search,
  Users,
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
  rating: number;
  totalDeliveries: number;
}

interface DriverFormData {
  name: string;
  phone: string;
  vehicle: string;
  status: DriverStatus;
  rating: number;
}

const defaultFormData: DriverFormData = {
  name: '',
  phone: '',
  vehicle: '',
  status: 'available',
  rating: 4.5,
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'size-3.5',
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
  );
}

function StatusSummaryCards({ data }: { data: Driver[] }) {
  const available = data.filter((d) => d.status === 'available').length;
  const onDelivery = data.filter((d) => d.status === 'on_delivery').length;
  const offline = data.filter((d) => d.status === 'offline').length;

  const summaries = [
    {
      label: 'Available',
      count: available,
      icon: Wifi,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
    },
    {
      label: 'On Delivery',
      count: onDelivery,
      icon: Navigation,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
    },
    {
      label: 'Offline',
      count: offline,
      icon: WifiOff,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800/50',
      border: 'border-gray-200 dark:border-gray-700',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {summaries.map((item, index) => (
        <FadeIn key={item.label} delay={0.1 + index * 0.05}>
          <Card className={cn('border', item.border)}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={cn('flex size-10 items-center justify-center rounded-lg', item.bg)}>
                <item.icon className={cn('size-5', item.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ))}
    </div>
  );
}

function DriverCard({
  driver,
  onEdit,
  onArchive,
  onViewDetail,
}: {
  driver: Driver;
  onEdit: (driver: Driver) => void;
  onArchive: (driver: Driver) => void;
  onViewDetail: (driver: Driver) => void;
}) {
  const pulseColor =
    driver.status === 'available'
      ? 'bg-green-500'
      : driver.status === 'on_delivery'
        ? 'bg-blue-500'
        : 'bg-gray-400';

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card className="group/card relative h-full overflow-hidden cursor-pointer transition-shadow hover:shadow-md" onClick={() => onViewDetail(driver)}>
          {/* Status pulse indicator */}
          {(driver.status === 'available' || driver.status === 'on_delivery') && (
            <div className="absolute right-4 top-4">
              <span className="relative flex size-3">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                    pulseColor
                  )}
                />
                <span
                  className={cn(
                    'relative inline-flex size-3 rounded-full',
                    pulseColor
                  )}
                />
              </span>
            </div>
          )}

          {/* Action dropdown */}
          <div className="absolute right-3 top-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 opacity-0 transition-opacity group-hover/card:opacity-100 focus:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(driver); }} className="gap-2">
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onArchive(driver); }}
                  className="gap-2"
                >
                  <Archive className="size-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="group/card p-6">
            {/* Driver header */}
            <div className="flex items-center gap-4">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {getInitials(driver.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{driver.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-3.5" />
                  <span>{driver.phone}</span>
                </div>
              </div>
            </div>

            {/* Status & Vehicle */}
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge status={driver.status} pulse={driver.status === 'available' || driver.status === 'on_delivery'} />
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Truck className="size-3.5" />
                <span>{driver.vehicle}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="my-4 border-t" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <PackageCheck className="size-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-lg font-bold">{driver.completedToday}</span>
                </div>
                <div className="text-xs text-muted-foreground">Today</div>
              </div>
              <div className="text-center">
                <StarRating rating={driver.rating} />
                <div className="mt-1 text-xs text-muted-foreground">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{driver.totalDeliveries.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total</div>
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
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="driver-name">Name</Label>
            <Input
              id="driver-name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Phone */}
          <div className="grid gap-2">
            <Label htmlFor="driver-phone">Phone</Label>
            <Input
              id="driver-phone"
              placeholder="e.g. +1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {/* Vehicle */}
          <div className="grid gap-2">
            <Label htmlFor="driver-vehicle">Vehicle</Label>
            <Input
              id="driver-vehicle"
              placeholder="e.g. Van #6"
              value={formData.vehicle}
              onChange={(e) => setFormData((prev) => ({ ...prev, vehicle: e.target.value }))}
            />
          </div>

          {/* Status */}
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

          {/* Rating (only editable in edit mode) */}
          {mode === 'edit' && (
            <div className="grid gap-2">
              <Label htmlFor="driver-rating">Rating (1.0 - 5.0)</Label>
              <Input
                id="driver-rating"
                type="number"
                min={1}
                max={5}
                step={0.1}
                value={formData.rating}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rating: Math.min(5, Math.max(1, parseFloat(e.target.value) || 4.5)),
                  }))
                }
              />
            </div>
          )}
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
          <AlertDialogAction
            onClick={onConfirm}
          >
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return data.filter((driver) => {
      const matchesSearch =
        !searchQuery.trim() ||
        driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.vehicle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || driver.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

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

  // Add driver
  const handleOpenAdd = () => {
    setDialogMode('add');
    setFormData({ ...defaultFormData });
    setEditingDriver(null);
    setDialogOpen(true);
  };

  // Edit driver
  const handleOpenEdit = (driver: Driver) => {
    setDialogMode('edit');
    setFormData({
      name: driver.name,
      phone: driver.phone,
      vehicle: driver.vehicle,
      status: driver.status,
      rating: driver.rating,
    });
    setEditingDriver(driver);
    setDialogOpen(true);
  };

  // View driver detail
  const handleViewDetail = (driver: Driver) => {
    setDetailDriver(driver);
    setDetailOpen(true);
  };

  // Submit (add or edit)
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
        rating: formData.rating,
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
                rating: formData.rating,
              }
            : d
        )
      );
      toast.success(`Driver "${formData.name.trim()}" updated successfully.`);
    }

    setDialogOpen(false);
  };

  // Archive driver
  const handleOpenArchive = (driver: Driver) => {
    setArchivingDriver(driver);
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!archivingDriver) return;
    const name = archivingDriver.name;
    archiveStore.archiveItem('driver', archivingDriver, archivingDriver.id, archivingDriver.name);
    setData((prev) => prev.filter((d) => d.id !== archivingDriver.id));
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
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
                  <Badge variant="secondary" className="gap-1.5 font-medium">
                    <Users className="size-3.5" />
                    {data.length}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Monitor and manage your delivery drivers fleet.
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
        <StatusSummaryCards data={data} />

        {/* Search & Filter Bar */}
        <FadeIn delay={0.15}>
          <AnimatedCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_delivery">On Delivery</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Driver Grid */}
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onEdit={handleOpenEdit}
              onArchive={handleOpenArchive}
              onViewDetail={handleViewDetail}
            />
          ))}
        </StaggerContainer>

        {/* Empty state when no results */}
        {filteredDrivers.length === 0 && (
          <FadeIn>
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <Search className="size-10 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">No drivers found</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            </div>
          </FadeIn>
        )}

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
          <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar">
            {detailDriver && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                        {getInitials(detailDriver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailDriver.name}</SheetTitle>
                      <SheetDescription>{detailDriver.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={detailDriver.status} pulse={detailDriver.status !== 'offline'} />
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <PackageCheck className="h-3.5 text-green-600 dark:text-green-400" />
                        <span className="text-xl font-bold">{detailDriver.completedToday}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Today</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <StarRating rating={detailDriver.rating} />
                      <p className="mt-1 text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <p className="text-xl font-bold">{detailDriver.totalDeliveries.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{detailDriver.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Vehicle</p>
                          <p className="text-sm font-medium">{detailDriver.vehicle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Navigation className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className="text-sm font-medium capitalize">{detailDriver.status.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setDetailOpen(false);
                      handleOpenEdit(detailDriver);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Driver
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
