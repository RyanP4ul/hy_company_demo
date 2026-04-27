-- ============================================================================
-- HyOps — Seed Data
-- Populate all tables with the same data used by the frontend mock data.
-- Run AFTER schema.sql
-- ============================================================================

-- ============================================================================
-- 1. WAREHOUSES
-- ============================================================================
INSERT INTO warehouses (id, name, address) VALUES
    ('WH-A', 'Warehouse A', '100 Industrial Blvd, New York, NY 10001'),
    ('WH-B', 'Warehouse B', '200 Commerce Park, Los Angeles, CA 90001'),
    ('WH-C', 'Warehouse C', '300 Logistics Way, Chicago, IL 60601');

-- ============================================================================
-- 2. INVENTORY CATEGORIES
-- ============================================================================
INSERT INTO inventory_categories (id, name) VALUES
    ('CAT-ELEC', 'Electronics'),
    ('CAT-ACC',  'Accessories'),
    ('CAT-HOME', 'Home');

-- ============================================================================
-- 3. ROLES
-- ============================================================================
INSERT INTO roles (id, name, description) VALUES
    ('admin',   'Admin',   'Full access to all system features and settings.'),
    ('manager', 'Manager', 'Access to manage inventory, orders, and deliveries.'),
    ('staff',   'Staff',   'Access to view and manage inventory and orders.'),
    ('driver',  'Driver',  'Access to view assigned deliveries and update status.'),
    ('viewer',  'Viewer',  'Read-only access to view data and reports.');

-- ============================================================================
-- 4. PERMISSIONS
-- ============================================================================
INSERT INTO permissions (id, label, category) VALUES
    -- Inventory
    ('inv-view',    'View inventory items',     'Inventory'),
    ('inv-create',  'Create inventory items',   'Inventory'),
    ('inv-edit',    'Edit inventory items',     'Inventory'),
    ('inv-delete',  'Delete inventory items',   'Inventory'),
    ('inv-export',  'Export inventory data',    'Inventory'),
    -- Orders
    ('ord-view',    'View orders',              'Orders'),
    ('ord-create',  'Create orders',            'Orders'),
    ('ord-edit',    'Edit orders',              'Orders'),
    ('ord-cancel',  'Cancel orders',            'Orders'),
    -- Deliveries
    ('del-view',    'View deliveries',          'Deliveries'),
    ('del-assign',  'Assign deliveries',        'Deliveries'),
    ('del-reschedule', 'Reschedule deliveries', 'Deliveries'),
    -- Users
    ('usr-view',    'View users',               'Users'),
    ('usr-create',  'Create users',             'Users'),
    ('usr-edit',    'Edit users',               'Users'),
    ('usr-delete',  'Delete users',             'Users'),
    -- Reports
    ('rep-view',    'View reports',             'Reports'),
    ('rep-create',  'Generate reports',         'Reports'),
    ('rep-export',  'Export reports',           'Reports'),
    -- Settings
    ('set-view',    'View settings',            'Settings'),
    ('set-edit',    'Edit settings',            'Settings'),
    ('set-integrations', 'Manage integrations', 'Settings');

-- ============================================================================
-- 5. ROLE PERMISSIONS
-- ============================================================================

-- Admin: ALL permissions enabled
INSERT INTO role_permissions (role_id, permission_id, enabled) VALUES
    ('admin', 'inv-view',    TRUE),
    ('admin', 'inv-create',  TRUE),
    ('admin', 'inv-edit',    TRUE),
    ('admin', 'inv-delete',  TRUE),
    ('admin', 'inv-export',  TRUE),
    ('admin', 'ord-view',    TRUE),
    ('admin', 'ord-create',  TRUE),
    ('admin', 'ord-edit',    TRUE),
    ('admin', 'ord-cancel',  TRUE),
    ('admin', 'del-view',    TRUE),
    ('admin', 'del-assign',  TRUE),
    ('admin', 'del-reschedule', TRUE),
    ('admin', 'usr-view',    TRUE),
    ('admin', 'usr-create',  TRUE),
    ('admin', 'usr-edit',    TRUE),
    ('admin', 'usr-delete',  TRUE),
    ('admin', 'rep-view',    TRUE),
    ('admin', 'rep-create',  TRUE),
    ('admin', 'rep-export',  TRUE),
    ('admin', 'set-view',    TRUE),
    ('admin', 'set-edit',    TRUE),
    ('admin', 'set-integrations', TRUE);

