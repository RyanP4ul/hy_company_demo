-- ============================================================================
-- HyOps — Seed Data
-- Populate all tables with the same data used by the frontend mock data.
-- Run AFTER schema.sql
-- ============================================================================

-- ============================================================================
-- 1. WAREHOUSES
-- ============================================================================
INSERT INTO warehouses (id, name, address, city, type, status, utilized, manager, contact_phone, created_at) VALUES
    ('WH-001', 'Warehouse A',          '100 Industrial Blvd, Makati City',      'Makati City',      'main',         'active',      2847, 'Alex Johnson',    '+1 (555) 100-0001', '2023-01-15'),
    ('WH-002', 'Warehouse B',          '200 Commerce Park, BGC Taguig',         'Taguig City',      'regional',     'active',      1653, 'Sarah Miller',    '+1 (555) 200-0002', '2023-03-20'),
    ('WH-003', 'Warehouse C',          '300 Logistics Way, Muntinlupa City',    'Muntinlupa City',  'fulfillment',  'active',       987, 'Emily Taylor',    '+1 (555) 300-0003', '2023-06-10'),
    ('WH-004', 'Cold Storage Unit 1',  '400 Cold Chain Ave, Pasay City',        'Pasay City',       'cold_storage', 'maintenance',   234, 'David Chen',      '+1 (555) 400-0004', '2023-09-01'),
    ('WH-005', 'Warehouse D',          '500 Distribution Hub, Quezon City',     'Quezon City',      'regional',     'active',      1456, 'Lisa Wang',       '+1 (555) 500-0005', '2023-11-15'),
    ('WH-006', 'Warehouse E',          '600 Supply Chain Rd, Caloocan City',    'Caloocan City',    'main',         'active',      3210, 'Michael Brown',   '+1 (555) 600-0006', '2024-01-02');

-- ============================================================================
-- 2. USERS
-- ============================================================================
INSERT INTO users (id, name, email, password, role, status, last_active) VALUES
    ('USR-001', 'Alex Johnson',    'alex@company.com',    '$2b$10$placeholder_hash_1', 'Admin', 'active',   NOW()),
    ('USR-002', 'Sarah Miller',    'sarah@company.com',   '$2b$10$placeholder_hash_2', 'Staff', 'active',   NOW() - INTERVAL '5 minutes'),
    ('USR-003', 'James Wilson',    'james@company.com',   '$2b$10$placeholder_hash_3', 'Staff', 'active',   NOW() - INTERVAL '1 hour'),
    ('USR-004', 'Maria Garcia',    'maria@company.com',   '$2b$10$placeholder_hash_4', 'Staff', 'active',   NOW() - INTERVAL '30 minutes'),
    ('USR-005', 'David Chen',      'david@company.com',   '$2b$10$placeholder_hash_5', 'Staff', 'active',   NOW() - INTERVAL '2 hours'),
    ('USR-006', 'Emily Taylor',    'emily@company.com',   '$2b$10$placeholder_hash_6', 'Admin', 'active',   NOW() - INTERVAL '4 hours'),
    ('USR-007', 'Michael Brown',   'michael@company.com', '$2b$10$placeholder_hash_7', 'Staff', 'inactive', NOW() - INTERVAL '3 days'),
    ('USR-008', 'Lisa Wang',       'lisa@company.com',    '$2b$10$placeholder_hash_8', 'Staff', 'active',   NOW() - INTERVAL '1 day');

-- ============================================================================
-- 3. CUSTOMERS
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
-- 4. INVENTORY
-- ============================================================================
INSERT INTO inventory (id, name, warehouse_id, last_updated) VALUES
    ('SKU-001', 'Tarpaulin', 'WH-001', '2024-01-15'),
    ('SKU-002', 'Linoleum',  'WH-002', '2024-01-14'),
    ('SKU-003', 'Sakolin',   'WH-003', '2024-01-13');

