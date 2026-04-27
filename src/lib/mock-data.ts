// ========================
// Mock Data for SaaS Dashboard
// ========================

export const kpiData = {
  totalRevenue: { value: '₱284,520', change: '+12.5%', trend: 'up' as const },
  totalOrders: { value: '1,847', change: '+8.2%', trend: 'up' as const },
  totalProducts: { value: '3,429', change: '-2.1%', trend: 'down' as const },
  deliveryRate: { value: '97.8%', change: '+1.3%', trend: 'up' as const },
};

export const revenueChartData = [
  { month: 'Jan', revenue: 18600, orders: 145 },
  { month: 'Feb', revenue: 22400, orders: 178 },
  { month: 'Mar', revenue: 19800, orders: 156 },
  { month: 'Apr', revenue: 27600, orders: 210 },
  { month: 'May', revenue: 31200, orders: 245 },
  { month: 'Jun', revenue: 28900, orders: 228 },
  { month: 'Jul', revenue: 35400, orders: 278 },
  { month: 'Aug', revenue: 32100, orders: 256 },
  { month: 'Sep', revenue: 38700, orders: 298 },
  { month: 'Oct', revenue: 42300, orders: 324 },
  { month: 'Nov', revenue: 39800, orders: 312 },
  { month: 'Dec', revenue: 45600, orders: 348 },
];

export const categoryData = [
  { name: 'Electronics', value: 35, fill: 'var(--color-chart-1)' },
  { name: 'Clothing', value: 25, fill: 'var(--color-chart-2)' },
  { name: 'Food & Beverage', value: 20, fill: 'var(--color-chart-3)' },
  { name: 'Home & Garden', value: 12, fill: 'var(--color-chart-4)' },
  { name: 'Other', value: 8, fill: 'var(--color-chart-5)' },
];

export const inventoryItems = [
  { id: 'SKU-001', name: 'Widget Pro X200', category: 'Electronics', price: 149.99, stock: 5, minStock: 10, status: 'low_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-15' },
  { id: 'SKU-002', name: 'Smart Sensor V3', category: 'Electronics', price: 89.99, stock: 234, minStock: 50, status: 'in_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-14' },
  { id: 'SKU-003', name: 'Premium Widget XL', category: 'Electronics', price: 249.99, stock: 67, minStock: 20, status: 'in_stock' as const, warehouse: 'Warehouse B', lastUpdated: '2024-01-13' },
  { id: 'SKU-004', name: 'Basic Connector Kit', category: 'Electronics', price: 29.99, stock: 1024, minStock: 200, status: 'in_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-12' },
  { id: 'SKU-005', name: 'Eco-Friendly Case', category: 'Accessories', price: 39.99, stock: 0, minStock: 30, status: 'out_of_stock' as const, warehouse: 'Warehouse B', lastUpdated: '2024-01-11' },
  { id: 'SKU-006', name: 'Wireless Charger Pad', category: 'Electronics', price: 59.99, stock: 189, minStock: 40, status: 'in_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-10' },
  { id: 'SKU-007', name: 'USB-C Hub Adapter', category: 'Accessories', price: 44.99, stock: 456, minStock: 100, status: 'in_stock' as const, warehouse: 'Warehouse C', lastUpdated: '2024-01-09' },
  { id: 'SKU-008', name: 'LED Desk Lamp', category: 'Home', price: 79.99, stock: 12, minStock: 15, status: 'low_stock' as const, warehouse: 'Warehouse B', lastUpdated: '2024-01-08' },
  { id: 'SKU-009', name: 'Noise Cancelling Buds', category: 'Electronics', price: 129.99, stock: 89, minStock: 25, status: 'in_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-07' },
  { id: 'SKU-010', name: 'Portable Power Bank', category: 'Electronics', price: 49.99, stock: 567, minStock: 100, status: 'in_stock' as const, warehouse: 'Warehouse C', lastUpdated: '2024-01-06' },
  { id: 'SKU-011', name: 'Bluetooth Speaker Mini', category: 'Electronics', price: 69.99, stock: 3, minStock: 20, status: 'low_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-05' },
  { id: 'SKU-012', name: 'Webcam HD 1080p', category: 'Electronics', price: 99.99, stock: 0, minStock: 30, status: 'out_of_stock' as const, warehouse: 'Warehouse B', lastUpdated: '2024-01-04' },
  { id: 'SKU-013', name: 'Mechanical Keyboard', category: 'Electronics', price: 159.99, stock: 234, minStock: 50, status: 'in_stock' as const, warehouse: 'Warehouse A', lastUpdated: '2024-01-03' },
  { id: 'SKU-014', name: 'Wireless Mouse', category: 'Electronics', price: 69.99, stock: 445, minStock: 80, status: 'in_stock' as const, warehouse: 'Warehouse C', lastUpdated: '2024-01-02' },
  { id: 'SKU-015', name: 'Monitor Stand', category: 'Accessories', price: 89.99, stock: 78, minStock: 20, status: 'in_stock' as const, warehouse: 'Warehouse B', lastUpdated: '2024-01-01' },
];

export const orders = [
  { id: 'ORD-2847', customer: 'Acme Corp', items: 12, total: 1847.99, status: 'pending' as const, date: '2024-01-15', priority: 'high' as const, deliveryType: 'truck' as const, paymentStatus: 'unpaid' as const },
  { id: 'ORD-2846', customer: 'TechStart Inc', items: 5, total: 749.95, status: 'processing' as const, date: '2024-01-15', priority: 'medium' as const, deliveryType: 'lalamove' as const, paymentStatus: 'unpaid' as const },
  { id: 'ORD-2845', customer: 'Global Trade Ltd', items: 34, total: 5199.66, status: 'shipped' as const, date: '2024-01-14', priority: 'high' as const, deliveryType: 'truck' as const, paymentStatus: 'paid' as const },
  { id: 'ORD-2844', customer: 'Metro Supply Co', items: 8, total: 1199.92, status: 'delivered' as const, date: '2024-01-14', priority: 'low' as const, deliveryType: 'lalamove' as const, paymentStatus: 'paid' as const },
  { id: 'ORD-2843', customer: 'Swift Retail', items: 2, total: 299.98, status: 'cancelled' as const, date: '2024-01-13', priority: 'low' as const, deliveryType: 'truck' as const, paymentStatus: 'unpaid' as const },
  { id: 'ORD-2842', customer: 'Digital Hub', items: 15, total: 2249.85, status: 'processing' as const, date: '2024-01-13', priority: 'medium' as const, deliveryType: 'truck' as const, paymentStatus: 'paid' as const },
  { id: 'ORD-2841', customer: 'Prime Logistics', items: 22, total: 3299.78, status: 'shipped' as const, date: '2024-01-12', priority: 'high' as const, deliveryType: 'truck' as const, paymentStatus: 'paid' as const },
  { id: 'ORD-2840', customer: 'Nova Enterprises', items: 6, total: 899.94, status: 'delivered' as const, date: '2024-01-12', priority: 'low' as const, deliveryType: 'lalamove' as const, paymentStatus: 'paid' as const },
  { id: 'ORD-2839', customer: 'Atlas Trading', items: 18, total: 2699.82, status: 'pending' as const, date: '2024-01-11', priority: 'medium' as const, deliveryType: 'truck' as const, paymentStatus: 'unpaid' as const },
  { id: 'ORD-2838', customer: 'Pinnacle Goods', items: 9, total: 1349.91, status: 'processing' as const, date: '2024-01-11', priority: 'high' as const, deliveryType: 'lalamove' as const, paymentStatus: 'unpaid' as const },
];

