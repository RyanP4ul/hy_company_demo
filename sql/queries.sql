-- ============================================================================
-- HyOps — Common Queries & Reports
-- Ready-to-use SQL queries for the dashboard and features.
-- ============================================================================


-- ============================================================================
-- 1. DASHBOARD QUERIES
-- ============================================================================

-- 1.1 Dashboard KPI Summary
SELECT
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled')                          AS total_revenue,
    (SELECT COUNT(*) FROM orders)                                                                     AS total_orders,
    (SELECT COUNT(*) FROM inventory)                                                                  AS total_products,
    ROUND(
        (SELECT COUNT(*) FROM deliveries WHERE status = 'delivered')::NUMERIC
        / NULLIF((SELECT COUNT(*) FROM deliveries), 0) * 100, 1
    )                                                                                                 AS delivery_rate_pct,
    (SELECT COUNT(*) FROM customers WHERE status = 'active')                                         AS active_customers,
    (SELECT COUNT(*) FROM drivers WHERE status = 'available')                                        AS available_drivers,
    (SELECT COUNT(*) FROM inventory WHERE status IN ('low_stock', 'out_of_stock'))                   AS low_stock_alerts;

-- 1.2 Revenue trend by month (last 12 months)
SELECT
    TO_CHAR(o.created_at, 'Mon')   AS month,
    EXTRACT(MONTH FROM o.created_at)::INTEGER AS month_num,
    SUM(o.total)                    AS revenue,
    COUNT(*)                         AS orders_count
FROM orders o
WHERE o.status != 'cancelled'
  AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
GROUP BY TO_CHAR(o.created_at, 'Mon'), EXTRACT(MONTH FROM o.created_at)
ORDER BY month_num;

-- 1.3 Weekly performance (current week)
SELECT
    TO_CHAR(d.created_at, 'Dy')   AS day,
    COUNT(DISTINCT o.id)          AS orders,
    COUNT(DISTINCT CASE WHEN d.status = 'delivered' THEN d.id END) AS deliveries
FROM generate_series(0, 6) AS gs(i)
CROSS JOIN LATERAL (SELECT CURRENT_DATE - gs.i AS date_val) dates
LEFT JOIN orders o ON DATE(o.created_at) = dates.date_val AND o.status != 'cancelled'
LEFT JOIN deliveries d ON d.order_id = o.id
GROUP BY TO_CHAR(dates.date_val, 'Dy'), dates.date_val
ORDER BY dates.date_val DESC;

-- 1.4 Category distribution (for pie chart)
SELECT
    ic.name   AS category,
    COUNT(*)  AS product_count,
    ROUND(AVG(i.price), 2) AS avg_price,
    SUM(i.stock)           AS total_stock
FROM inventory i
JOIN inventory_categories ic ON i.category_id = ic.id
GROUP BY ic.name
ORDER BY product_count DESC;

-- 1.5 Top 5 customers by orders
SELECT
    c.name,
    c.total_orders,
    c.total_spent,
    c.last_order_date
FROM customers c
WHERE c.status = 'active'
ORDER BY c.total_orders DESC
LIMIT 5;

-- 1.6 Top 5 selling products (by order item quantity)
SELECT
    oi.product_name,
    SUM(oi.quantity)    AS total_sold,
    SUM(oi.subtotal)    AS total_revenue
FROM order_items oi
GROUP BY oi.product_name
ORDER BY total_sold DESC
LIMIT 5;

-- 1.7 Recent activity feed (last 50 entries)
(
    SELECT 'audit'    AS source, user_name AS actor, action::TEXT, resource || ' ' || resource_id AS target, details, created_at
    FROM audit_logs
) UNION ALL (
    SELECT 'activity' AS source, user_name AS actor, action, target, NULL::JSONB, created_at
    FROM activity_timeline
)
ORDER BY created_at DESC
LIMIT 50;


-- ============================================================================
-- 2. INVENTORY QUERIES
-- ============================================================================

