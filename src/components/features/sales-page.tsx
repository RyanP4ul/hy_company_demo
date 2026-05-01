'use client';

import React, { useState, useMemo } from 'react';
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
import {
  salesTransactions as initialSales,
  type SalesTransaction,
  type PaymentMethod,
  type SaleStatus,
} from '@/lib/mock-data';
import { PageTransition, FadeIn } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Package,
  User,
} from 'lucide-react';
import { PesoSign, CirclePesoSign } from '@/components/icons/peso-sign';
import { toast } from 'sonner';
import { cn, formatPeso } from '@/lib/utils';
import { useSearchStore } from '@/stores/search';

// ==================== Helpers ====================

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

const paymentMethodConfig: Record<PaymentMethod, { label: string; icon: typeof CreditCard; color: string; bg: string }> = {
  visa: {
    label: 'Visa / Stripe',
    icon: CreditCard,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  gcash: {
    label: 'GCash',
    icon: Smartphone,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  cash: {
    label: 'Cash',
    icon: Banknote,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
};

const statusConfig: Record<SaleStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  refunded: {
    label: 'Refunded',
    icon: RotateCcw,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const cfg = paymentMethodConfig[method];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('gap-1', cfg.bg, cfg.color, 'border-0')}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('gap-1', cfg.bg, cfg.color, cfg.border)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ==================== Main Component ====================

export default function SalesPage() {
  const [data, setData] = useState<SalesTransaction[]>(initialSales);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedSale, setSelectedSale] = useState<SalesTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundingSale, setRefundingSale] = useState<SalesTransaction | null>(null);
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);

  // Auto-record sale from delivered orders (simulated)
  const handleRefund = () => {
    if (!refundingSale) return;
    setData((prev) =>
      prev.map((s) =>
        s.id === refundingSale.id ? { ...s, status: 'refunded' as const } : s
      )
    );
    setSelectedSale((prev) =>
      prev && prev.id === refundingSale.id ? { ...prev, status: 'refunded' as const } : prev
    );
    toast.success(`Sale ${refundingSale.id} has been refunded`);
    setRefundDialogOpen(false);
    setRefundingSale(null);
  };

  // Summary stats
  const stats = useMemo(() => {
    const completed = data.filter((s) => s.status === 'completed');
    const refunded = data.filter((s) => s.status === 'refunded');
    const pending = data.filter((s) => s.status === 'pending');
    const totalRevenue = completed.reduce((sum, s) => sum + s.total, 0);
    const totalRefunded = refunded.reduce((sum, s) => sum + s.total, 0);
    const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0;
    return {
      totalSales: completed.length,
      totalRevenue,
      totalRefunded,
      netRevenue: totalRevenue - totalRefunded,
      avgOrderValue,
      pendingCount: pending.length,
      refundedCount: refunded.length,
    };
  }, [data]);

  // Filtered data
  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (paymentFilter !== 'all') {
      result = result.filter((s) => s.paymentMethod === paymentFilter);
    }
    return result;
  }, [data, statusFilter, paymentFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<SalesTransaction>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Sale ID <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-primary">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'orderId',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Order <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'customer',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Customer <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
              <span className="text-[10px] font-semibold text-primary">
                {(row.original.customer).split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <span className="font-medium">{row.original.customer}</span>
          </div>
        ),
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ getValue }) => (
          <span className="tabular-nums">{(getValue() as number)} items</span>
        ),
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Total <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => (
          <span className={cn(
            'font-semibold tabular-nums',
            row.original.status === 'refunded' ? 'line-through text-muted-foreground' : ''
          )}>
            {formatPeso(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Payment',
        cell: ({ getValue }) => <PaymentMethodBadge method={getValue() as PaymentMethod} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <SaleStatusBadge status={getValue() as SaleStatus} />,
      },
      {
        accessorKey: 'soldAt',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Date <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const sale = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedSale(sale); setDrawerOpen(true); }}>
                  <Eye className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                {sale.status === 'completed' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); setRefundingSale(sale); setRefundDialogOpen(true); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <RotateCcw className="mr-2 size-4" />
                      Issue Refund
                    </DropdownMenuItem>
                  </>
                )}
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

  const handleRowClick = (sale: SalesTransaction) => {
    setSelectedSale(sale);
    setDrawerOpen(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <CirclePesoSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
                <p className="text-sm text-muted-foreground">
                  Track sales transactions &amp; revenue
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1.5 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200 dark:border-green-800 px-3 py-1.5">
                <Receipt className="size-3.5" />
                Auto-Recording Active
              </Badge>
            </div>
          </div>
        </FadeIn>

        {/* Summary Stats */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AnimatedCard delay={0}>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <PesoSign className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">
                    {formatPeso(stats.totalRevenue, 0, 0)}
                  </p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.03}>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                  <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Revenue</p>
                  <p className="mt-0.5 text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                    {formatPeso(stats.netRevenue, 0, 0)}
                  </p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.06}>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                  <ShoppingCart className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">{stats.totalSales}</p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.09}>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">
                    {formatPeso(stats.avgOrderValue)}
                  </p>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </FadeIn>

        {/* Payment Breakdown */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-3 gap-4">
            {(['visa', 'gcash', 'cash'] as PaymentMethod[]).map((method) => {
              const cfg = paymentMethodConfig[method];
              const Icon = cfg.icon;
              const methodSales = data.filter((s) => s.paymentMethod === method && s.status === 'completed');
              const methodTotal = methodSales.reduce((sum, s) => sum + s.total, 0);
              const pct = stats.totalRevenue > 0 ? (methodTotal / stats.totalRevenue) * 100 : 0;
              return (
                <AnimatedCard key={method} delay={0}>
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-9 items-center justify-center rounded-lg', cfg.bg)}>
                      <Icon className={cn('size-4', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{cfg.label}</p>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-base font-bold tabular-nums">
                          {formatPeso(methodTotal, 0, 0)}
                        </p>
                        <span className="text-xs font-medium text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </FadeIn>

        {/* Search & Filter */}
        <FadeIn delay={0.15}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by sale ID, order ID, or customer..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment</SelectItem>
                    <SelectItem value="visa">Visa / Stripe</SelectItem>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Data Table */}
        <FadeIn delay={0.2}>
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
                        onClick={() => handleRowClick(row.original)}
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
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <Receipt className="h-8 w-8 opacity-30" />
                          <p>No sales transactions found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {filteredData.length} of {data.length} transactions
              </p>
              <p className="text-sm font-medium text-muted-foreground">
                Net: {formatPeso(stats.netRevenue)}
              </p>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Sale Detail Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
            {selectedSale && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <SheetTitle className="text-lg font-mono">{selectedSale.id}</SheetTitle>
                    <SaleStatusBadge status={selectedSale.status} />
                  </div>
                  <SheetDescription>
                    Sale recorded on {selectedSale.recordedAt}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* Sale Overview */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Sale Overview
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <ShoppingCart className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Order</p>
                          <p className="text-sm font-medium font-mono">{selectedSale.orderId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <User className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Customer</p>
                          <p className="text-sm font-medium">{selectedSale.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Items</p>
                          <p className="text-sm font-medium">{selectedSale.items} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Calendar className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sold At</p>
                          <p className="text-sm font-medium">{selectedSale.soldAt}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Payment
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Method</span>
                        <PaymentMethodBadge method={selectedSale.paymentMethod} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Breakdown
                    </h3>
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="tabular-nums">₱${selectedSale.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (8%)</span>
                        <span className="tabular-nums">₱${selectedSale.tax.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className={cn(
                          'tabular-nums text-lg',
                          selectedSale.status === 'refunded' ? 'line-through text-muted-foreground' : ''
                        )}>
                          ₱${selectedSale.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedSale.status === 'completed' && (
                    <>
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-destructive hover:text-destructive"
                        onClick={() => {
                          setRefundingSale(selectedSale);
                          setRefundDialogOpen(true);
                        }}
                      >
                        <RotateCcw className="size-4" />
                        Issue Refund
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Refund Confirmation Dialog */}
        <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Issue Refund</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to issue a refund for sale <span className="font-semibold">{refundingSale?.id}</span> ({refundingSale?.customer})?
                This will refund <span className="font-semibold">₱${refundingSale?.total.toFixed(2)}</span> and mark the sale as refunded.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setRefundDialogOpen(false); setRefundingSale(null); }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRefund}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Refund
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
