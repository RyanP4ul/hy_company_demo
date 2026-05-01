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
    (SELECT COUNT(*) FROM inventory i WHERE EXISTS (
        SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND (pt.stock = 0 OR pt.stock < pt.min_stock)
    ))                                                                                                AS low_stock_alerts;

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

-- 1.4 Product type distribution (for chart)
SELECT
    pt.name AS type_name,
    COUNT(*) AS product_count,
    ROUND(AVG(pt.price), 2) AS avg_price,
    SUM(pt.stock) AS total_stock
FROM product_types pt
GROUP BY pt.name
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
    oi.type_name,
    SUM(oi.quantity)    AS total_sold,
    SUM(oi.subtotal)    AS total_revenue
FROM order_items oi
GROUP BY oi.product_name, oi.type_name
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

-- 2.1 All inventory with warehouse and type summary
SELECT
    i.id, i.name,
    w.name AS warehouse,
    i.last_updated,
    (SELECT COUNT(*) FROM product_types pt WHERE pt.product_id = i.id) AS type_count,
    (SELECT COALESCE(SUM(pt.stock), 0) FROM product_types pt WHERE pt.product_id = i.id) AS total_stock,
    (SELECT MIN(pt.price) FROM product_types pt WHERE pt.product_id = i.id) AS min_price,
    (SELECT MAX(pt.price) FROM product_types pt WHERE pt.product_id = i.id) AS max_price,
    CASE
        WHEN EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock = 0) THEN 'out_of_stock'
        WHEN EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock < pt.min_stock) THEN 'low_stock'
        ELSE 'in_stock'
    END AS computed_status
FROM inventory i
JOIN warehouses w ON i.warehouse_id = w.id
ORDER BY i.last_updated DESC;

-- 2.2 Low stock & out of stock types (alert items)
SELECT
    i.id AS product_id,
    i.name AS product_name,
    pt.id AS type_id,
    pt.name AS type_name,
    pt.stock,
    pt.min_stock,
    pt.min_stock - pt.stock AS deficit,
    CASE
        WHEN pt.stock = 0 THEN 'out_of_stock'
        WHEN pt.stock < pt.min_stock THEN 'low_stock'
        ELSE 'ok'
    END AS alert_status,
    w.name AS warehouse
FROM product_types pt
JOIN inventory i ON i.id = pt.product_id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE pt.stock <= pt.min_stock
ORDER BY pt.stock ASC, pt.min_stock - pt.stock DESC;

-- 2.3 Inventory by warehouse summary
SELECT
    w.name AS warehouse,
    COUNT(DISTINCT i.id) AS total_products,
    COALESCE(SUM(pt.stock), 0) AS total_stock,
    COALESCE(SUM(pt.price * pt.stock), 0) AS total_value,
    COUNT(DISTINCT CASE WHEN pt.stock = 0 THEN pt.id END) AS out_of_stock_types,
    COUNT(DISTINCT CASE WHEN pt.stock > 0 AND pt.stock < pt.min_stock THEN pt.id END) AS low_stock_types
FROM warehouses w
LEFT JOIN inventory i ON i.warehouse_id = w.id
LEFT JOIN product_types pt ON pt.product_id = i.id
GROUP BY w.name
ORDER BY total_value DESC;

-- 2.4 Inventory value by product type name
SELECT
    pt.name AS type_name,
    COUNT(*) AS product_count,
    SUM(pt.stock) AS total_units,
    SUM(pt.price * pt.stock) AS total_inventory_value
FROM product_types pt
GROUP BY pt.name
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

-- 3.4 Order details with line items (including product type)
SELECT
    o.id AS order_id,
    o.customer_name,
    o.status,
    o.priority,
    o.total AS order_total,
    oi.product_name,
    oi.type_name,
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
-- 4. WAREHOUSE QUERIES
-- ============================================================================

-- 4.1 All warehouses with stats
SELECT
    w.id,
    w.name,
    w.type,
    w.address,
    COUNT(DISTINCT i.id) AS total_products,
    COALESCE(SUM(pt.stock), 0) AS total_stock,
    COALESCE(SUM(pt.price * pt.stock), 0) AS total_inventory_value,
    COUNT(DISTINCT CASE WHEN pt.stock = 0 THEN pt.id END) AS out_of_stock_types,
    COUNT(DISTINCT CASE WHEN pt.stock > 0 AND pt.stock < pt.min_stock THEN pt.id END) AS low_stock_types