-- Manager: Most permissions, no delete users, no edit settings
INSERT INTO role_permissions (role_id, permission_id, enabled) VALUES
    ('manager', 'inv-view',    TRUE),
    ('manager', 'inv-create',  TRUE),
    ('manager', 'inv-edit',    TRUE),
    ('manager', 'inv-delete',  FALSE),
    ('manager', 'inv-export',  TRUE),
    ('manager', 'ord-view',    TRUE),
    ('manager', 'ord-create',  TRUE),
    ('manager', 'ord-edit',    TRUE),
    ('manager', 'ord-cancel',  TRUE),
    ('manager', 'del-view',    TRUE),
    ('manager', 'del-assign',  TRUE),
    ('manager', 'del-reschedule', TRUE),
    ('manager', 'usr-view',    TRUE),
    ('manager', 'usr-create',  FALSE),
    ('manager', 'usr-edit',    FALSE),
    ('manager', 'usr-delete',  FALSE),
    ('manager', 'rep-view',    TRUE),
    ('manager', 'rep-create',  TRUE),
    ('manager', 'rep-export',  TRUE),
    ('manager', 'set-view',    TRUE),
    ('manager', 'set-edit',    FALSE),
    ('manager', 'set-integrations', FALSE);

-- Staff: View/create inventory & orders, limited others
INSERT INTO role_permissions (role_id, permission_id, enabled) VALUES
    ('staff', 'inv-view',    TRUE),
    ('staff', 'inv-create',  TRUE),
    ('staff', 'inv-edit',    TRUE),
    ('staff', 'inv-delete',  FALSE),
    ('staff', 'inv-export',  FALSE),
    ('staff', 'ord-view',    TRUE),
    ('staff', 'ord-create',  TRUE),
    ('staff', 'ord-edit',    TRUE),
    ('staff', 'ord-cancel',  FALSE),
    ('staff', 'del-view',    TRUE),
    ('staff', 'del-assign',  FALSE),
    ('staff', 'del-reschedule', FALSE),
    ('staff', 'usr-view',    TRUE),
    ('staff', 'usr-create',  FALSE),
    ('staff', 'usr-edit',    FALSE),
    ('staff', 'usr-delete',  FALSE),
    ('staff', 'rep-view',    TRUE),
    ('staff', 'rep-create',  FALSE),
    ('staff', 'rep-export',  FALSE),
    ('staff', 'set-view',    TRUE),
    ('staff', 'set-edit',    FALSE),
    ('staff', 'set-integrations', FALSE);

-- Driver: Only delivery-related permissions
INSERT INTO role_permissions (role_id, permission_id, enabled) VALUES
    ('driver', 'del-view',    TRUE),
    ('driver', 'del-assign',  FALSE),
    ('driver', 'del-reschedule', FALSE);

-- Viewer: Read-only access
INSERT INTO role_permissions (role_id, permission_id, enabled) VALUES
    ('viewer', 'inv-view',    TRUE),
    ('viewer', 'ord-view',    TRUE),
    ('viewer', 'del-view',    TRUE),
    ('viewer', 'usr-view',    TRUE),
    ('viewer', 'rep-view',    TRUE),
    ('viewer', 'set-view',    TRUE);