-- 2.1 All inventory with category and warehouse names
SELECT
    i.id, i.name, ic.name AS category, i.price, i.stock, i.min_stock,
    i.status, w.name AS warehouse, i.last_updated
FROM inventory i
JOIN inventory_categories ic ON i.category_id = ic.id
JOIN warehouses w ON i.warehouse_id = w.id
ORDER BY i.last_updated DESC;

-- 2.2 Low stock & out of stock items (alert items)
SELECT
    i.id, i.name, ic.name AS category,
    i.stock, i.min_stock,
    i.min_stock - i.stock AS deficit,
    i.status, w.name AS warehouse
FROM inventory i
JOIN inventory_categories ic ON i.category_id = ic.id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.stock <= i.min_stock
ORDER BY i.stock ASC, i.min_stock - i.stock DESC;

-- 2.3 Inventory by warehouse summary
SELECT
    w.name AS warehouse,
    COUNT(*) AS total_products,
    SUM(i.stock) AS total_stock,
    SUM(i.price * i.stock) AS total_value,
    COUNT(*) FILTER (WHERE i.status = 'out_of_stock') AS out_of_stock_count,
    COUNT(*) FILTER (WHERE i.status = 'low_stock') AS low_stock_count
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.id
GROUP BY w.name
ORDER BY total_value DESC;

-- 2.4 Inventory value by category
SELECT
    ic.name AS category,
    COUNT(*) AS product_count,
    SUM(i.stock) AS total_units,
    SUM(i.price * i.stock) AS total_inventory_value
FROM inventory i
JOIN inventory_categories ic ON i.category_id = ic.id
GROUP BY ic.name
ORDER BY total_inventory_value DESC;


-- ============================================================================
-- 3. ORDER QUERIES
-- ============================================================================

-- 3.1 All orders with customer and driver details
SELECT
    o.id, o.customer_name, c.contact_number, c.company,
    o.item_count, o.total, o.status, o.priority,
    d.name AS driver_name,
    o.created_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN drivers d ON o.assigned_driver_id = d.id
ORDER BY o.created_at DESC;

-- 3.2 Orders by status with count and total
SELECT
    status,
    COUNT(*)   AS order_count,
    SUM(total) AS total_value
FROM orders
GROUP BY status
ORDER BY order_count DESC;

-- 3.3 High priority pending orders
SELECT
    o.id, o.customer_name, o.total, o.priority,
    o.created_at,
    DATEDIFF(NOW(), o.created_at) AS days_pending
FROM orders o
WHERE o.status = 'pending' AND o.priority = 'high'
ORDER BY o.created_at ASC;

-- 3.4 Order details with line items
SELECT
    o.id AS order_id,
    o.customer_name,
    o.status,
    o.priority,
    o.total AS order_total,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
ORDER BY o.created_at DESC, oi.id;

-- 3.5 Customer order history
SELECT
    o.id, o.total, o.status, o.priority, o.created_at
FROM orders o
WHERE o.customer_id = 'CST-001'   -- Replace with actual customer ID
ORDER BY o.created_at DESC;


-- ============================================================================
-- 4. DELIVERY QUERIES
-- ============================================================================

-- 4.1 All deliveries with order and driver details
SELECT
    d.id, d.order_id, o.customer_name, o.total AS order_total,
    drv.name AS driver_name, drv.phone AS driver_phone, drv.vehicle,
    d.destination, d.status, d.eta, d.progress,
    d.started_at, d.completed_at
FROM deliveries d
JOIN orders o ON d.order_id = o.id
JOIN drivers drv ON d.driver_id = drv.id
ORDER BY d.created_at DESC;

-- 4.2 Active deliveries (in transit)
SELECT
    d.id, o.customer_name, drv.name AS driver_name,
    d.destination, d.eta, d.progress, d.started_at
FROM deliveries d
JOIN orders o ON d.order_id = o.id
JOIN drivers drv ON d.driver_id = drv.id
WHERE d.status = 'in_transit'
ORDER BY d.progress DESC;

-- 4.3 Pending deliveries (not yet started)
SELECT
    d.id, o.customer_name, d.eta, d.destination
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE d.status = 'pending'
ORDER BY d.eta ASC;