FROM warehouses w
LEFT JOIN inventory i ON i.warehouse_id = w.id
LEFT JOIN product_types pt ON pt.product_id = i.id
GROUP BY w.id, w.name, w.type, w.address
ORDER BY w.name;

-- 4.2 Warehouse utilization summary
SELECT
    w.name AS warehouse,
    w.utilized AS capacity,
    COALESCE(SUM(pt.stock), 0) AS current_stock,
    CASE
        WHEN COALESCE(SUM(pt.stock), 0) >= w.utilized * 0.9 THEN 'Near capacity'
        WHEN COALESCE(SUM(pt.stock), 0) >= w.utilized * 0.7 THEN 'Moderate'
        ELSE 'Available'
    END AS capacity_status
FROM warehouses w
LEFT JOIN inventory i ON i.warehouse_id = w.id
LEFT JOIN product_types pt ON pt.product_id = i.id
GROUP BY w.id, w.name, w.utilized
ORDER BY w.name;

-- 4.3 Warehouses by type distribution
SELECT
    w.type AS warehouse_type,
    COUNT(*) AS warehouse_count,
    SUM(w.utilized) AS total_capacity,
    COALESCE(SUM(inv.total_stock), 0) AS total_stock
FROM warehouses w
LEFT JOIN (
    SELECT i.warehouse_id, SUM(pt.stock) AS total_stock
    FROM inventory i
    JOIN product_types pt ON pt.product_id = i.id
    GROUP BY i.warehouse_id
) inv ON inv.warehouse_id = w.id
GROUP BY w.type
ORDER BY warehouse_count DESC;


-- ============================================================================
-- 5. DELIVERY QUERIES
-- ============================================================================

-- 5.1 All deliveries with order and driver details
SELECT
    d.id, d.order_id, o.customer_name, o.total AS order_total,
    drv.name AS driver_name, drv.phone AS driver_phone, drv.vehicle,
    d.status, d.eta, d.progress,
    d.started_at, d.completed_at,
    (SELECT COUNT(*) FROM delivery_stops ds WHERE ds.delivery_id = d.id) AS total_stops,
    (SELECT COUNT(*) FROM delivery_stops ds WHERE ds.delivery_id = d.id AND ds.status = 'completed') AS completed_stops
FROM deliveries d
JOIN orders o ON d.order_id = o.id
JOIN drivers drv ON d.driver_id = drv.id
ORDER BY d.created_at DESC;

-- 5.2 Active deliveries (in transit)
SELECT
    d.id, o.customer_name, drv.name AS driver_name,
    d.eta, d.progress, d.started_at,
    (SELECT COUNT(*) FROM delivery_stops ds WHERE ds.delivery_id = d.id) AS total_stops,
    (SELECT COUNT(*) FROM delivery_stops ds WHERE ds.delivery_id = d.id AND ds.status = 'completed') AS completed_stops
FROM deliveries d
JOIN orders o ON d.order_id = o.id
JOIN drivers drv ON d.driver_id = drv.id
WHERE d.status = 'in_transit'
ORDER BY d.progress DESC;

-- 5.3 Pending deliveries (not yet started)
SELECT
    d.id, o.customer_name, d.eta,
    (SELECT COUNT(*) FROM delivery_stops ds WHERE ds.delivery_id = d.id) AS total_stops
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE d.status = 'pending'
ORDER BY d.eta ASC;

-- 5.4 Delivery stops for a specific delivery
SELECT
    ds.id AS stop_id,
    ds.stop_order,
    ds.address,
    ds.city,
    ds.notes,
    ds.status,
    ds.arrived_at,
    ds.completed_at
FROM delivery_stops ds
WHERE ds.delivery_id = 'DEL-1092'   -- Replace with actual delivery ID
ORDER BY ds.stop_order;

-- 5.5 Delivery performance stats
SELECT
    COUNT(*)                                                        AS total_deliveries,
    COUNT(*) FILTER (WHERE status = 'delivered')                    AS completed,
    COUNT(*) FILTER (WHERE status = 'in_transit')                   AS in_transit,
    COUNT(*) FILTER (WHERE status = 'pending')                      AS pending,
    ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/3600), 1) AS avg_delivery_hours
FROM deliveries
WHERE completed_at IS NOT NULL;

-- 5.6 Delivery with all stops joined
SELECT
    d.id AS delivery_id,
    d.order_id,
    o.customer_name,
    drv.name AS driver_name,
    d.status AS delivery_status,
    d.eta,
    d.progress,
    d.started_at,
    d.completed_at,
    ds.id AS stop_id,
    ds.stop_order,
    ds.address AS stop_address,
    ds.city AS stop_city,
    ds.notes AS stop_notes,
    ds.status AS stop_status,
    ds.arrived_at,
    ds.completed_at
