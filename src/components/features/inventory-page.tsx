'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  MoreHorizontal,
  Pencil,
  Archive,
  ChevronLeft,
  ChevronRight,
  Warehouse,
  Layers,
  Tag,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/peso-sign';
import { toast } from 'sonner';

import { inventoryItems as initialInventory } from '@/lib/mock-data';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
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
import { cn } from '@/lib/utils';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';

type InventoryItem = (typeof initialInventory)[number];

interface ProductFormState {
  name: string;
  category: string;
  price: string;
  stock: string;
  minStock: string;
  warehouse: string;
}

const emptyForm: ProductFormState = {
  name: '',
  category: 'Electronics',
  price: '',
  stock: '',
  minStock: '',
  warehouse: 'Warehouse A',
};

function calculateStatus(stock: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (stock === 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryItem[]>(initialInventory);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [archivingItem, setArchivingItem] = useState<InventoryItem | null>(null);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  // Listen for search navigation to auto-open inventory detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'inventory') {
        setData((prev) => {
          const item = prev.find((i) => i.id === target.id);
          if (item) {
            setDetailItem(item);
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

  // Listen for restored items from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setData((prev) => [...prev, restoredData as InventoryItem]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  const openAddDialog = useCallback(() => {
    setEditingItem(null);
    setForm(emptyForm);
    setFormDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      price: String(item.price),
      stock: String(item.stock),
      minStock: String(item.minStock),
      warehouse: item.warehouse,
    });
    setFormDialogOpen(true);
  }, []);

  const openArchiveDialog = useCallback((item: InventoryItem) => {
    setArchivingItem(item);
    setArchiveDialogOpen(true);
  }, []);

  const resetFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setForm(emptyForm);
    setEditingItem(null);
  }, []);

  const resetArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(false);
    setArchivingItem(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      toast.error('Please enter valid stock quantity');
      return;
    }
    if (!form.minStock || isNaN(Number(form.minStock)) || Number(form.minStock) < 0) {
      toast.error('Please enter valid minimum stock');
      return;
    }

    const price = parseFloat(Number(form.price).toFixed(2));
    const stock = Math.floor(Number(form.stock));
    const minStock = Math.floor(Number(form.minStock));
    const status = calculateStatus(stock, minStock);
    const today = new Date().toISOString().split('T')[0];

    if (editingItem) {
      setData((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: form.name.trim(), category: form.category, price, stock, minStock, status, warehouse: form.warehouse, lastUpdated: today }
            : item
        )
      );
      toast.success('Product updated successfully');
    } else {
      const maxNum = data.reduce((max, item) => {
        const num = parseInt(item.id.replace('SKU-', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newId = `SKU-${String(maxNum + 1).padStart(3, '0')}`;
      const newItem: InventoryItem = {
        id: newId,
        name: form.name.trim(),
        category: form.category,
        price,
        stock,
        minStock,
        status,
        warehouse: form.warehouse,
        lastUpdated: today,
      };
      setData((prev) => [newItem, ...prev]);
      toast.success('Product added successfully');
    }

    resetFormDialog();
  }, [form, editingItem, data, resetFormDialog]);

  const handleArchive = useCallback(() => {
    if (!archivingItem) return;
    archiveStore.archiveItem('inventory', archivingItem, archivingItem.id, archivingItem.name);
    setData((prev) => prev.filter((item) => item.id !== archivingItem.id));
    toast.success('Product archived successfully');
    resetArchiveDialog();
  }, [archivingItem, resetArchiveDialog, archiveStore]);

  const columns = useMemo<ColumnDef<InventoryItem>[]>(
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
            SKU
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
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Category
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <Badge variant="secondary" className="text-xs">
            {getValue() as string}
          </Badge>
        ),
      },
      {
        accessorKey: 'price',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Price
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="tabular-nums">
            ₱${(getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'stock',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Stock
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ row }) => {
          const stock = row.getValue('stock') as number;
          const minStock = row.original.minStock;
          const isLow = stock > 0 && stock <= minStock;
          return (
            <span
              className={cn(
                'tabular-nums font-medium',
                isLow && 'text-amber-600 dark:text-amber-400',
                stock === 0 && 'text-red-600 dark:text-red-400'
              )}
            >
              {stock.toLocaleString()}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as string} />
        ),
      },
      {
        accessorKey: 'warehouse',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Warehouse
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'lastUpdated',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Updated
            <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-sm">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(row.original)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openArchiveDialog(row.original)}
              >
                <Archive className="mr-2 size-4" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [openEditDialog, openArchiveDialog]
  );

  const filteredData = useMemo(() => {
    let result = data;

    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter((item) => item.category === categoryFilter);
    }

    return result;
  }, [data, statusFilter, categoryFilter]);

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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your product inventory and stock levels
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </FadeIn>

        {/* Summary Cards */}
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <AnimatedCard delay={0}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="mt-1 text-2xl font-bold">{data.length}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2.5">
                  <Package className="h-5 w-5 text-primary" />
                </div>
              </div>
            </AnimatedCard>
          </StaggerItem>
          <StaggerItem>
            <AnimatedCard delay={0.05}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Stock</p>
                  <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.filter((i) => i.status === 'in_stock').length}
                  </p>
                </div>
                <StatusBadge status="in_stock" />
              </div>
            </AnimatedCard>
          </StaggerItem>
          <StaggerItem>
            <AnimatedCard delay={0.1}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {data.filter((i) => i.status === 'low_stock').length}
                  </p>
                </div>
                <StatusBadge status="low_stock" pulse />
              </div>
            </AnimatedCard>
          </StaggerItem>
          <StaggerItem>
            <AnimatedCard delay={0.15}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                    {data.filter((i) => i.status === 'out_of_stock').length}
                  </p>
                </div>
                <StatusBadge status="out_of_stock" />
              </div>
            </AnimatedCard>
          </StaggerItem>
        </StaggerContainer>

        {/* Search & Filter Bar */}
        <FadeIn delay={0.2}>
          <AnimatedCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
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
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Home">Home</SelectItem>
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
                        className={cn(
                          'transition-colors duration-150',
                          row.original.status === 'low_stock' &&
                            'bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20',
                          row.original.status === 'out_of_stock' &&
                            'bg-red-50/30 hover:bg-red-100/30 dark:bg-red-950/10 dark:hover:bg-red-950/20'
                        )}
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
                          <Package className="h-8 w-8 opacity-30" />
                          <p>No products found matching your filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {table.getState().pagination.pageIndex * 10 + 1} to{' '}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * 10,
                  filteredData.length
                )}{' '}
                of {filteredData.length} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: table.getPageCount() },
                    (_, i) => (
                      <Button
                        key={i}
                        variant={
                          table.getState().pagination.pageIndex === i
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => table.setPageIndex(i)}
                      >
                        {i + 1}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AnimatedCard>
        </FadeIn>

        {/* Add/Edit Product Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={(open) => { if (!open) resetFormDialog(); else setFormDialogOpen(true); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Product' : 'Add Product'}
              </DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Update the product details below.'
                  : 'Fill in the details to add a new product.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product-name">Name</Label>
                <Input
                  id="product-name"
                  placeholder="Product name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                  >
                    <SelectTrigger id="product-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                      <SelectItem value="Home">Home</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-warehouse">Warehouse</Label>
                  <Select
                    value={form.warehouse}
                    onValueChange={(v) => setForm((f) => ({ ...f, warehouse: v }))}
                  >
                    <SelectTrigger id="product-warehouse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Warehouse A">Warehouse A</SelectItem>
                      <SelectItem value="Warehouse B">Warehouse B</SelectItem>
                      <SelectItem value="Warehouse C">Warehouse C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-price">Price (₱)</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-stock">Stock</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="product-minstock">Min Stock</Label>
                  <Input
                    id="product-minstock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={form.minStock}
                    onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFormDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingItem ? 'Save Changes' : 'Add Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive &quot;{archivingItem?.name}&quot; ({archivingItem?.id})? Archived items can be restored from the Archived page.
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

        {/* Product Detail Sheet (from search) */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar">
            {detailItem && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailItem.name}</SheetTitle>
                      <SheetDescription>{detailItem.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={detailItem.status} />
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <PesoSign className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Price</span>
                      </div>
                      <p className="text-xl font-bold">₱${detailItem.price.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Layers className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Stock</span>
                      </div>
                      <p className={cn(
                        'text-xl font-bold',
                        detailItem.status === 'low_stock' && 'text-amber-600 dark:text-amber-400',
                        detailItem.status === 'out_of_stock' && 'text-red-600 dark:text-red-400',
                        detailItem.status === 'in_stock' && 'text-green-600 dark:text-green-400'
                      )}>
                        {detailItem.stock.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Min: {detailItem.minStock}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Category</p>
                          <p className="text-sm font-medium">{detailItem.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Warehouse</p>
                          <p className="text-sm font-medium">{detailItem.warehouse}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium">{detailItem.lastUpdated}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Stock Status</p>
                          <p className="text-sm font-medium">
                            {detailItem.stock === 0 ? 'Out of Stock' :
                             detailItem.stock <= detailItem.minStock ? 'Low Stock' : 'In Stock'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setDetailOpen(false);
                      openEditDialog(detailItem);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Product
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