-- ============================================================================
-- 4b. PRODUCT TYPES
-- ============================================================================
INSERT INTO product_types (id, product_id, name, stock, min_stock, price) VALUES
    -- SKU-001: Tarpaulin
    ('T-001', 'SKU-001', 'C1',  150, 50, 100),
    ('T-002', 'SKU-001', 'S4',  200, 50, 200),
    ('T-003', 'SKU-001', 'S2',  180, 50, 300),
    ('T-004', 'SKU-001', 'A2',   75, 30, 400),
    -- SKU-002: Linoleum
    ('T-005', 'SKU-002', 'Kilo 17', 120, 30, 100),
    ('T-006', 'SKU-002', '20',       95, 30, 200),
    ('T-007', 'SKU-002', '28',        0, 20, 300),
    ('T-008', 'SKU-002', '32',       85, 25, 400),
    ('T-009', 'SKU-002', '36',       60, 20, 500),
    ('T-010', 'SKU-002', '40',        0, 15, 600),
    ('T-011', 'SKU-002', '52',       45, 15, 700),
    ('T-012', 'SKU-002', '60',       30, 10, 800),
    -- SKU-003: Sakolin
    ('T-013', 'SKU-003', '.32mm', 200, 40, 100),
    ('T-014', 'SKU-003', '.35mm', 170, 40, 200),
    ('T-015', 'SKU-003', '.40mm', 130, 30, 300),
    ('T-016', 'SKU-003', '.45mm',  50, 25, 400),
    ('T-017', 'SKU-003', '1mm',     0, 20, 500);

-- ============================================================================
-- 5. DRIVERS
-- ============================================================================
INSERT INTO drivers (id, user_id, name, phone, status, vehicle, completed_today, rating, total_deliveries) VALUES
    ('DRV-001', 'USR-003', 'James Wilson',     '+1 (555) 123-4567', 'available',  'Van #1', 8, 4.8, 1247),
    ('DRV-002', 'USR-004', 'Maria Garcia',     '+1 (555) 234-5678', 'on_delivery','Van #2', 6, 4.9, 1102),
    ('DRV-003', 'USR-005', 'David Chen',       '+1 (555) 345-6789', 'on_delivery','Van #3', 5, 4.7,  987),
    ('DRV-004', NULL,       'Sarah Kim',        '+1 (555) 456-7890', 'available',  'Van #4', 7, 4.6,  856),
    ('DRV-005', NULL,       'Robert Martinez',  '+1 (555) 567-8901', 'offline',   'Van #5', 0, 4.5,  734);

-- ============================================================================
-- 6. ORDERS
-- ============================================================================
INSERT INTO orders (id, customer_id, customer_name, item_count, total, status, priority, notes, payment_status, delivery_type, created_at) VALUES
    ('ORD-2847', 'CST-001', 'Acme Corp',        12, 1847.99, 'pending',    'high',   '',                         'paid',   'truck',    '2024-01-15'),
    ('ORD-2846', 'CST-003', 'TechStart Inc',     5,  749.95, 'processing', 'medium', '',                         'unpaid', 'lalamove', '2024-01-15'),
    ('ORD-2845', 'CST-002', 'Global Trade Ltd',  34, 5199.66, 'shipped',    'high',   '',                         'paid',   'truck',    '2024-01-14'),
    ('ORD-2844', 'CST-007', 'Metro Supply Co',   8, 1199.92, 'delivered',  'low',    '',                         'paid',   'lalamove', '2024-01-14'),
    ('ORD-2843', 'CST-011', 'Swift Retail',      2,  299.98, 'cancelled',  'low',    '',                         'unpaid', 'truck',    '2024-01-13'),
    ('ORD-2842', 'CST-008', 'Digital Hub',       15, 2249.85, 'processing', 'medium', '',                         'paid',   'truck',    '2024-01-13'),
    ('ORD-2841', 'CST-005', 'Prime Logistics',   22, 3299.78, 'shipped',    'high',   '',                         'unpaid', 'truck',    '2024-01-12'),
    ('ORD-2840', 'CST-012', 'Nova Enterprises',  6,  899.94, 'delivered',  'low',    '',                         'paid',   'lalamove', '2024-01-12'),
    ('ORD-2839', 'CST-009', 'Atlas Trading',     18, 2699.82, 'pending',    'medium', '',                         'unpaid', 'truck',    '2024-01-11'),
    ('ORD-2838', 'CST-010', 'Pinnacle Goods',    9, 1349.91, 'processing', 'high',   '',                         'paid',   'lalamove', '2024-01-11');