FROM deliveries d
JOIN orders o ON d.order_id = o.id
JOIN drivers drv ON d.driver_id = drv.id
LEFT JOIN delivery_stops ds ON ds.delivery_id = d.id
WHERE d.id = 'DEL-1092'   -- Replace with actual delivery ID
ORDER BY ds.stop_order;


-- ============================================================================
-- 6. DRIVER QUERIES
-- ============================================================================

-- 6.1 Driver performance summary
SELECT
    d.id, d.name, d.phone, d.status, d.vehicle,
    d.completed_today, d.rating, d.total_deliveries,
    (SELECT COUNT(*) FROM deliveries WHERE driver_id = d.id AND status = 'in_transit') AS active_deliveries
FROM drivers d
ORDER BY d.rating DESC, d.total_deliveries DESC;

-- 6.2 Driver availability
SELECT status, COUNT(*) AS count
FROM drivers
GROUP BY status;

-- 6.3 Driver delivery history
SELECT
    d.id AS delivery_id, o.customer_name, o.total,
    d.status, d.started_at, d.completed_at,
    EXTRACT(EPOCH FROM (d.completed_at - d.started_at))/3600 AS hours_taken
FROM deliveries d
JOIN orders o ON d.order_id = o.id
WHERE d.driver_id = 'DRV-001'  -- Replace with actual driver ID
ORDER BY d.created_at DESC;


-- ============================================================================
-- 7. CUSTOMER QUERIES
-- ============================================================================

-- 7.1 All customers with order summary
SELECT
    c.id, c.name, c.contact_number, c.company, c.address,
    c.total_orders, c.total_spent, c.status,
    c.join_date, c.last_order_date
FROM customers c
ORDER BY c.total_orders DESC;

-- 7.2 Customer lifetime value ranking
SELECT
    c.name, c.company, c.total_orders, c.total_spent,
    RANK() OVER (ORDER BY c.total_spent DESC) AS spending_rank
FROM customers c
WHERE c.status = 'active'
ORDER BY c.total_spent DESC;

-- 7.3 Recently active customers (ordered in last 30 days)
SELECT
    c.name, c.contact_number, c.total_orders, c.last_order_date
FROM customers c
WHERE c.last_order_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY c.last_order_date DESC;

-- 7.4 Dormant customers (no orders in 60+ days)
SELECT
    c.name, c.contact_number, c.total_orders,
    c.last_order_date,
    CURRENT_DATE - c.last_order_date AS days_inactive
FROM customers c
WHERE c.status = 'active'
  AND c.last_order_date < CURRENT_DATE - INTERVAL '60 days'
ORDER BY c.last_order_date ASC;


-- ============================================================================
-- 8. NOTIFICATION QUERIES
-- ============================================================================

-- 8.1 Unread notifications for a user
SELECT *
FROM notifications
WHERE user_id = 'USR-001'  -- Replace with actual user ID
  AND is_read = FALSE
ORDER BY created_at DESC;

-- 8.2 Notification counts by type
SELECT
    type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE is_read = FALSE) AS unread
FROM notifications
WHERE user_id = 'USR-001'
GROUP BY type
ORDER BY unread DESC;

-- 8.3 Mark all notifications as read for a user
-- UPDATE notifications SET is_read = TRUE WHERE user_id = 'USR-001' AND is_read = FALSE;


-- ============================================================================
-- 9. AUDIT LOG QUERIES
-- ============================================================================

-- 9.1 Recent audit logs
SELECT
    al.id, al.user_name, al.action, al.resource,
    al.resource_id, al.details, al.ip_address, al.created_at
FROM audit_logs al
ORDER BY al.created_at DESC
LIMIT 100;

-- 9.2 Audit logs filtered by action type
SELECT *
FROM audit_logs
WHERE action = 'UPDATE'
ORDER BY created_at DESC;

-- 9.3 Audit logs for a specific resource
SELECT *
FROM audit_logs
WHERE resource = 'Product' AND resource_id = 'SKU-002'
ORDER BY created_at DESC;

-- 9.4 Audit summary by action type (last 30 days)
SELECT
    action,
    COUNT(*) AS count,
    COUNT(DISTINCT user_name) AS unique_users
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY action
ORDER BY count DESC;


-- ============================================================================
-- 10. ARCHIVE QUERIES
-- ============================================================================

