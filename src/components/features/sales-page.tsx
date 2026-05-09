"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  salesTransactions as initialSales,
  type SalesTransaction,
  type SaleStatus,
} from "@/lib/mock-data";
import {
  PageTransition,
  FadeIn,
  StaggerItem,
  StaggerContainer,
} from "@/components/shared/animated-components";
import { AnimatedCard } from "@/components/shared/animated-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  ShoppingCart,
  MoreHorizontal,
  Eye,
  Pencil,
  RotateCcw,
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  Package,
  User,
  Plus,
} from "lucide-react";
import { PesoSign, CirclePesoSign } from "@/components/icons/peso-sign";
import { toast } from "sonner";
import { cn, formatPeso } from "@/lib/utils";
import { useSearchStore } from "@/stores/search";

// ==================== Helpers ====================

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === "desc") return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

const statusConfig: Record<
  SaleStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    border: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
  },
  refunded: {
    label: "Refunded",
    icon: RotateCcw,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
};

function SaleStatusBadge({ status }: { status: SaleStatus }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1", cfg.bg, cfg.color, cfg.border)}
    >
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ==================== Form State ====================

interface SaleFormState {
  customer: string;
  orderId: string;
  items: string;
  subtotal: string;
  tax: string;
  total: string;
  status: string;
  soldAt: string;
}

const emptySaleForm: SaleFormState = {
  customer: "",
  orderId: "",
  items: "1",
  subtotal: "0",
  tax: "0",
  total: "0",
  status: "completed",
  soldAt: new Date().toISOString().split("T")[0],
};

// ==================== Main Component ====================

export default function SalesPage() {
  const [data, setData] = useState<SalesTransaction[]>(initialSales);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState<SalesTransaction | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundingSale, setRefundingSale] = useState<SalesTransaction | null>(
    null,
  );
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);

  // Create/Edit dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<SalesTransaction | null>(null);
  const [form, setForm] = useState<SaleFormState>(emptySaleForm);

  // Auto-calculate tax & total from subtotal
  const computedTax = useMemo(() => {
    const sub = parseFloat(form.subtotal) || 0;
    return sub * 0.08;
  }, [form.subtotal]);

  const computedTotal = useMemo(() => {
    const sub = parseFloat(form.subtotal) || 0;
    const tax = parseFloat(form.tax) || computedTax;
    return sub + tax;
  }, [form.subtotal, form.tax, computedTax]);

  const handleOpenCreateDialog = useCallback(() => {
    setEditingSale(null);
    setForm(emptySaleForm);
    setFormDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback(
    (sale: SalesTransaction, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setEditingSale(sale);
      setForm({
        customer: sale.customer,
        orderId: sale.orderId,
        items: String(sale.items),
        subtotal: sale.subtotal.toString(),
        tax: sale.tax.toString(),
        total: sale.total.toString(),
        status: sale.status,
        soldAt: sale.soldAt,
      });
      setFormDialogOpen(true);
    },
    [],
  );

  const resetFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setEditingSale(null);
    setForm(emptySaleForm);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.customer.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.orderId.trim()) {
      toast.error("Order ID is required");
      return;
    }
    const items = parseInt(form.items);
    if (!items || items < 1) {
      toast.error("Please enter a valid item count");
      return;
    }
    const subtotal = parseFloat(form.subtotal);
    if (isNaN(subtotal) || subtotal < 0) {
      toast.error("Please enter a valid subtotal");
      return;
    }
    const tax = parseFloat(form.tax);
    if (isNaN(tax) || tax < 0) {
      toast.error("Please enter a valid tax amount");
      return;
    }
    const total = subtotal + tax;
    const today = new Date().toISOString().split("T")[0];

    if (editingSale) {
      // Update existing
      setData((prev) =>
        prev.map((s) =>
          s.id === editingSale.id
            ? {
                ...s,
                customer: form.customer.trim(),
                orderId: form.orderId.trim(),
                items,
                subtotal,
                tax,
                total,
                status: form.status as SaleStatus,
                soldAt: form.soldAt || today,
              }
            : s,
        ),
      );
      setSelectedSale((prev) =>
        prev && prev.id === editingSale.id
          ? {
              ...prev,
              customer: form.customer.trim(),
              orderId: form.orderId.trim(),
              items,
              subtotal,
              tax,
              total,
              status: form.status as SaleStatus,
              soldAt: form.soldAt || today,
            }
          : prev,
      );
      toast.success(`Sale ${editingSale.id} updated successfully`);
    } else {
      // Create new
      const maxNum = data.reduce((max, s) => {
        const num = parseInt(s.id.replace("SAL-", ""), 10);
        return num > max ? num : max;
      }, 0);
      const newId = `SAL-${maxNum + 1}`;
      const now = new Date();
      const recordedAt = `${today} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const newSale: SalesTransaction = {
        id: newId,
        orderId: form.orderId.trim(),
        customer: form.customer.trim(),
        items,
        subtotal,
        tax,
        total,
        paymentMethod: "cash" as const,
        status: form.status as SaleStatus,
        soldAt: form.soldAt || today,
        recordedAt,
      };
      setData((prev) => [newSale, ...prev]);
      toast.success(
        `Payment ${newId} created successfully for ${form.customer.trim()}`,
      );
    }

    resetFormDialog();
  }, [form, editingSale, data, resetFormDialog]);

  // Refund handler
  const handleRefund = () => {
    if (!refundingSale) return;
    setData((prev) =>
      prev.map((s) =>
        s.id === refundingSale.id ? { ...s, status: "refunded" as const } : s,
      ),
    );
    setSelectedSale((prev) =>
      prev && prev.id === refundingSale.id
        ? { ...prev, status: "refunded" as const }
        : prev,
    );
    toast.success(`Sale ${refundingSale.id} has been refunded`);
    setRefundDialogOpen(false);
    setRefundingSale(null);
  };

  // Summary stats
  const stats = useMemo(() => {
    const completed = data.filter((s) => s.status === "completed");
    const refunded = data.filter((s) => s.status === "refunded");
    const pending = data.filter((s) => s.status === "pending");
    const totalRevenue = completed.reduce((sum, s) => sum + s.total, 0);
    const totalRefunded = refunded.reduce((sum, s) => sum + s.total, 0);
    const avgOrderValue =
      completed.length > 0 ? totalRevenue / completed.length : 0;
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
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result;
  }, [data, statusFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<SalesTransaction>[]>(
    () => [
      {
        accessorKey: "id",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sale ID <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "orderId",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Order <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "customer",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Customer <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10">
              <span className="text-[10px] font-semibold text-primary">
                {row.original.customer
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </span>
            </div>
            <span className="font-medium">{row.original.customer}</span>
          </div>
        ),
      },
      {
        accessorKey: "items",
        header: "Items",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue() as number} items</span>
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              "font-semibold tabular-nums",
              row.original.status === "refunded"
                ? "line-through text-muted-foreground"
                : "",
            )}
          >
            {formatPeso(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <SaleStatusBadge status={getValue() as SaleStatus} />
        ),
      },
      {
        accessorKey: "soldAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
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
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSale(sale);
                    setDrawerOpen(true);
                  }}
                >
                  <Eye className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handleOpenEditDialog(sale, e)}
                >
                  <Pencil className="mr-2 size-4" />
                  Edit Payment
                </DropdownMenuItem>
                {sale.status === "completed" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setRefundingSale(sale);
                        setRefundDialogOpen(true);
                      }}
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
    [handleOpenEditDialog],
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
            <Button onClick={handleOpenCreateDialog} className="gap-2">
              <Plus className="size-4" />
              Create Payment
            </Button>
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
                  <p className="mt-0.5 text-xl font-bold tabular-nums">
                    {stats.totalSales}
                  </p>
                </div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.09}>
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg. Order Value
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">
                    {formatPeso(stats.avgOrderValue)}
                  </p>
                </div>
              </div>
            </AnimatedCard>
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
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
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
                              cell.getContext(),
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
                    <SheetTitle className="text-lg font-mono">
                      {selectedSale.id}
                    </SheetTitle>
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
                          <p className="text-sm font-medium font-mono">
                            {selectedSale.orderId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <User className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Customer
                          </p>
                          <p className="text-sm font-medium">
                            {selectedSale.customer}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Package className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Items</p>
                          <p className="text-sm font-medium">
                            {selectedSale.items} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                          <Calendar className="size-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Sold At
                          </p>
                          <p className="text-sm font-medium">
                            {selectedSale.soldAt}
                          </p>
                        </div>
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
                        <span className="tabular-nums">
                          {formatPeso(selectedSale.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax (8%)</span>
                        <span className="tabular-nums">
                          {formatPeso(selectedSale.tax)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span
                          className={cn(
                            "tabular-nums text-lg",
                            selectedSale.status === "refunded"
                              ? "line-through text-muted-foreground"
                              : "",
                          )}
                        >
                          {formatPeso(selectedSale.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {selectedSale.status !== "refunded" && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setDrawerOpen(false);
                          handleOpenEditDialog(selectedSale);
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit Payment
                      </Button>
                    )}
                    {selectedSale.status === "completed" && (
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
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Create / Edit Payment Dialog */}
        <Dialog
          open={formDialogOpen}
          onOpenChange={(v) => {
            if (!v) resetFormDialog();
            else setFormDialogOpen(true);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingSale ? (
                  <>
                    <Pencil className="size-5 text-primary" />
                    Edit Payment — {editingSale.id}
                  </>
                ) : (
                  <>
                    <Plus className="size-5 text-primary" />
                    Create Payment
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {editingSale
                  ? "Update the payment details below."
                  : "Record a new sales transaction manually."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              {/* Customer */}
              <div className="grid gap-2">
                <Label htmlFor="sale-customer">Customer *</Label>
                <Input
                  id="sale-customer"
                  placeholder="Enter customer name"
                  value={form.customer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer: e.target.value }))
                  }
                />
              </div>

              {/* Order ID */}
              <div className="grid gap-2">
                <Label htmlFor="sale-order">Order ID *</Label>
                <Input
                  id="sale-order"
                  placeholder="e.g. ORD-2847"
                  value={form.orderId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, orderId: e.target.value }))
                  }
                />
              </div>

              {/* Items & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sale-items">Items *</Label>
                  <Input
                    id="sale-items"
                    type="number"
                    min="1"
                    placeholder="0"
                    value={form.items}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, items: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sale-date">Sale Date</Label>
                  <Input
                    id="sale-date"
                    type="date"
                    value={form.soldAt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, soldAt: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Subtotal & Tax */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sale-subtotal">Subtotal (₱) *</Label>
                  <Input
                    id="sale-subtotal"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.subtotal}
                    onChange={(e) => {
                      setForm((f) => ({
                        ...f,
                        subtotal: e.target.value,
                        tax: (parseFloat(e.target.value || "0") * 0.08).toFixed(
                          2,
                        ),
                      }));
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sale-tax">Tax (₱)</Label>
                  <Input
                    id="sale-tax"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.tax}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tax: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Computed Total Preview */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">
                    {formatPeso(parseFloat(form.subtotal) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (8%)</span>
                  <span className="tabular-nums">
                    {formatPeso(parseFloat(form.tax) || 0)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums text-base">
                    {formatPeso(computedTotal)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={resetFormDialog}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit}>
                {editingSale ? "Save Changes" : "Create Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Confirmation Dialog */}
        <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Issue Refund</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to issue a refund for sale{" "}
                <span className="font-semibold">{refundingSale?.id}</span> (
                {refundingSale?.customer})? This will refund{" "}
                <span className="font-semibold">
                  {formatPeso(refundingSale?.total)}
                </span>{" "}
                and mark the sale as refunded.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setRefundDialogOpen(false);
                  setRefundingSale(null);
                }}
              >
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