-- 4.4 Delivery timeline for a specific delivery
SELECT
    dt.step_name, dt.step_time, dt.completed
FROM delivery_timeline dt
WHERE dt.delivery_id = 'DEL-1092'  -- Replace with actual delivery ID
ORDER BY dt.sort_order;

-- 4.5 Delivery performance stats
SELECT
    COUNT(*)                                                        AS total_deliveries,
    COUNT(*) FILTER (WHERE status = 'delivered')                    AS completed,
    COUNT(*) FILTER (WHERE status = 'in_transit')                   AS in_transit,
    COUNT(*) FILTER (WHERE status = 'pending')                      AS pending,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600), 1) AS avg_delivery_hours
FROM deliveries
WHERE completed_at IS NOT NULL;


-- ============================================================================
-- 5. DRIVER QUERIES
-- ============================================================================

-- 5.1 Driver performance summary
SELECT
    d.id, d.name, d.phone, d.status, d.vehicle,
    d.completed_today, d.rating, d.total_deliveries,
    (SELECT COUNT(*) FROM deliveries WHERE driver_id = d.id AND status = 'in_transit') AS active_deliveries
FROM drivers d
ORDER BY d.rating DESC, d.total_deliveries DESC;

-- 5.2 Driver availability
SELECT status, COUNT(*) AS count
FROM drivers
GROUP BY status;

-- 5.3 Driver delivery history
SELECT
    d.id AS delivery_id, o.customer_name, o.total,
    d.destination, d.status, d.started_at, d.completed_at,
    EXTRACT(EPOCH FROM (d.completed_at - d.started_at))/3600 AS hours_taken
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE d.driver_id = 'DRV-001'  -- Replace with actual driver ID
ORDER BY d.created_at DESC;


-- ============================================================================
-- 6. CUSTOMER QUERIES
-- ============================================================================

-- 6.1 All customers with order summary
SELECT
    c.id, c.name, c.contact_number, c.company, c.address,
    c.total_orders, c.total_spent, c.status,
    c.join_date, c.last_order_date
FROM customers c
ORDER BY c.total_orders DESC;

-- 6.2 Customer lifetime value ranking
SELECT
    c.name, c.company, c.total_orders, c.total_spent,
    RANK() OVER (ORDER BY c.total_spent DESC) AS spending_rank
FROM customers c
WHERE c.status = 'active'
ORDER BY c.total_spent DESC;

-- 6.3 Recently active customers (ordered in last 30 days)
SELECT
    c.name, c.contact_number, c.total_orders, c.last_order_date
FROM customers c
WHERE c.last_order_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY c.last_order_date DESC;

-- 6.4 Dormant customers (no orders in 60+ days)
SELECT
    c.name, c.contact_number, c.total_orders,
    c.last_order_date,
    CURRENT_DATE - c.last_order_date AS days_inactive
FROM customers c
WHERE c.status = 'active'
  AND c.last_order_date < CURRENT_DATE - INTERVAL '60 days'
ORDER BY c.last_order_date ASC;


-- ============================================================================
-- 7. NOTIFICATION QUERIES
-- ============================================================================

-- 7.1 Unread notifications for a user
SELECT *
FROM notifications
WHERE user_id = 'USR-001'  -- Replace with actual user ID
  AND is_read = FALSE
ORDER BY created_at DESC;

-- 7.2 Notification counts by type
SELECT
    type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE is_read = FALSE) AS unread
FROM notifications
WHERE user_id = 'USR-001'
GROUP BY type
ORDER BY unread DESC;

-- 7.3 Mark all notifications as read for a user
-- UPDATE notifications SET is_read = TRUE WHERE user_id = 'USR-001' AND is_read = FALSE;


-- ============================================================================
-- 8. AUDIT LOG QUERIES
-- ============================================================================

-- 8.1 Recent audit logs
SELECT
    al.id, al.user_name, al.action, al.resource,
    al.resource_id, al.details, al.ip_address, al.created_at