export type StopStatus = 'pending' | 'in_transit' | 'delivered';

export interface DeliveryStop {
  id: string;
  orderId: string;
  customer: string;
  address: string;
  status: StopStatus;
  items: number;
  total: number;
  deliveredAt: string | null;
  distanceFromPrev: number; // km from previous stop
  estimatedArrival: string;
  notes?: string;
}

export interface DeliveryRoute {
  id: string;
  driver: string;
  vehicle: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  stops: DeliveryStop[];
  totalDistance: number; // total route km
  totalOrders: number;
  totalValue: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  currentStopIndex: number;
  scheduledDate: string | null;
  scheduledTime: string | null;
  rescheduledDate: string | null;
  rescheduledTime: string | null;
  rescheduleReason: string | null;
}

// One truck = multiple customer orders, each with own address and delivery status
export const deliveries: DeliveryRoute[] = [
  {
    id: 'DEL-1092',
    driver: 'James Wilson',
    vehicle: 'Van #1',
    status: 'delivered',
    currentStopIndex: 3,
    totalDistance: 42.5,
    totalOrders: 3,
    totalValue: 6547.58,
    startedAt: '2024-01-14 08:00',
    completedAt: '2024-01-14 15:20',
    cancelledAt: null,
    cancelReason: null,
    stops: [
      { id: 'S-001', orderId: 'ORD-2844', customer: 'Metro Supply Co', address: '147 Pine Road, Philadelphia, PA 19101', status: 'delivered', items: 8, total: 1199.92, deliveredAt: '2024-01-14 09:15', distanceFromPrev: 12.3, estimatedArrival: '09:00 AM' },
      { id: 'S-002', orderId: 'ORD-2839', customer: 'Atlas Trading', address: '369 Elm Street, San Diego, CA 92101', status: 'delivered', items: 18, total: 2699.82, deliveredAt: '2024-01-14 11:30', distanceFromPrev: 15.2, estimatedArrival: '11:00 AM' },
      { id: 'S-003', orderId: 'ORD-2838', customer: 'Pinnacle Goods', address: '480 Birch Blvd, Dallas, TX 75201', status: 'delivered', items: 9, total: 1349.91, deliveredAt: '2024-01-14 14:00', distanceFromPrev: 10.8, estimatedArrival: '01:30 PM' },
      { id: 'S-004', orderId: 'ORD-2843', customer: 'Swift Retail', address: '591 Walnut Dr, San Jose, CA 95101', status: 'delivered', items: 2, total: 299.98, deliveredAt: '2024-01-14 15:10', distanceFromPrev: 4.2, estimatedArrival: '02:45 PM' },
    ],
  },
  {
    id: 'DEL-1091',
    driver: 'Maria Garcia',
    vehicle: 'Van #2',
    status: 'in_transit',
    currentStopIndex: 1,
    totalDistance: 38.7,
    totalOrders: 4,
    totalValue: 10097.29,
    startedAt: '2024-01-15 08:30',
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    stops: [
      { id: 'S-005', orderId: 'ORD-2845', customer: 'Global Trade Ltd', address: '456 Commerce Blvd, Los Angeles, CA 90001', status: 'delivered', items: 34, total: 5199.66, deliveredAt: '2024-01-15 10:20', distanceFromPrev: 14.1, estimatedArrival: '10:00 AM' },
      { id: 'S-006', orderId: 'ORD-2846', customer: 'TechStart Inc', address: '789 Innovation Dr, San Francisco, CA 94102', status: 'in_transit', items: 5, total: 749.95, deliveredAt: null, distanceFromPrev: 8.5, estimatedArrival: '12:30 PM', notes: 'Gate code: 4521' },
      { id: 'S-007', orderId: 'ORD-2841', customer: 'Prime Logistics', address: '987 Trade St, Houston, TX 77001', status: 'pending', items: 22, total: 3299.78, deliveredAt: null, distanceFromPrev: 9.8, estimatedArrival: '02:00 PM' },
      { id: 'S-008', orderId: 'ORD-2847', customer: 'Acme Corp', address: '123 Business Ave, New York, NY 10001', status: 'pending', items: 12, total: 1847.99, deliveredAt: null, distanceFromPrev: 6.3, estimatedArrival: '03:30 PM' },
    ],
  },
  {
    id: 'DEL-1090',
    driver: 'David Chen',
    vehicle: 'Van #3',
    status: 'in_transit',
    currentStopIndex: 0,
    totalDistance: 25.4,
    totalOrders: 3,
    totalValue: 4949.67,
    startedAt: '2024-01-15 09:00',
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    stops: [
      { id: 'S-009', orderId: 'ORD-2840', customer: 'Nova Enterprises', address: '712 Ash Court, Austin, TX 73301', status: 'in_transit', items: 6, total: 899.94, deliveredAt: null, distanceFromPrev: 11.2, estimatedArrival: '10:30 AM', notes: 'Back entrance, ring bell' },
      { id: 'S-010', orderId: 'ORD-2842', customer: 'Digital Hub', address: '258 Cedar Lane, San Antonio, TX 78201', status: 'pending', items: 15, total: 2249.85, deliveredAt: null, distanceFromPrev: 7.8, estimatedArrival: '12:00 PM' },
      { id: 'S-011', orderId: 'ORD-2848', customer: 'Summit Electronics', address: '445 Oak Ridge Rd, Austin, TX 73344', status: 'pending', items: 10, total: 1799.88, deliveredAt: null, distanceFromPrev: 6.4, estimatedArrival: '01:15 PM' },
    ],
  },
  {
    id: 'DEL-1089',
    driver: 'Sarah Kim',
    vehicle: 'Van #4',
    status: 'pending',
    currentStopIndex: 0,
    totalDistance: 31.6,
    totalOrders: 3,
    totalValue: 6349.39,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    stops: [
      { id: 'S-012', orderId: 'ORD-2849', customer: 'Pacific Supply', address: '888 Harbor Blvd, Seattle, WA 98101', status: 'pending', items: 20, total: 3299.50, deliveredAt: null, distanceFromPrev: 13.4, estimatedArrival: 'Tomorrow 09:30 AM' },
      { id: 'S-013', orderId: 'ORD-2850', customer: 'Redwood Distributors', address: '222 Pinecrest Ave, Portland, OR 97201', status: 'pending', items: 8, total: 1549.89, deliveredAt: null, distanceFromPrev: 10.2, estimatedArrival: 'Tomorrow 11:15 AM' },
      { id: 'S-014', orderId: 'ORD-2851', customer: 'Golden Gate Trading', address: '555 Market St, San Francisco, CA 94105', status: 'pending', items: 14, total: 1500.00, deliveredAt: null, distanceFromPrev: 8.0, estimatedArrival: 'Tomorrow 01:00 PM' },
    ],
  },
  {
    id: 'DEL-1088',
    driver: 'Robert Martinez',
    vehicle: 'Van #5',
    status: 'delivered',
    currentStopIndex: 2,
    totalDistance: 19.8,
    totalOrders: 2,
    totalValue: 2199.86,
    startedAt: '2024-01-13 07:30',
    completedAt: '2024-01-13 12:45',
    cancelledAt: null,
    cancelReason: null,
    stops: [
      { id: 'S-015', orderId: 'ORD-2835', customer: 'Lakeview Industries', address: '333 Lakeshore Dr, Chicago, IL 60601', status: 'delivered', items: 7, total: 899.94, deliveredAt: '2024-01-13 09:00', distanceFromPrev: 10.5, estimatedArrival: '08:45 AM' },
      { id: 'S-016', orderId: 'ORD-2836', customer: 'Mountain Supply Co', address: '666 Peak Rd, Denver, CO 80201', status: 'delivered', items: 11, total: 1299.92, deliveredAt: '2024-01-13 11:30', distanceFromPrev: 9.3, estimatedArrival: '11:00 AM' },
    ],
  },
];

