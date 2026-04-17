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
import { registerUserCredentials, changeUserPassword } from '@/stores/auth';
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
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';

type User = (typeof initialUsers)[number];

interface UserFormState {
  name: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
}

const emptyForm: UserFormState = {
  name: '',
  email: '',
  role: 'Staff',
  password: '',
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
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  Staff: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  Driver: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  Viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>(initialUsers);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [archivingUser, setArchivingUser] = useState<User | null>(null);
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const archiveStore = useArchiveStore();
  const clearSearchTarget = useSearchStore((s) => s.clearTarget);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Change Password dialog state
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const openEditDialog = useCallback((user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      password: '',
      confirmPassword: '',
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
  }, []);

  const resetArchiveDialog = useCallback(() => {
    setArchiveDialogOpen(false);
    setArchivingUser(null);
  }, []);

  const resetToggleDialog = useCallback(() => {
    setToggleDialogOpen(false);
    setTogglingUser(null);
  }, []);

  const openChangePasswordDialog = useCallback((user: User) => {
    setChangingPasswordUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setChangePasswordDialogOpen(true);
  }, []);

  const resetChangePasswordDialog = useCallback(() => {
    setChangePasswordDialogOpen(false);
    setChangingPasswordUser(null);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  }, []);

  const handleChangePassword = useCallback(() => {
    if (!changingPasswordUser) return;
    if (!newPassword) {
      toast.error('New password is required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const success = changeUserPassword(changingPasswordUser.email, newPassword);
    if (success) {
      toast.success(`Password changed successfully for ${changingPasswordUser.name}`);
    } else {
      toast.error(`Failed to change password. User ${changingPasswordUser.email} not found in credentials.`);
    }
    resetChangePasswordDialog();
  }, [changingPasswordUser, newPassword, confirmNewPassword, resetChangePasswordDialog]);

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) {
      toast.error('User name is required');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Password validation for new users
    if (!editingUser) {
      if (!form.password) {
        toast.error('Password is required');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    // If editing and password fields are filled, validate them
    if (editingUser && (form.password || form.confirmPassword)) {
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    if (editingUser) {
      setData((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? { ...user, name: form.name.trim(), email: form.email.trim(), role: form.role }
            : user
        )
      );
      // If password was updated, re-register credentials
      if (form.password) {
        registerUserCredentials(form.email.trim(), form.password, form.name.trim(), form.role);
      }
      toast.success('User updated successfully');
    } else {
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
      // Register credentials so user can log in
      registerUserCredentials(form.email.trim(), form.password, form.name.trim(), form.role);
      toast.success('User added successfully. They can now log in with their credentials.');
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
    [openEditDialog, openChangePasswordDialog, openToggleDialog, openArchiveDialog]
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
                  ? 'Update the user details below. Leave password fields empty to keep current password.'
                  : 'Create a new user account. They will use these credentials to log in.'}
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
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                    <SelectItem value="Viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-password">Password {!editingUser && <span className="text-destructive">*</span>}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? 'Leave empty to keep current' : 'Minimum 6 characters'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              {!editingUser && (
                <div className="grid gap-2">
                  <Label htmlFor="user-confirm-password">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="user-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                      className="pl-9 pr-9"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
              )}
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
        <Dialog open={changePasswordDialogOpen} onOpenChange={(open) => { if (!open) resetChangePasswordDialog(); else setChangePasswordDialogOpen(true); }}>
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                Change Password
              </DialogTitle>
              <DialogDescription>
                Set a new password for <span className="font-medium text-foreground">{changingPasswordUser?.name}</span> ({changingPasswordUser?.email}). They will use this new password to log in next time.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border bg-muted/30 p-3 flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {changingPasswordUser ? getInitials(changingPasswordUser.name) : ''}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{changingPasswordUser?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{changingPasswordUser?.email}</p>
                </div>
                <Badge variant="outline" className={cn('text-xs font-medium shrink-0', roleColors[changingPasswordUser?.role || ''] || '')}>
                  {changingPasswordUser?.role}
                </Badge>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-destructive">Password must be at least 6 characters</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-new-password">Confirm New Password <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  >
                    {showConfirmNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {confirmNewPassword && newPassword !== confirmNewPassword && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
                {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
                  <p className="text-xs text-green-600 dark:text-green-400">Passwords match</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetChangePasswordDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={!newPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
              >
                <KeyRound className="mr-2 size-4" />
                Change Password
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
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageTransition>
  );
}