-- 10.1 All archived items
SELECT
    a.id, a.entity_type, a.entity_id, a.label,
    a.archived_at, a.restored_at, a.is_deleted
FROM archives a
WHERE a.is_deleted = FALSE
ORDER BY a.archived_at DESC;

-- 10.2 Archives by entity type
SELECT
    entity_type,
    COUNT(*) AS total_archived,
    COUNT(*) FILTER (WHERE restored_at IS NULL) AS currently_archived,
    COUNT(*) FILTER (WHERE restored_at IS NOT NULL) AS restored
FROM archives
GROUP BY entity_type
ORDER BY total_archived DESC;

-- 10.3 Search archived items
SELECT *
FROM archives
WHERE entity_type = 'inventory'
  AND is_deleted = FALSE
  AND restored_at IS NULL
ORDER BY archived_at DESC;


-- ============================================================================
-- 11. REPORTS
-- ============================================================================

-- 11.1 Sales report (monthly breakdown)
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

-- 11.2 Delivery performance report
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

-- 11.3 Inventory valuation report
SELECT
    pt.name AS type_name,
    COUNT(*) AS products,
    SUM(pt.stock) AS total_units,
    ROUND(SUM(pt.price * pt.stock), 2) AS total_value,
    ROUND(AVG(pt.price), 2) AS avg_price,
    MIN(pt.price) AS min_price,
    MAX(pt.price) AS max_price
FROM product_types pt
GROUP BY pt.name
ORDER BY total_value DESC;

-- 11.4 Customer acquisition report (by month)
SELECT
    DATE_TRUNC('month', c.join_date)::DATE AS month_start,
    COUNT(*) AS new_customers,
    SUM(c.total_spent) AS lifetime_value
FROM customers c
GROUP BY DATE_TRUNC('month', c.join_date)
ORDER BY month_start DESC;

-- 11.5 Driver performance leaderboard
SELECT
    d.name, d.vehicle, d.rating, d.total_deliveries,
    COUNT(del.id) FILTER (WHERE del.status = 'delivered') AS successful_deliveries,
    ROUND(AVG(EXTRACT(EPOCH FROM (del.completed_at - del.started_at))/3600), 1) AS avg_delivery_hours
FROM drivers d
LEFT JOIN deliveries del ON del.driver_id = d.id AND del.completed_at IS NOT NULL
GROUP BY d.id, d.name, d.vehicle, d.rating, d.total_deliveries
ORDER BY d.rating DESC, d.total_deliveries DESC;


-- ============================================================================
-- 12. DAILY SALES & INVENTORY STATUS (Dashboard Widgets)
-- ============================================================================

-- 12.1 Daily sales volume (current week — Mon to Sun)
SELECT
    TO_CHAR(date_val, 'Dy') AS day,
    COALESCE(SUM(o.total), 0) AS sales,
    COALESCE(COUNT(o.id), 0) AS order_count
FROM generate_series(0, 6) AS gs(i)
CROSS JOIN LATERAL (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + gs.i) AS d(date_val)
LEFT JOIN orders o ON DATE(o.created_at) = d.date_val AND o.status != 'cancelled'
GROUP BY TO_CHAR(d.date_val, 'Dy'), d.date_val
ORDER BY d.date_val;

-- 12.2 Inventory status distribution (computed from product_types)
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock = 0) THEN 'out_of_stock'
        WHEN EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock < pt.min_stock) THEN 'low_stock'
        ELSE 'in_stock'
    END AS status,
    COUNT(*) AS item_count
FROM inventory i
GROUP BY status
ORDER BY
    CASE status
        WHEN 'in_stock' THEN 1
        WHEN 'low_stock' THEN 2
        WHEN 'out_of_stock' THEN 3
    END;

-- 12.3 Inventory status as single-row summary
SELECT
    (SELECT COUNT(*) FROM inventory i WHERE NOT EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND (pt.stock = 0 OR pt.stock < pt.min_stock))) AS in_stock_count,
    (SELECT COUNT(*) FROM inventory i WHERE EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock < pt.min_stock AND pt.stock > 0)) AS low_stock_count,
    (SELECT COUNT(*) FROM inventory i WHERE EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock = 0)) AS out_of_stock_count,
    (SELECT COUNT(*) FROM inventory) AS total_count;


-- ============================================================================
-- 13. SALES QUERIES
-- ============================================================================

-- 13.1 Sales summary (total revenue, transactions, avg order value)
SELECT
    COUNT(*) AS total_transactions,
    COALESCE(SUM(total), 0) AS total_revenue,
    ROUND(COALESCE(AVG(total), 0), 2) AS avg_order_value