-- ============================================================================
-- 6. USERS
-- ============================================================================
INSERT INTO users (id, name, email, password, role_id, status, last_active) VALUES
    ('USR-001', 'Alex Johnson',    'alex@company.com',    '$2b$10$placeholder_hash_1', 'admin',   'active',   NOW()),
    ('USR-002', 'Sarah Miller',    'sarah@company.com',   '$2b$10$placeholder_hash_2', 'staff',   'active',   NOW() - INTERVAL '5 minutes'),
    ('USR-003', 'James Wilson',    'james@company.com',   '$2b$10$placeholder_hash_3', 'driver',  'active',   NOW() - INTERVAL '1 hour'),
    ('USR-004', 'Maria Garcia',    'maria@company.com',   '$2b$10$placeholder_hash_4', 'driver',  'active',   NOW() - INTERVAL '30 minutes'),
    ('USR-005', 'David Chen',      'david@company.com',   '$2b$10$placeholder_hash_5', 'staff',   'active',   NOW() - INTERVAL '2 hours'),
    ('USR-006', 'Emily Taylor',    'emily@company.com',   '$2b$10$placeholder_hash_6', 'manager', 'active',   NOW() - INTERVAL '4 hours'),
    ('USR-007', 'Michael Brown',   'michael@company.com', '$2b$10$placeholder_hash_7', 'staff',   'inactive', NOW() - INTERVAL '3 days'),
    ('USR-008', 'Lisa Wang',       'lisa@company.com',    '$2b$10$placeholder_hash_8', 'staff',   'active',   NOW() - INTERVAL '1 day');

-- ============================================================================
-- 7. CUSTOMERS
-- ============================================================================
INSERT INTO customers (id, name, contact_number, company, address, total_orders, total_spent, status, join_date, last_order_date) VALUES
    ('CST-001', 'Acme Corp',         '+1 (555) 100-2001', 'Acme Corporation',        '123 Business Ave, New York, NY 10001',        47, 68450.00, 'active',   '2023-03-15', '2024-01-15'),
    ('CST-002', 'Global Trade Ltd',   '+1 (555) 200-3002', 'Global Trade Ltd',        '456 Commerce Blvd, Los Angeles, CA 90001',     38, 52300.00, 'active',   '2023-05-22', '2024-01-14'),
    ('CST-003', 'TechStart Inc',      '+1 (555) 300-4003', 'TechStart Inc',           '789 Innovation Dr, San Francisco, CA 94102',   32, 45100.00, 'active',   '2023-06-10', '2024-01-15'),
    ('CST-004', 'John Mitchell',      '+1 (555) 400-5004', '',                        '321 Oak Street, Chicago, IL 60601',             28, 38700.00, 'active',   '2023-07-01', '2024-01-12'),
    ('CST-005', 'Prime Logistics',    '+1 (555) 500-6005', 'Prime Logistics LLC',     '987 Trade St, Houston, TX 77001',               24, 33200.00, 'active',   '2023-08-18', '2024-01-12'),
    ('CST-006', 'Sarah Williams',     '+1 (555) 600-7006', '',                        '654 Maple Ave, Phoenix, AZ 85001',              19, 24600.00, 'active',   '2023-09-05', '2024-01-10'),
    ('CST-007', 'Metro Supply Co',    '+1 (555) 700-8007', 'Metro Supply Co',         '147 Pine Road, Philadelphia, PA 19101',         15, 19800.00, 'active',   '2023-10-12', '2024-01-14'),
    ('CST-008', 'Digital Hub',        '+1 (555) 800-9008', 'Digital Hub Solutions',   '258 Cedar Lane, San Antonio, TX 78201',         12, 16400.00, 'active',   '2023-11-01', '2024-01-13'),
    ('CST-009', 'Atlas Trading',      '+1 (555) 900-1009', 'Atlas Trading Group',     '369 Elm Street, San Diego, CA 92101',           10, 12300.00, 'active',   '2023-11-20', '2024-01-11'),
    ('CST-010', 'Pinnacle Goods',     '+1 (555) 100-2010', 'Pinnacle Goods Inc',      '480 Birch Blvd, Dallas, TX 75201',             8,  9700.00, 'active',   '2023-12-05', '2024-01-11'),
    ('CST-011', 'Swift Retail',       '+1 (555) 200-3011', 'Swift Retail Partners',   '591 Walnut Dr, San Jose, CA 95101',             5,  6200.00, 'inactive', '2023-12-15', '2024-01-13'),
    ('CST-012', 'Nova Enterprises',   '+1 (555) 300-4012', '',                        '712 Ash Court, Austin, TX 73301',                3,  4100.00, 'active',   '2024-01-02', '2024-01-12');