export const deliveryTimeline = [
  { step: 'Loaded at Warehouse', time: '08:00 AM', completed: true },
  { step: 'Departed', time: '08:15 AM', completed: true },
  { step: 'En route to Stop 1', time: '08:30 AM', completed: true },
  { step: 'Stop 1 Delivered', time: '09:15 AM', completed: true },
  { step: 'En route to Stop 2', time: '09:30 AM', completed: true },
  { step: 'Stop 2 Delivered', time: '11:30 AM', completed: false },
  { step: 'Stop 3 Delivered', time: '--', completed: false },
  { step: 'Route Complete', time: '--', completed: false },
];

export const activityTimeline = [
  { id: '1', user: 'Ryan Paul Espinola', action: 'created order', target: 'ORD-2847', time: '2 min ago', type: 'order' as const },
  { id: '2', user: 'System', action: 'alert: low stock', target: 'Widget Pro X200', time: '5 min ago', type: 'alert' as const },
  { id: '3', user: 'Maria Garcia', action: 'started delivery', target: 'DEL-1091', time: '30 min ago', type: 'delivery' as const },
  { id: '4', user: 'James Wilson', action: 'completed delivery', target: 'DEL-1092', time: '1 hour ago', type: 'delivery' as const },
  { id: '5', user: 'Ryan Paul Espinola', action: 'updated inventory', target: 'Smart Sensor V3', time: '2 hours ago', type: 'inventory' as const },
  { id: '6', user: 'System', action: 'new user registered', target: 'Sarah Miller', time: '3 hours ago', type: 'user' as const },
  { id: '7', user: 'David Chen', action: 'accepted delivery', target: 'DEL-1090', time: '4 hours ago', type: 'delivery' as const },
  { id: '8', user: 'System', action: 'payment received', target: 'INV-4520 (₱2,450)', time: '5 hours ago', type: 'payment' as const },
];

export const users = [
  { id: 'USR-001', name: 'Ryan Paul Espinola', email: 'espinola@company.com', role: 'Admin', status: 'active' as const, lastActive: 'Just now', avatar: '' },
  { id: 'USR-002', name: 'Sarah Miller', email: 'sarah@company.com', role: 'Staff', status: 'active' as const, lastActive: '5 min ago', avatar: '' },
  { id: 'USR-003', name: 'James Wilson', email: 'james@company.com', role: 'Driver', status: 'active' as const, lastActive: '1 hour ago', avatar: '' },
  { id: 'USR-004', name: 'Maria Garcia', email: 'maria@company.com', role: 'Driver', status: 'active' as const, lastActive: '30 min ago', avatar: '' },
  { id: 'USR-005', name: 'David Chen', email: 'david@company.com', role: 'Staff', status: 'active' as const, lastActive: '2 hours ago', avatar: '' },
  { id: 'USR-006', name: 'Emily Taylor', email: 'emily@company.com', role: 'Manager', status: 'active' as const, lastActive: '4 hours ago', avatar: '' },
  { id: 'USR-007', name: 'Michael Brown', email: 'michael@company.com', role: 'Staff', status: 'inactive' as const, lastActive: '3 days ago', avatar: '' },
  { id: 'USR-008', name: 'Lisa Wang', email: 'lisa@company.com', role: 'Staff', status: 'active' as const, lastActive: '1 day ago', avatar: '' },
];

export const auditLogs = [
  { id: 'LOG-001', user: 'Ryan Paul Espinola', action: 'UPDATE', resource: 'Product', resourceId: 'SKU-002', details: { field: 'price', old: '79.99', new: '89.99' }, timestamp: '2024-01-15 10:30:22', ip: '192.168.1.100' },
  { id: 'LOG-002', user: 'Ryan Paul Espinola', action: 'CREATE', resource: 'Order', resourceId: 'ORD-2847', details: { customer: 'Acme Corp', items: 12, total: '₱1,847.99' }, timestamp: '2024-01-15 10:28:15', ip: '192.168.1.100' },
  { id: 'LOG-003', user: 'System', action: 'ALERT', resource: 'Inventory', resourceId: 'SKU-001', details: { alert: 'Low Stock', current: 5, minimum: 10 }, timestamp: '2024-01-15 10:25:00', ip: 'system' },
  { id: 'LOG-004', user: 'Sarah Miller', action: 'UPDATE', resource: 'Delivery', resourceId: 'DEL-1091', details: { field: 'status', old: 'pending', new: 'in_transit' }, timestamp: '2024-01-15 10:00:00', ip: '192.168.1.105' },
  { id: 'LOG-005', user: 'Emily Taylor', action: 'DELETE', resource: 'User', resourceId: 'USR-010', details: { reason: 'Account terminated', user: 'John Doe' }, timestamp: '2024-01-15 09:45:30', ip: '192.168.1.108' },
  { id: 'LOG-006', user: 'James Wilson', action: 'UPDATE', resource: 'Delivery', resourceId: 'DEL-1092', details: { field: 'status', old: 'in_transit', new: 'delivered' }, timestamp: '2024-01-15 09:30:00', ip: 'mobile' },
];