FROM orders
WHERE status != 'cancelled';

-- 13.2 Sales by payment method
SELECT
    payment_method,
    COUNT(*) AS transaction_count,
    COALESCE(SUM(total), 0) AS total_revenue,
    ROUND(COALESCE(AVG(total), 0), 2) AS avg_order_value
FROM orders
WHERE status != 'cancelled'
GROUP BY payment_method
ORDER BY total_revenue DESC;

-- 13.3 Sales by status
SELECT
    status,
    COUNT(*) AS order_count,
    COALESCE(SUM(total), 0) AS total_value,
    ROUND(COALESCE(SUM(total), 0)::NUMERIC / NULLIF(COUNT(*), 0), 2) AS avg_value
FROM orders
GROUP BY status
ORDER BY order_count DESC;

-- 13.4 Daily sales breakdown (current week)
SELECT
    TO_CHAR(date_val, 'Dy') AS day,
    date_val,
    COALESCE(SUM(o.total), 0) AS daily_revenue,
    COALESCE(COUNT(o.id), 0) AS transactions
FROM generate_series(0, 6) AS gs(i)
CROSS JOIN LATERAL (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + gs.i) AS d(date_val)
LEFT JOIN orders o ON DATE(o.created_at) = d.date_val AND o.status != 'cancelled'
GROUP BY TO_CHAR(d.date_val, 'Dy'), d.date_val
ORDER BY d.date_val;

-- 13.5 Monthly sales trend
SELECT
    DATE_TRUNC('month', created_at)::DATE AS month_start,
    TO_CHAR(created_at, 'Mon YYYY') AS month_label,
    COUNT(*) AS order_count,
    COALESCE(SUM(total), 0) AS revenue,
    ROUND(COALESCE(AVG(total), 0), 2) AS avg_order_value
FROM orders
WHERE status != 'cancelled'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months'
GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon YYYY')
ORDER BY month_start;

-- 13.6 Top customers by sales
SELECT
    c.name,
    c.company,
    c.total_orders,
    c.total_spent,
    c.last_order_date,
    ROUND(c.total_spent / NULLIF(c.total_orders, 0), 2) AS avg_order_value
FROM customers c
WHERE c.status = 'active'
  AND c.total_orders > 0
ORDER BY c.total_spent DESC
LIMIT 10;


-- ============================================================================
-- 14. INBOX QUERIES
-- ============================================================================

-- 14.1 All conversations with message counts
SELECT
    c.id AS conversation_id,
    c.channel,
    c.subject,
    c.status,
    c.customer_name,
    c.last_message_at,
    c.created_at AS conversation_started,
    (SELECT COUNT(*) FROM inbox_messages im WHERE im.conversation_id = c.id) AS total_messages
FROM inbox_conversations c
ORDER BY c.last_message_at DESC;

-- 14.2 Open conversations (by channel)
SELECT
    channel,
    COUNT(*) AS open_count
FROM inbox_conversations
WHERE status = 'open'
GROUP BY channel
ORDER BY open_count DESC;

-- 14.3 Unread message count per conversation
SELECT
    c.id AS conversation_id,
    c.channel,
    c.subject,
    c.customer_name,
    (SELECT COUNT(*) FROM inbox_messages im WHERE im.conversation_id = c.id AND im.is_read = FALSE) AS unread_count,
    c.last_message_at
FROM inbox_conversations c
WHERE EXISTS (
    SELECT 1 FROM inbox_messages im
    WHERE im.conversation_id = c.id AND im.is_read = FALSE
)
ORDER BY c.last_message_at DESC;

-- 14.4 Messages for a specific conversation
SELECT
    im.id AS message_id,
    im.sender_type,
    im.sender_name,
    im.body,
    im.is_read,
    im.created_at
FROM inbox_messages im
WHERE im.conversation_id = 'CONV-001'   -- Replace with actual conversation ID
ORDER BY im.created_at;


-- ============================================================================
-- 15. SETTINGS & LANGUAGE QUERIES
-- ============================================================================

-- 15.1 Get current language setting
SELECT value AS current_language
FROM settings
WHERE key = 'language';

-- 15.2 Update language setting
-- UPDATE settings SET value = 'tl', updated_at = NOW(), updated_by = 'USR-001' WHERE key = 'language';
-- Supported values: 'en' (English), 'tl' (Filipino), 'zh' (Chinese)

-- 15.3 Get all settings
SELECT key, value, description, updated_at, updated_by
FROM settings
ORDER BY key;
