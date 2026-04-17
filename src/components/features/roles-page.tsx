'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  ChevronDown,
  Shield,
  Users,
  Truck,
  BarChart3,
  Settings,
  Eye,
  LucideIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  label: string;
  enabled: boolean;
}

interface PermissionCategory {
  name: string;
  icon: LucideIcon;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  color: string;
  permissions: PermissionCategory[];
}

const rolesData: Role[] = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full access to all system features and settings.',
    userCount: 2,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    permissions: [
      {
        name: 'Inventory',
        icon: BarChart3,
        permissions: [
          { id: 'inv-view', label: 'View inventory items', enabled: true },
          { id: 'inv-create', label: 'Create inventory items', enabled: true },
          { id: 'inv-edit', label: 'Edit inventory items', enabled: true },
          { id: 'inv-delete', label: 'Delete inventory items', enabled: true },
          { id: 'inv-export', label: 'Export inventory data', enabled: true },
        ],
      },
      {
        name: 'Orders',
        icon: Settings,
        permissions: [
          { id: 'ord-view', label: 'View orders', enabled: true },
          { id: 'ord-create', label: 'Create orders', enabled: true },
          { id: 'ord-edit', label: 'Edit orders', enabled: true },
          { id: 'ord-cancel', label: 'Cancel orders', enabled: true },
        ],
      },
      {
        name: 'Deliveries',
        icon: Truck,
        permissions: [
          { id: 'del-view', label: 'View deliveries', enabled: true },
          { id: 'del-assign', label: 'Assign deliveries', enabled: true },
          { id: 'del-reschedule', label: 'Reschedule deliveries', enabled: true },
        ],
      },
      {
        name: 'Users',
        icon: Users,
        permissions: [
          { id: 'usr-view', label: 'View users', enabled: true },
          { id: 'usr-create', label: 'Create users', enabled: true },
          { id: 'usr-edit', label: 'Edit users', enabled: true },
          { id: 'usr-delete', label: 'Delete users', enabled: true },
        ],
      },
      {
        name: 'Reports',
        icon: BarChart3,
        permissions: [
          { id: 'rep-view', label: 'View reports', enabled: true },
          { id: 'rep-create', label: 'Generate reports', enabled: true },
          { id: 'rep-export', label: 'Export reports', enabled: true },
        ],
      },
      {
        name: 'Settings',
        icon: Settings,
        permissions: [
          { id: 'set-view', label: 'View settings', enabled: true },
          { id: 'set-edit', label: 'Edit settings', enabled: true },
          { id: 'set-integrations', label: 'Manage integrations', enabled: true },
        ],
      },
    ],
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Access to manage inventory, orders, and deliveries.',
    userCount: 3,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    permissions: [
      {
        name: 'Inventory',
        icon: BarChart3,
        permissions: [
          { id: 'm-inv-view', label: 'View inventory items', enabled: true },
          { id: 'm-inv-create', label: 'Create inventory items', enabled: true },
          { id: 'm-inv-edit', label: 'Edit inventory items', enabled: true },
          { id: 'm-inv-delete', label: 'Delete inventory items', enabled: false },
          { id: 'm-inv-export', label: 'Export inventory data', enabled: true },
        ],
      },
      {
        name: 'Orders',
        icon: Settings,
        permissions: [
          { id: 'm-ord-view', label: 'View orders', enabled: true },
          { id: 'm-ord-create', label: 'Create orders', enabled: true },
          { id: 'm-ord-edit', label: 'Edit orders', enabled: true },
          { id: 'm-ord-cancel', label: 'Cancel orders', enabled: true },
        ],
      },
      {
        name: 'Deliveries',
        icon: Truck,
        permissions: [
          { id: 'm-del-view', label: 'View deliveries', enabled: true },
          { id: 'm-del-assign', label: 'Assign deliveries', enabled: true },
          { id: 'm-del-reschedule', label: 'Reschedule deliveries', enabled: true },
        ],
      },
      {
        name: 'Users',
        icon: Users,
        permissions: [
          { id: 'm-usr-view', label: 'View users', enabled: true },
          { id: 'm-usr-create', label: 'Create users', enabled: false },
          { id: 'm-usr-edit', label: 'Edit users', enabled: false },
          { id: 'm-usr-delete', label: 'Delete users', enabled: false },
        ],
      },
      {
        name: 'Reports',
        icon: BarChart3,
        permissions: [
          { id: 'm-rep-view', label: 'View reports', enabled: true },
          { id: 'm-rep-create', label: 'Generate reports', enabled: true },
          { id: 'm-rep-export', label: 'Export reports', enabled: true },
        ],
      },
      {
        name: 'Settings',
        icon: Settings,
        permissions: [
          { id: 'm-set-view', label: 'View settings', enabled: true },
          { id: 'm-set-edit', label: 'Edit settings', enabled: false },
          { id: 'm-set-integrations', label: 'Manage integrations', enabled: false },
        ],
      },
    ],
  },
  {
    id: 'staff',
    name: 'Staff',
    description: 'Access to view and manage inventory and orders.',
    userCount: 12,
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    permissions: [
      {
        name: 'Inventory',
        icon: BarChart3,
        permissions: [
          { id: 's-inv-view', label: 'View inventory items', enabled: true },
          { id: 's-inv-create', label: 'Create inventory items', enabled: true },
          { id: 's-inv-edit', label: 'Edit inventory items', enabled: true },
          { id: 's-inv-delete', label: 'Delete inventory items', enabled: false },
          { id: 's-inv-export', label: 'Export inventory data', enabled: false },
        ],
      },
      {
        name: 'Orders',
        icon: Settings,
        permissions: [
          { id: 's-ord-view', label: 'View orders', enabled: true },
          { id: 's-ord-create', label: 'Create orders', enabled: true },
          { id: 's-ord-edit', label: 'Edit orders', enabled: true },
          { id: 's-ord-cancel', label: 'Cancel orders', enabled: false },
        ],
      },
      {
        name: 'Deliveries',
        icon: Truck,
        permissions: [
          { id: 's-del-view', label: 'View deliveries', enabled: true },
          { id: 's-del-assign', label: 'Assign deliveries', enabled: false },
          { id: 's-del-reschedule', label: 'Reschedule deliveries', enabled: false },
        ],
      },
      {
        name: 'Users',
        icon: Users,
        permissions: [
          { id: 's-usr-view', label: 'View users', enabled: true },
          { id: 's-usr-create', label: 'Create users', enabled: false },
          { id: 's-usr-edit', label: 'Edit users', enabled: false },
          { id: 's-usr-delete', label: 'Delete users', enabled: false },
        ],
      },
      {
        name: 'Reports',
        icon: BarChart3,
        permissions: [
          { id: 's-rep-view', label: 'View reports', enabled: true },
          { id: 's-rep-create', label: 'Generate reports', enabled: false },
          { id: 's-rep-export', label: 'Export reports', enabled: false },
        ],
      },
      {
        name: 'Settings',
        icon: Settings,
        permissions: [
          { id: 's-set-view', label: 'View settings', enabled: false },
          { id: 's-set-edit', label: 'Edit settings', enabled: false },
          { id: 's-set-integrations', label: 'Manage integrations', enabled: false },
        ],
      },
    ],
  },
  {
    id: 'driver',
    name: 'Driver',
    description: 'Access to view assigned deliveries and update status.',
    userCount: 8,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    permissions: [
      {
        name: 'Inventory',
        icon: BarChart3,
        permissions: [
          { id: 'd-inv-view', label: 'View inventory items', enabled: false },
          { id: 'd-inv-create', label: 'Create inventory items', enabled: false },
          { id: 'd-inv-edit', label: 'Edit inventory items', enabled: false },
          { id: 'd-inv-delete', label: 'Delete inventory items', enabled: false },
          { id: 'd-inv-export', label: 'Export inventory data', enabled: false },
        ],
      },
      {
        name: 'Orders',
        icon: Settings,
        permissions: [
          { id: 'd-ord-view', label: 'View orders', enabled: true },
          { id: 'd-ord-create', label: 'Create orders', enabled: false },
          { id: 'd-ord-edit', label: 'Edit orders', enabled: false },
          { id: 'd-ord-cancel', label: 'Cancel orders', enabled: false },
        ],
      },
      {
        name: 'Deliveries',
        icon: Truck,
        permissions: [
          { id: 'd-del-view', label: 'View deliveries', enabled: true },
          { id: 'd-del-assign', label: 'Assign deliveries', enabled: false },
          { id: 'd-del-reschedule', label: 'Reschedule deliveries', enabled: false },
        ],
      },
      {
        name: 'Users',
        icon: Users,
        permissions: [
          { id: 'd-usr-view', label: 'View users', enabled: false },
          { id: 'd-usr-create', label: 'Create users', enabled: false },
          { id: 'd-usr-edit', label: 'Edit users', enabled: false },
          { id: 'd-usr-delete', label: 'Delete users', enabled: false },
        ],
      },
      {
        name: 'Reports',
        icon: BarChart3,
        permissions: [
          { id: 'd-rep-view', label: 'View reports', enabled: false },
          { id: 'd-rep-create', label: 'Generate reports', enabled: false },
          { id: 'd-rep-export', label: 'Export reports', enabled: false },
        ],
      },
      {
        name: 'Settings',
        icon: Settings,
        permissions: [
          { id: 'd-set-view', label: 'View settings', enabled: false },
          { id: 'd-set-edit', label: 'Edit settings', enabled: false },
          { id: 'd-set-integrations', label: 'Manage integrations', enabled: false },
        ],
      },
    ],
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to view data across the system.',
    userCount: 5,
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    permissions: [
      {
        name: 'Inventory',
        icon: BarChart3,
        permissions: [
          { id: 'v-inv-view', label: 'View inventory items', enabled: true },
          { id: 'v-inv-create', label: 'Create inventory items', enabled: false },
          { id: 'v-inv-edit', label: 'Edit inventory items', enabled: false },
          { id: 'v-inv-delete', label: 'Delete inventory items', enabled: false },
          { id: 'v-inv-export', label: 'Export inventory data', enabled: false },
        ],
      },
      {
        name: 'Orders',
        icon: Settings,
        permissions: [
          { id: 'v-ord-view', label: 'View orders', enabled: true },
          { id: 'v-ord-create', label: 'Create orders', enabled: false },
          { id: 'v-ord-edit', label: 'Edit orders', enabled: false },
          { id: 'v-ord-cancel', label: 'Cancel orders', enabled: false },
        ],
      },
      {
        name: 'Deliveries',
        icon: Truck,
        permissions: [
          { id: 'v-del-view', label: 'View deliveries', enabled: true },
          { id: 'v-del-assign', label: 'Assign deliveries', enabled: false },
          { id: 'v-del-reschedule', label: 'Reschedule deliveries', enabled: false },
        ],
      },
      {
        name: 'Users',
        icon: Users,
        permissions: [
          { id: 'v-usr-view', label: 'View users', enabled: true },
          { id: 'v-usr-create', label: 'Create users', enabled: false },
          { id: 'v-usr-edit', label: 'Edit users', enabled: false },
          { id: 'v-usr-delete', label: 'Delete users', enabled: false },
        ],
      },
      {
        name: 'Reports',
        icon: BarChart3,
        permissions: [
          { id: 'v-rep-view', label: 'View reports', enabled: true },
          { id: 'v-rep-create', label: 'Generate reports', enabled: false },
          { id: 'v-rep-export', label: 'Export reports', enabled: false },
        ],
      },
      {
        name: 'Settings',
        icon: Settings,
        permissions: [
          { id: 'v-set-view', label: 'View settings', enabled: true },
          { id: 'v-set-edit', label: 'Edit settings', enabled: false },
          { id: 'v-set-integrations', label: 'Manage integrations', enabled: false },
        ],
      },
    ],
  },
];

