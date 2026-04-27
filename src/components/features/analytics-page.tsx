'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CheckCircle2,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { PesoSign } from '@/components/icons/peso-sign';
import { cn } from '@/lib/utils';
import {
  revenueChartData,
  weeklyPerformanceData,
  categoryData,
} from '@/lib/mock-data';
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from '@/components/shared/animated-components';
import { AnimatedCard } from '@/components/shared/animated-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const pieData = [
  { name: 'Pending', value: 25, fill: 'oklch(0.75 0.18 80)' },
  { name: 'Processing', value: 15, fill: 'oklch(0.55 0.22 265)' },
  { name: 'Shipped', value: 30, fill: 'oklch(0.6 0.15 200)' },
  { name: 'Delivered', value: 25, fill: 'oklch(0.62 0.19 145)' },
  { name: 'Cancelled', value: 5, fill: 'oklch(0.577 0.245 27.325)' },
];

const metrics = [
  {
    title: 'Total Revenue',
    value: '₱284,520',
    change: '+12.5%',
    trend: 'up' as const,
    icon: PesoSign,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Avg Order Value',
    value: '₱153.99',
    change: '+3.2%',
    trend: 'up' as const,
    icon: ShoppingCart,
    color: 'text-chart-2',
    bgColor: 'bg-chart-2/10',
  },
  {
    title: 'Fulfillment Rate',
    value: '97.8%',
    change: '+1.3%',
    trend: 'up' as const,
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    title: 'Return Rate',
    value: '2.3%',
    change: '-0.8%',
    trend: 'down' as const,
    icon: RotateCcw,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Page Header */}
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Insights and performance metrics
              </p>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </FadeIn>

        {/* Metric Cards */}
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <StaggerItem key={metric.title}>
              <AnimatedCard delay={0}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
                    <div className="flex items-center gap-1 text-xs">
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                      )}
                      <span
                        className={cn(
                          'font-medium',
                          metric.trend === 'up'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {metric.change}
                      </span>
                      <span className="text-muted-foreground">vs last period</span>
                    </div>
                  </div>
                  <div className={cn('rounded-xl p-3', metric.bgColor)}>
                    <metric.icon className={cn('h-5 w-5', metric.color)} />
                  </div>
                </div>
              </AnimatedCard>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Revenue Trend Chart */}
        <AnimatedCard title="Revenue Trend" description="Monthly revenue over time" delay={0.1}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: 'var(--chart-1)', strokeWidth: 2, stroke: 'var(--background)' }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  fill="url(#revenueGradient)"
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: 'var(--chart-2)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>

        {/* Weekly Performance Chart */}
        <AnimatedCard title="Weekly Performance" description="Orders, deliveries, and returns by day" delay={0.2}>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyPerformanceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis className="text-xs" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="var(--chart-1)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="deliveries"
                  name="Deliveries"
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="returns"
                  name="Returns"
                  fill="var(--chart-3)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>

        {/* Bottom Row: Pie + Horizontal Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order Status Distribution */}
          <AnimatedCard title="Order Status Distribution" description="Current order breakdown" delay={0.3}>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={300}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => (
                      <span className="text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>

          {/* Top Categories */}
          <AnimatedCard title="Top Categories" description="Product category distribution" delay={0.4}>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    width={110}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-xs">
                            <p className="font-semibold">{payload[0].payload.name}</p>
                            <p className="text-muted-foreground">{payload[0].value}% share</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    name="Share"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cat-cell-${index}`} fill={entry.fill} stroke="none" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </PageTransition>
  );
}
