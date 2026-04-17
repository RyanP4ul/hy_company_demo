'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Truck,
  Clock,
  AlertTriangle,
  Boxes,
  UserPlus,
  CreditCard,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  kpiData,
  revenueChartData,
  categoryData,
  activityTimeline,
  topSellingProducts,
  topCustomers,
  dailySales,
  inventoryStatus,
} from '@/lib/mock-data';
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from '@/components/shared/animated-components';
import { AnimatedCard, KPICard } from '@/components/shared/animated-card';

// ─── Activity type → icon + border color map ────────────────────────────────
const activityTypeConfig: Record<
  string,
  { icon: React.ElementType; borderColor: string; bgColor: string }
> = {
  order: {
    icon: ShoppingCart,
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  alert: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  delivery: {
    icon: Truck,
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  inventory: {
    icon: Boxes,
    borderColor: 'border-l-purple-500',
    bgColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  },
  user: {
    icon: UserPlus,
    borderColor: 'border-l-pink-500',
    bgColor: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  payment: {
    icon: CreditCard,
    borderColor: 'border-l-cyan-500',
    bgColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
};

// ─── Custom Tooltip for Revenue Chart ───────────────────────────────────────
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name === 'revenue'
            ? `$${entry.value.toLocaleString()}`
            : `${entry.value} orders`}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const recentActivities = activityTimeline.slice(0, 6);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard Overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening with your inventory today.
            </p>
          </div>
        </FadeIn>

        {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StaggerItem>
            <KPICard
              title="Total Revenue"
              value={kpiData.totalRevenue.value}
              change={kpiData.totalRevenue.change}
              trend={kpiData.totalRevenue.trend}
              icon={<DollarSign className="size-5" />}
              delay={0}
            />
          </StaggerItem>
          <StaggerItem>
            <KPICard
              title="Total Orders"
              value={kpiData.totalOrders.value}
              change={kpiData.totalOrders.change}
              trend={kpiData.totalOrders.trend}
              icon={<ShoppingCart className="size-5" />}
              delay={0.08}
            />
          </StaggerItem>
          <StaggerItem>
            <KPICard
              title="Total Products"
              value={kpiData.totalProducts.value}
              change={kpiData.totalProducts.change}
              trend={kpiData.totalProducts.trend}
              icon={<Package className="size-5" />}
              delay={0.16}
            />
          </StaggerItem>
          <StaggerItem>
            <KPICard
              title="Delivery Rate"
              value={kpiData.deliveryRate.value}
              change={kpiData.deliveryRate.change}
              trend={kpiData.deliveryRate.trend}
              icon={<Truck className="size-5" />}
              delay={0.24}
            />
          </StaggerItem>
        </StaggerContainer>

        {/* ─── Revenue Chart + Category Distribution ──────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Revenue Area Chart */}
          <AnimatedCard
            title="Revenue Overview"
            description="Monthly revenue & orders"
            className="lg:col-span-2"
            delay={0.15}
          >
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    animationDuration={1200}
                    name="revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    fill="url(#ordersGradient)"
                    animationDuration={1200}
                    animationBegin={300}
                    name="orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Category Pie Chart */}
          <AnimatedCard
            title="Categories"
            description="Product distribution"
            delay={0.25}
          >
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1000}
                    animationBegin={200}
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Share']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>
        </div>

        {/* ─── Daily Sales + Inventory Status ──────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Daily Sales Bar Chart */}
          <AnimatedCard title="Daily Sales" description="Sales volume this week" delay={0.2}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Inventory Status Donut Chart */}
          <AnimatedCard title="Inventory Status" description="Current stock distribution" delay={0.25}>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={1000}
                    animationBegin={200}
                  >
                    {inventoryStatus.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} items`, 'Count']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-card)',
                      fontSize: '13px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>
        </div>

        {/* ─── Activity Timeline ──────────────────────────────────────────── */}
        <AnimatedCard title="Recent Activity" description="Latest actions across the platform" delay={0.3}>
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-px bg-border" />

            <StaggerContainer className="space-y-0">
              {recentActivities.map((activity) => {
                const config = activityTypeConfig[activity.type] ?? {
                  icon: Clock,
                  borderColor: 'border-l-muted-foreground',
                  bgColor: 'bg-muted text-muted-foreground',
                };
                const IconComp = config.icon;

                return (
                  <StaggerItem key={activity.id}>
                    <div className={`relative flex items-start gap-4 border-l-2 ${config.borderColor} py-3 pl-2`}>
                      {/* Avatar / Icon */}
                      <div
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgColor} ml-[11px] -translate-x-[22px]`}
                      >
                        <IconComp className="size-4" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{activity.user}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>{' '}
                          <span className="font-medium text-foreground">{activity.target}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </AnimatedCard>

        {/* ─── Top Selling Products ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnimatedCard title="Top Selling Products" description="Best performers this month" delay={0.4}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Units Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map((product, idx) => (
                  <TableRow key={product.name}>
                    <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{product.sold.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{product.revenue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AnimatedCard>

          <AnimatedCard title="Most Orders by Customers" description="Top customers this month" delay={0.45}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, idx) => {
                  const barWidth = Math.max(20, (customer.orders / topCustomers[0].orders) * 100);
                  return (
                    <TableRow key={customer.name}>
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{customer.name}</p>
                            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                              <motion.div
                                className="h-1.5 rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${barWidth}%` }}
                                transition={{ duration: 0.8, delay: 0.5 + idx * 0.1, ease: 'easeOut' }}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
                          {customer.orders}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{customer.spent}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </AnimatedCard>
        </div>
      </div>
    </PageTransition>
  );
}
