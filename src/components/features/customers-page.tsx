'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { cn, formatPeso } from '@/lib/utils';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';
import { customers as initialCustomers } from '@/lib/mock-data';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Archive,
  Eye,
  ChevronUp,
  ChevronDown,
  Phone,
  Building2,
  MapPin,
  ShoppingCart,
  Calendar,
  UserX,
  UserCheck,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/peso-sign';
import { useAuthStore } from '@/stores/auth';

type Customer = (typeof initialCustomers)[number];

interface CustomerFormState {
  name: string;
  contactNumber: string;
  company: string;
  address: string;
}

const emptyForm: CustomerFormState = {
  name: '',
  contactNumber: '',
  company: '',
  address: '',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function CustomersPage() {
  const [data, setData] = useState<Customer[]>(initialCustomers);
  const userRole = useAuthStore((s) => s.user?.role ?? 'Admin');
  const isViewOnly = userRole !== 'Admin';
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [archivingCustomer, setArchivingCustomer] = useState<Customer | null>(null);
  const [togglingCustomer, setTogglingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Summary stats
  const totalCustomers = data.length;
  const activeCustomers = data.filter((c) => c.status === 'active').length;
  const totalRevenue = data.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrdersAll = data.reduce((sum, c) => sum + c.totalOrders, 0);

  // Listen for search navigation to auto-open customer detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'customer') {
        setData((prev) => {
          const customer = prev.find((c) => c.id === target.id);
          if (customer) {
            setDetailCustomer(customer);
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

  // Listen for restored customers from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setData((prev) => [...prev, restoredData as Customer]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  const openAddDialog = useCallback(() => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setFormDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      contactNumber: customer.contactNumber,
      company: customer.company,
      address: customer.address,
    });
    setFormDialogOpen(true);
  }, []);

  const openArchiveDialog = useCallback((customer: Customer) => {
    setArchivingCustomer(customer);
    setArchiveDialogOpen(true);
  }, []);

  const openToggleDialog = useCallback((customer: Customer) => {
    setTogglingCustomer(customer);
    setToggleDialogOpen(true);
  }, []);

  const resetFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setForm(emptyForm);
    setEditingCustomer(null);
  }, []);

  const resetArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(false);
    setArchivingCustomer(null);
  }, []);

  const resetToggleDialog = useCallback(() => {
    setToggleDialogOpen(false);
    setTogglingCustomer(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!form.contactNumber.trim()) {
      toast.error('Contact number is required');
      return;
    }

    if (editingCustomer) {
      setData((prev) =>
        prev.map((customer) =>
          customer.id === editingCustomer.id
            ? {
                ...customer,
                name: form.name.trim(),
                contactNumber: form.contactNumber.trim(),
                company: form.company.trim(),
                address: form.address.trim(),
              }
            : customer
        )
      );
      toast.success('Customer updated successfully');
    } else {
      const maxNum = data.reduce((max, customer) => {
        const num = parseInt(customer.id.replace('CST-', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newId = `CST-${String(maxNum + 1).padStart(3, '0')}`;
      const newCustomer: Customer = {
        id: newId,
        name: form.name.trim(),
        contactNumber: form.contactNumber.trim(),
        company: form.company.trim(),
        address: form.address.trim(),
        totalOrders: 0,
        totalSpent: 0,
        status: 'active' as const,
        joinDate: new Date().toISOString().split('T')[0],
        lastOrder: '-',
      };
      setData((prev) => [newCustomer, ...prev]);
      toast.success('Customer added successfully');
    }

    resetFormDialog();
  }, [form, editingCustomer, data, resetFormDialog]);

  const handleArchive = useCallback(() => {
    if (!archivingCustomer) return;
    archiveStore.archiveItem('customer', archivingCustomer, archivingCustomer.id, archivingCustomer.name);
    setData((prev) => prev.filter((customer) => customer.id !== archivingCustomer.id));
    toast.success('Customer archived successfully');
    resetArchiveDialog();
  }, [archivingCustomer, resetArchiveDialog, archiveStore]);

  const handleToggleStatus = useCallback(() => {
    if (!togglingCustomer) return;
    const newStatus = togglingCustomer.status === 'active' ? 'inactive' : 'active';
    setData((prev) =>
      prev.map((customer) =>
        customer.id === togglingCustomer.id
          ? { ...customer, status: newStatus as 'active' | 'inactive' }
          : customer
      )
    );
    toast.success(
      newStatus === 'inactive'
        ? `${togglingCustomer.name} has been deactivated`
        : `${togglingCustomer.name} has been activated`
    );
    resetToggleDialog();
  }, [togglingCustomer, resetToggleDialog]);

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Customer
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                {getInitials(row.getValue('name'))}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{row.getValue('name')}</div>
              <div className="text-xs text-muted-foreground">{row.original.id}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'contactNumber',
        header: 'Contact',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.getValue('contactNumber')}</span>
        ),
      },
      {
        accessorKey: 'company',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Company
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => {
          const company = row.getValue('company') as string;
          return (
            <span className={cn('text-sm', company ? '' : 'text-muted-foreground italic')}>
              {company || 'No company'}
            </span>
          );
        },
      },
      {
        accessorKey: 'totalOrders',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Orders
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => {
          const orders = row.getValue('totalOrders') as number;
          return (
            <Badge variant="secondary" className="tabular-nums font-medium">
              {orders}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'totalSpent',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total Spent
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">{formatPeso(row.getValue('totalSpent') as number)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('status') as 'active' | 'inactive';
          return <StatusBadge status={status} />;
        },
      },
      {
        accessorKey: 'lastOrder',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Order
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.getValue('lastOrder')}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const customer = row.original;
          const isActive = customer.status === 'active';
          return isViewOnly ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => { setDetailCustomer(customer); setDetailOpen(true); }}
            >
              <Eye className="size-4" />
              <span className="sr-only">View details</span>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                  <Pencil className="mr-2 size-4" />
                  Edit Customer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openToggleDialog(customer)}>
                  {isActive ? (
                    <>
                      <UserX className="mr-2 size-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 size-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openArchiveDialog(customer)}
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
    [openEditDialog, openToggleDialog, openArchiveDialog, isViewOnly]
  );

  const table = useReactTable({
    data,
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground">
                Manage your customers and track their order history.
              </p>
            </div>
            {!isViewOnly && (
              <Button className="gap-2" onClick={openAddDialog}>
                <Plus className="size-4" />
                Add Customer
              </Button>
            )}
            {isViewOnly && (
              <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <Eye className="size-3.5" />
                View Only
              </span>
            )}
          </div>
        </FadeIn>

        {/* Summary Cards */}
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <motion.div
              className="rounded-lg border bg-card p-4"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Customers</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{totalCustomers}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="size-5 text-primary" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>
          <StaggerItem>
            <motion.div
              className="rounded-lg border bg-card p-4"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active Customers</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{activeCustomers}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <UserCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>
          <StaggerItem>
            <motion.div
              className="rounded-lg border bg-card p-4"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Orders</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{totalOrdersAll}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ShoppingCart className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>
          <StaggerItem>
            <motion.div
              className="rounded-lg border bg-card p-4"
              whileHover={{ y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{formatPeso(totalRevenue)}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <PesoSign className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Search Bar */}
        <FadeIn delay={0.1}>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </FadeIn>

        {/* Data Table */}
        <StaggerContainer delay={0.15}>
          <motion.div
            className="rounded-lg border bg-card"
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
            }}
          >
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
                  table.getRowModel().rows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className="group border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </motion.div>

          {/* Pagination */}
          <StaggerItem>
            <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}{' '}
                of {table.getFilteredRowModel().rows.length} customers
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => table.previousPage()}
                      className={cn(
                        'cursor-pointer',
                        !table.getCanPreviousPage() && 'pointer-events-none opacity-50'
                      )}
                    />
                  </PaginationItem>
                  {Array.from({ length: table.getPageCount() }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={table.getState().pagination.pageIndex === i}
                        onClick={() => table.setPageIndex(i)}
                        className="cursor-pointer"
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => table.nextPage()}
                      className={cn(
                        'cursor-pointer',
                        !table.getCanNextPage() && 'pointer-events-none opacity-50'
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Add/Edit Customer Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={(open) => { if (!open) resetFormDialog(); else setFormDialogOpen(true); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? 'Edit Customer' : 'Add Customer'}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? 'Update the customer details below.'
                  : 'Fill in the details to add a new customer.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="customer-name"
                  placeholder="Customer name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-phone">Contact Number <span className="text-destructive">*</span></Label>
                <Input
                  id="customer-phone"
                  placeholder="+1 (555) 000-0000"
                  value={form.contactNumber}
                  onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-company">Company <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  id="customer-company"
                  placeholder="Company name"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  placeholder="Street, City, State, ZIP"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFormDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingCustomer ? 'Save Changes' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive &quot;{archivingCustomer?.name}&quot; ({archivingCustomer?.contactNumber})? Archived items can be restored from the Archived page.
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

        {/* Deactivate/Activate Confirmation Dialog */}
        <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {togglingCustomer?.status === 'active' ? 'Deactivate Customer' : 'Activate Customer'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {togglingCustomer?.status === 'active'
                  ? `Are you sure you want to deactivate "${togglingCustomer?.name}"? Their ordering will be paused.`
                  : `Are you sure you want to activate "${togglingCustomer?.name}"? They will be able to place orders again.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetToggleDialog}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatus}
                className={
                  togglingCustomer?.status === 'active'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : ''
                }
              >
                {togglingCustomer?.status === 'active' ? 'Deactivate' : 'Activate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Customer Detail Sheet (from search) */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar">
            {detailCustomer && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                        {getInitials(detailCustomer.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailCustomer.name}</SheetTitle>
                      <SheetDescription>{detailCustomer.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={detailCustomer.status} />
                    {detailCustomer.company && (
                      <Badge variant="outline" className="text-xs font-medium">
                        {detailCustomer.company}
                      </Badge>
                    )}
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* Order Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">{detailCustomer.totalOrders}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="mt-1 text-xl font-bold tabular-nums">{formatPeso(detailCustomer.totalSpent)}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm font-medium">{detailCustomer.contactNumber}</p>
                        </div>
                      </div>
                      {detailCustomer.company && (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Company</p>
                            <p className="text-sm font-medium">{detailCustomer.company}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">{detailCustomer.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dates */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Joined</p>
                          <p className="text-sm font-medium">{detailCustomer.joinDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Order</p>
                          <p className="text-sm font-medium">{detailCustomer.lastOrder}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {!isViewOnly && (
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        setDetailOpen(false);
                        openEditDialog(detailCustomer);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Customer
                    </Button>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
