'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  MapPin,
  Mail,
  Phone,
  Package,
  Truck,
  Bike,
  MoreHorizontal,
  Pencil,
  Archive,
  X as XIcon,
  ListOrdered,
  Clock,
  Activity,
  CircleCheck,
  Route,
  CheckCircle2,
  Circle,
  CalendarClock,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { useNavigationStore } from '@/stores/navigation';
import { usePageContext } from '@/stores/page-context';
import { toast } from 'sonner';
import { cn, formatPeso } from '@/lib/utils';

import { orders as initialOrders, deliveries, inventoryItems, type DeliveryRoute, type PaymentStatus } from '@/lib/mock-data';
import { StatusBadge, PriorityBadge } from '@/components/shared/status-badge';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { OrderStatusStepper, type OrderStatus } from '@/components/shared/order-status-stepper';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';

type Order = (typeof initialOrders)[number];

interface OrderFormState {
  customer: string;
  items: string;
  total: string;
  priority: string;
  deliveryType: string;
  paymentStatus: string;
}

const emptyOrderForm: OrderFormState = {
  customer: '',
  items: '1',
  total: '',
  priority: 'medium',
  deliveryType: 'truck',
  paymentStatus: 'unpaid',
};

// Handle status change from the stepper
function handleStatusChangeFromStepper(
  newStatus: OrderStatus,
  selectedOrderId: string,
  setData: React.Dispatch<React.SetStateAction<Order[]>>,
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>
) {
  setData((prev) =>
    prev.map((order) =>
      order.id === selectedOrderId
        ? { ...order, status: newStatus as Order['status'] }
        : order
    )
  );
  setSelectedOrder((prev) =>
    prev && prev.id === selectedOrderId
      ? { ...prev, status: newStatus as Order['status'] }
      : prev
  );
  toast.success(`Order status updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`);
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

export default function OrdersPage() {
  const [data, setData] = useState<Order[]>(initialOrders);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Navigation
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);
  const setReturnTo = usePageContext((s) => s.setReturnTo);
  const setSelectedDeliveryId = usePageContext((s) => s.setSelectedDeliveryId);

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [archivingOrder, setArchivingOrder] = useState<Order | null>(null);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [form, setForm] = useState<OrderFormState>(emptyOrderForm);

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [reschedulingOrder, setReschedulingOrder] = useState<Order | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Listen for search navigation to auto-open order detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'order') {
        setData((prev) => {
          const order = prev.find((o) => o.id === target.id);
          if (order) {
            setSelectedOrder(order);
            setDrawerOpen(true);
          }
          return prev;
        });
        clearSearchTarget();
      }
    };
    window.addEventListener('search:navigate', handler);
    return () => window.removeEventListener('search:navigate', handler);
  }, [clearSearchTarget]);

  // Listen for orders created from the create-order page
  useEffect(() => {
    const handleOrderCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const orderData = customEvent.detail;
      if (orderData) {
        setData((prev) => [{
          id: orderData.id,
          customer: orderData.customer,
          items: orderData.items,
          total: orderData.total,
          status: orderData.status,
          date: orderData.date,
          priority: orderData.priority,
          deliveryType: orderData.deliveryType || 'truck',
          paymentStatus: orderData.paymentStatus || 'unpaid',
        }, ...prev]);
      }
    };
    window.addEventListener('order:created', handleOrderCreated);
    return () => window.removeEventListener('order:created', handleOrderCreated);
  }, []);

  // Listen for restored orders from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        const order = restoredData as Order;
        setData((prev) => [...prev, order]);
        setSelectedOrder((prev) => {
          if (prev && prev.id === order.id) {
            return order;
          }
          return prev;
        });
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  // Listen for delivery created — update order statuses to 'shipped'
  useEffect(() => {
    const handleDeliveryCreated = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { orderIds } = customEvent.detail;
      if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
        const idSet = new Set(orderIds);
        setData((prev) =>
          prev.map((order) =>
            idSet.has(order.id) ? { ...order, status: 'shipped' as const } : order
          )
        );
        setSelectedOrder((prev) => {
          if (prev && idSet.has(prev.id)) {
            return { ...prev, status: 'shipped' as const };
          }
          return prev;
        });
        toast.info(`${orderIds.length} order(s) status updated to Shipped`);
      }
    };
    window.addEventListener('delivery:created', handleDeliveryCreated);
    return () => window.removeEventListener('delivery:created', handleDeliveryCreated);
  }, []);

  // Mock order items for detail view
  // Find the delivery route that contains this order
  const findOrderDelivery = useCallback((orderId: string): DeliveryRoute | null => {
    return deliveries.find((d) => d.stops.some((s) => s.orderId === orderId)) ?? null;
  }, []);

  const mockOrderItems = useMemo(() => {
    return inventoryItems.slice(0, 6).flatMap((product) =>
      product.types.slice(0, 1).map((type) => ({
        name: product.name,
        typeName: type.name,
        productId: product.id,
        qty: Math.floor(Math.random() * 5) + 1,
        price: type.price,
      }))
    );
  }, []);

  const openAddDialog = useCallback(() => {
    // Navigate to the Create Order page instead of opening a dialog
    setReturnTo('orders');
    setCurrentView('create-order');
  }, [setCurrentView, setReturnTo]);

  const openEditDialog = useCallback((order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingOrder(order);
    setForm({
      customer: order.customer,
      items: String(order.items),
      total: String(order.total),
      priority: order.priority,
      deliveryType: 'deliveryType' in order ? (order as Record<string, unknown>).deliveryType as string : 'truck',
      paymentStatus: 'paymentStatus' in order ? (order as Record<string, unknown>).paymentStatus as string : 'unpaid',
    });
    setFormDialogOpen(true);
  }, []);

  const openArchiveDialog = useCallback((order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArchivingOrder(order);
    setArchiveDialogOpen(true);
  }, []);

  const openCancelDialog = useCallback((order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCancellingOrder(order);
    setCancelDialogOpen(true);
  }, []);

  const resetFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setForm(emptyOrderForm);
    setEditingOrder(null);
  }, []);

  const resetArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(false);
    setArchivingOrder(null);
  }, []);

  const resetCancelDialog = useCallback(() => {
    setCancelDialogOpen(false);
    setCancellingOrder(null);
  }, []);

  const openRescheduleDialog = useCallback((order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReschedulingOrder(order);
    // Pre-fill with current schedule if exists
    const currentDate = (order as Record<string, unknown>).scheduleDate as string | undefined;
    const currentTime = (order as Record<string, unknown>).scheduleTime as string | undefined;
    setRescheduleDate(currentDate || '');
    setRescheduleTime(currentTime || '');
    setRescheduleDialogOpen(true);
  }, []);

  const resetRescheduleDialog = useCallback(() => {
    setRescheduleDialogOpen(false);
    setReschedulingOrder(null);
    setRescheduleDate('');
    setRescheduleTime('');
  }, []);

  const handleReschedule = useCallback(() => {
    if (!reschedulingOrder) return;
    if (!rescheduleDate && !rescheduleTime) {
      toast.error('Please select a date or time to reschedule');
      return;
    }
    setData((prev) =>
      prev.map((order) =>
        order.id === reschedulingOrder.id
          ? { ...order, scheduleDate: rescheduleDate, scheduleTime: rescheduleTime } as Order & { scheduleDate?: string; scheduleTime?: string }
          : order
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === reschedulingOrder.id
        ? { ...prev, scheduleDate: rescheduleDate, scheduleTime: rescheduleTime } as Order & { scheduleDate?: string; scheduleTime?: string }
        : prev
    );
    toast.success(`Order ${reschedulingOrder.id} rescheduled to ${rescheduleDate || 'TBD'}${rescheduleTime ? ` at ${rescheduleTime}` : ''}`);
    resetRescheduleDialog();
  }, [reschedulingOrder, rescheduleDate, rescheduleTime, resetRescheduleDialog]);

  const handleSubmit = useCallback(() => {
    if (!form.customer.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }
    if (!form.items || isNaN(Number(form.items)) || Number(form.items) < 1) {
      toast.error('Please enter valid items count');
      return;
    }

    const total = parseFloat(Number(form.total).toFixed(2));
    const items = Math.floor(Number(form.items));
    const today = new Date().toISOString().split('T')[0];

    if (editingOrder) {
      setData((prev) =>
        prev.map((order) =>
          order.id === editingOrder.id
            ? { ...order, customer: form.customer.trim(), items, total, priority: form.priority as 'high' | 'medium' | 'low', paymentStatus: form.paymentStatus as PaymentStatus }
            : order
        )
      );
      toast.success('Order updated successfully');
      // Also update the selectedOrder in drawer if it matches
      setSelectedOrder((prev) =>
        prev && prev.id === editingOrder.id
          ? { ...prev, customer: form.customer.trim(), items, total, priority: form.priority as 'high' | 'medium' | 'low', paymentStatus: form.paymentStatus as PaymentStatus }
          : prev
      );
    } else {
      const maxNum = data.reduce((max, order) => {
        const num = parseInt(order.id.replace('ORD-', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newId = `ORD-${maxNum + 1}`;
      const newOrder: Order = {
        id: newId,
        customer: form.customer.trim(),
        items,
        total,
        status: 'pending',
        date: today,
        priority: form.priority as 'high' | 'medium' | 'low',
        paymentStatus: form.paymentStatus as PaymentStatus,
      };
      setData((prev) => [newOrder, ...prev]);
      toast.success('Order created successfully');
    }

    resetFormDialog();
  }, [form, editingOrder, data, resetFormDialog]);

  const handleArchive = useCallback(() => {
    if (!archivingOrder) return;
    archiveStore.archiveItem('order', archivingOrder, archivingOrder.id, archivingOrder.customer);
    setData((prev) => prev.filter((order) => order.id !== archivingOrder.id));
    if (selectedOrder?.id === archivingOrder.id) {
      setSelectedOrder(null);
      setDrawerOpen(false);
    }
    toast.success('Order archived successfully');
    resetArchiveDialog();
  }, [archivingOrder, selectedOrder, resetArchiveDialog, archiveStore]);

  const handleCancel = useCallback(() => {
    if (!cancellingOrder) return;
    setData((prev) =>
      prev.map((order) =>
        order.id === cancellingOrder.id
          ? { ...order, status: 'cancelled' as const }
          : order
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === cancellingOrder.id
        ? { ...prev, status: 'cancelled' as const }
        : prev
    );
    toast.success('Order cancelled successfully');
    resetCancelDialog();
  }, [cancellingOrder, resetCancelDialog]);

  const handleRowClick = useCallback((order: Order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Order ID
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Customer
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'items',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Items
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number)} items</span>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="tabular-nums font-semibold">
            {formatPeso(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as string} />
        ),
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ getValue }) => {
          const ps = getValue() as PaymentStatus | undefined;
          if (ps === 'paid') {
            return (
              <Badge className="gap-0.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[11px] px-2 py-0.5">
                <Wallet className="size-3" />Paid
              </Badge>
            );
          }
          return (
            <Badge className="gap-0.5 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[11px] px-2 py-0.5">
              <AlertTriangle className="size-3" />Unpaid
            </Badge>
          );
        },
      },
      {
        id: 'deliveryType',
        header: 'Delivery',
        cell: ({ row }) => {
          const dt = (row.original as Record<string, unknown>).deliveryType as string | undefined;
          if (dt === 'lalamove') {
            return (
              <Badge variant="outline" className="gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                <Bike className="h-3 w-3" />
                Lalamove
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="gap-1 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800">
              <Truck className="h-3 w-3" />
              Truck
            </Badge>
          );
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => (
          <PriorityBadge priority={getValue() as 'high' | 'medium' | 'low'} />
        ),
      },
      {
        accessorKey: 'date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Date
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const order = row.original;
          const canCancel = order.status === 'pending' || order.status === 'processing';
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => openEditDialog(order, e)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => openRescheduleDialog(order, e)}>
                  <CalendarClock className="mr-2 size-4" />
                  Reschedule
                </DropdownMenuItem>
                {canCancel && (
                  <DropdownMenuItem onClick={(e) => openCancelDialog(order, e)}>
                    <XIcon className="mr-2 size-4" />
                    Cancel Order
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => openArchiveDialog(order, e)}
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
    [openEditDialog, openCancelDialog, openArchiveDialog]
  );

  const filteredData = useMemo(() => {
    let result = data;

    if (statusFilter !== 'all') {
      result = result.filter((order) => order.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter((order) => order.priority === priorityFilter);
    }

    if (deliveryTypeFilter !== 'all') {
      result = result.filter((order) => {
        const dt = (order as Record<string, unknown>).deliveryType as string | undefined;
        return dt === deliveryTypeFilter;
      });
    }

    return result;
  }, [data, statusFilter, priorityFilter, deliveryTypeFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
                <p className="text-sm text-muted-foreground">
                  Track and manage customer orders
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Create Order
            </Button>
          </div>
        </FadeIn>

        {/* Summary Stats */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <AnimatedCard delay={0}>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ListOrdered className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="mt-1 text-xl font-bold">{data.length}</p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.05}>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
                    {data.filter((o) => o.status === 'pending').length}
                  </p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.1}>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="mt-1 text-xl font-bold text-blue-600 dark:text-blue-400">
                    {data.filter((o) => o.status === 'processing').length}
                  </p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.15}>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Truck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Shipped</p>
                  <p className="mt-1 text-xl font-bold text-violet-600 dark:text-violet-400">
                    {data.filter((o) => o.status === 'shipped').length}
                  </p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                  <CircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
                    {data.filter((o) => o.status === 'delivered').length}
                  </p>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </FadeIn>

        {/* Search & Filter Bar */}
        <FadeIn delay={0.2}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders by ID or customer..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={deliveryTypeFilter} onValueChange={setDeliveryTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Delivery" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Delivery</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="lalamove">Lalamove</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Data Table */}
        <FadeIn delay={0.3}>
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
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
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
                        onClick={() => handleRowClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ShoppingCart className="h-8 w-8 opacity-30" />
                          <p>No orders found matching your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {filteredData.length} of {data.length} orders
              </p>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Order Detail Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
            {selectedOrder && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <SheetTitle className="text-lg">
                      {selectedOrder.id}
                    </SheetTitle>
                    <StatusBadge status={selectedOrder.status} />
                    <PriorityBadge priority={selectedOrder.priority} />
                    {(() => {
                      const ps = (selectedOrder as Record<string, unknown>).paymentStatus as string | undefined;
                      if (ps === 'paid') {
                        return (
                          <Badge className="gap-0.5 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-1.5 py-0">
                            <Wallet className="size-2.5" />Paid
                          </Badge>
                        );
                      }
                      if (ps === 'unpaid') {
                        return (
                          <Badge className="gap-0.5 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[10px] px-1.5 py-0">
                            <AlertTriangle className="size-2.5" />Unpaid
                          </Badge>
                        );
                      }
                      return null;
                    })()}
                    {(() => {
                      const dt = (selectedOrder as Record<string, unknown>).deliveryType as string | undefined;
                      if (dt === 'lalamove') {
                        return (
                          <Badge variant="outline" className="gap-1 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                            <Bike className="h-3 w-3" />
                            Lalamove
                          </Badge>
                        );
                      }
                      return (
                        <Badge variant="outline" className="gap-1 bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800">
                          <Truck className="h-3 w-3" />
                          Truck
                        </Badge>
                      );
                    })()}
                  </div>
                  <SheetDescription>
                    Order placed on {selectedOrder.date}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 px-4 pb-6">
                  {/* Order Status - Read Only at Top */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Order Status
                    </h3>
                    <OrderStatusStepper
                      currentStatus={selectedOrder.status as OrderStatus}
                      onChangeStatus={() => {}}
                      interactive={false}
                      size="sm"
                    />
                  </div>

                  <Separator />

                  {/* Customer Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Customer Information
                    </h3>
                    <div className="space-y-2.5 rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <span className="text-sm font-semibold text-primary">
                            {selectedOrder.customer
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{selectedOrder.customer}</p>
                          <p className="text-xs text-muted-foreground">
                            Enterprise Customer
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 pl-12">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span>contact@{selectedOrder.customer.toLowerCase().replace(/\s+/g, '')}.com</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span>+1 (555) 000-{Math.floor(Math.random() * 9000 + 1000)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>123 Business Ave, Suite 100</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Order Items ({selectedOrder.items})
                    </h3>
                    <div className="space-y-2">
                      {mockOrderItems.slice(0, Math.min(selectedOrder.items, 6)).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-lg border p-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.typeName} · Qty: {item.qty} × ₱{item.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold tabular-nums">
                            ₱${(item.qty * item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Order Total */}
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="tabular-nums">
                        ₱${selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="tabular-nums text-green-600 dark:text-green-400">
                        Free
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="tabular-nums text-lg">
                        ₱${selectedOrder.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">Payment Status</span>
                      {(() => {
                        const ps = (selectedOrder as Record<string, unknown>).paymentStatus as string | undefined;
                        if (ps === 'paid') {
                          return (
                            <Badge className="gap-1 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[11px] px-2 py-0.5">
                              <Wallet className="size-3" />Paid
                            </Badge>
                          );
                        }
                        return (
                          <Badge className="gap-1 border-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 text-[11px] px-2 py-0.5">
                            <AlertTriangle className="size-3" />Unpaid
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>

                  <Separator />

                  {/* Delivery Assignment */}
                  {(() => {
                    const route = findOrderDelivery(selectedOrder.id);
                    if (!route) return null;
                    const stop = route.stops.find((s) => s.orderId === selectedOrder.id);
                    if (!stop) return null;
                    const stopIndex = route.stops.indexOf(stop) + 1;
                    return (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Delivery Assignment
                        </h3>
                        <div className="rounded-lg border bg-muted/30 p-3 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                                <Route className="h-3.5 w-3.5 text-primary" />
                              </div>
                              <span className="text-sm font-medium font-mono">{route.id}</span>
                            </div>
                            <StatusBadge status={route.status === 'in_transit' ? 'on_delivery' : route.status} pulse={route.status === 'in_transit'} />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="h-3.5 w-3.5" />
                            <span>{route.driver} · {route.vehicle}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">Stop {stopIndex}/{route.stops.length} · {stop.address}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {stop.status === 'delivered' ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                <span className="text-green-600 dark:text-green-400">Delivered at {stop.deliveredAt}</span>
                              </>
                            ) : stop.status === 'in_transit' ? (
                              <>
                                <Truck className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-blue-600 dark:text-blue-400">Out for delivery · ETA {stop.estimatedArrival}</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Scheduled · ETA {stop.estimatedArrival}</span>
                              </>
                            )}
                          </div>
                          {/* Mini route progress */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {route.stops.map((s, idx) => {
                              const isThisStop = s.orderId === selectedOrder.id;
                              return (
                                <React.Fragment key={s.id}>
                                  <div className={cn(
                                    'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
                                    s.status === 'delivered' ? 'bg-green-500 text-white' :
                                    s.status === 'in_transit' ? 'bg-blue-500 text-white animate-pulse' :
                                    'bg-muted text-muted-foreground',
                                    isThisStop && 'ring-2 ring-primary ring-offset-1'
                                  )}>
                                    {s.status === 'delivered' ? '✓' : idx + 1}
                                  </div>
                                  {idx < route.stops.length - 1 && (
                                    <div className={cn(
                                      'h-0.5 flex-1',
                                      s.status === 'delivered' ? 'bg-green-300' : 'bg-muted'
                                    )} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-1.5 mt-1"
                            onClick={() => {
                              setDrawerOpen(false);
                              setSelectedDeliveryId(route.id);
                              setReturnTo('orders');
                              setCurrentView('delivery-detail');
                            }}
                          >
                            View Delivery Route
                            <Route className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })()}

                  <Separator />

                  {/* Schedule Info + Reschedule Action */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Schedule
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => openRescheduleDialog(selectedOrder)}
                      >
                        <CalendarClock className="h-3 w-3" />
                        Reschedule
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      {(() => {
                        const sDate = (selectedOrder as Record<string, unknown>).scheduleDate as string | undefined;
                        const sTime = (selectedOrder as Record<string, unknown>).scheduleTime as string | undefined;
                        if (sDate || sTime) {
                          return (
                            <div className="flex items-center gap-2 text-sm">
                              <CalendarClock className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-medium">
                                {sDate || 'No date'}
                                {sTime ? ` at ${sTime}` : ''}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarClock className="h-4 w-4 shrink-0" />
                            <span>No schedule set</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <Separator />
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create/Edit Order Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={(open) => { if (!open) resetFormDialog(); else setFormDialogOpen(true); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? 'Edit Order' : 'Create Order'}
              </DialogTitle>
              <DialogDescription>
                {editingOrder
                  ? 'Update the order details below.'
                  : 'Fill in the details to create a new order.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="order-customer">Customer Name</Label>
                <Input
                  id="order-customer"
                  placeholder="Customer or company name"
                  value={form.customer}
                  onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="order-items">Items Count</Label>
                  <Input
                    id="order-items"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={form.items}
                    onChange={(e) => setForm((f) => ({ ...f, items: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order-total">Total Amount (₱)</Label>
                  <Input
                    id="order-total"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.total}
                    onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order-priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger id="order-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="order-delivery-type">Delivery Type</Label>
                <Select
                  value={form.deliveryType}
                  onValueChange={(v) => setForm((f) => ({ ...f, deliveryType: v }))}
                >
                  <SelectTrigger id="order-delivery-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="truck">
                      <span className="flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5" />
                        Truck
                      </span>
                    </SelectItem>
                    <SelectItem value="lalamove">
                      <span className="flex items-center gap-2">
                        <Bike className="h-3.5 w-3.5" />
                        Lalamove
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-payment-status">Payment Status</Label>
                <Select
                  value={form.paymentStatus}
                  onValueChange={(v) => setForm((f) => ({ ...f, paymentStatus: v }))}
                >
                  <SelectTrigger id="edit-payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        Unpaid
                      </span>
                    </SelectItem>
                    <SelectItem value="paid">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Paid
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFormDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingOrder ? 'Save Changes' : 'Create Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive order &quot;{archivingOrder?.id}&quot; for &quot;{archivingOrder?.customer}&quot;? Archived items can be restored from the Archived page.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetArchiveDialog}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleArchive}
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancel Order Confirmation Dialog */}
        <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel order &quot;{cancellingOrder?.id}&quot; for &quot;{cancellingOrder?.customer}&quot;? This will set the order status to cancelled.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetCancelDialog}>
                Keep Order
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                Cancel Order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reschedule Order Dialog */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={(open) => { if (!open) resetRescheduleDialog(); }}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                Reschedule Order
              </DialogTitle>
              <DialogDescription>
                Update the delivery schedule for order &quot;{reschedulingOrder?.id}&quot; — {reschedulingOrder?.customer}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="reschedule-date">
                  Delivery Date
                </Label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="pl-9"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reschedule-time">
                  Delivery Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reschedule-time"
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {/* Current schedule preview */}
              {(rescheduleDate || rescheduleTime) && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">New Schedule</p>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 text-primary" />
                    {rescheduleDate || 'No date set'}
                    {rescheduleTime ? ` at ${rescheduleTime}` : ''}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={resetRescheduleDialog}>
                Cancel
              </Button>
              <Button onClick={handleReschedule} className="gap-2">
                <CalendarClock className="h-4 w-4" />
                Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