FROM audit_logs al
ORDER BY al.created_at DESC
LIMIT 100;

-- 8.2 Audit logs filtered by action type
SELECT *
FROM audit_logs
WHERE action = 'UPDATE'
ORDER BY created_at DESC;

-- 8.3 Audit logs for a specific resource
SELECT *
FROM audit_logs
WHERE resource = 'Product' AND resource_id = 'SKU-002'
ORDER BY created_at DESC;

-- 8.4 Audit summary by action type (last 30 days)
SELECT
    action,
    COUNT(*) AS count,
    COUNT(DISTINCT user_name) AS unique_users
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action
ORDER BY count DESC;


-- ============================================================================
-- 9. ARCHIVE QUERIES
-- ============================================================================

-- 9.1 All archived items
SELECT
    a.id, a.entity_type, a.entity_id, a.label,
    a.archived_at, a.restored_at, a.is_deleted
FROM archives a
WHERE a.is_deleted = FALSE
ORDER BY a.archived_at DESC;

-- 9.2 Archives by entity type
SELECT
    entity_type,
    COUNT(*) AS total_archived,
    COUNT(*) FILTER (WHERE restored_at IS NULL) AS currently_archived,
    COUNT(*) FILTER (WHERE restored_at IS NOT NULL) AS restored
FROM archives
GROUP BY entity_type
ORDER BY total_archived DESC;

-- 9.3 Search archived items
SELECT *
FROM archives
WHERE entity_type = 'inventory'
  AND is_deleted = FALSE
  AND restored_at IS NULL
ORDER BY archived_at DESC;


-- ============================================================================
-- 10. REPORTS
-- ============================================================================

-- 10.1 Sales report (monthly breakdown)
SELECT
    DATE_TRUNC('month', o.created_at)::DATE AS month_start,
    COUNT(*) AS total_orders,
    SUM(o.total) AS revenue,
    SUM(o.total) / COUNT(*) AS avg_order_value,
    COUNT(DISTINCT o.customer_id) AS unique_customers
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month_start DESC;

-- 10.2 Delivery performance report
SELECT
    DATE_TRUNC('week', d.completed_at)::DATE AS week_start,
    COUNT(*) AS total_deliveries,
    COUNT(*) FILTER (WHERE status = 'delivered') AS successful,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'delivered')::NUMERIC
        / NULLIF(COUNT(*), 0) * 100, 1
    ) AS success_rate_pct,
    ROUND(AVG(
        EXTRACT(EPOCH FROM (d.completed_at - d.started_at)) / 3600
    ), 1) AS avg_hours
FROM deliveries d
WHERE d.completed_at IS NOT NULL
GROUP BY DATE_TRUNC('week', d.completed_at)
ORDER BY week_start DESC;

-- 10.3 Inventory valuation report
SELECT
    ic.name AS category,
    COUNT(*) AS products,
    SUM(i.stock) AS total_units,
    ROUND(SUM(i.price * i.stock), 2) AS total_value,
    ROUND(AVG(i.price), 2) AS avg_price,
    MIN(i.price) AS min_price,
    MAX(i.price) AS max_price
FROM inventory i
JOIN inventory_categories ic ON i.category_id = ic.id
GROUP BY ic.name
ORDER BY total_value DESC;

-- 10.4 Customer acquisition report (by month)
SELECT
    DATE_TRUNC('month', c.join_date)::DATE AS month_start,
    COUNT(*) AS new_customers,
    SUM(c.total_spent) AS lifetime_value
FROM customers c
GROUP BY DATE_TRUNC('month', c.join_date)
ORDER BY month_start DESC;

-- 10.5 Driver performance leaderboard
SELECT
    d.name, d.vehicle, d.rating, d.total_deliveries,
    COUNT(del.id) FILTER (WHERE del.status = 'delivered') AS successful_deliveries,
    ROUND(AVG(EXTRACT(EPOCH FROM (del.completed_at - del.started_at))/3600), 1) AS avg_delivery_hours