export const drivers = [
  { id: 'DRV-001', name: 'James Wilson', phone: '+1 (555) 123-4567', status: 'available' as const, vehicle: 'Van #1', completedToday: 8, rating: 4.8, totalDeliveries: 1247 },
  { id: 'DRV-002', name: 'Maria Garcia', phone: '+1 (555) 234-5678', status: 'on_delivery' as const, vehicle: 'Van #2', completedToday: 6, rating: 4.9, totalDeliveries: 1102 },
  { id: 'DRV-003', name: 'David Chen', phone: '+1 (555) 345-6789', status: 'on_delivery' as const, vehicle: 'Van #3', completedToday: 5, rating: 4.7, totalDeliveries: 987 },
  { id: 'DRV-004', name: 'Sarah Kim', phone: '+1 (555) 456-7890', status: 'available' as const, vehicle: 'Van #4', completedToday: 7, rating: 4.6, totalDeliveries: 856 },
  { id: 'DRV-005', name: 'Robert Martinez', phone: '+1 (555) 567-8901', status: 'offline' as const, vehicle: 'Van #5', completedToday: 0, rating: 4.5, totalDeliveries: 734 },
];

export const weeklyPerformanceData = [
  { day: 'Mon', orders: 42, deliveries: 38, returns: 3 },
  { day: 'Tue', orders: 38, deliveries: 35, returns: 2 },
  { day: 'Wed', orders: 55, deliveries: 50, returns: 5 },
  { day: 'Thu', orders: 48, deliveries: 45, returns: 1 },
  { day: 'Fri', orders: 62, deliveries: 58, returns: 4 },
  { day: 'Sat', orders: 35, deliveries: 32, returns: 2 },
  { day: 'Sun', orders: 28, deliveries: 25, returns: 1 },
];

export const customers = [
  { id: 'CST-001', name: 'Acme Corp', contactNumber: '+1 (555) 100-2001', company: 'Acme Corporation', address: '123 Business Ave, New York, NY 10001', totalOrders: 47, totalSpent: 68450.00, status: 'active' as const, joinDate: '2023-03-15', lastOrder: '2024-01-15' },
  { id: 'CST-002', name: 'Global Trade Ltd', contactNumber: '+1 (555) 200-3002', company: 'Global Trade Ltd', address: '456 Commerce Blvd, Los Angeles, CA 90001', totalOrders: 38, totalSpent: 52300.00, status: 'active' as const, joinDate: '2023-05-22', lastOrder: '2024-01-14' },
  { id: 'CST-003', name: 'TechStart Inc', contactNumber: '+1 (555) 300-4003', company: 'TechStart Inc', address: '789 Innovation Dr, San Francisco, CA 94102', totalOrders: 32, totalSpent: 45100.00, status: 'active' as const, joinDate: '2023-06-10', lastOrder: '2024-01-15' },
  { id: 'CST-004', name: 'John Mitchell', contactNumber: '+1 (555) 400-5004', company: '', address: '321 Oak Street, Chicago, IL 60601', totalOrders: 28, totalSpent: 38700.00, status: 'active' as const, joinDate: '2023-07-01', lastOrder: '2024-01-12' },
  { id: 'CST-005', name: 'Prime Logistics', contactNumber: '+1 (555) 500-6005', company: 'Prime Logistics LLC', address: '987 Trade St, Houston, TX 77001', totalOrders: 24, totalSpent: 33200.00, status: 'active' as const, joinDate: '2023-08-18', lastOrder: '2024-01-12' },
  { id: 'CST-006', name: 'Sarah Williams', contactNumber: '+1 (555) 600-7006', company: '', address: '654 Maple Ave, Phoenix, AZ 85001', totalOrders: 19, totalSpent: 24600.00, status: 'active' as const, joinDate: '2023-09-05', lastOrder: '2024-01-10' },
  { id: 'CST-007', name: 'Metro Supply Co', contactNumber: '+1 (555) 700-8007', company: 'Metro Supply Co', address: '147 Pine Road, Philadelphia, PA 19101', totalOrders: 15, totalSpent: 19800.00, status: 'active' as const, joinDate: '2023-10-12', lastOrder: '2024-01-14' },
  { id: 'CST-008', name: 'Digital Hub', contactNumber: '+1 (555) 800-9008', company: 'Digital Hub Solutions', address: '258 Cedar Lane, San Antonio, TX 78201', totalOrders: 12, totalSpent: 16400.00, status: 'active' as const, joinDate: '2023-11-01', lastOrder: '2024-01-13' },
  { id: 'CST-009', name: 'Atlas Trading', contactNumber: '+1 (555) 900-1009', company: 'Atlas Trading Group', address: '369 Elm Street, San Diego, CA 92101', totalOrders: 10, totalSpent: 12300.00, status: 'active' as const, joinDate: '2023-11-20', lastOrder: '2024-01-11' },
  { id: 'CST-010', name: 'Pinnacle Goods', contactNumber: '+1 (555) 100-2010', company: 'Pinnacle Goods Inc', address: '480 Birch Blvd, Dallas, TX 75201', totalOrders: 8, totalSpent: 9700.00, status: 'active' as const, joinDate: '2023-12-05', lastOrder: '2024-01-11' },
  { id: 'CST-011', name: 'Swift Retail', contactNumber: '+1 (555) 200-3011', company: 'Swift Retail Partners', address: '591 Walnut Dr, San Jose, CA 95101', totalOrders: 5, totalSpent: 6200.00, status: 'inactive' as const, joinDate: '2023-12-15', lastOrder: '2024-01-13' },
  { id: 'CST-012', name: 'Nova Enterprises', contactNumber: '+1 (555) 300-4012', company: '', address: '712 Ash Court, Austin, TX 73301', totalOrders: 3, totalSpent: 4100.00, status: 'active' as const, joinDate: '2024-01-02', lastOrder: '2024-01-12' },
];

export const topCustomers = [
  { name: 'Acme Corp', orders: 47, spent: '₱68,450' },
  { name: 'Global Trade Ltd', orders: 38, spent: '₱52,300' },
  { name: 'TechStart Inc', orders: 32, spent: '₱45,100' },
  { name: 'John Mitchell', orders: 28, spent: '₱38,700' },
  { name: 'Prime Logistics', orders: 24, spent: '₱33,200' },
];

export const topSellingProducts = [
  { name: 'Smart Sensor V3', sold: 342, revenue: '₱30,776' },
  { name: 'Wireless Charger Pad', sold: 289, revenue: '₱17,334' },
  { name: 'USB-C Hub Adapter', sold: 256, revenue: '₱11,518' },
  { name: 'Mechanical Keyboard', sold: 198, revenue: '₱31,678' },
  { name: 'Noise Cancelling Buds', sold: 176, revenue: '₱22,878' },
];

