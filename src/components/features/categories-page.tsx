'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, type ColumnDef, type SortingState } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { categories as initialCategories, type Category, type CategoryStatus } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { StatusBadge } from '@/components/shared/status-badge';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Tags, Plus, MoreVertical, Pencil, Archive, FolderTree, Package, LayoutGrid, LayoutList, Search, ArrowUpDown, ArrowUp, ArrowDown, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function generateCategoryId(existing: Category[]): string {
  const maxNum = existing.reduce((max, c) => {
    const match = c.id.match(/CAT-(\d+)/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  return `CAT-${String(maxNum + 1).padStart(3, '0')}`;
}

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ArrowUp className="ml-1 h-3.5 w-3.5" />;
  if (direction === 'desc') return <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
}

// ─── Config ─────────────────────────────────────────────────────────────────────

const statusConfig: Record<CategoryStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-green-600 dark:text-green-400' },
  inactive: { label: 'Inactive', color: 'text-gray-600 dark:text-gray-400' },
};

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CategoryFormData {
  name: string;
  description: string;
  parentCategory: string; // category id or '__none__'
  status: CategoryStatus;
}

const defaultFormData: CategoryFormData = {
  name: '',
  description: '',
  parentCategory: '__none__',
  status: 'active',
};

// ─── Status Summary Cards ───────────────────────────────────────────────────────

function StatusSummaryCards({ data }: { data: Category[] }) {
  const total = data.length;
  const active = data.filter((c) => c.status === 'active').length;
  const inactive = data.filter((c) => c.status === 'inactive').length;
  const withParent = data.filter((c) => c.parentCategory !== null).length;

  const summaries = [
    { label: 'Total Categories', count: total, icon: Tags, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active', count: active, icon: Check, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
    { label: 'Inactive', count: inactive, icon: XIcon, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500/10' },
    { label: 'With Parent', count: withParent, icon: FolderTree, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
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

// ─── Category Card (Grid View) ──────────────────────────────────────────────────

function CategoryCard({
  category,
  data,
  onEdit,
  onArchive,
  onView,
}: {
  category: Category;
  data: Category[];
  onEdit: (category: Category) => void;
  onArchive: (category: Category) => void;
  onView: (category: Category) => void;
}) {
  const parentCat = category.parentCategory ? data.find((c) => c.name === category.parentCategory) : null;

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className="h-full"
      >
        <Card className="group/card relative h-full cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-md" onClick={() => onView(category)}>
          {/* Status indicator bar */}
          <div className={cn('absolute left-0 top-0 h-full w-1', category.status === 'active' ? 'bg-green-500' : 'bg-gray-400')} />

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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(category); }}>
                  <FolderTree className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(category); }}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); onArchive(category); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Archive className="mr-2 size-4" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <CardContent className="p-5 pl-5">
            {/* Category header */}
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderTree className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold">{category.name}</h3>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{category.id}</p>
              </div>
            </div>

            {/* Status & Parent */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={category.status} />
              {parentCat && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <FolderTree className="size-3" />
                  {category.parentCategory}
                </Badge>
              )}
            </div>

            {/* Divider */}
            <Separator className="my-4" />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Package className="size-3.5 text-primary" />
                  <span className="text-lg font-bold tabular-nums">{category.productCount}</span>
                </div>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Tags className="size-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-lg font-bold tabular-nums">
                    {data.filter((c) => c.parentCategory === category.name).length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Subcategories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </StaggerItem>
  );
}

// ─── Add / Edit Dialog ──────────────────────────────────────────────────────────

function CategoryFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  mode,
  parentOptions,
  statusOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<CategoryFormData>>;
  onSubmit: () => void;
  mode: 'add' | 'edit';
  parentOptions: ComboboxOption[];
  statusOptions: ComboboxOption[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Category' : 'Edit Category'}</DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details to create a new product category.'
              : 'Update the category information below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              placeholder="e.g. Electronics"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              placeholder="Brief description of this category..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>Parent Category</Label>
            <Combobox
              options={parentOptions}
              value={formData.parentCategory}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, parentCategory: value }))}
              placeholder="Select parent category..."
              searchPlaceholder="Search categories..."
              emptyMessage="No category found."
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Combobox
              options={statusOptions}
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as CategoryStatus }))}
              placeholder="Select status..."
              searchPlaceholder="Search status..."
              emptyMessage="No status found."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!formData.name.trim()}
          >
            {mode === 'add' ? 'Add Category' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Archive Confirmation Dialog ────────────────────────────────────────────────

function ArchiveCategoryDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onConfirm: () => void;
}) {
  if (!category) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive <span className="font-semibold">{category.name}</span>?
            Archived items can be restored from the Archived page. Products in this category will remain intact.
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

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [data, setData] = useState<Category[]>(initialCategories as Category[]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<CategoryFormData>({ ...defaultFormData });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [archivingCategory, setArchivingCategory] = useState<Category | null>(null);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Search & filter
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Sorting for table view
  const [sorting, setSorting] = useState<SortingState>([]);

  // Combobox options
  const parentOptions: ComboboxOption[] = useMemo(() => [
    { value: '__none__', label: 'None (Top-level category)' },
    ...data
      .filter((c) => c.id !== editingCategory?.id && !c.parentCategory)
      .map((c) => ({ value: c.name, label: c.name })),
  ], [data, editingCategory]);

  const statusOptions: ComboboxOption[] = [
    { value: 'active', label: 'Active', icon: Check },
    { value: 'inactive', label: 'Inactive', icon: XIcon },
  ];

  // Listen for search navigation to auto-open category detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'category') {
        setData((prev) => {
          const category = prev.find((c) => c.id === target.id);
          if (category) {
            setDetailCategory(category);
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

  // Listen for restored categories from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setData((prev) => [...prev, restoredData as Category]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    let result = data;
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.status === statusFilter);
    }
    return result;
  }, [data, statusFilter]);

  // Table columns
  const columns = useMemo<ColumnDef<Category>[]>(
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
          const category = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FolderTree className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="line-clamp-1 max-w-[180px] text-xs text-muted-foreground">{category.description}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'parentCategory',
        header: 'Parent',
        cell: ({ getValue }) => {
          const parent = getValue() as string | null;
          return parent ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <FolderTree className="size-3" />
              {parent}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: 'productCount',
        header: ({ column }) => (
          <Button variant="ghost" size="sm" className="-ml-3 h-8 font-semibold" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Products <SortIcon direction={column.getIsSorted()} />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums">{getValue() as number}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const category = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(category); }}>
                  <FolderTree className="mr-2 size-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(category); }}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleOpenArchive(category); }}
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

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenAdd = () => {
    setDialogMode('add');
    setFormData({ ...defaultFormData });
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setDialogMode('edit');
    setFormData({
      name: category.name,
      description: category.description,
      parentCategory: category.parentCategory || '__none__',
      status: category.status,
    });
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleViewDetail = (category: Category) => {
    setDetailCategory(category);
    setDetailOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name.');
      return;
    }

    if (dialogMode === 'add') {
      const newCategory: Category = {
        id: generateCategoryId(data),
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentCategory: formData.parentCategory === '__none__' ? null : formData.parentCategory,
        productCount: 0,
        status: formData.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setData((prev) => [...prev, newCategory]);
      toast.success(`Category "${newCategory.name}" added successfully.`);
    } else if (editingCategory) {
      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentCategory: formData.parentCategory === '__none__' ? null : formData.parentCategory,
        status: formData.status,
      };
      setData((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id ? { ...c, ...updates } : c
        )
      );
      // Update child categories' parentCategory reference if name changed
      if (formData.name.trim() !== editingCategory.name) {
        setData((prev) =>
          prev.map((c) =>
            c.parentCategory === editingCategory.name
              ? { ...c, parentCategory: formData.name.trim() }
              : c
          )
        );
      }
      // Update detail drawer if viewing the same category
      setDetailCategory((prev) =>
        prev && prev.id === editingCategory.id ? { ...prev, ...updates } : prev
      );
      toast.success(`Category "${formData.name.trim()}" updated successfully.`);
    }

    setDialogOpen(false);
  };

  const handleOpenArchive = (category: Category) => {
    setArchivingCategory(category);
    setArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!archivingCategory) return;
    const name = archivingCategory.name;
    archiveStore.archiveItem('category', archivingCategory as unknown as Record<string, unknown>, archivingCategory.id, archivingCategory.name);
    setData((prev) => prev.filter((c) => c.id !== archivingCategory.id));
    if (detailCategory?.id === archivingCategory.id) {
      setDetailCategory(null);
      setDetailOpen(false);
    }
    setArchiveDialogOpen(false);
    setArchivingCategory(null);
    toast.success(`Category "${name}" archived successfully.`);
  };

  // ─── Subcategory count helper ──────────────────────────────────────────────

  const getSubcategoryCount = useCallback((catName: string) => {
    return data.filter((c) => c.parentCategory === catName).length;
  }, [data]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Tags className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                <p className="text-sm text-muted-foreground">
                  Organize and manage your product categories
                </p>
              </div>
            </div>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="size-4" />
              Add Category
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
                  placeholder="Search categories by name, ID, or parent..."
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
                  <Tags className="size-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">No categories found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {globalFilter || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Get started by adding your first category.'}
                  </p>
                </div>
                {!globalFilter && statusFilter === 'all' && (
                  <Button className="gap-2" onClick={handleOpenAdd}>
                    <Plus className="size-4" />
                    Add Category
                  </Button>
                )}
              </div>
            </AnimatedCard>
          ) : viewMode === 'grid' ? (
            <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.06}>
              {filteredData.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  data={data}
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
                          <p className="text-muted-foreground">No categories found.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredData.length} of {data.length} categories
                </p>
              </div>
            </AnimatedCard>
          )}
        </FadeIn>

        {/* Add/Edit Dialog */}
        <CategoryFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          mode={dialogMode}
          parentOptions={parentOptions}
          statusOptions={statusOptions}
        />

        {/* Archive Confirmation Dialog */}
        <ArchiveCategoryDialog
          open={archiveDialogOpen}
          onOpenChange={setArchiveDialogOpen}
          category={archivingCategory}
          onConfirm={handleConfirmArchive}
        />

        {/* Category Detail Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto custom-scrollbar">
            {detailCategory && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-lg bg-primary/10">
                      <FolderTree className="h-7 w-7 text-primary" />
                    </div>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailCategory.name}</SheetTitle>
                      <SheetDescription>{detailCategory.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusBadge status={detailCategory.status} />
                    {detailCategory.parentCategory && (
                      <Badge variant="outline" className="gap-1">
                        <FolderTree className="size-3" />
                        {detailCategory.parentCategory}
                      </Badge>
                    )}
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  {/* Description */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{detailCategory.description}</p>
                  </div>

                  <Separator />

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="size-4 text-primary" />
                        <span className="text-xl font-bold tabular-nums">{detailCategory.productCount}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Products</p>
                    </div>
                    <div className="rounded-lg border bg-muted/30 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Tags className="size-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-xl font-bold tabular-nums">{getSubcategoryCount(detailCategory.name)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Subcategories</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Category Information */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Category Information
                    </h3>
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Parent</span>
                        <span className="text-sm font-medium">
                          {detailCategory.parentCategory || 'None (Top-level)'}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <StatusBadge status={detailCategory.status} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="text-sm font-medium">
                          {new Date(detailCategory.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subcategories list */}
                  {getSubcategoryCount(detailCategory.name) > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          Subcategories
                        </h3>
                        <div className="space-y-2">
                          {data
                            .filter((c) => c.parentCategory === detailCategory.name)
                            .map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={cn(
                                    'size-2 rounded-full',
                                    sub.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                  )} />
                                  <span className="text-sm font-medium">{sub.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {sub.productCount} products
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={detailCategory.status === 'active' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setData((prev) => prev.map((c) => c.id === detailCategory.id ? { ...c, status: 'active' } : c));
                          setDetailCategory((prev) => prev ? { ...prev, status: 'active' } : prev);
                          toast.success(`"${detailCategory.name}" is now Active`);
                        }}
                      >
                        <Check className="size-3.5" />
                        Active
                      </Button>
                      <Button
                        variant={detailCategory.status === 'inactive' ? 'default' : 'outline'}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setData((prev) => prev.map((c) => c.id === detailCategory.id ? { ...c, status: 'inactive' } : c));
                          setDetailCategory((prev) => prev ? { ...prev, status: 'inactive' } : prev);
                          toast.success(`"${detailCategory.name}" is now Inactive`);
                        }}
                      >
                        <XIcon className="size-3.5" />
                        Inactive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setDetailOpen(false);
                          handleOpenEdit(detailCategory);
                        }}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-destructive hover:text-destructive"
                        onClick={() => {
                          setDetailOpen(false);
                          handleOpenArchive(detailCategory);
                        }}
                      >
                        <Archive className="size-3.5" />
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