-- ============================================================================
-- 7. ORDER ITEMS (Sample line items for key orders)
-- ============================================================================
INSERT INTO order_items (id, order_id, product_id, product_name, type_id, type_name, quantity, unit_price) VALUES
    -- ORD-2847: Acme Corp
    ('OI-001', 'ORD-2847', 'SKU-001', 'Tarpaulin',  'T-004', 'A2',     3, 400),
    ('OI-002', 'ORD-2847', 'SKU-002', 'Linoleum',   'T-008', '32',     4, 400),
    -- ORD-2846: TechStart Inc
    ('OI-003', 'ORD-2846', 'SKU-003', 'Sakolin',    'T-014', '.35mm',  5, 200),
    -- ORD-2845: Global Trade Ltd
    ('OI-004', 'ORD-2845', 'SKU-001', 'Tarpaulin',  'T-002', 'S4',    10, 200),
    ('OI-005', 'ORD-2845', 'SKU-002', 'Linoleum',   'T-009', '36',    14, 500),
    ('OI-006', 'ORD-2845', 'SKU-003', 'Sakolin',    'T-015', '.40mm', 10, 300),
    -- ORD-2844: Metro Supply Co
    ('OI-007', 'ORD-2844', 'SKU-001', 'Tarpaulin',  'T-003', 'S2',     4, 300),
    ('OI-008', 'ORD-2844', 'SKU-002', 'Linoleum',   'T-006', '20',     4, 200),
    -- ORD-2841: Prime Logistics
    ('OI-009', 'ORD-2841', 'SKU-002', 'Linoleum',   'T-008', '32',     8, 400),
    ('OI-010', 'ORD-2841', 'SKU-001', 'Tarpaulin',  'T-004', 'A2',     4, 400),
    ('OI-011', 'ORD-2841', 'SKU-003', 'Sakolin',    'T-013', '.32mm', 10, 100);