-- ============================================================================
-- 8. INVENTORY
-- ============================================================================
INSERT INTO inventory (id, name, category_id, price, stock, min_stock, warehouse_id, status, last_updated) VALUES
    ('SKU-001', 'Widget Pro X200',        'CAT-ELEC', 149.99, 5,    10,  'WH-A', 'low_stock',    '2024-01-15'),
    ('SKU-002', 'Smart Sensor V3',        'CAT-ELEC',  89.99, 234,  50,  'WH-A', 'in_stock',     '2024-01-14'),
    ('SKU-003', 'Premium Widget XL',      'CAT-ELEC', 249.99, 67,   20,  'WH-B', 'in_stock',     '2024-01-13'),
    ('SKU-004', 'Basic Connector Kit',    'CAT-ELEC',  29.99, 1024, 200, 'WH-A', 'in_stock',     '2024-01-12'),
    ('SKU-005', 'Eco-Friendly Case',      'CAT-ACC',   39.99, 0,    30,  'WH-B', 'out_of_stock', '2024-01-11'),
    ('SKU-006', 'Wireless Charger Pad',   'CAT-ELEC',  59.99, 189,  40,  'WH-A', 'in_stock',     '2024-01-10'),
    ('SKU-007', 'USB-C Hub Adapter',      'CAT-ACC',   44.99, 456,  100, 'WH-C', 'in_stock',     '2024-01-09'),
    ('SKU-008', 'LED Desk Lamp',          'CAT-HOME',  79.99, 12,   15,  'WH-B', 'low_stock',    '2024-01-08'),
    ('SKU-009', 'Noise Cancelling Buds',  'CAT-ELEC', 129.99, 89,   25,  'WH-A', 'in_stock',     '2024-01-07'),
    ('SKU-010', 'Portable Power Bank',    'CAT-ELEC',  49.99, 567,  100, 'WH-C', 'in_stock',     '2024-01-06'),
    ('SKU-011', 'Bluetooth Speaker Mini', 'CAT-ELEC',  69.99, 3,    20,  'WH-A', 'low_stock',    '2024-01-05'),
    ('SKU-012', 'Webcam HD 1080p',        'CAT-ELEC',  99.99, 0,    30,  'WH-B', 'out_of_stock', '2024-01-04'),
    ('SKU-013', 'Mechanical Keyboard',    'CAT-ELEC', 159.99, 234,  50,  'WH-A', 'in_stock',     '2024-01-03'),
    ('SKU-014', 'Wireless Mouse',         'CAT-ELEC',  69.99, 445,  80,  'WH-C', 'in_stock',     '2024-01-02'),
    ('SKU-015', 'Monitor Stand',          'CAT-ACC',   89.99, 78,   20,  'WH-B', 'in_stock',     '2024-01-01');

-- ============================================================================
-- 9. DRIVERS
-- ============================================================================
INSERT INTO drivers (id, user_id, name, phone, status, vehicle, completed_today, rating, total_deliveries) VALUES
    ('DRV-001', 'USR-003', 'James Wilson',     '+1 (555) 123-4567', 'available',  'Van #1', 8, 4.8, 1247),
    ('DRV-002', 'USR-004', 'Maria Garcia',     '+1 (555) 234-5678', 'on_delivery','Van #2', 6, 4.9, 1102),
    ('DRV-003', 'USR-005', 'David Chen',       '+1 (555) 345-6789', 'on_delivery','Van #3', 5, 4.7,  987),
    ('DRV-004', NULL,       'Sarah Kim',        '+1 (555) 456-7890', 'available',  'Van #4', 7, 4.6,  856),
    ('DRV-005', NULL,       'Robert Martinez',  '+1 (555) 567-8901', 'offline',   'Van #5', 0, 4.5,  734);

