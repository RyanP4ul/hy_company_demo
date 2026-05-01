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
import { cn } from '@/lib/utils';
import { useArchiveStore } from '@/stores/archive';
import { useSearchStore } from '@/stores/search';
import { users as initialUsers } from '@/lib/mock-data';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  UserX,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Mail,
  Shield,
  Clock,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
} from 'lucide-react';

type User = (typeof initialUsers)[number];

interface UserFormState {
  name: string;
  email: string;
  role: string;
  password: string;
}

interface ChangePasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  role: 'Staff',
  password: '',
};

const emptyPasswordForm: ChangePasswordForm = {
  newPassword: '',
  confirmPassword: '',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const roleColors: Record<string, string> = {
  Admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  Staff: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>(initialUsers);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [archivingUser, setArchivingUser] = useState<User | null>(null);
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Change password dialog states
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>(emptyPasswordForm);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Show/hide password in create form
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Listen for search navigation to auto-open user detail
  useEffect(() => {
    const handler = () => {
      const target = useSearchStore.getState().target;
      if (target?.type === 'user') {
        setData((prev) => {
          const user = prev.find((u) => u.id === target.id);
          if (user) {
            setDetailUser(user);
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

  // Listen for restored users from the Archived page
  useEffect(() => {
    const handleRestored = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { data: restoredData } = customEvent.detail;
      if (restoredData) {
        setData((prev) => [...prev, restoredData as User]);
      }
    };
    window.addEventListener('archive:restored', handleRestored);
    return () => window.removeEventListener('archive:restored', handleRestored);
  }, []);

  const openAddDialog = useCallback(() => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setFormDialogOpen(true);
  }, []);

  const openArchiveDialog = useCallback((user: User) => {
    setArchivingUser(user);
    setArchiveDialogOpen(true);
  }, []);

  const openToggleDialog = useCallback((user: User) => {
    setTogglingUser(user);
    setToggleDialogOpen(true);
  }, []);

  const resetFormDialog = useCallback(() => {
    setFormDialogOpen(false);
    setForm(emptyForm);
    setEditingUser(null);
    setShowCreatePassword(false);
  }, []);

  const resetChangePasswordDialog = useCallback(() => {
    setChangePasswordOpen(false);
    setChangingPasswordUser(null);
    setPasswordForm(emptyPasswordForm);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, []);

  const openChangePasswordDialog = useCallback((user: User) => {
    setChangingPasswordUser(user);
    setPasswordForm(emptyPasswordForm);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setChangePasswordOpen(true);
  }, []);

  const getPasswordStrength = useCallback((pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
  }, []);

  const getStrengthLabel = (score: number) => {
    if (score <= 1) return { label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { label: 'Strong', color: 'bg-emerald-500' };
    return { label: 'Very Strong', color: 'bg-emerald-600' };
  };

  const getStrengthTextColor = (score: number) => {
    if (score <= 1) return 'text-red-500';
    if (score <= 2) return 'text-orange-500';
    if (score <= 3) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const resetArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(false);
    setArchivingUser(null);
  }, []);

  const resetToggleDialog = useCallback(() => {
    setToggleDialogOpen(false);
    setTogglingUser(null);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('User name is required');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password required only when creating a new user
    if (!editingUser && !form.password.trim()) {
      toast.error('Password is required for new users');
      return;
    }
    if (!editingUser && form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (editingUser) {
      setData((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? { ...user, name: form.name.trim(), email: form.email.trim(), role: form.role }
            : user
        )
      );
      toast.success('User updated successfully');
    } else {
      if (getPasswordStrength(form.password) < 3) {
        toast.error('Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
        return;
      }
      const maxNum = data.reduce((max, user) => {
        const num = parseInt(user.id.replace('USR-', ''), 10);
        return num > max ? num : max;
      }, 0);
      const newId = `USR-${String(maxNum + 1).padStart(3, '0')}`;
      const newUser: User = {
        id: newId,
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: 'active' as const,
        lastActive: 'Just now',
        avatar: '',
      };
      setData((prev) => [newUser, ...prev]);
      toast.success('User added successfully');
    }

    resetFormDialog();
  }, [form, editingUser, data, resetFormDialog]);

  const handleArchive = useCallback(() => {
    if (!archivingUser) return;
    archiveStore.archiveItem('user', archivingUser, archivingUser.id, archivingUser.name);
    setData((prev) => prev.filter((user) => user.id !== archivingUser.id));
    toast.success('User archived successfully');
    resetArchiveDialog();
  }, [archivingUser, resetArchiveDialog, archiveStore]);

  const handleToggleStatus = useCallback(() => {
    if (!togglingUser) return;
    const newStatus = togglingUser.status === 'active' ? 'inactive' : 'active';
    setData((prev) =>
      prev.map((user) =>
        user.id === togglingUser.id
          ? { ...user, status: newStatus as 'active' | 'inactive', lastActive: newStatus === 'inactive' ? 'Deactivated' : 'Just now' }
          : user
      )
    );
    toast.success(
      newStatus === 'inactive'
        ? `${togglingUser.name} has been deactivated`
        : `${togglingUser.name} has been activated`
    );
    resetToggleDialog();
  }, [togglingUser, resetToggleDialog]);

  const columns = useMemo<ColumnDef<User>[]>(
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
            User
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
        accessorKey: 'email',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.getValue('role') as string;
          return (
            <Badge variant="outline" className={`text-xs font-medium ${roleColors[role] || ''}`}>
              {role}
            </Badge>
          );
        },
        filterFn: (row, _columnId, filterValue) => {
          return row.getValue('role') === filterValue;
        },
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
        accessorKey: 'lastActive',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Last Active
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : null}
          </Button>
        ),
      },
      {
        id: 'actions',
        header: '',
        size: 40,
        cell: ({ row }) => {
          const user = row.original;
          const isActive = user.status === 'active';
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                  <Pencil className="mr-2 size-4" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openChangePasswordDialog(user)}>
                  <KeyRound className="mr-2 size-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openToggleDialog(user)}>
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
                  onClick={() => openArchiveDialog(user)}
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
    [openEditDialog, openToggleDialog, openArchiveDialog, openChangePasswordDialog]
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
              <h1 className="text-2xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground">
                Manage your team members and their account permissions.
              </p>
            </div>
            <Button className="gap-2" onClick={openAddDialog}>
              <Plus className="size-4" />
              Add User
            </Button>
          </div>
        </FadeIn>

        {/* Search Bar */}
        <FadeIn delay={0.1}>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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
                      No users found.
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
                of {table.getFilteredRowModel().rows.length} users
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

        {/* Add/Edit User Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={(open) => { if (!open) resetFormDialog(); else setFormDialogOpen(true); }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add User'}
              </DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Update the user details below.'
                  : 'Fill in the details to add a new team member.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="email@company.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="user-password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="user-password"
                      type={showCreatePassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="pl-9 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowCreatePassword((v) => !v)}
                    >
                      {showCreatePassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </Button>
                  </div>
                  {form.password.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                'h-1 w-8 rounded-full transition-colors',
                                getPasswordStrength(form.password) >= level
                                  ? getStrengthLabel(getPasswordStrength(form.password)).color
                                  : 'bg-muted'
                              )}
                            />
                          ))}
                        </div>
                        <span className={cn('text-xs font-medium', getStrengthTextColor(getPasswordStrength(form.password)))}>
                          {getStrengthLabel(getPasswordStrength(form.password)).label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <span className={cn('text-xs', /[A-Z]/.test(form.password) ? 'text-emerald-600' : 'text-muted-foreground')}>
                          Uppercase
                        </span>
                        <span className={cn('text-xs', /[a-z]/.test(form.password) ? 'text-emerald-600' : 'text-muted-foreground')}>
                          Lowercase
                        </span>
                        <span className={cn('text-xs', /[0-9]/.test(form.password) ? 'text-emerald-600' : 'text-muted-foreground')}>
                          Number
                        </span>
                        <span className={cn('text-xs', /[^A-Za-z0-9]/.test(form.password) ? 'text-emerald-600' : 'text-muted-foreground')}>
                          Special
                        </span>
                        <span className={cn('text-xs', form.password.length >= 8 ? 'text-emerald-600' : 'text-muted-foreground')}>
                          8+ chars
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="user-role">Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger id="user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetFormDialog}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingUser ? 'Save Changes' : 'Add User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive &quot;{archivingUser?.name}&quot; ({archivingUser?.email})? Archived items can be restored from the Archived page.
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
                {togglingUser?.status === 'active' ? 'Deactivate User' : 'Activate User'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {togglingUser?.status === 'active'
                  ? `Are you sure you want to deactivate "${togglingUser?.name}"? They will lose access to the system.`
                  : `Are you sure you want to activate "${togglingUser?.name}"? They will regain access to the system.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={resetToggleDialog}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleToggleStatus}
                className={
                  togglingUser?.status === 'active'
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : ''
                }
              >
                {togglingUser?.status === 'active' ? 'Deactivate' : 'Activate'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Change Password Dialog */}
        <Dialog open={changePasswordOpen} onOpenChange={(open) => { if (!open) resetChangePasswordDialog(); else setChangePasswordOpen(true); }}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="size-5" />
                Change Password
              </DialogTitle>
              <DialogDescription>
                Set a new password for <span className="font-medium text-foreground">{changingPasswordUser?.name}</span> ({changingPasswordUser?.email})
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* New Password */}
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimum 8 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                    className="pl-9 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
                {/* Password strength indicator */}
                {passwordForm.newPassword.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              'h-1 w-8 rounded-full transition-colors',
                              getPasswordStrength(passwordForm.newPassword) >= level
                                ? getStrengthLabel(getPasswordStrength(passwordForm.newPassword)).color
                                : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn('text-xs font-medium', getStrengthTextColor(getPasswordStrength(passwordForm.newPassword)))}>
                        {getStrengthLabel(getPasswordStrength(passwordForm.newPassword)).label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {[
                        { test: /[A-Z]/, label: 'Uppercase' },
                        { test: /[a-z]/, label: 'Lowercase' },
                        { test: /[0-9]/, label: 'Number' },
                        { test: /[^A-Za-z0-9]/, label: 'Special' },
                        { test: (pw: string) => pw.length >= 8, label: '8+ chars' },
                      ].map(({ test, label }) => (
                        <span
                          key={label}
                          className={cn(
                            'text-xs',
                            (typeof test === 'function' ? test(passwordForm.newPassword) : test.test(passwordForm.newPassword))
                              ? 'text-emerald-600'
                              : 'text-muted-foreground'
                          )}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    className={cn(
                      'pl-9 pr-10',
                      passwordForm.confirmPassword.length > 0 &&
                        passwordForm.newPassword !== passwordForm.confirmPassword &&
                        'border-red-500 focus-visible:ring-red-500'
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
                {/* Match indicator */}
                {passwordForm.confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <>
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <div className="size-3.5 rounded-full border-2 border-red-400" />
                        <span className="text-xs text-red-500 font-medium">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Requirements reminder */}
              <div className="rounded-lg border border-muted bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Password requirements:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    Minimum 8 characters
                  </li>
                  <li className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    At least one uppercase and one lowercase letter
                  </li>
                  <li className="flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                    At least one number and one special character
                  </li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetChangePasswordDialog}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!passwordForm.newPassword.trim()) {
                    toast.error('Please enter a new password');
                    return;
                  }
                  if (passwordForm.newPassword.length < 8) {
                    toast.error('Password must be at least 8 characters');
                    return;
                  }
                  if (getPasswordStrength(passwordForm.newPassword) < 3) {
                    toast.error('Password is too weak. Include uppercase, lowercase, numbers, and special characters.');
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    toast.error('Passwords do not match');
                    return;
                  }
                  toast.success(`Password changed for ${changingPasswordUser?.name}`);
                  resetChangePasswordDialog();
                }}
              >
                <KeyRound className="mr-2 size-4" />
                Update Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Detail Sheet (from search) */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar">
            {detailUser && (
              <>
                <SheetHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                        {getInitials(detailUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <SheetTitle className="text-lg">{detailUser.name}</SheetTitle>
                      <SheetDescription>{detailUser.id}</SheetDescription>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={detailUser.status} />
                    <Badge variant="outline" className={`text-xs font-medium ${roleColors[detailUser.role] || ''}`}>
                      {detailUser.role}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="space-y-5 px-4 pb-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm font-medium">{detailUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Role</p>
                          <p className="text-sm font-medium">{detailUser.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Active</p>
                          <p className="text-sm font-medium">{detailUser.lastActive}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setDetailOpen(false);
                      openEditDialog(detailUser);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit User
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      setDetailOpen(false);
                      openChangePasswordDialog(detailUser);
                    }}
                  >
                    <KeyRound className="h-4 w-4" />
                    Change Password
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