-- ============================================================================
-- 8. DELIVERIES (Multi-stop model)
-- ============================================================================
INSERT INTO deliveries (id, driver_id, status, origin_lat, origin_lng, current_stop_index, total_distance, total_orders, total_value, started_at, completed_at, cancelled_at, cancel_reason, scheduled_date, scheduled_time, rescheduled_date, rescheduled_time, reschedule_reason) VALUES
    ('DEL-1092', 'DRV-001', 'delivered',  14.5995, 120.9842, 3, 42.5,  3, 6547.58,  '2024-01-14 08:00:00', '2024-01-14 15:20:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('DEL-1091', 'DRV-002', 'in_transit', 14.6090, 120.9820, 1, 38.7,  4, 10097.29, '2024-01-15 08:30:00', NULL,                   NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('DEL-1090', 'DRV-003', 'in_transit', 14.5378, 121.0014, 0, 25.4,  3, 4949.67,  '2024-01-15 09:00:00', NULL,                   NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('DEL-1089', 'DRV-004', 'pending',    14.5547, 121.0244, 0, 31.6,  3, 6349.39,  NULL,                   NULL,                   NULL, NULL, '2024-01-16', '09:00', NULL, NULL, NULL),
    ('DEL-1088', 'DRV-005', 'delivered',  14.5995, 120.9842, 2, 19.8,  2, 2199.86,  '2024-01-13 07:30:00', '2024-01-13 12:45:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ============================================================================
-- 9. DELIVERY STOPS
-- ============================================================================

-- DEL-1092 stops (4 stops — all delivered)
INSERT INTO delivery_stops (id, delivery_id, stop_index, order_id, customer, address, status, items, total, delivered_at, distance_from_prev, estimated_arrival, notes, lat, lng) VALUES
    ('S-001', 'DEL-1092', 0, 'ORD-2844', 'Metro Supply Co',   '147 Pine Road, Makati City',       'delivered',  8, 1199.92, '2024-01-14 09:15', 12.3, '09:00 AM',  NULL, 14.5547, 121.0244),
    ('S-002', 'DEL-1092', 1, 'ORD-2839', 'Atlas Trading',     '369 Elm Street, BGC Taguig',       'delivered', 18, 2699.82, '2024-01-14 11:30', 15.2, '11:00 AM',  NULL, 14.5176, 121.0509),
    ('S-003', 'DEL-1092', 2, 'ORD-2838', 'Pinnacle Goods',    '480 Birch Blvd, Pasig City',       'delivered',  9, 1349.91, '2024-01-14 14:00', 10.8, '01:30 PM',  NULL, 14.5764, 121.0613),
    ('S-004', 'DEL-1092', 3, 'ORD-2843', 'Swift Retail',      '591 Walnut Dr, Quezon City',      'delivered',  2,  299.98, '2024-01-14 15:10',  4.2, '02:45 PM',  NULL, 14.6488, 121.0509);

-- DEL-1091 stops (4 stops — 1 delivered, 1 in_transit, 2 pending)
INSERT INTO delivery_stops (id, delivery_id, stop_index, order_id, customer, address, status, items, total, delivered_at, distance_from_prev, estimated_arrival, notes, lat, lng) VALUES
    ('S-005', 'DEL-1091', 0, 'ORD-2845', 'Global Trade Ltd', '456 Commerce Blvd, San Juan City',     'delivered',  34, 5199.66, '2024-01-15 10:20', 14.1, '10:00 AM',  NULL,              14.6037, 121.0366),
    ('S-006', 'DEL-1091', 1, 'ORD-2846', 'TechStart Inc',    '789 Innovation Dr, Mandaluyong City', 'in_transit',  5,  749.95, NULL,                 8.5, '12:30 PM',  'Gate code: 4521', 14.5794, 121.0355),
    ('S-007', 'DEL-1091', 2, 'ORD-2841', 'Prime Logistics',  '987 Trade St, Marikina City',         'pending',    22, 3299.78, NULL,                 9.8, '02:00 PM',  NULL,              14.6507, 121.1082),
    ('S-008', 'DEL-1091', 3, 'ORD-2847', 'Acme Corp',        '123 Business Ave, Caloocan City',     'pending',    12, 1847.99, NULL,                 6.3, '03:30 PM',  NULL,              14.6488, 120.9730);

-- DEL-1090 stops (3 stops — 1 in_transit, 2 pending)
INSERT INTO delivery_stops (id, delivery_id, stop_index, order_id, customer, address, status, items, total, delivered_at, distance_from_prev, estimated_arrival, notes, lat, lng) VALUES
    ('S-009', 'DEL-1090', 0, 'ORD-2840', 'Nova Enterprises',     '712 Ash Court, Parañaque City',   'in_transit',  6,  899.94, NULL, 11.2, '10:30 AM',  'Back entrance, ring bell', 14.4793, 121.0198),
    ('S-010', 'DEL-1090', 1, 'ORD-2842', 'Digital Hub',          '258 Cedar Lane, Las Piñas City',  'pending',    15, 2249.85, NULL,  7.8, '12:00 PM',  NULL,                     14.4509, 121.0140),
    ('S-011', 'DEL-1090', 2, 'ORD-2848', 'Summit Electronics',   '445 Oak Ridge Rd, Muntinlupa City','pending',    10, 1799.88, NULL,  6.4, '01:15 PM',  NULL,                     14.4127, 121.0259);

-- DEL-1089 stops (3 stops — all pending)
INSERT INTO delivery_stops (id, delivery_id, stop_index, order_id, customer, address, status, items, total, delivered_at, distance_from_prev, estimated_arrival, notes, lat, lng) VALUES
    ('S-012', 'DEL-1089', 0, 'ORD-2849', 'Pacific Supply',       '888 Harbor Blvd, Navotas City',       'pending', 20, 3299.50, NULL, 13.4, 'Tomorrow 09:30 AM', NULL, 14.6547, 120.9464),
    ('S-013', 'DEL-1089', 1, 'ORD-2850', 'Redwood Distributors', '222 Pinecrest Ave, Malabon City',     'pending',  8, 1549.89, NULL, 10.2, 'Tomorrow 11:15 AM', NULL, 14.6689, 120.9610),
    ('S-014', 'DEL-1089', 2, 'ORD-2851', 'Golden Gate Trading',  '555 Market St, Valenzuela City',      'pending', 14, 1500.00, NULL,  8.0, 'Tomorrow 01:00 PM', NULL, 14.6989, 120.9749);

-- DEL-1088 stops (2 stops — all delivered)
INSERT INTO delivery_stops (id, delivery_id, stop_index, order_id, customer, address, status, items, total, delivered_at, distance_from_prev, estimated_arrival, notes, lat, lng) VALUES
    ('S-015', 'DEL-1088', 0, 'ORD-2835', 'Lakeview Industries', '333 Lakeshore Dr, Manila',   'delivered',  7,  899.94, '2024-01-13 09:00', 10.5, '08:45 AM', NULL, 14.5906, 120.9798),
    ('S-016', 'DEL-1088', 1, 'ORD-2836', 'Mountain Supply Co',  '666 Peak Rd, Manila',        'delivered', 11, 1299.92, '2024-01-13 11:30',  9.3, '11:00 AM', NULL, 14.6042, 120.9914);

-- ============================================================================
-- 10. DELIVERY TIMELINE (for DEL-1092 — completed delivery)
-- ============================================================================
INSERT INTO delivery_timeline (delivery_id, step_name, step_time, completed, sort_order) VALUES
    ('DEL-1092', 'Loaded at Warehouse', '08:00 AM', TRUE,  1),
    ('DEL-1092', 'Departed',           '08:15 AM', TRUE,  2),
    ('DEL-1092', 'Stop 1 Delivered',    '09:15 AM', TRUE,  3),
    ('DEL-1092', 'Stop 2 Delivered',    '11:30 AM', TRUE,  4),
    ('DEL-1092', 'Stop 3 Delivered',    '02:00 PM', TRUE,  5),
    ('DEL-1092', 'Stop 4 Delivered',    '03:10 PM', TRUE,  6),
    ('DEL-1092', 'Route Complete',      '03:20 PM', TRUE,  7);

-- Timeline for DEL-1091 — in progress
INSERT INTO delivery_timeline (delivery_id, step_name, step_time, completed, sort_order) VALUES
    ('DEL-1091', 'Loaded at Warehouse', '08:30 AM', TRUE,  1),
    ('DEL-1091', 'Departed',           '08:30 AM', TRUE,  2),
    ('DEL-1091', 'Stop 1 Delivered',    '10:20 AM', TRUE,  3),
    ('DEL-1091', 'En route to Stop 2',  '10:30 AM', TRUE,  4),
    ('DEL-1091', 'Stop 2 Delivered',    '--:--',    FALSE, 5),
    ('DEL-1091', 'Stop 3 Delivered',    '--:--',    FALSE, 6),
    ('DEL-1091', 'Stop 4 Delivered',    '--:--',    FALSE, 7),
    ('DEL-1091', 'Route Complete',      '--:--',    FALSE, 8);

-- ============================================================================
-- 11. SALES TRANSACTIONS (auto-recorded from delivered orders)
-- ============================================================================
INSERT INTO sales_transactions (id, order_id, customer, items, subtotal, tax, total, payment_method, status, sold_at, recorded_at) VALUES
    ('SAL-1001', 'ORD-2844', 'Metro Supply Co',   8,  1199.92,  95.99,  1295.91, 'gcash', 'completed', '2024-01-14', '2024-01-14 16:32'),
    ('SAL-1000', 'ORD-2840', 'Nova Enterprises',   6,   899.94,  71.99,   971.93, 'visa',  'completed', '2024-01-12', '2024-01-12 11:05'),
    ('SAL-0999', 'ORD-2837', 'Zenith Supplies',    10, 1499.90, 119.99,  1619.89, 'cash',  'completed', '2024-01-11', '2024-01-11 14:48'),
    ('SAL-0998', 'ORD-2835', 'Blue Ocean Ltd',     3,   449.97,  36.00,   485.97, 'gcash', 'refunded',  '2024-01-10', '2024-01-10 09:22'),
    ('SAL-0997', 'ORD-2833', 'Redwood Trading',    20, 2999.80, 239.98,  3239.78, 'visa',  'completed', '2024-01-09', '2024-01-09 17:15'),
    ('SAL-0996', 'ORD-2830', 'Summit Goods',       7,  1049.93,  83.99,  1133.92, 'cash',  'completed', '2024-01-08', '2024-01-08 13:40'),
    ('SAL-0995', 'ORD-2828', 'Acme Corp',          15, 2249.85, 179.99,  2429.84, 'visa',  'completed', '2024-01-07', '2024-01-07 10:55'),
    ('SAL-0994', 'ORD-2826', 'Prime Logistics',     4,   599.96,  48.00,   647.96, 'gcash', 'completed', '2024-01-06', '2024-01-06 15:30'),
    ('SAL-0993', 'ORD-2824', 'TechStart Inc',      11, 1649.89, 131.99,  1781.88, 'cash',  'completed', '2024-01-05', '2024-01-05 12:10'),
    ('SAL-0992', 'ORD-2822', 'Global Trade Ltd',   25, 3749.75, 299.98,  4049.73, 'visa',  'completed', '2024-01-04', '2024-01-04 09:45'),
    ('SAL-0991', 'ORD-2820', 'Metro Supply Co',    2,   299.98,  24.00,   323.98, 'gcash', 'pending',   '2024-01-03', '2024-01-03 16:20'),
    ('SAL-0990', 'ORD-2818', 'Swift Retail',        9, 1349.91, 107.99,  1457.90, 'cash',  'completed', '2024-01-02', '2024-01-02 11:35');

-- ============================================================================
-- 12. INBOX CONVERSATIONS
-- ============================================================================
INSERT INTO inbox_conversations (id, channel, customer_name, customer_phone, customer_type, customer_orders, customer_total_spent, customer_since, status, assigned_to, last_message, last_message_time, unread_count, webhook_event_id) VALUES
    ('CONV-001', 'viber',  'Acme Corp',               '+1 (555) 100-2001',      'regular', 47, 68450.00, '2023-03-15', 'open',     'Sarah Miller', 'Can we get an update on ORD-2847?',          '2 min ago',  3, 'WH-VIB-78231'),
    ('CONV-002', 'wechat', 'Global Trade Ltd',         '+1 (555) 200-3002',      'regular', 38, 52300.00, '2023-05-22', 'open',     'Alex Johnson', '我们的订单已经到港口了吗？',                     '15 min ago', 2, 'WH-WX-45291'),
    ('CONV-003', 'viber',  'TechStart Inc',            '+1 (555) 300-4003',      'regular', 32, 45100.00, '2023-06-10', 'resolved', 'Sarah Miller', 'Great, that works! Thanks for your help.',     '1 hour ago', 0, 'WH-VIB-78235'),
    ('CONV-004', 'wechat', '张伟 (Wei Zhang)',          '+86 138-8888-1001',      'new',      0,     0.00, '2024-01-15', 'open',     NULL,           '请问你们有最低起订量要求吗？',                   '5 min ago',  4, 'WH-WX-45300'),
    ('CONV-005', 'viber',  'Maria Santos',             '+63 917-123-4567',       'new',      0,     0.00, '2024-01-15', 'open',     NULL,           'How much is the Wireless Charger Pad?',         '30 min ago', 2, 'WH-VIB-78240'),
    ('CONV-006', 'wechat', '李明 (Ming Li)',           '+86 139-9999-2002',      'regular', 15, 18500.00, '2023-08-20', 'pending',  'Emily Taylor', '这次的包装有问题，有几个产品损坏了',              '45 min ago', 1, 'WH-WX-45305');

-- ============================================================================
-- 13. INBOX MESSAGES
-- ============================================================================

-- CONV-001 messages (Acme Corp — Viber)
INSERT INTO inbox_messages (id, conversation_id, sender, content, timestamp, message_type) VALUES
    ('MSG-001', 'CONV-001', 'customer', 'Hi, I would like to check the status of our recent order ORD-2847.',                            '2024-01-15 10:15 AM', 'text'),
    ('MSG-002', 'CONV-001', 'agent',    'Hello! Let me check on that for you. Order ORD-2847 is currently pending and being processed.',  '2024-01-15 10:18 AM', 'text'),
    ('MSG-003', 'CONV-001', 'customer', 'Do you have an estimated shipping date? We need these items urgently.',                        '2024-01-15 10:22 AM', 'text'),
    ('MSG-004', 'CONV-001', 'agent',    'The order should be shipped by tomorrow. I will flag it as high priority to expedite.',        '2024-01-15 10:25 AM', 'text'),
    ('MSG-005', 'CONV-001', 'customer', 'That would be great, thank you!',                                                             '2024-01-15 10:26 AM', 'text'),
    ('MSG-006', 'CONV-001', 'customer', 'Also, can we add 5 more units of SKU-002 to this order?',                                     '2024-01-15 10:30 AM', 'text'),
    ('MSG-007', 'CONV-001', 'customer', 'Can we get an update on ORD-2847?',                                                         '2024-01-15 10:35 AM', 'text');

-- CONV-002 messages (Global Trade Ltd — WeChat)
INSERT INTO inbox_messages (id, conversation_id, sender, content, timestamp, message_type) VALUES
    ('MSG-008', 'CONV-002', 'customer', '你好，我们想查询一下订单 ORD-2845 的物流信息',                                            '2024-01-15 09:00 AM', 'text'),
    ('MSG-009', 'CONV-002', 'agent',    '您好！订单 ORD-2845 已发货，正在运输中。预计2小时后到达。',                                 '2024-01-15 09:05 AM', 'text'),
    ('MSG-010', 'CONV-002', 'customer', '好的，谢谢！我们可以跟踪物流吗？',                                                           '2024-01-15 09:10 AM', 'text'),
    ('MSG-011', 'CONV-002', 'agent',    '当然可以！我已经将跟踪链接发送到您的邮箱。',                                                '2024-01-15 09:15 AM', 'text'),
    ('MSG-012', 'CONV-002', 'customer', '我们的订单已经到港口了吗？',                                                                '2024-01-15 10:20 AM', 'text'),
    ('MSG-013', 'CONV-002', 'customer', '我们需要在下周一前收到这批货物',                                                            '2024-01-15 10:22 AM', 'text');

-- CONV-003 messages (TechStart Inc — Viber)
INSERT INTO inbox_messages (id, conversation_id, sender, content, timestamp, message_type) VALUES
    ('MSG-014', 'CONV-003', 'customer', 'We need to place a bulk order for Smart Sensor V3. How many do you have in stock?',             '2024-01-15 08:30 AM', 'text'),
    ('MSG-015', 'CONV-003', 'agent',    'We currently have 234 units of Smart Sensor V3 in stock at Warehouse A. How many do you need?','2024-01-15 08:35 AM', 'text'),
    ('MSG-016', 'CONV-003', 'customer', 'We need 100 units. Can we get a discount for bulk orders?',                                    '2024-01-15 08:40 AM', 'text'),
    ('MSG-017', 'CONV-003', 'agent',    'Absolutely! For 100+ units, we offer a 15% bulk discount. That brings the price from ₱89.99 to ₱76.49 per unit.', '2024-01-15 08:45 AM', 'text'),
    ('MSG-018', 'CONV-003', 'customer', 'Great, that works! Thanks for your help.',                                                    '2024-01-15 09:00 AM', 'text');

-- CONV-004 messages (张伟 — WeChat)
INSERT INTO inbox_messages (id, conversation_id, sender, content, timestamp, message_type) VALUES
    ('MSG-019', 'CONV-004', 'customer', '你好，我是深圳一家贸易公司的采购经理',                                                      '2024-01-15 10:00 AM', 'text'),
    ('MSG-020', 'CONV-004', 'customer', '我们想了解你们的产品目录和价格',                                                            '2024-01-15 10:02 AM', 'text'),
    ('MSG-021', 'CONV-004', 'agent',    '欢迎！我可以为您提供完整的产品目录。请问您对哪类产品感兴趣？',                                  '2024-01-15 10:10 AM', 'text'),
    ('MSG-022', 'CONV-004', 'customer', '主要是电子类产品，特别是传感器和充电设备',                                                    '2024-01-15 10:15 AM', 'text'),
    ('MSG-023', 'CONV-004', 'customer', '请问你们有最低起订量要求吗？',                                                              '2024-01-15 10:30 AM', 'text'),
    ('MSG-024', 'CONV-004', 'customer', '我们首次试单希望从小批量开始',                                                              '2024-01-15 10:32 AM', 'text'),
    ('MSG-025', 'CONV-004', 'customer', '大概50-100件左右',                                                                         '2024-01-15 10:33 AM', 'text'),
    ('MSG-026', 'CONV-004', 'customer', '另外能否提供样品？',                                                                        '2024-01-15 10:35 AM', 'text');

-- CONV-005 messages (Maria Santos — Viber)
INSERT INTO inbox_messages (id, conversation_id, sender, content, timestamp, message_type) VALUES
    ('MSG-027', 'CONV-005', 'customer', 'Hi! I saw your products online. Do you ship to the Philippines?',                              '2024-01-15 09:45 AM', 'text'),
    ('MSG-028', 'CONV-005', 'agent',    'Hello Maria! Yes, we ship internationally including the Philippines. Shipping usually takes 5-7 business days.', '2024-01-15 09:50 AM', 'text'),
    ('MSG-029', 'CONV-005', 'customer', 'That''s great! I''m interested in some electronics accessories.',                                 '2024-01-15 10:00 AM', 'text'),
    ('MSG-030', 'CONV-005', 'customer', 'How much is the Wireless Charger Pad?',                                                       '2024-01-15 10:05 AM', 'text');

-- CONV-006 messages (李明 — WeChat)
INSERT INTO inbox_messages (id, conversation_id, sender, content, timestamp, message_type) VALUES
    ('MSG-031', 'CONV-006', 'customer', '你好，我收到了上次订单，但有一个问题需要反馈',                                              '2024-01-15 09:30 AM', 'text'),
    ('MSG-032', 'CONV-006', 'agent',    '您好李明，很抱歉给您带来不便。请告诉我具体情况，我们会尽快处理。',                              '2024-01-15 09:35 AM', 'text'),
    ('MSG-033', 'CONV-006', 'customer', '这次的包装有问题，有几个产品损坏了',                                                           '2024-01-15 09:40 AM', 'text'),
    ('MSG-034', 'CONV-006', 'customer', '我拍了照片，需要我发给您看吗？',                                                             '2024-01-15 09:50 AM', 'text');

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
    ('LOG-002', 'Alex Johnson', 'CREATE', 'Order',     'ORD-2847', '{"customer": "Acme Corp", "items": 12, "total": "₱1,847.99"}', '192.168.1.100', '2024-01-15 10:28:15'),
    ('LOG-003', 'System',       'ALERT',  'Inventory', 'SKU-001', '{"alert": "Low Stock", "current": 5, "minimum": 10}',           'system',        '2024-01-15 10:25:00'),
    ('LOG-004', 'Sarah Miller', 'UPDATE', 'Delivery',  'DEL-1091', '{"field": "status", "old": "pending", "new": "in_transit"}',    '192.168.1.105', '2024-01-15 10:00:00'),
    ('LOG-005', 'Emily Taylor', 'DELETE', 'User',      'USR-010', '{"reason": "Account terminated", "user": "John Doe"}',           '192.168.1.108', '2024-01-15 09:45:30'),
    ('LOG-006', 'James Wilson', 'UPDATE', 'Delivery',  'DEL-1092', '{"field": "status", "old": "in_transit", "new": "delivered"}',  'mobile',        '2024-01-15 09:30:00');

-- ============================================================================
-- 16. ACTIVITY TIMELINE
-- ============================================================================
INSERT INTO activity_timeline (user_name, action, target, target_type, created_at) VALUES
    ('Alex Johnson',   'created order',      'ORD-2847',                  'order',     NOW() - INTERVAL '2 minutes'),
    ('System',         'alert: low stock',   'Widget Pro X200',           'alert',     NOW() - INTERVAL '5 minutes'),
    ('Maria Garcia',   'started delivery',   'DEL-1091',                  'delivery',  NOW() - INTERVAL '30 minutes'),
    ('James Wilson',   'completed delivery', 'DEL-1092',                  'delivery',  NOW() - INTERVAL '1 hour'),
    ('Alex Johnson',   'updated inventory',  'Smart Sensor V3',           'inventory', NOW() - INTERVAL '2 hours'),
    ('System',         'new user registered','Sarah Miller',              'user',      NOW() - INTERVAL '3 hours'),
    ('David Chen',     'accepted delivery',  'DEL-1090',                  'delivery',  NOW() - INTERVAL '4 hours'),
    ('System',         'payment received',   'INV-4520 (₱2,450)',        'payment',   NOW() - INTERVAL '5 hours');

-- ============================================================================
-- 17. SETTINGS (App configuration)
-- ============================================================================
INSERT INTO settings (key, value, description) VALUES
    ('company_name',        'HyOps',                        'Company name displayed in the app'),
    ('timezone',            'Asia/Manila',                  'Default timezone'),
    ('currency',            'PHP',                         'Default currency code'),
    ('date_format',         'YYYY-MM-DD',                  'Default date format'),
    ('low_stock_threshold', '10',                          'Global minimum stock alert threshold'),
    ('delivery_eta_buffer', '30',                          'Minutes buffer added to ETA estimates'),
    ('notification_email',  'notifications@hyops.com',     'System notification email'),
    ('company_email',       'info@hyops.com',              'Public-facing company email'),
    ('max_orders_per_page', '10',                          'Pagination: orders per page'),
    ('max_items_per_page',  '15',                          'Pagination: inventory items per page'),
    ('theme_default',       'light',                       'Default UI theme'),
    ('language',            'en',                          'Default language code (en=English, tl=Filipino, zh=Chinese)');