-- ============================================================================
-- 10. ORDERS
-- ============================================================================
INSERT INTO orders (id, customer_id, customer_name, item_count, total, status, priority, notes, assigned_driver_id, created_at) VALUES
    ('ORD-2847', 'CST-001', 'Acme Corp',       12, 1847.99, 'pending',    'high',   '',         NULL,     '2024-01-15'),
    ('ORD-2846', 'CST-003', 'TechStart Inc',    5,  749.95, 'processing', 'medium', '',         NULL,     '2024-01-15'),
    ('ORD-2845', 'CST-002', 'Global Trade Ltd', 34, 5199.66, 'shipped',    'high',   '',         'DRV-002', '2024-01-14'),
    ('ORD-2844', 'CST-007', 'Metro Supply Co',  8,  1199.92, 'delivered',  'low',    '',         'DRV-001', '2024-01-14'),
    ('ORD-2843', 'CST-011', 'Swift Retail',     2,  299.98, 'cancelled',  'low',    '',         NULL,     '2024-01-13'),
    ('ORD-2842', 'CST-008', 'Digital Hub',      15, 2249.85, 'processing', 'medium', '',         NULL,     '2024-01-13'),
    ('ORD-2841', 'CST-005', 'Prime Logistics',  22, 3299.78, 'shipped',    'high',   '',         'DRV-003', '2024-01-12'),
    ('ORD-2840', 'CST-012', 'Nova Enterprises', 6,  899.94, 'delivered',  'low',    '',         'DRV-001', '2024-01-12'),
    ('ORD-2839', 'CST-009', 'Atlas Trading',    18, 2699.82, 'pending',    'medium', '',         'DRV-002', '2024-01-11'),
    ('ORD-2838', 'CST-010', 'Pinnacle Goods',   9,  1349.91, 'processing', 'high',   '',         'DRV-004', '2024-01-11');

-- ============================================================================
-- 11. ORDER ITEMS (Sample line items for key orders)
-- ============================================================================
INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price) VALUES
    -- ORD-2847: Acme Corp
    ('OI-001', 'ORD-2847', 'SKU-001', 'Widget Pro X200',       3, 149.99),
    ('OI-002', 'ORD-2847', 'SKU-002', 'Smart Sensor V3',       5,  89.99),
    ('OI-003', 'ORD-2847', 'SKU-006', 'Wireless Charger Pad',  2,  59.99),
    ('OI-004', 'ORD-2847', 'SKU-009', 'Noise Cancelling Buds', 2, 129.99),
    -- ORD-2846: TechStart Inc
    ('OI-005', 'ORD-2846', 'SKU-013', 'Mechanical Keyboard',   3, 159.99),
    ('OI-006', 'ORD-2846', 'SKU-014', 'Wireless Mouse',        2,  69.99),
    -- ORD-2845: Global Trade Ltd
    ('OI-007', 'ORD-2845', 'SKU-004', 'Basic Connector Kit',   10, 29.99),
    ('OI-008', 'ORD-2845', 'SKU-007', 'USB-C Hub Adapter',     15, 44.99),
    ('OI-009', 'ORD-2845', 'SKU-010', 'Portable Power Bank',    9, 49.99),
    -- ORD-2844: Metro Supply Co
    ('OI-010', 'ORD-2844', 'SKU-003', 'Premium Widget XL',     4, 249.99),
    ('OI-011', 'ORD-2844', 'SKU-008', 'LED Desk Lamp',         4,  79.99),
    -- ORD-2841: Prime Logistics
    ('OI-012', 'ORD-2841', 'SKU-002', 'Smart Sensor V3',       8,  89.99),
    ('OI-013', 'ORD-2841', 'SKU-004', 'Basic Connector Kit',   6,  29.99),
    ('OI-014', 'ORD-2841', 'SKU-013', 'Mechanical Keyboard',   8, 159.99);

