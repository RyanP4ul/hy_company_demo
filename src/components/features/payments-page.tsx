'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  CreditCard,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Wallet,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Copy,
  MoreHorizontal,
  ExternalLink,
  ShoppingBag,
  Smartphone,
  Download,
  X as XIcon,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/peso-sign';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import { useNavigationStore } from '@/stores/navigation';
import { payments, type Payment, type PaymentMethod, type PaymentStatus } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn, formatPeso, formatNumber } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ========================
// SortIcon Component
// ========================

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

// ========================
// Payment Status Badge (Inline)
// ========================

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  completed: {
    label: 'Completed',
    className:
      'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  pending: {
    label: 'Pending',
    className:
      'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    icon: <Clock className="h-3 w-3" />,
  },
  failed: {
    label: 'Failed',
    className:
      'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: <XCircle className="h-3 w-3" />,
  },
  refunded: {
    label: 'Refunded',
    className:
      'bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    icon: <RotateCcw className="h-3 w-3" />,
  },
};

function PaymentStatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  const config = paymentStatusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ========================
// Payment Method Badge
// ========================

const methodConfig: Record<
  PaymentMethod,
  { label: string; className: string; icon: React.ReactNode }
> = {
  visa: {
    label: 'Visa / Stripe',
    className:
      'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: <CreditCard className="h-3 w-3" />,
  },
  gcash: {
    label: 'GCash / PayMongo',
    className:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: <Smartphone className="h-3 w-3" />,
  },
  cash: {
    label: 'Cash',
    className:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: <Banknote className="h-3 w-3" />,
  },
};

