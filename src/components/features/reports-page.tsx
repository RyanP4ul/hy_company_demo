'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/shared/animated-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileBarChart,
  ShoppingCart,
  Truck,
  Activity,
  Download,
  Loader2,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ReportType = 'inventory' | 'sales' | 'delivery' | 'activity';

interface ReportConfig {
  id: ReportType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const reportTypes: ReportConfig[] = [
  {
    id: 'inventory',
    label: 'Inventory Report',
    icon: FileBarChart,
    description: 'Stock levels, movements, and alerts',
  },
  {
    id: 'sales',
    label: 'Sales Report',
    icon: ShoppingCart,
    description: 'Revenue, orders, and trends',
  },
  {
    id: 'delivery',
    label: 'Delivery Report',
    icon: Truck,
    description: 'Delivery performance and metrics',
  },
  {
    id: 'activity',
    label: 'User Activity Report',
    icon: Activity,
    description: 'User engagement and actions',
  },
];

// Sample report data per type
const sampleReportData: Record<ReportType, { headers: string[]; rows: string[][] }> = {
  inventory: {
    headers: ['Product', 'SKU', 'Type', 'Stock', 'Min Stock', 'Status', 'Warehouse'],
    rows: [
      ['Tarpaulin', 'SKU-001', 'C1', '150', '50', 'In Stock', 'Warehouse A'],
      ['Tarpaulin', 'SKU-001', 'S4', '200', '50', 'In Stock', 'Warehouse A'],
      ['Tarpaulin', 'SKU-001', 'S2', '180', '50', 'In Stock', 'Warehouse A'],
      ['Tarpaulin', 'SKU-001', 'A2', '75', '30', 'In Stock', 'Warehouse A'],
      ['Linoleum', 'SKU-002', 'Kilo 17', '120', '30', 'In Stock', 'Warehouse B'],
      ['Linoleum', 'SKU-002', '28', '0', '20', 'Out of Stock', 'Warehouse B'],
      ['Linoleum', 'SKU-002', '40', '0', '15', 'Out of Stock', 'Warehouse B'],
      ['Sakolin', 'SKU-003', '.32mm', '200', '40', 'In Stock', 'Warehouse C'],
      ['Sakolin', 'SKU-003', '1mm', '0', '20', 'Out of Stock', 'Warehouse C'],
    ],
  },
  sales: {
    headers: ['Month', 'Revenue', 'Orders', 'Avg Order Value', 'Returns', 'Net Revenue'],
    rows: [
      ['Jan 2024', '₱18,600', '145', '₱128.28', '3', '₱18,240'],
      ['Feb 2024', '₱22,400', '178', '₱125.84', '5', '₱21,850'],
      ['Mar 2024', '₱19,800', '156', '₱126.92', '2', '₱19,550'],
      ['Apr 2024', '₱27,600', '210', '₱131.43', '4', '₱27,100'],
      ['May 2024', '₱31,200', '245', '₱127.35', '6', '₱30,480'],
      ['Jun 2024', '₱28,900', '228', '₱126.75', '3', '₱28,510'],
    ],
  },
  delivery: {
    headers: ['Driver', 'Deliveries', 'On Time %', 'Avg Duration', 'Rating', 'Completed Today'],
    rows: [
      ['James Wilson', '1,247', '96.2%', '2h 15m', '4.8', '8'],
      ['Maria Garcia', '1,102', '97.5%', '2h 05m', '4.9', '6'],
      ['David Chen', '987', '94.8%', '2h 30m', '4.7', '5'],
      ['Sarah Kim', '856', '95.3%', '2h 20m', '4.6', '7'],
      ['Robert Martinez', '734', '93.1%', '2h 45m', '4.5', '0'],
    ],
  },
  activity: {
    headers: ['User', 'Role', 'Actions Today', 'Last Login', 'Sessions', 'Avg Duration'],
    rows: [
      ['Alex Johnson', 'Admin', '42', 'Just now', '8', '45 min'],
      ['Sarah Miller', 'Staff', '28', '5 min ago', '5', '32 min'],
      ['James Wilson', 'Driver', '15', '1 hour ago', '3', '20 min'],
      ['Maria Garcia', 'Driver', '12', '30 min ago', '3', '18 min'],
      ['David Chen', 'Staff', '9', '2 hours ago', '2', '25 min'],
      ['Emily Taylor', 'Manager', '35', '4 hours ago', '6', '38 min'],
    ],
  },
};

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-24 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="mt-1 h-3 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Table skeleton */}
      <Card>
        <CardContent className="p-4">
          <Skeleton className="mb-4 h-6 w-48 rounded" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded" />
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>('inventory');
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-31');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  const generateReport = useCallback(() => {
    setIsGenerated(false);
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 2000);
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setSelectedType(value as ReportType);
    if (isGenerated) {
      setIsGenerated(false);
      setIsGenerating(true);
      setTimeout(() => {
        setIsGenerating(false);
        setIsGenerated(true);
      }, 1500);
    }
  }, [isGenerated]);

  const reportData = sampleReportData[selectedType];
  const activeReport = reportTypes.find((r) => r.id === selectedType)!;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Generate and download detailed reports for your business.
            </p>
          </div>
        </FadeIn>

        {/* Report Configuration */}
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Report Type Selection */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Report Type</div>
                  <Tabs
                    value={selectedType}
                    onValueChange={handleTypeChange}
                  >
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                      {reportTypes.map((type) => (
                        <TabsTrigger key={type.id} value={type.id} className="gap-2">
                          <type.icon className="size-4" />
                          <span className="hidden sm:inline">{type.label}</span>
                          <span className="sm:hidden">{type.label.split(' ')[0]}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <p className="text-sm text-muted-foreground">{activeReport.description}</p>
                </div>

                {/* Date Range */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="size-4" />
                    Date Range
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground" htmlFor="date-from">From</label>
                      <Input
                        id="date-from"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-[180px]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground" htmlFor="date-to">To</label>
                      <Input
                        id="date-to"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-[180px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-center gap-3">
                  <Button onClick={generateReport} disabled={isGenerating} className="gap-2">
                    {isGenerating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <FileBarChart className="size-4" />
                    )}
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                  </Button>
                  {isGenerated && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-sm text-green-600 dark:text-green-400"
                    >
                      Report generated successfully
                    </motion.span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Report Preview */}
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
            >
              <ReportSkeleton />
            </motion.div>
          ) : isGenerated ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Summary Cards */}
              <StaggerContainer className="grid grid-cols-2 gap-4 lg:grid-cols-4" staggerDelay={0.05}>
                {selectedType === 'inventory' && [
                  { label: 'Total Products', value: '3,429' },
                  { label: 'Low Stock Items', value: '4' },
                  { label: 'Out of Stock', value: '2' },
                  { label: 'Total Value', value: '₱284,520' },
                ].map((s) => (
                  <StaggerItem key={s.label}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">{s.label}</div>
                        <div className="mt-1 text-xl font-bold">{s.value}</div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
                {selectedType === 'sales' && [
                  { label: 'Total Revenue', value: '₱148,500' },
                  { label: 'Total Orders', value: '1,162' },
                  { label: 'Avg Order Value', value: '₱127.80' },
                  { label: 'Return Rate', value: '2.0%' },
                ].map((s) => (
                  <StaggerItem key={s.label}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">{s.label}</div>
                        <div className="mt-1 text-xl font-bold">{s.value}</div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
                {selectedType === 'delivery' && [
                  { label: 'Total Deliveries', value: '4,926' },
                  { label: 'On-Time Rate', value: '95.4%' },
                  { label: 'Avg Duration', value: '2h 19m' },
                  { label: 'Avg Rating', value: '4.7' },
                ].map((s) => (
                  <StaggerItem key={s.label}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">{s.label}</div>
                        <div className="mt-1 text-xl font-bold">{s.value}</div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
                {selectedType === 'activity' && [
                  { label: 'Active Users', value: '6' },
                  { label: 'Total Actions', value: '141' },
                  { label: 'Avg Session', value: '30 min' },
                  { label: 'Total Sessions', value: '27' },
                ].map((s) => (
                  <StaggerItem key={s.label}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">{s.label}</div>
                        <div className="mt-1 text-xl font-bold">{s.value}</div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Data Table */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base">
                      {activeReport.label} — {dateFrom} to {dateTo}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-3.5" />
                        Download PDF
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="size-3.5" />
                        Download CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {reportData.headers.map((header, i) => (
                              <TableHead key={i}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reportData.rows.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                              {row.map((cell, cellIdx) => (
                                <TableCell key={cellIdx}>
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ) : (
            <FadeIn delay={0.2}>
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                    <FileBarChart className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No report generated</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a report type, set the date range, and click &quot;Generate Report&quot; to get started.
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