-- ============================================================================
-- 12. DELIVERIES
-- ============================================================================
INSERT INTO deliveries (id, order_id, driver_id, destination, status, eta, progress, started_at, completed_at) VALUES
    ('DEL-1092', 'ORD-2844', 'DRV-001', 'Metro Supply Co, 123 Business Ave',         'delivered',  'Delivered',        100, '2024-01-14 08:30:00', '2024-01-14 14:20:00'),
    ('DEL-1091', 'ORD-2845', 'DRV-002', 'Global Trade Ltd, 456 Commerce Blvd',       'in_transit', '2 hours',          65,  '2024-01-14 10:00:00', NULL),
    ('DEL-1090', 'ORD-2841', 'DRV-003', 'Prime Logistics, 789 Trade St',             'in_transit', '4 hours',          35,  '2024-01-14 11:30:00', NULL),
    ('DEL-1089', 'ORD-2840', 'DRV-001', 'Nova Enterprises, 321 Innovation Dr',       'delivered',  'Delivered',        100, '2024-01-13 09:00:00', '2024-01-13 16:45:00'),
    ('DEL-1088', 'ORD-2838', 'DRV-004', 'Pinnacle Goods, 654 Market Ln',             'pending',    'Tomorrow 09:00',    0,   NULL,                   NULL),
    ('DEL-1087', 'ORD-2839', 'DRV-002', 'Atlas Trading, 987 Export Way',             'pending',    'Tomorrow 11:00',    0,   NULL,                   NULL);

-- ============================================================================
-- 13. DELIVERY TIMELINE (for DEL-1092 — completed delivery)
-- ============================================================================
INSERT INTO delivery_timeline (delivery_id, step_name, step_time, completed, sort_order) VALUES
    ('DEL-1092', 'Order Confirmed', '09:00 AM', TRUE,  1),
    ('DEL-1092', 'Picked Up',      '09:45 AM', TRUE,  2),
    ('DEL-1092', 'In Transit',     '10:30 AM', TRUE,  3),
    ('DEL-1092', 'Out for Delivery','01:00 PM', TRUE,  4),
    ('DEL-1092', 'Delivered',      '02:20 PM', TRUE,  5);

-- Timeline for DEL-1091 — in progress
INSERT INTO delivery_timeline (delivery_id, step_name, step_time, completed, sort_order) VALUES
    ('DEL-1091', 'Order Confirmed', '09:00 AM', TRUE,  1),
    ('DEL-1091', 'Picked Up',      '09:30 AM', TRUE,  2),
    ('DEL-1091', 'In Transit',     '10:00 AM', TRUE,  3),
    ('DEL-1091', 'Out for Delivery','--:--',    FALSE, 4),
    ('DEL-1091', 'Delivered',      '--:--',    FALSE, 5);

-- ============================================================================
-- 14. NOTIFICATIONS
-- ============================================================================
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
    ('USR-001', 'Low Stock Alert',      'Widget Pro X200 is running low on stock (5 units remaining)',          'warning', FALSE, NOW() - INTERVAL '2 minutes'),
    ('USR-001', 'New Order Received',    'Order #ORD-2847 has been placed by Acme Corp',                        'info',    FALSE, NOW() - INTERVAL '15 minutes'),
    ('USR-001', 'Delivery Completed',    'Delivery #DEL-1092 has been successfully delivered',                  'success', FALSE, NOW() - INTERVAL '1 hour'),
    ('USR-001', 'Payment Failed',        'Invoice #INV-4521 payment processing failed',                         'error',   TRUE,  NOW() - INTERVAL '3 hours'),
    ('USR-001', 'New User Registered',   'Sarah Miller has been added as a staff member',                       'info',    TRUE,  NOW() - INTERVAL '5 hours');