function PaymentMethodBadge({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  const config = methodConfig[method];
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ========================
// Helper: Date range filter
// ========================

function matchesDateRange(dateStr: string, range: string): boolean {
  if (range === 'all') return true;
  const paymentDate = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'today') {
    return paymentDate >= today;
  }
  if (range === 'week') {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return paymentDate >= weekAgo;
  }
  if (range === 'month') {
    return (
      paymentDate.getMonth() === today.getMonth() &&
      paymentDate.getFullYear() === today.getFullYear()
    );
  }
  return true;
}

// ========================
// Main Component
// ========================

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>(payments);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Navigation
  const setCurrentView = useNavigationStore((s) => s.setCurrentView);

  // Summary counts
  const totalCount = data.length;
  const completedCount = useMemo(
    () => data.filter((p) => p.status === 'completed').length,
    [data]
  );
  const pendingCount = useMemo(
    () => data.filter((p) => p.status === 'pending').length,
    [data]
  );
  const failedCount = useMemo(
    () => data.filter((p) => p.status === 'failed').length,
    [data]
  );
  const refundedCount = useMemo(
    () => data.filter((p) => p.status === 'refunded').length,
    [data]
  );

  // Total volume
  const totalVolume = useMemo(
    () =>
      data
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
    [data]
  );

  // Filtering logic
  const filteredData = useMemo(() => {
    let result = data;

    if (methodFilter !== 'all') {
      result = result.filter((p) => p.method === methodFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (dateRangeFilter !== 'all') {
      result = result.filter((p) => matchesDateRange(p.date, dateRangeFilter));
    }

    return result;
  }, [data, methodFilter, statusFilter, dateRangeFilter]);

  const hasActiveFilters =
    methodFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    globalFilter.length > 0;

  const handleClearFilters = useCallback(() => {
    setMethodFilter('all');
    setStatusFilter('all');
    setDateRangeFilter('all');
    setGlobalFilter('');
  }, []);

  // Row click / view details
  const handleRowClick = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setSheetOpen(true);
  }, []);

  const handleViewDetails = useCallback(
    (payment: Payment, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedPayment(payment);
      setSheetOpen(true);
    },
    []
  );

  const handleCopyRef = useCallback((refId: string) => {
    navigator.clipboard.writeText(refId).then(() => {
      toast.success('Reference ID copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy reference ID');
    });
  }, []);

  const handleNavigateToOrder = useCallback(
    (orderId: string) => {
      setCurrentView('orders');
      // Dispatch event for orders page to pick up
      window.dispatchEvent(
        new CustomEvent('search:navigate', {
          detail: { type: 'order', id: orderId },
        })
      );
    },
    [setCurrentView]
  );

  const handleExport = useCallback(() => {
    toast.success('Payment data exported successfully');
  }, []);

  // Table columns
  const columns = useMemo<ColumnDef<Payment>[]>(
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
            Payment ID
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
        accessorKey: 'orderId',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Order
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
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
        accessorKey: 'amount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Amount
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-bold tabular-nums">
            {formatPeso(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'method',
        header: 'Method',
        cell: ({ getValue }) => (
          <PaymentMethodBadge method={getValue() as PaymentMethod} />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <PaymentStatusBadge status={getValue() as PaymentStatus} />
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
          const payment = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => handleViewDetails(payment, e)}>
                  <Eye className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleViewDetails]
  );

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
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 space-y-6 pb-6">
          {/* ============================== */}
          {/* 1. Page Header                 */}
          {/* ============================== */}
          <FadeIn>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
                  <p className="text-sm text-muted-foreground">
                    Track and manage payment transactions
                  </p>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </FadeIn>

          {/* ============================== */}
          {/* 2. Summary Cards               */}
          {/* ============================== */}
          <StaggerContainer className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StaggerItem>
              <AnimatedCard delay={0}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payments</p>
                    <p className="mt-1 text-2xl font-bold">{totalCount}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <PesoSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </AnimatedCard>
            </StaggerItem>
            <StaggerItem>
              <AnimatedCard delay={0.05}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                      {completedCount}
                    </p>
                  </div>
                  <StatusBadge status="completed" />
                </div>
              </AnimatedCard>
            </StaggerItem>
            <StaggerItem>
              <AnimatedCard delay={0.1}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {pendingCount}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              </AnimatedCard>
            </StaggerItem>
            <StaggerItem>
              <AnimatedCard delay={0.15}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                      {failedCount}
                    </p>
                  </div>
                  <StatusBadge status="error" />
                </div>
              </AnimatedCard>
            </StaggerItem>
            <StaggerItem>
              <AnimatedCard delay={0.2}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Refunded</p>
                    <p className="mt-1 text-2xl font-bold text-muted-foreground">
                      {refundedCount}
                    </p>
                  </div>
                  <StatusBadge status="warning" />
                </div>
              </AnimatedCard>
            </StaggerItem>
          </StaggerContainer>

          {/* ============================== */}
          {/* 3. Search & Filter Bar         */}
          {/* ============================== */}
          <FadeIn delay={0.2}>
            <AnimatedCard>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search payments by ID, order, or customer..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[170px]">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="visa">Visa / Stripe</SelectItem>
                      <SelectItem value="gcash">GCash / PayMongo</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handleClearFilters}
                    >
                      <XIcon className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </AnimatedCard>
          </FadeIn>

          {/* ============================== */}
          {/* 4. Payment Logs Table          */}
          {/* ============================== */}
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
                            <Wallet className="h-8 w-8 opacity-30" />
                            <p>No payments found matching your filters.</p>
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
                  Showing {filteredData.length} of {data.length} payments
                </p>
              </div>
            </AnimatedCard>
          </FadeIn>
        </div>

        {/* ============================== */}
        {/* 6. Footer                      */}
        {/* ============================== */}
        <footer className="mt-auto border-t py-4">
          <p className="text-center text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.length} transactions · Total
            Volume: {formatPeso(totalVolume)}
          </p>
        </footer>
      </div>

      {/* ============================== */}
      {/* 5. Payment Detail Sheet        */}
      {/* ============================== */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
          {selectedPayment && (
            <>
              <SheetHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <SheetTitle className="text-lg">
                    {selectedPayment.id}
                  </SheetTitle>
                  <PaymentStatusBadge status={selectedPayment.status} />
                </div>
                <SheetDescription>
                  {selectedPayment.date}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                {/* ---- Payment Overview ---- */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Overview
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <PesoSign className="h-5 w-5 text-muted-foreground" />
                      <span className="text-3xl font-bold tabular-nums">
                        {formatPeso(selectedPayment.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">
                        Status
                      </Label>
                      <PaymentStatusBadge status={selectedPayment.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">
                        Method
                      </Label>
                      <PaymentMethodBadge method={selectedPayment.method} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ---- Order Information ---- */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Order Information
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        Order ID
                      </Label>
                      <button
                        onClick={() =>
                          handleNavigateToOrder(selectedPayment.orderId)
                        }
                        className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {selectedPayment.orderId}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        Customer
                      </Label>
                      <span className="text-sm font-medium">
                        {selectedPayment.customer}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">
                        Description
                      </Label>
                      <span className="max-w-[200px] text-right text-sm text-muted-foreground">
                        {selectedPayment.description}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ---- Payment Method Details ---- */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Payment Method Details
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                    {selectedPayment.method === 'visa' && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
                            <CreditCard className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Card ending in &bull;&bull;&bull;&bull;{' '}
                              {selectedPayment.last4 || '4242'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Processed by Stripe
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedPayment.method === 'gcash' && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                            <Smartphone className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              GCash Number:{' '}
                              {selectedPayment.gcashNumber || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Processed by PayMongo
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedPayment.method === 'cash' && (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30">
                            <Banknote className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Processed by:{' '}
                              {selectedPayment.processedBy || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Manual Transaction
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* ---- Transaction Reference ---- */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Transaction Reference
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-mono text-sm">
                        {selectedPayment.refId || 'N/A'}
                      </span>
                      {selectedPayment.refId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 size-8"
                          onClick={() =>
                            handleCopyRef(selectedPayment.refId!)
                          }
                        >
                          <Copy className="size-4" />
                          <span className="sr-only">Copy reference ID</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </PageTransition>
  );
}