export const dailySales = [
  { day: 'Mon', sales: 4200 },
  { day: 'Tue', sales: 3800 },
  { day: 'Wed', sales: 5100 },
  { day: 'Thu', sales: 4700 },
  { day: 'Fri', sales: 6200 },
  { day: 'Sat', sales: 3500 },
  { day: 'Sun', sales: 2800 },
];

export const inventoryStatus = [
  { name: 'In Stock', value: 8, fill: 'var(--color-chart-1)' },
  { name: 'Low Stock', value: 3, fill: 'var(--color-chart-3)' },
  { name: 'Out of Stock', value: 2, fill: 'var(--color-chart-5)' },
];

// ========================
// Sales Transactions (auto-recorded from delivered orders)
// ========================

export type PaymentMethod = 'cash' | 'gcash' | 'visa';
export type SaleStatus = 'completed' | 'refunded' | 'pending';

export interface SalesTransaction {
  id: string;
  orderId: string;
  customer: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  soldAt: string;     // date of sale (when order delivered)
  recordedAt: string; // when the sale was auto-recorded
}

export const salesTransactions: SalesTransaction[] = [
  {
    id: 'SAL-1001',
    orderId: 'ORD-2844',
    customer: 'Metro Supply Co',
    items: 8,
    subtotal: 1199.92,
    tax: 95.99,
    total: 1295.91,
    paymentMethod: 'gcash',
    status: 'completed',
    soldAt: '2024-01-14',
    recordedAt: '2024-01-14 16:32',
  },
  {
    id: 'SAL-1000',
    orderId: 'ORD-2840',
    customer: 'Nova Enterprises',
    items: 6,
    subtotal: 899.94,
    tax: 71.99,
    total: 971.93,
    paymentMethod: 'visa',
    status: 'completed',
    soldAt: '2024-01-12',
    recordedAt: '2024-01-12 11:05',
  },
  {
    id: 'SAL-0999',
    orderId: 'ORD-2837',
    customer: 'Zenith Supplies',
    items: 10,
    subtotal: 1499.90,
    tax: 119.99,
    total: 1619.89,
    paymentMethod: 'cash',
    status: 'completed',
    soldAt: '2024-01-11',
    recordedAt: '2024-01-11 14:48',
  },
  {
    id: 'SAL-0998',
    orderId: 'ORD-2835',
    customer: 'Blue Ocean Ltd',
    items: 3,
    subtotal: 449.97,
    tax: 36.00,
    total: 485.97,
    paymentMethod: 'gcash',
    status: 'refunded',
    soldAt: '2024-01-10',
    recordedAt: '2024-01-10 09:22',
  },
  {
    id: 'SAL-0997',
    orderId: 'ORD-2833',
    customer: 'Redwood Trading',
    items: 20,
    subtotal: 2999.80,
    tax: 239.98,
    total: 3239.78,
    paymentMethod: 'visa',
    status: 'completed',
    soldAt: '2024-01-09',
    recordedAt: '2024-01-09 17:15',
  },
  {
    id: 'SAL-0996',
    orderId: 'ORD-2830',
    customer: 'Summit Goods',
    items: 7,
    subtotal: 1049.93,
    tax: 83.99,
    total: 1133.92,
    paymentMethod: 'cash',
    status: 'completed',
    soldAt: '2024-01-08',
    recordedAt: '2024-01-08 13:40',
  },
  {
    id: 'SAL-0995',
    orderId: 'ORD-2828',
    customer: 'Acme Corp',
    items: 15,
    subtotal: 2249.85,
    tax: 179.99,
    total: 2429.84,
    paymentMethod: 'visa',
    status: 'completed',
    soldAt: '2024-01-07',
    recordedAt: '2024-01-07 10:55',
  },
  {
    id: 'SAL-0994',
    orderId: 'ORD-2826',
    customer: 'Prime Logistics',
    items: 4,
    subtotal: 599.96,
    tax: 48.00,
    total: 647.96,
    paymentMethod: 'gcash',
    status: 'completed',
    soldAt: '2024-01-06',
    recordedAt: '2024-01-06 15:30',
  },
  {
    id: 'SAL-0993',
    orderId: 'ORD-2824',
    customer: 'TechStart Inc',
    items: 11,
    subtotal: 1649.89,
    tax: 131.99,
    total: 1781.88,
    paymentMethod: 'cash',
    status: 'completed',
    soldAt: '2024-01-05',
    recordedAt: '2024-01-05 12:10',
  },
  {
    id: 'SAL-0992',
    orderId: 'ORD-2822',
    customer: 'Global Trade Ltd',
    items: 25,
    subtotal: 3749.75,
    tax: 299.98,
    total: 4049.73,
    paymentMethod: 'visa',
    status: 'completed',
    soldAt: '2024-01-04',
    recordedAt: '2024-01-04 09:45',
  },
  {
    id: 'SAL-0991',
    orderId: 'ORD-2820',
    customer: 'Metro Supply Co',
    items: 2,
    subtotal: 299.98,
    tax: 24.00,
    total: 323.98,
    paymentMethod: 'gcash',
    status: 'pending',
    soldAt: '2024-01-03',
    recordedAt: '2024-01-03 16:20',
  },
  {
    id: 'SAL-0990',
    orderId: 'ORD-2818',
    customer: 'Swift Retail',
    items: 9,
    subtotal: 1349.91,
    tax: 107.99,
    total: 1457.90,
    paymentMethod: 'cash',
    status: 'completed',
    soldAt: '2024-01-02',
    recordedAt: '2024-01-02 11:35',
  },
];

// ========================
// Central Inbox — Viber & WeChat Webhook Messages
// ========================

export type InboxChannel = 'viber' | 'wechat';
export type CustomerType = 'regular' | 'new';
export type MessageSender = 'customer' | 'agent';
export type ConversationStatus = 'open' | 'resolved' | 'pending';

export interface InboxMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'order_inquiry' | 'location';
  attachments?: { name: string; url: string; type: string }[];
}

export interface InboxConversation {
  id: string;
  channel: InboxChannel;
  customerName: string;
  customerAvatar?: string;
  customerPhone: string;
  customerType: CustomerType;
  customerOrders: number;
  customerTotalSpent: number;
  customerSince: string;
  status: ConversationStatus;
  assignedTo?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: InboxMessage[];
  webhookEventId?: string;
}

