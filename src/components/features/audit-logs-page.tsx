'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auditLogs } from '@/lib/mock-data';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronDown,
  Filter,
  Clock,
  User,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionType = 'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ALERT';

const actionConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  CREATE: {
    label: 'CREATE',
    icon: Plus,
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  },
  UPDATE: {
    label: 'UPDATE',
    icon: Pencil,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  },
  DELETE: {
    label: 'DELETE',
    icon: Trash2,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  },
  ALERT: {
    label: 'ALERT',
    icon: AlertTriangle,
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800',
  },
};

function DiffViewer({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details);

  // Check if this is an UPDATE with old/new fields
  const hasDiff = 'old' in details && 'new' in details;

  if (hasDiff) {
    return (
      <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
        <div className="text-xs font-medium text-muted-foreground uppercase">
          Change Details — {String(details.field || 'Field')}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 text-xs font-medium text-red-600 dark:text-red-400">Previous</div>
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 font-mono text-sm text-red-700 line-through dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {String(details.old)}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-green-600 dark:text-green-400">Updated</div>
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 font-mono text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
              {String(details.new)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // General details display (JSON-like)
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
      <div className="text-xs font-medium text-muted-foreground uppercase">
        Details
      </div>
      <div className="space-y-1.5 font-mono text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="shrink-0 font-medium text-muted-foreground">{key}:</span>
            <span className="text-foreground">
              {typeof value === 'number' ? value : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogEntry({
  log,
  index,
}: {
  log: (typeof auditLogs)[0];
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const config = actionConfig[log.action] || actionConfig.UPDATE;
  const ActionIcon = config.icon;

  return (
    <StaggerItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <motion.div
          className="group rounded-lg border bg-card transition-colors hover:bg-muted/30"
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
          }}
        >
          <CollapsibleTrigger className="flex w-full items-center gap-4 p-4 text-left">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div className={cn('flex size-8 items-center justify-center rounded-full border', config.bg)}>
                <ActionIcon className={cn('size-4', config.color)} />
              </div>
              {index < auditLogs.length - 1 && (
                <div className="mt-1 h-4 w-px bg-border" />
              )}
            </div>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{log.user}</span>
                <Badge variant="outline" className={cn('text-xs font-medium', config.bg, config.color)}>
                  {log.action}
                </Badge>
                <span className="text-muted-foreground">{log.resource}</span>
                <Badge variant="secondary" className="font-mono text-xs">
                  {log.resourceId}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="size-3" />
                  <span>{log.timestamp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ShieldAlert className="size-3" />
                  <span>IP: {log.ip}</span>
                </div>
              </div>
            </div>

            {/* Chevron */}
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <ChevronDown className="size-4 text-muted-foreground" />
            </motion.div>
          </CollapsibleTrigger>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="overflow-hidden"
              >
                <div className="border-t px-4 pb-4 pt-3 pl-16">
                  <DiffViewer details={log.details as Record<string, unknown>} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Collapsible>
    </StaggerItem>
  );
}

export default function AuditLogsPage() {
  const [actionFilter, setActionFilter] = useState<ActionType>('ALL');
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');

  const resources = useMemo(() => {
    const set = new Set(auditLogs.map((log) => log.resource));
    return Array.from(set);
  }, []);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      if (resourceFilter !== 'ALL' && log.resource !== resourceFilter) return false;
      return true;
    });
  }, [actionFilter, resourceFilter]);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
              <p className="text-muted-foreground">
                Track all system changes and user activities.
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <FileText className="size-4" />
              Export Logs
            </Button>
          </div>
        </FadeIn>

        {/* Filter Bar */}
        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="size-4" />
              Filters
            </div>
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as ActionType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="ALERT">Alert</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Resources</SelectItem>
                  {resources.map((res) => (
                    <SelectItem key={res} value={res}>
                      {res}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </FadeIn>

        {/* Log Entries */}
        <StaggerContainer className="space-y-3" staggerDelay={0.05}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log, index) => (
              <LogEntry key={log.id} log={log} index={index} />
            ))
          ) : (
            <FadeIn>
              <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12">
                <Filter className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No logs match the selected filters.</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => {
                    setActionFilter('ALL');
                    setResourceFilter('ALL');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </FadeIn>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  );
}