// Predefined colors for role creation
const ROLE_COLORS = [
  {
    name: 'purple',
    value: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    swatch: 'bg-purple-500',
  },
  {
    name: 'blue',
    value: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    swatch: 'bg-blue-500',
  },
  {
    name: 'slate',
    value: 'bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    swatch: 'bg-slate-500',
  },
  {
    name: 'orange',
    value: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    swatch: 'bg-orange-500',
  },
  {
    name: 'green',
    value: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    swatch: 'bg-green-500',
  },
  {
    name: 'gray',
    value: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    swatch: 'bg-gray-500',
  },
  {
    name: 'red',
    value: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    swatch: 'bg-red-500',
  },
  {
    name: 'teal',
    value: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    swatch: 'bg-teal-500',
  },
  {
    name: 'pink',
    value: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border-pink-200 dark:border-pink-800',
    swatch: 'bg-pink-500',
  },
  {
    name: 'yellow',
    value: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    swatch: 'bg-yellow-500',
  },
];

// Permission template for new roles (all unchecked)
function getDefaultPermissions(prefix: string): PermissionCategory[] {
  return [
    {
      name: 'Inventory',
      icon: BarChart3,
      permissions: [
        { id: `${prefix}-inv-view`, label: 'View inventory items', enabled: false },
        { id: `${prefix}-inv-create`, label: 'Create inventory items', enabled: false },
        { id: `${prefix}-inv-edit`, label: 'Edit inventory items', enabled: false },
        { id: `${prefix}-inv-delete`, label: 'Delete inventory items', enabled: false },
        { id: `${prefix}-inv-export`, label: 'Export inventory data', enabled: false },
      ],
    },
    {
      name: 'Orders',
      icon: Settings,
      permissions: [
        { id: `${prefix}-ord-view`, label: 'View orders', enabled: false },
        { id: `${prefix}-ord-create`, label: 'Create orders', enabled: false },
        { id: `${prefix}-ord-edit`, label: 'Edit orders', enabled: false },
        { id: `${prefix}-ord-cancel`, label: 'Cancel orders', enabled: false },
      ],
    },
    {
      name: 'Deliveries',
      icon: Truck,
      permissions: [
        { id: `${prefix}-del-view`, label: 'View deliveries', enabled: false },
        { id: `${prefix}-del-assign`, label: 'Assign deliveries', enabled: false },
        { id: `${prefix}-del-reschedule`, label: 'Reschedule deliveries', enabled: false },
      ],
    },
    {
      name: 'Users',
      icon: Users,
      permissions: [
        { id: `${prefix}-usr-view`, label: 'View users', enabled: false },
        { id: `${prefix}-usr-create`, label: 'Create users', enabled: false },
        { id: `${prefix}-usr-edit`, label: 'Edit users', enabled: false },
        { id: `${prefix}-usr-delete`, label: 'Delete users', enabled: false },
      ],
    },
    {
      name: 'Reports',
      icon: BarChart3,
      permissions: [
        { id: `${prefix}-rep-view`, label: 'View reports', enabled: false },
        { id: `${prefix}-rep-create`, label: 'Generate reports', enabled: false },
        { id: `${prefix}-rep-export`, label: 'Export reports', enabled: false },
      ],
    },
    {
      name: 'Settings',
      icon: Settings,
      permissions: [
        { id: `${prefix}-set-view`, label: 'View settings', enabled: false },
        { id: `${prefix}-set-edit`, label: 'Edit settings', enabled: false },
        { id: `${prefix}-set-integrations`, label: 'Manage integrations', enabled: false },
      ],
    },
  ];
}

function AnimatedCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  return (
    <motion.div
      className="flex items-center gap-3 py-1.5"
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div whileTap={{ scale: 0.9 }}>
        <Checkbox
          checked={checked}
          onCheckedChange={onChange ? (val) => onChange(val === true) : undefined}
        />
      </motion.div>
      <span
        className={cn(
          'text-sm transition-colors',
          checked ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </motion.div>
  );
}

function RoleCard({
  role,
  index,
  onDelete,
}: {
  role: Role;
  index: number;
  onDelete?: (role: Role) => void;
}) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (catName: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const enabledCount = role.permissions.reduce(
    (sum, cat) => sum + cat.permissions.filter((p) => p.enabled).length,
    0
  );
  const totalCount = role.permissions.reduce((sum, cat) => sum + cat.permissions.length, 0);
  const isAdmin = role.id === 'admin';

  return (
    <StaggerItem>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <Badge variant="outline" className={cn('text-xs', role.color)}>
                    {role.userCount} users
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold">{enabledCount}</div>
                <div className="text-xs text-muted-foreground">of {totalCount} permissions</div>
              </div>
              {!isAdmin && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(role)}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-1">
            {role.permissions.map((category) => {
              const isOpen = openCategories.has(category.name);
              const catIcon = category.icon;
              const catEnabledCount = category.permissions.filter((p) => p.enabled).length;

              return (
                <Collapsible
                  key={category.name}
                  open={isOpen}
                  onOpenChange={() => toggleCategory(category.name)}
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <catIcon className="size-4 text-muted-foreground" />
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {catEnabledCount}/{category.permissions.length}
                      </Badge>
                    </div>
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </motion.div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="ml-6 space-y-0.5 border-l pl-4"
                    >
                      {category.permissions.map((perm) => (
                        <AnimatedCheckbox
                          key={perm.id}
                          checked={perm.enabled}
                          label={perm.label}
                        />
                      ))}
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </StaggerItem>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(() => JSON.parse(JSON.stringify(rolesData)));
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  // Create Role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0].value);
  const [newRolePermissions, setNewRolePermissions] = useState<PermissionCategory[]>(
    getDefaultPermissions('new')
  );

  // Computed stats
  const totalRoles = roles.length;
  const totalUsers = roles.reduce((sum, role) => sum + role.userCount, 0);
  const totalPermissions = roles.reduce(
    (sum, role) => sum + role.permissions.reduce((s, cat) => s + cat.permissions.length, 0),
    0
  );

  // Reset create form
  const resetCreateForm = useCallback(() => {
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRoleColor(ROLE_COLORS[0].value);
    setNewRolePermissions(getDefaultPermissions('new'));
  }, []);

  // Open create dialog
  const openCreateDialog = useCallback(() => {
    resetCreateForm();
    setCreateDialogOpen(true);
  }, [resetCreateForm]);

  // Toggle a permission in the create dialog
  const toggleNewPermission = useCallback((catName: string, permId: string) => {
    setNewRolePermissions((prev) =>
      prev.map((cat) =>
        cat.name === catName
          ? {
              ...cat,
              permissions: cat.permissions.map((p) =>
                p.id === permId ? { ...p, enabled: !p.enabled } : p
              ),
            }
          : cat
      )
    );
  }, []);

  // Toggle all permissions in a category
  const toggleCategoryAll = useCallback((catName: string, enableAll: boolean) => {
    setNewRolePermissions((prev) =>
      prev.map((cat) =>
        cat.name === catName
          ? {
              ...cat,
              permissions: cat.permissions.map((p) => ({ ...p, enabled: enableAll })),
            }
          : cat
      )
    );
  }, []);

  // Create role handler
  const handleCreateRole = useCallback(() => {
    const trimmedName = newRoleName.trim();

    if (!trimmedName) {
      toast.error('Role name is required');
      return;
    }

    const duplicate = roles.some(
      (r) => r.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      toast.error(`A role named "${trimmedName}" already exists`);
      return;
    }

    const prefix = trimmedName.toLowerCase().replace(/\s+/g, '-').slice(0, 3);
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name: trimmedName,
      description: newRoleDescription.trim() || 'No description provided.',
      userCount: 0,
      color: newRoleColor,
      permissions: getDefaultPermissions(prefix).map((cat, catIdx) => ({
        ...cat,
        permissions: cat.permissions.map((p, pIdx) => ({
          ...p,
          id: `${prefix}-${p.id.split('-').slice(-2).join('-')}`,
          enabled: newRolePermissions[catIdx]?.permissions[pIdx]?.enabled ?? false,
        })),
      })),
    };

    setRoles((prev) => [...prev, newRole]);
    setCreateDialogOpen(false);
    resetCreateForm();
    toast.success(`Role "${trimmedName}" created successfully`);
  }, [newRoleName, newRoleDescription, newRoleColor, newRolePermissions, roles, resetCreateForm]);

  // Delete role handler
  const handleDeleteRole = useCallback(() => {
    if (!roleToDelete || roleToDelete.id === 'admin') return;
    setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
    setDeleteDialogOpen(false);
    toast.success(`Role "${roleToDelete.name}" deleted successfully`);
    setRoleToDelete(null);
  }, [roleToDelete]);

  // Open delete confirmation
  const openDeleteDialog = useCallback((role: Role) => {
    if (role.id === 'admin') {
      toast.error('Cannot delete the Admin role');
      return;
    }
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
              <p className="text-muted-foreground">
                Manage roles and configure permission levels for your team.
              </p>
            </div>
            <Button className="gap-2" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Role
            </Button>
          </div>
        </FadeIn>

        {/* Role Summary */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Roles', value: totalRoles.toString() },
              { label: 'Total Users', value: totalUsers.toString() },
              { label: 'Permission Categories', value: '6' },
              { label: 'Total Permissions', value: totalPermissions.toString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border bg-card p-3"
              >
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Role Cards */}
        <StaggerContainer className="grid gap-6" staggerDelay={0.1}>
          {roles.map((role, index) => (
            <RoleCard key={role.id} role={role} index={index} onDelete={openDeleteDialog} />
          ))}
        </StaggerContainer>

        {/* Create Role Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Define a new role with custom permissions for your team members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Role Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Role Name</label>
                <Input
                  placeholder="e.g. Supervisor, Coordinator"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe what this role is for..."
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Color Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_COLORS.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full transition-all',
                        color.swatch,
                        newRoleColor === color.value
                          ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                          : 'hover:scale-105 opacity-60 hover:opacity-100'
                      )}
                      onClick={() => setNewRoleColor(color.value)}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Permissions</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setNewRolePermissions((prev) =>
                          prev.map((cat) => ({
                            ...cat,
                            permissions: cat.permissions.map((p) => ({ ...p, enabled: true })),
                          }))
                        );
                      }}
                    >
                      Enable All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setNewRolePermissions((prev) =>
                          prev.map((cat) => ({
                            ...cat,
                            permissions: cat.permissions.map((p) => ({ ...p, enabled: false })),
                          }))
                        );
                      }}
                    >
                      Disable All
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {newRolePermissions.map((category) => {
                    const catIcon = category.icon;
                    const allEnabled = category.permissions.every((p) => p.enabled);
                    const someEnabled = category.permissions.some((p) => p.enabled);

                    return (
                      <div key={category.name} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <catIcon className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.permissions.filter((p) => p.enabled).length}/{category.permissions.length}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => toggleCategoryAll(category.name, !allEnabled)}
                          >
                            {allEnabled ? 'Disable All' : someEnabled ? 'Enable Remaining' : 'Enable All'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                          {category.permissions.map((perm) => (
                            <AnimatedCheckbox
                              key={perm.id}
                              checked={perm.enabled}
                              label={perm.label}
                              onChange={() => toggleNewPermission(category.name, perm.id)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRole}>
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Role Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role &ldquo;{roleToDelete?.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The role will be permanently removed from the system.
                Users currently assigned to this role will need to be reassigned.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setRoleToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRole}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
}