-- ============================================================================
-- 15. AUDIT LOGS
-- ============================================================================
INSERT INTO audit_logs (id, user_name, action, resource, resource_id, details, ip_address, created_at) VALUES
    ('LOG-001', 'Alex Johnson', 'UPDATE', 'Product',   'SKU-002', '{"field": "price", "old": "79.99", "new": "89.99"}',           '192.168.1.100', '2024-01-15 10:30:22'),
    ('LOG-002', 'Alex Johnson', 'CREATE', 'Order',     'ORD-2847', '{"customer": "Acme Corp", "items": 12, "total": "$1,847.99"}',  '192.168.1.100', '2024-01-15 10:28:15'),
    ('LOG-003', 'System',       'ALERT',  'Inventory', 'SKU-001', '{"alert": "Low Stock", "current": 5, "minimum": 10}',           'system',        '2024-01-15 10:25:00'),
    ('LOG-004', 'Sarah Miller', 'UPDATE', 'Delivery',  'DEL-1091', '{"field": "status", "old": "pending", "new": "in_transit"}',    '192.168.1.105', '2024-01-15 10:00:00'),
    ('LOG-005', 'Emily Taylor', 'DELETE', 'User',      'USR-010', '{"reason": "Account terminated", "user": "John Doe"}',           '192.168.1.108', '2024-01-15 09:45:30'),
    ('LOG-006', 'James Wilson', 'UPDATE', 'Delivery',  'DEL-1092', '{"field": "status", "old": "in_transit", "new": "delivered"}',  'mobile',        '2024-01-15 09:30:00');

-- ============================================================================
-- 16. ACTIVITY TIMELINE
-- ============================================================================
INSERT INTO activity_timeline (user_name, action, target, target_type, created_at) VALUES
    ('Alex Johnson',   'created order',     'ORD-2847',                  'order',     NOW() - INTERVAL '2 minutes'),
    ('System',         'alert: low stock',  'Widget Pro X200',           'alert',     NOW() - INTERVAL '5 minutes'),
    ('Maria Garcia',   'started delivery',  'DEL-1091',                  'delivery',  NOW() - INTERVAL '30 minutes'),
    ('James Wilson',   'completed delivery','DEL-1092',                  'delivery',  NOW() - INTERVAL '1 hour'),
    ('Alex Johnson',   'updated inventory', 'Smart Sensor V3',           'inventory', NOW() - INTERVAL '2 hours'),
    ('System',         'new user registered','Sarah Miller',             'user',      NOW() - INTERVAL '3 hours'),
    ('David Chen',     'accepted delivery', 'DEL-1090',                  'delivery',  NOW() - INTERVAL '4 hours'),
    ('System',         'payment received',  'INV-4520 ($2,450)',         'payment',   NOW() - INTERVAL '5 hours');

-- ============================================================================
-- 17. SETTINGS (App configuration)
-- ============================================================================
INSERT INTO settings (key, value, description) VALUES
    ('company_name',        'HyOps',                        'Company name displayed in the app'),
    ('timezone',            'America/New_York',            'Default timezone'),
    ('currency',            'USD',                         'Default currency code'),
    ('date_format',         'YYYY-MM-DD',                  'Default date format'),
    ('low_stock_threshold', '10',                          'Global minimum stock alert threshold'),
    ('delivery_eta_buffer', '30',                          'Minutes buffer added to ETA estimates'),
    ('notification_email',  'notifications@cloudinv.com',  'System notification email'),
    ('max_orders_per_page', '10',                          'Pagination: orders per page'),
    ('max_items_per_page',  '15',                          'Pagination: inventory items per page'),
    ('theme_default',       'light',                       'Default UI theme'),
    ('language',            'en',                          'Default language code (en=English, tl=Filipino, zh=Chinese)');