export const inboxConversations: InboxConversation[] = [
  {
    id: 'CONV-001',
    channel: 'viber',
    customerName: 'Acme Corp',
    customerPhone: '+1 (555) 100-2001',
    customerType: 'regular',
    customerOrders: 47,
    customerTotalSpent: 68450,
    customerSince: '2023-03-15',
    status: 'open',
    assignedTo: 'Sarah Miller',
    lastMessage: 'Can we get an update on ORD-2847?',
    lastMessageTime: '2 min ago',
    unreadCount: 3,
    webhookEventId: 'WH-VIB-78231',
    messages: [
      { id: 'MSG-001', conversationId: 'CONV-001', sender: 'customer', content: 'Hi, I would like to check the status of our recent order ORD-2847.', timestamp: '2024-01-15 10:15 AM', type: 'text' },
      { id: 'MSG-002', conversationId: 'CONV-001', sender: 'agent', content: 'Hello! Let me check on that for you. Order ORD-2847 is currently pending and being processed.', timestamp: '2024-01-15 10:18 AM', type: 'text' },
      { id: 'MSG-003', conversationId: 'CONV-001', sender: 'customer', content: 'Do you have an estimated shipping date? We need these items urgently.', timestamp: '2024-01-15 10:22 AM', type: 'text' },
      { id: 'MSG-004', conversationId: 'CONV-001', sender: 'agent', content: 'The order should be shipped by tomorrow. I will flag it as high priority to expedite.', timestamp: '2024-01-15 10:25 AM', type: 'text' },
      { id: 'MSG-005', conversationId: 'CONV-001', sender: 'customer', content: 'That would be great, thank you!', timestamp: '2024-01-15 10:26 AM', type: 'text' },
      { id: 'MSG-006', conversationId: 'CONV-001', sender: 'customer', content: 'Also, can we add 5 more units of SKU-002 to this order?', timestamp: '2024-01-15 10:30 AM', type: 'text' },
      { id: 'MSG-007', conversationId: 'CONV-001', sender: 'customer', content: 'Can we get an update on ORD-2847?', timestamp: '2024-01-15 10:35 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-002',
    channel: 'wechat',
    customerName: 'Global Trade Ltd',
    customerPhone: '+1 (555) 200-3002',
    customerType: 'regular',
    customerOrders: 38,
    customerTotalSpent: 52300,
    customerSince: '2023-05-22',
    status: 'open',
    assignedTo: 'Ryan Paul Espinola',
    lastMessage: '我们的订单已经到港口了吗？',
    lastMessageTime: '15 min ago',
    unreadCount: 2,
    webhookEventId: 'WH-WX-45291',
    messages: [
      { id: 'MSG-008', conversationId: 'CONV-002', sender: 'customer', content: '你好，我们想查询一下订单 ORD-2845 的物流信息', timestamp: '2024-01-15 09:00 AM', type: 'text' },
      { id: 'MSG-009', conversationId: 'CONV-002', sender: 'agent', content: '您好！订单 ORD-2845 已发货，正在运输中。预计2小时后到达。', timestamp: '2024-01-15 09:05 AM', type: 'text' },
      { id: 'MSG-010', conversationId: 'CONV-002', sender: 'customer', content: '好的，谢谢！我们可以跟踪物流吗？', timestamp: '2024-01-15 09:10 AM', type: 'text' },
      { id: 'MSG-011', conversationId: 'CONV-002', sender: 'agent', content: '当然可以！我已经将跟踪链接发送到您的邮箱。', timestamp: '2024-01-15 09:15 AM', type: 'text' },
      { id: 'MSG-012', conversationId: 'CONV-002', sender: 'customer', content: '我们的订单已经到港口了吗？', timestamp: '2024-01-15 10:20 AM', type: 'text' },
      { id: 'MSG-013', conversationId: 'CONV-002', sender: 'customer', content: '我们需要在下周一前收到这批货物', timestamp: '2024-01-15 10:22 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-003',
    channel: 'viber',
    customerName: 'TechStart Inc',
    customerPhone: '+1 (555) 300-4003',
    customerType: 'regular',
    customerOrders: 32,
    customerTotalSpent: 45100,
    customerSince: '2023-06-10',
    status: 'resolved',
    assignedTo: 'Sarah Miller',
    lastMessage: 'Great, that works! Thanks for your help.',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    webhookEventId: 'WH-VIB-78235',
    messages: [
      { id: 'MSG-014', conversationId: 'CONV-003', sender: 'customer', content: 'We need to place a bulk order for Smart Sensor V3. How many do you have in stock?', timestamp: '2024-01-15 08:30 AM', type: 'text' },
      { id: 'MSG-015', conversationId: 'CONV-003', sender: 'agent', content: 'We currently have 234 units of Smart Sensor V3 in stock at Warehouse A. How many do you need?', timestamp: '2024-01-15 08:35 AM', type: 'text' },
      { id: 'MSG-016', conversationId: 'CONV-003', sender: 'customer', content: 'We need 100 units. Can we get a discount for bulk orders?', timestamp: '2024-01-15 08:40 AM', type: 'text' },
      { id: 'MSG-017', conversationId: 'CONV-003', sender: 'agent', content: 'Absolutely! For 100+ units, we offer a 15% bulk discount. That brings the price from ₱89.99 to ₱76.49 per unit.', timestamp: '2024-01-15 08:45 AM', type: 'text' },
      { id: 'MSG-018', conversationId: 'CONV-003', sender: 'customer', content: 'Great, that works! Thanks for your help.', timestamp: '2024-01-15 09:00 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-004',
    channel: 'wechat',
    customerName: '张伟 (Wei Zhang)',
    customerPhone: '+86 138-8888-1001',
    customerType: 'new',
    customerOrders: 0,
    customerTotalSpent: 0,
    customerSince: '2024-01-15',
    status: 'open',
    lastMessage: '请问你们有最低起订量要求吗？',
    lastMessageTime: '5 min ago',
    unreadCount: 4,
    webhookEventId: 'WH-WX-45300',
    messages: [
      { id: 'MSG-019', conversationId: 'CONV-004', sender: 'customer', content: '你好，我是深圳一家贸易公司的采购经理', timestamp: '2024-01-15 10:00 AM', type: 'text' },
      { id: 'MSG-020', conversationId: 'CONV-004', sender: 'customer', content: '我们想了解你们的产品目录和价格', timestamp: '2024-01-15 10:02 AM', type: 'text' },
      { id: 'MSG-021', conversationId: 'CONV-004', sender: 'agent', content: '欢迎！我可以为您提供完整的产品目录。请问您对哪类产品感兴趣？', timestamp: '2024-01-15 10:10 AM', type: 'text' },
      { id: 'MSG-022', conversationId: 'CONV-004', sender: 'customer', content: '主要是电子类产品，特别是传感器和充电设备', timestamp: '2024-01-15 10:15 AM', type: 'text' },
      { id: 'MSG-023', conversationId: 'CONV-004', sender: 'customer', content: '请问你们有最低起订量要求吗？', timestamp: '2024-01-15 10:30 AM', type: 'text' },
      { id: 'MSG-024', conversationId: 'CONV-004', sender: 'customer', content: '我们首次试单希望从小批量开始', timestamp: '2024-01-15 10:32 AM', type: 'text' },
      { id: 'MSG-025', conversationId: 'CONV-004', sender: 'customer', content: '大概50-100件左右', timestamp: '2024-01-15 10:33 AM', type: 'text' },
      { id: 'MSG-026', conversationId: 'CONV-004', sender: 'customer', content: '另外能否提供样品？', timestamp: '2024-01-15 10:35 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-005',
    channel: 'viber',
    customerName: 'Maria Santos',
    customerPhone: '+63 917-123-4567',
    customerType: 'new',
    customerOrders: 0,
    customerTotalSpent: 0,
    customerSince: '2024-01-15',
    status: 'open',
    lastMessage: 'How much is the Wireless Charger Pad?',
    lastMessageTime: '30 min ago',
    unreadCount: 2,
    webhookEventId: 'WH-VIB-78240',
    messages: [
      { id: 'MSG-027', conversationId: 'CONV-005', sender: 'customer', content: 'Hi! I saw your products online. Do you ship to the Philippines?', timestamp: '2024-01-15 09:45 AM', type: 'text' },
      { id: 'MSG-028', conversationId: 'CONV-005', sender: 'agent', content: 'Hello Maria! Yes, we ship internationally including the Philippines. Shipping usually takes 5-7 business days.', timestamp: '2024-01-15 09:50 AM', type: 'text' },
      { id: 'MSG-029', conversationId: 'CONV-005', sender: 'customer', content: 'That\'s great! I\'m interested in some electronics accessories.', timestamp: '2024-01-15 10:00 AM', type: 'text' },
      { id: 'MSG-030', conversationId: 'CONV-005', sender: 'customer', content: 'How much is the Wireless Charger Pad?', timestamp: '2024-01-15 10:05 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-006',
    channel: 'wechat',
    customerName: '李明 (Ming Li)',
    customerPhone: '+86 139-9999-2002',
    customerType: 'regular',
    customerOrders: 15,
    customerTotalSpent: 18500,
    customerSince: '2023-08-20',
    status: 'pending',
    assignedTo: 'Emily Taylor',
    lastMessage: '这次的包装有问题，有几个产品损坏了',
    lastMessageTime: '45 min ago',
    unreadCount: 1,
    webhookEventId: 'WH-WX-45305',
    messages: [
      { id: 'MSG-031', conversationId: 'CONV-006', sender: 'customer', content: '你好，我收到了上次订单，但有一个问题需要反馈', timestamp: '2024-01-15 09:30 AM', type: 'text' },
      { id: 'MSG-032', conversationId: 'CONV-006', sender: 'agent', content: '您好李明，很抱歉给您带来不便。请告诉我具体情况，我们会尽快处理。', timestamp: '2024-01-15 09:35 AM', type: 'text' },
      { id: 'MSG-033', conversationId: 'CONV-006', sender: 'customer', content: '这次的包装有问题，有几个产品损坏了', timestamp: '2024-01-15 09:40 AM', type: 'text' },
      { id: 'MSG-034', conversationId: 'CONV-006', sender: 'customer', content: '我拍了照片，需要我发给您看吗？', timestamp: '2024-01-15 09:50 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-007',
    channel: 'viber',
    customerName: 'Prime Logistics',
    customerPhone: '+1 (555) 500-6005',
    customerType: 'regular',
    customerOrders: 24,
    customerTotalSpent: 33200,
    customerSince: '2023-08-18',
    status: 'open',
    assignedTo: 'David Chen',
    lastMessage: 'The delivery for ORD-2841 is delayed.',
    lastMessageTime: '1 hour ago',
    unreadCount: 1,
    webhookEventId: 'WH-VIB-78242',
    messages: [
      { id: 'MSG-035', conversationId: 'CONV-007', sender: 'customer', content: 'We noticed that delivery DEL-1090 hasn\'t moved for the past 2 hours. Can you check?', timestamp: '2024-01-15 08:00 AM', type: 'text' },
      { id: 'MSG-036', conversationId: 'CONV-007', sender: 'agent', content: 'Let me check with the driver. David Chen is currently on that delivery route.', timestamp: '2024-01-15 08:10 AM', type: 'text' },
      { id: 'MSG-037', conversationId: 'CONV-007', sender: 'agent', content: 'The driver reported heavy traffic on the route. ETA has been updated to approximately 4 hours from start.', timestamp: '2024-01-15 08:20 AM', type: 'text' },
      { id: 'MSG-038', conversationId: 'CONV-007', sender: 'customer', content: 'The delivery for ORD-2841 is delayed.', timestamp: '2024-01-15 09:00 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-008',
    channel: 'wechat',
    customerName: '王芳 (Fang Wang)',
    customerPhone: '+86 136-7777-3003',
    customerType: 'new',
    customerOrders: 0,
    customerTotalSpent: 0,
    customerSince: '2024-01-15',
    status: 'open',
    lastMessage: '我想先了解一下你们公司的情况',
    lastMessageTime: '2 hours ago',
    unreadCount: 3,
    webhookEventId: 'WH-WX-45310',
    messages: [
      { id: 'MSG-039', conversationId: 'CONV-008', sender: 'customer', content: '您好，是通过微信推荐了解到贵公司的', timestamp: '2024-01-15 08:00 AM', type: 'text' },
      { id: 'MSG-040', conversationId: 'CONV-008', sender: 'customer', content: '我想先了解一下你们公司的情况', timestamp: '2024-01-15 08:05 AM', type: 'text' },
      { id: 'MSG-041', conversationId: 'CONV-008', sender: 'customer', content: '你们主要经营什么类型的产品？', timestamp: '2024-01-15 08:10 AM', type: 'text' },
      { id: 'MSG-042', conversationId: 'CONV-008', sender: 'customer', content: '价格区间大概是多少？', timestamp: '2024-01-15 08:15 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-009',
    channel: 'viber',
    customerName: 'Nova Enterprises',
    customerPhone: '+1 (555) 300-4012',
    customerType: 'regular',
    customerOrders: 3,
    customerTotalSpent: 4100,
    customerSince: '2024-01-02',
    status: 'resolved',
    lastMessage: 'Thank you, the issue has been resolved.',
    lastMessageTime: '3 hours ago',
    unreadCount: 0,
    webhookEventId: 'WH-VIB-78245',
    messages: [
      { id: 'MSG-043', conversationId: 'CONV-009', sender: 'customer', content: 'We received our order but 2 items were missing from the package.', timestamp: '2024-01-15 07:00 AM', type: 'text' },
      { id: 'MSG-044', conversationId: 'CONV-009', sender: 'agent', content: 'I\'m sorry to hear that. Could you please provide your order number?', timestamp: '2024-01-15 07:05 AM', type: 'text' },
      { id: 'MSG-045', conversationId: 'CONV-009', sender: 'customer', content: 'Order ORD-2840. Missing items: USB-C Hub Adapter x2', timestamp: '2024-01-15 07:10 AM', type: 'text' },
      { id: 'MSG-046', conversationId: 'CONV-009', sender: 'agent', content: 'I\'ve verified and initiated a replacement shipment for the missing items. You should receive them within 2 business days.', timestamp: '2024-01-15 07:20 AM', type: 'text' },
      { id: 'MSG-047', conversationId: 'CONV-009', sender: 'customer', content: 'Thank you, the issue has been resolved.', timestamp: '2024-01-15 07:25 AM', type: 'text' },
    ],
  },
  {
    id: 'CONV-010',
    channel: 'viber',
    customerName: 'Carlos Rivera',
    customerPhone: '+63 918-456-7890',
    customerType: 'new',
    customerOrders: 0,
    customerTotalSpent: 0,
    customerSince: '2024-01-15',
    status: 'pending',
    lastMessage: 'Can I visit your warehouse?',
    lastMessageTime: '4 hours ago',
    unreadCount: 1,
    webhookEventId: 'WH-VIB-78250',
    messages: [
      { id: 'MSG-048', conversationId: 'CONV-010', sender: 'customer', content: 'Hi, I run a small electronics shop in Manila.', timestamp: '2024-01-15 06:00 AM', type: 'text' },
      { id: 'MSG-049', conversationId: 'CONV-010', sender: 'customer', content: 'I\'m looking for wholesale suppliers for accessories.', timestamp: '2024-01-15 06:05 AM', type: 'text' },
      { id: 'MSG-050', conversationId: 'CONV-010', sender: 'agent', content: 'Hello Carlos! We\'d be happy to work with you. What specific products are you interested in?', timestamp: '2024-01-15 06:30 AM', type: 'text' },
      { id: 'MSG-051', conversationId: 'CONV-010', sender: 'customer', content: 'Can I visit your warehouse?', timestamp: '2024-01-15 06:35 AM', type: 'text' },
    ],
  },
];

// ========================
// Categories (for inventory classification)
// ========================

export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  name: string;
  description: string;
  parentCategory: string | null;
  productCount: number;
  status: CategoryStatus;
  createdAt: string;
}

export const categories: Category[] = [
  { id: 'CAT-001', name: 'Electronics', description: 'Electronic devices, gadgets, and components', parentCategory: null, productCount: 11, status: 'active', createdAt: '2023-01-15' },
  { id: 'CAT-002', name: 'Accessories', description: 'Phone cases, chargers, adapters, and peripherals', parentCategory: 'Electronics', productCount: 3, status: 'active', createdAt: '2023-02-10' },
  { id: 'CAT-003', name: 'Home', description: 'Home appliances, furniture, and decor', parentCategory: null, productCount: 1, status: 'active', createdAt: '2023-03-05' },
  { id: 'CAT-004', name: 'Food & Beverage', description: 'Consumable goods, snacks, and drinks', parentCategory: null, productCount: 0, status: 'active', createdAt: '2023-04-20' },
  { id: 'CAT-005', name: 'Clothing', description: 'Apparel, footwear, and fashion items', parentCategory: null, productCount: 0, status: 'active', createdAt: '2023-05-12' },
  { id: 'CAT-006', name: 'Audio', description: 'Headphones, speakers, and microphones', parentCategory: 'Electronics', productCount: 4, status: 'active', createdAt: '2023-06-08' },
  { id: 'CAT-007', name: 'Computer Parts', description: 'Keyboards, mice, monitors, and internal components', parentCategory: 'Electronics', productCount: 5, status: 'active', createdAt: '2023-07-22' },
  { id: 'CAT-008', name: 'Mobile', description: 'Smartphones, tablets, and mobile accessories', parentCategory: 'Electronics', productCount: 2, status: 'active', createdAt: '2023-08-15' },
  { id: 'CAT-009', name: 'Sports & Outdoors', description: 'Exercise equipment and outdoor gear', parentCategory: null, productCount: 0, status: 'inactive', createdAt: '2023-09-01' },
  { id: 'CAT-010', name: 'Office Supplies', description: 'Stationery, paper, and desk accessories', parentCategory: null, productCount: 0, status: 'active', createdAt: '2023-10-18' },
];

// ========================
// Warehouses (storage locations)
// ========================

export type WarehouseStatus = 'active' | 'inactive' | 'maintenance';
export type WarehouseType = 'main' | 'regional' | 'fulfillment' | 'cold_storage';

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  type: WarehouseType;
  status: WarehouseStatus;
  capacity: number;
  utilized: number;
  manager: string;
  contactPhone: string;
  createdAt: string;
}

export const warehouses: Warehouse[] = [
  { id: 'WH-001', name: 'Warehouse A', address: '123 Commerce Blvd, Suite 100', city: 'New York', type: 'main', status: 'active', capacity: 5000, utilized: 3450, manager: 'James Wilson', contactPhone: '+1 (555) 123-4567', createdAt: '2022-06-15' },
  { id: 'WH-002', name: 'Warehouse B', address: '456 Industrial Park Dr', city: 'Los Angeles', type: 'regional', status: 'active', capacity: 3500, utilized: 2180, manager: 'Maria Garcia', contactPhone: '+1 (555) 234-5678', createdAt: '2022-09-20' },
  { id: 'WH-003', name: 'Warehouse C', address: '789 Logistics Way', city: 'Chicago', type: 'fulfillment', status: 'active', capacity: 2500, utilized: 1450, manager: 'David Chen', contactPhone: '+1 (555) 345-6789', createdAt: '2023-01-10' },
  { id: 'WH-004', name: 'Cold Storage Unit D', address: '321 Freeze Point Rd', city: 'Houston', type: 'cold_storage', status: 'active', capacity: 1200, utilized: 890, manager: 'Sarah Kim', contactPhone: '+1 (555) 456-7890', createdAt: '2023-04-05' },
  { id: 'WH-005', name: 'Warehouse E', address: '654 Harbor View Ln', city: 'San Francisco', type: 'regional', status: 'maintenance', capacity: 2000, utilized: 0, manager: 'Robert Martinez', contactPhone: '+1 (555) 567-8901', createdAt: '2023-07-18' },
  { id: 'WH-006', name: 'Warehouse F', address: '987 Distribution Ave', city: 'Seattle', type: 'fulfillment', status: 'inactive', capacity: 1800, utilized: 0, manager: 'Emily Taylor', contactPhone: '+1 (555) 678-9012', createdAt: '2023-11-01' },
];