FROM drivers d
LEFT JOIN deliveries del ON del.driver_id = d.id AND del.completed_at IS NOT NULL
GROUP BY d.id, d.name, d.vehicle, d.rating, d.total_deliveries
ORDER BY d.rating DESC, d.total_deliveries DESC;


-- ============================================================================
-- 11. DAILY SALES & INVENTORY STATUS (Dashboard Widgets)
-- ============================================================================

-- 11.1 Daily sales volume (current week — Mon to Sun)
SELECT
    TO_CHAR(date_val, 'Dy') AS day,
    COALESCE(SUM(o.total), 0) AS sales,
    COALESCE(COUNT(o.id), 0) AS order_count
FROM generate_series(0, 6) AS gs(i)
CROSS JOIN LATERAL (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + gs.i) AS d(date_val)
LEFT JOIN orders o ON DATE(o.created_at) = d.date_val AND o.status != 'cancelled'
GROUP BY TO_CHAR(d.date_val, 'Dy'), d.date_val
ORDER BY d.date_val;

-- 11.2 Inventory status distribution (for donut chart)
SELECT
    status,
    COUNT(*) AS item_count
FROM inventory
GROUP BY status
ORDER BY
    CASE status
        WHEN 'in_stock' THEN 1
        WHEN 'low_stock' THEN 2
        WHEN 'out_of_stock' THEN 3
    END;

-- 11.3 Inventory status as single-row summary
SELECT
    COUNT(*) FILTER (WHERE status = 'in_stock')     AS in_stock_count,
    COUNT(*) FILTER (WHERE status = 'low_stock')    AS low_stock_count,
    COUNT(*) FILTER (WHERE status = 'out_of_stock')  AS out_of_stock_count,
    COUNT(*)                                          AS total_count
FROM inventory;


-- ============================================================================
-- 12. ROLES & PERMISSIONS QUERIES
-- ============================================================================

-- 12.1 All roles with user count and permission summary
SELECT
    r.id,
    r.name,
    r.description,
    COUNT(DISTINCT u.id) AS user_count,
    COUNT(DISTINCT rp.permission_id) FILTER (WHERE rp.enabled = TRUE) AS enabled_permissions,
    COUNT(DISTINCT rp.permission_id) AS total_permissions
FROM roles r
LEFT JOIN users u ON u.role_id = r.id AND u.status = 'active'
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.id, r.name, r.description
ORDER BY user_count DESC;

-- 12.2 Permissions for a specific role (grouped by category)
SELECT
    p.category,
    p.id AS permission_id,
    p.label,
    rp.enabled
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
WHERE rp.role_id = 'admin'   -- Replace with actual role ID
ORDER BY p.category, p.id;

-- 12.3 Create a new role
-- INSERT INTO roles (id, name, description) VALUES ('custom_role', 'Custom Role', 'Custom role description');
-- Then add permissions:
-- INSERT INTO role_permissions (role_id, permission_id, enabled)
-- SELECT 'custom_role', p.id, FALSE FROM permissions p;

-- 12.4 Delete a role (cannot delete if users are assigned)
-- First check for assigned users:
SELECT COUNT(*) AS assigned_users FROM users WHERE role_id = 'viewer';  -- Replace with role ID
-- Then delete if safe:
-- DELETE FROM role_permissions WHERE role_id = 'viewer';
-- DELETE FROM roles WHERE id = 'viewer';

-- 12.5 Users and their roles
SELECT
    u.id, u.name, u.email, u.status,
    r.name AS role_name, r.description AS role_description
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY r.name, u.name;


-- ============================================================================
-- 13. SETTINGS & LANGUAGE QUERIES
-- ============================================================================

-- 13.1 Get current language setting
SELECT value AS current_language
FROM settings
WHERE key = 'language';

-- 13.2 Update language setting
-- UPDATE settings SET value = 'tl', updated_at = NOW(), updated_by = 'USR-001' WHERE key = 'language';
-- Supported values: 'en' (English), 'tl' (Filipino), 'zh' (Chinese)

-- 13.3 Get all settings
SELECT key, value, description, updated_at, updated_by
FROM settings
ORDER BY key;
