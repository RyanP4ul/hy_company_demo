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
  Calendar,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/peso-sign';
import { toast } from 'sonner';

import { inventoryItems as initialInventory, getProductStatus, getTotalStock, getMinPrice, type ProductType, type InventoryItem } from '@/lib/mock-data';
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

interface TypeFormState {
  name: string;
  stock: string;
  minStock: string;
  price: string;
}

interface ProductFormState {
  name: string;
  warehouse: string;
  types: TypeFormState[];
}

const emptyTypeForm = (): TypeFormState => ({
  name: '',
  stock: '',
  minStock: '',
  price: '',
});

const emptyForm: ProductFormState = {
  name: '',
  warehouse: 'Warehouse A',
  types: [],
};

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

  // Type dialog states
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingTypeIndex, setEditingTypeIndex] = useState<number | null>(null);
  const [typeForm, setTypeForm] = useState<TypeFormState>(emptyTypeForm());

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
      warehouse: item.warehouse,
      types: item.types.map((t) => ({
        name: t.name,
        stock: String(t.stock),
        minStock: String(t.minStock),
        price: String(t.price),
      })),
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
    setTypeDialogOpen(false);
    setEditingTypeIndex(null);
    setTypeForm(emptyTypeForm());
  }, []);

  const resetArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(false);
    setArchivingItem(null);
  }, []);

  // Open add type dialog
  const openAddTypeDialog = useCallback(() => {
    setEditingTypeIndex(null);
    setTypeForm(emptyTypeForm());
    setTypeDialogOpen(true);
  }, []);

  // Open edit type dialog
  const openEditTypeDialog = useCallback((index: number) => {
    const t = form.types[index];
    if (!t) return;
    setEditingTypeIndex(index);
    setTypeForm({ name: t.name, stock: t.stock, minStock: t.minStock, price: t.price });
    setTypeDialogOpen(true);
  }, [form.types]);

  // Save type from dialog
  const handleSaveType = useCallback(() => {
    if (!typeForm.name.trim()) {
      toast.error('Type name is required');
      return;
    }
    if (!typeForm.price || isNaN(Number(typeForm.price)) || Number(typeForm.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (typeForm.stock === '' || isNaN(Number(typeForm.stock)) || Number(typeForm.stock) < 0) {
      toast.error('Please enter valid stock');
      return;
    }
    if (typeForm.minStock === '' || isNaN(Number(typeForm.minStock)) || Number(typeForm.minStock) < 0) {
      toast.error('Please enter valid minimum stock');
      return;
    }

    setForm((f) => {
      const newType: TypeFormState = {
        name: typeForm.name.trim(),
        stock: typeForm.stock,
        minStock: typeForm.minStock,
        price: typeForm.price,
      };
      if (editingTypeIndex !== null) {
        const newTypes = [...f.types];
        newTypes[editingTypeIndex] = newType;
        return { ...f, types: newTypes };
      }
      return { ...f, types: [...f.types, newType] };
    });
    setTypeDialogOpen(false);
    setEditingTypeIndex(null);
    setTypeForm(emptyTypeForm());
    toast.success(editingTypeIndex !== null ? 'Type updated' : 'Type added');
  }, [typeForm, editingTypeIndex]);

  // Remove type
  const handleRemoveType = useCallback((index: number) => {
    setForm((f) => ({ ...f, types: f.types.filter((_, i) => i !== index) }));
    toast.info('Type removed');
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (form.types.length === 0) {
      toast.error('At least one product type is required');
      return;
    }
    for (const t of form.types) {
      if (!t.name.trim()) {
        toast.error('All type names are required');
        return;
      }
      if (!t.price || isNaN(Number(t.price)) || Number(t.price) <= 0) {
        toast.error(`Please enter a valid price for type "${t.name}"`);
        return;
      }
      if (!t.stock || isNaN(Number(t.stock)) || Number(t.stock) < 0) {
        toast.error(`Please enter valid stock for type "${t.name}"`);
        return;
      }
      if (!t.minStock || isNaN(Number(t.minStock)) || Number(t.minStock) < 0) {
        toast.error(`Please enter valid minimum stock for type "${t.name}"`);
        return;
      }
    }

    const types: ProductType[] = form.types.map((t, i) => ({
      id: editingItem ? (editingItem.types[i]?.id ?? `T-${Date.now()}-${i}`) : `T-${Date.now()}-${i}`,
      name: t.name.trim(),
      price: parseFloat(Number(t.price).toFixed(2)),
      stock: Math.floor(Number(t.stock)),
      minStock: Math.floor(Number(t.minStock)),
    }));
    const today = new Date().toISOString().split('T')[0];

    if (editingItem) {
      setData((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, name: form.name.trim(), types, warehouse: form.warehouse, lastUpdated: today }
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
        types,
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
        id: 'types',
        header: 'Types',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.types.length} {row.original.types.length === 1 ? 'type' : 'types'}
          </Badge>
        ),
      },
      {
        id: 'priceRange',
        header: 'Price',
        cell: ({ row }) => {
          const prices = row.original.types.map(t => t.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return (
            <span className="tabular-nums">
              ₱{min === max ? min.toFixed(2) : `${min.toFixed(2)} – ${max.toFixed(2)}`}
            </span>
          );
        },
      },
      {
        id: 'totalStock',
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
          const totalStock = getTotalStock(row.original.types);
          const status = getProductStatus(row.original.types);
          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'tabular-nums font-medium',
                  status === 'low_stock' && 'text-amber-600 dark:text-amber-400',
                  status === 'out_of_stock' && 'text-red-600 dark:text-red-400'
                )}
              >
                {totalStock.toLocaleString()}
              </span>
              <StatusBadge status={status} />
            </div>
          );
        },
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
      result = result.filter((item) => getProductStatus(item.types) === statusFilter);
    }

    return result;
  }, [data, statusFilter]);

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
                    {data.filter((i) => getProductStatus(i.types) === 'in_stock').length}
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
                    {data.filter((i) => getProductStatus(i.types) === 'low_stock').length}
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
                    {data.filter((i) => getProductStatus(i.types) === 'out_of_stock').length}
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
                          getProductStatus(row.original.types) === 'low_stock' &&
                            'bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20',
                          getProductStatus(row.original.types) === 'out_of_stock' &&
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  placeholder="Product name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
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

              {/* Product Types */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    Product Types
                    {form.types.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {form.types.length} {form.types.length === 1 ? 'type' : 'types'}
                      </Badge>
                    )}
                  </Label>
                  {form.types.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={openAddTypeDialog}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Type
                    </Button>
                  )}
                </div>

                {form.types.length === 0 ? (
                  /* Empty state — like "Add First Item" in Create Order */
                  <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-lg">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <Layers className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No types added yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Click &quot;Add First Type&quot; to define product variations
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-4 gap-1.5"
                      onClick={openAddTypeDialog}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add First Type
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {form.types.map((type, idx) => {
                      const stockVal = type.stock !== '' ? Number(type.stock) : null;
                      const minStockVal = type.minStock !== '' ? Number(type.minStock) : null;
                      const typeStatus = stockVal !== null && minStockVal !== null
                        ? stockVal === 0 ? 'out_of_stock'
                          : stockVal < minStockVal ? 'low_stock'
                            : 'in_stock'
                        : null;
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center rounded-lg border bg-background px-3 py-2.5 group"
                        >
                          {/* Type name + status */}
                          <div className="col-span-4 sm:col-span-3 min-w-0">
                            <p className="text-sm font-medium truncate">{type.name || 'Untitled'}</p>
                            {typeStatus && (
                              <span className={cn(
                                'text-[10px] font-medium',
                                typeStatus === 'in_stock' && 'text-emerald-600 dark:text-emerald-400',
                                typeStatus === 'low_stock' && 'text-amber-600 dark:text-amber-400',
                                typeStatus === 'out_of_stock' && 'text-red-600 dark:text-red-400',
                              )}>
                                {typeStatus === 'in_stock' ? 'In Stock' : typeStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                              </span>
                            )}
                          </div>
                          {/* Stock */}
                          <div className="col-span-3 sm:col-span-2 text-center">
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <span className="font-medium text-foreground tabular-nums">{stockVal !== null ? stockVal : '-'}</span>
                          </div>
                          {/* Min Stock */}
                          <div className="col-span-3 sm:col-span-2 text-center">
                            <p className="text-xs text-muted-foreground">Min</p>
                            <span className="font-medium text-foreground tabular-nums">{minStockVal !== null ? minStockVal : '-'}</span>
                          </div>
                          {/* Price */}
                          <div className="col-span-2 text-right">
                            <p className="text-xs text-muted-foreground">Price</p>
                            <span className="font-medium text-foreground tabular-nums">₱{type.price || '0.00'}</span>
                          </div>
                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-1">
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
                              onClick={() => openEditTypeDialog(idx)}
                              aria-label="Edit type"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                              onClick={() => handleRemoveType(idx)}
                              aria-label="Remove type"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-end pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-muted-foreground"
                        onClick={openAddTypeDialog}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add another type
                      </Button>
                    </div>
                  </div>
                )}
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

        {/* ─── Add/Edit Type Dialog ──────────────────────────────────────────── */}
        <Dialog open={typeDialogOpen} onOpenChange={(open) => { if (!open) { setTypeDialogOpen(false); setEditingTypeIndex(null); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTypeIndex !== null ? 'Edit Type' : 'Add Type'}
              </DialogTitle>
              <DialogDescription>
                {editingTypeIndex !== null
                  ? 'Update the type details below.'
                  : 'Fill in the details to add a new product type.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="type-name">Type Name</Label>
                <Input
                  id="type-name"
                  placeholder="e.g., Small, Medium, 1kg, 500ml"
                  value={typeForm.name}
                  onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type-price">Price (₱)</Label>
                <Input
                  id="type-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={typeForm.price}
                  onChange={(e) => setTypeForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="type-stock">Stock</Label>
                  <Input
                    id="type-stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={typeForm.stock}
                    onChange={(e) => setTypeForm((f) => ({ ...f, stock: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-minstock">Min Stock</Label>
                  <Input
                    id="type-minstock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={typeForm.minStock}
                    onChange={(e) => setTypeForm((f) => ({ ...f, minStock: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setTypeDialogOpen(false); setEditingTypeIndex(null); }}>
                Cancel
              </Button>
              <Button onClick={handleSaveType}>
                {editingTypeIndex !== null ? 'Save Changes' : 'Add Type'}
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
            {detailItem && (() => {
              const status = getProductStatus(detailItem.types);
              const totalStock = getTotalStock(detailItem.types);
              return (
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
                      <StatusBadge status={status} />
                    </div>
                  </SheetHeader>

                  <div className="space-y-5 px-4 pb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <PesoSign className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Price Range</span>
                        </div>
                        {(() => {
                          const prices = detailItem.types.map(t => t.price);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return (
                            <p className="text-xl font-bold">
                              ₱{min === max ? min.toFixed(2) : `${min.toFixed(2)} – ${max.toFixed(2)}`}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Layers className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Total Stock</span>
                        </div>
                        <p className={cn(
                          'text-xl font-bold',
                          status === 'low_stock' && 'text-amber-600 dark:text-amber-400',
                          status === 'out_of_stock' && 'text-red-600 dark:text-red-400',
                          status === 'in_stock' && 'text-green-600 dark:text-green-400'
                        )}>
                          {totalStock.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Types Table */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Product Types ({detailItem.types.length})
                      </h3>
                      <div className="space-y-2">
                        {detailItem.types.map((type) => {
                          const typeStatus = type.stock === 0 ? 'out_of_stock' : type.stock < type.minStock ? 'low_stock' : 'in_stock';
                          return (
                            <div key={type.id} className="rounded-lg border px-3 py-2.5 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{type.name}</span>
                                <StatusBadge status={typeStatus} />
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <span className="block">Price</span>
                                  <span className="font-medium text-foreground tabular-nums">₱{type.price.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="block">Stock</span>
                                  <span className="font-medium text-foreground tabular-nums">{type.stock}</span>
                                </div>
                                <div>
                                  <span className="block">Min Stock</span>
                                  <span className="font-medium text-foreground tabular-nums">{type.minStock}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Details</h3>
                      <div className="space-y-3">
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
                            <p className="text-xs text-muted-foreground">Overall Status</p>
                            <p className="text-sm font-medium">
                              {status === 'out_of_stock' ? 'Out of Stock' :
                               status === 'low_stock' ? 'Low Stock' : 'In Stock'}
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
              );
            })()}
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
