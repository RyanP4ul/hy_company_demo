-- ============================================================================
-- HyOps — Full SQL Schema
-- Cloud-Based Real-Time Inventory, Order & Delivery Management
-- ============================================================================
-- Compatible with PostgreSQL 15+
-- For SQLite, replace ENUM types with CHECK constraints and remove
-- CASCADE options. See comments marked [SQLite] throughout.
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE customer_status AS ENUM ('active', 'inactive');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE order_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE delivery_status AS ENUM ('pending', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE driver_status AS ENUM ('available', 'on_delivery', 'offline');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ALERT');
CREATE TYPE entity_type AS ENUM ('inventory', 'order', 'delivery', 'user', 'driver', 'customer', 'warehouse', 'sale');
CREATE TYPE activity_type AS ENUM ('order', 'alert', 'delivery', 'inventory', 'user', 'payment');

-- ============================================================================
-- 2. CORE TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 Users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id          VARCHAR(20)  PRIMARY KEY,                    -- USR-001 format
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,                       -- bcrypt hash
    role        VARCHAR(10)  NOT NULL DEFAULT 'Staff' CHECK (role IN ('Admin', 'Staff')),
    avatar      TEXT         DEFAULT '',
    status      user_status  NOT NULL DEFAULT 'active',
    last_active TIMESTAMP    DEFAULT NOW(),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.2 Customers
-- ---------------------------------------------------------------------------
CREATE TABLE customers (
    id              VARCHAR(20)      PRIMARY KEY,            -- CST-001 format
    name            VARCHAR(100)     NOT NULL,
    contact_number  VARCHAR(30)      NOT NULL,
    company         VARCHAR(150)     DEFAULT '',
    address         TEXT             DEFAULT '',
    total_orders    INTEGER          NOT NULL DEFAULT 0,
    total_spent     DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    status          customer_status  NOT NULL DEFAULT 'active',
    join_date       DATE             NOT NULL DEFAULT CURRENT_DATE,
    last_order_date DATE,
    created_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.3 Warehouses
-- ---------------------------------------------------------------------------
CREATE TABLE warehouses (
    id            VARCHAR(20)   PRIMARY KEY,                 -- WH-001 format
    name          VARCHAR(200)  NOT NULL,
    address       TEXT          DEFAULT '',
    city          VARCHAR(100)  DEFAULT '',
    type          VARCHAR(20)   NOT NULL DEFAULT 'main' CHECK (type IN ('main', 'regional', 'fulfillment', 'cold_storage')),
    status        VARCHAR(20)   NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    utilized      INTEGER       NOT NULL DEFAULT 0,
    manager       VARCHAR(100)  DEFAULT '',
    contact_phone VARCHAR(30)   DEFAULT '',
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.4 Inventory Items (Products)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory (
    id           VARCHAR(20)       PRIMARY KEY,              -- SKU-001 format
    name         VARCHAR(200)      NOT NULL,
    warehouse_id VARCHAR(50)       NOT NULL REFERENCES warehouses(id),
    last_updated DATE              NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMP         NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP         NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.5 Product Types (variants per product)
-- ---------------------------------------------------------------------------
CREATE TABLE product_types (
    id           VARCHAR(20)   PRIMARY KEY,                 -- T-001 format
    product_id   VARCHAR(20)   NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    name         VARCHAR(100)  NOT NULL,                     -- e.g. 'Small', 'Medium', 'Pro'
    stock        INTEGER       NOT NULL DEFAULT 0,
    min_stock    INTEGER       NOT NULL DEFAULT 0,
    price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.6 Orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id                VARCHAR(20)      PRIMARY KEY,          -- ORD-2847 format
    customer_id       VARCHAR(20)      REFERENCES customers(id),
    customer_name     VARCHAR(200)     NOT NULL,             -- denormalized for quick lookup
    item_count        INTEGER          NOT NULL DEFAULT 0,
    total             DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    status            order_status     NOT NULL DEFAULT 'pending',
    priority          order_priority   NOT NULL DEFAULT 'medium',
    payment_status    VARCHAR(10)      NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'delayed')),
    delivery_type     VARCHAR(20)      DEFAULT '',
    notes             TEXT             DEFAULT '',
    assigned_driver_id VARCHAR(20)     DEFAULT NULL,         -- FK to drivers (set later)
    created_at        TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.7 Order Items (Line items within an order)
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id           VARCHAR(50)    PRIMARY KEY,
    order_id     VARCHAR(20)    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id   VARCHAR(20)    NOT NULL REFERENCES inventory(id),
    product_name VARCHAR(200)   NOT NULL,                     -- denormalized
    type_id      VARCHAR(20)    NOT NULL REFERENCES product_types(id),  -- NEW
    type_name    VARCHAR(100)   NOT NULL DEFAULT '',          -- denormalized type name, NEW
    quantity     INTEGER        NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price   DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    subtotal     DECIMAL(12,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at   TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.8 Drivers
-- ---------------------------------------------------------------------------
CREATE TABLE drivers (
    id                  VARCHAR(20)    PRIMARY KEY,          -- DRV-001 format
    user_id             VARCHAR(20)    DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
    name                VARCHAR(100)   NOT NULL,
    phone               VARCHAR(30)    NOT NULL,
    status              driver_status  NOT NULL DEFAULT 'available',
    vehicle             VARCHAR(100)   DEFAULT '',
    completed_today     INTEGER        NOT NULL DEFAULT 0,
    rating              DECIMAL(2,1)   NOT NULL DEFAULT 0.0 CHECK (rating >= 0 AND rating <= 5),
    total_deliveries    INTEGER        NOT NULL DEFAULT 0,
    created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.9 Deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE deliveries (
    id                  VARCHAR(20)      PRIMARY KEY,        -- DEL-1092 format
    order_id            VARCHAR(20)      NOT NULL REFERENCES orders(id),
    driver_id           VARCHAR(20)      NOT NULL REFERENCES drivers(id),
    status              delivery_status  NOT NULL DEFAULT 'pending',
    eta                 VARCHAR(100)     DEFAULT '',
    progress            INTEGER          NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    origin_lat          DECIMAL(10,7),
    origin_lng          DECIMAL(10,7),
    current_stop_index  INTEGER          DEFAULT 0,
    total_distance      DECIMAL(8,2)     DEFAULT 0,
    total_orders        INTEGER          DEFAULT 0,
    total_value         DECIMAL(12,2)    DEFAULT 0,
    scheduled_date      DATE,
    scheduled_time      VARCHAR(10),
    rescheduled_date    DATE,
    rescheduled_time    VARCHAR(10),
    reschedule_reason   TEXT,
    cancel_reason       TEXT,
    started_at          TIMESTAMP        DEFAULT NULL,
    completed_at        TIMESTAMP        DEFAULT NULL,
    created_at          TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.10 Delivery Stops (Multi-stop delivery model)
-- ---------------------------------------------------------------------------
CREATE TABLE delivery_stops (
    id                VARCHAR(20)      PRIMARY KEY,
    delivery_id       VARCHAR(20)      NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    order_id          VARCHAR(20)      DEFAULT NULL,
    customer          VARCHAR(200)     NOT NULL,
    address           TEXT             NOT NULL,
    status            VARCHAR(20)      NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'delivered')),
    items             INTEGER          NOT NULL DEFAULT 0,
    total             DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    delivered_at      TIMESTAMP        DEFAULT NULL,
    distance_from_prev DECIMAL(8,2)    DEFAULT 0,
    estimated_arrival VARCHAR(50)      DEFAULT '',
    notes             TEXT             DEFAULT '',
    lat               DECIMAL(10,7)    DEFAULT 0,
    lng               DECIMAL(10,7)    DEFAULT 0,
    sort_order        INTEGER          NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 2.11 Delivery Timeline (Steps per delivery)
-- ---------------------------------------------------------------------------
CREATE TABLE delivery_timeline (
    id          SERIAL      PRIMARY KEY,
    delivery_id VARCHAR(20) NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
    step_name   VARCHAR(100) NOT NULL,
    step_time   VARCHAR(50)  NOT NULL,                       -- e.g. "09:00 AM"
    completed   BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_order  INTEGER      NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------------------
-- 2.12 Sales
-- ---------------------------------------------------------------------------
CREATE TABLE sales (
    id              VARCHAR(20)      PRIMARY KEY,
    order_id        VARCHAR(20)      NOT NULL REFERENCES orders(id),
    customer        VARCHAR(200)     NOT NULL,
    items           INTEGER          NOT NULL DEFAULT 0,
    subtotal        DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    tax             DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    total           DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    payment_method  VARCHAR(10)      NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'gcash', 'visa')),
    status          VARCHAR(20)      NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'pending')),
    sold_at         DATE             NOT NULL DEFAULT CURRENT_DATE,
    recorded_at     TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.13 Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
    id          SERIAL      PRIMARY KEY,
    user_id     VARCHAR(20) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    message     TEXT        NOT NULL,
    type        notification_type NOT NULL DEFAULT 'info',
    is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.14 Audit Logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id          VARCHAR(20)    PRIMARY KEY,                  -- LOG-001 format
    user_name   VARCHAR(100)   NOT NULL DEFAULT 'System',   -- who performed the action
    action      audit_action   NOT NULL,
    resource    VARCHAR(100)   NOT NULL,                     -- Product, Order, Delivery, User, etc.
    resource_id VARCHAR(50)    NOT NULL,                     -- FK reference (SKU-001, ORD-2847, etc.)
    details     JSONB          DEFAULT '{}',                 -- { field, old, new } or { alert, current, minimum }
    ip_address  VARCHAR(45)    DEFAULT 'system',
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.15 Activity Timeline
-- ---------------------------------------------------------------------------
CREATE TABLE activity_timeline (
    id          SERIAL          PRIMARY KEY,
    user_name   VARCHAR(100)    NOT NULL,
    action      VARCHAR(200)    NOT NULL,
    target      VARCHAR(200)    NOT NULL,                     -- ORD-2847, DEL-1091, etc.
    target_type activity_type   NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.16 Archives (Soft-delete records)
-- ---------------------------------------------------------------------------
CREATE TABLE archives (
    id          SERIAL      PRIMARY KEY,
    entity_type entity_type NOT NULL,
    entity_id   VARCHAR(50) NOT NULL,
    entity_data JSONB       NOT NULL,                       -- full snapshot of the archived record
    label       VARCHAR(200) NOT NULL DEFAULT '',
    archived_at TIMESTAMP   NOT NULL DEFAULT NOW(),
    restored_at TIMESTAMP   DEFAULT NULL,
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE           -- true = permanently deleted
);

-- ---------------------------------------------------------------------------
-- 2.17 Settings (Key-value store for app settings)
-- ---------------------------------------------------------------------------
CREATE TABLE settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL,
    description TEXT         DEFAULT '',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_by  VARCHAR(20)  DEFAULT 'system'
);

-- ---------------------------------------------------------------------------
-- 2.18 Inbox Conversations
-- ---------------------------------------------------------------------------
CREATE TABLE inbox_conversations (
    id                  VARCHAR(20)      PRIMARY KEY,
    channel             VARCHAR(10)      NOT NULL CHECK (channel IN ('viber', 'wechat')),
    customer_name       VARCHAR(200)     NOT NULL,
    customer_phone      VARCHAR(30)      NOT NULL,
    customer_type       VARCHAR(10)      NOT NULL DEFAULT 'regular' CHECK (customer_type IN ('regular', 'new')),
    customer_orders     INTEGER          NOT NULL DEFAULT 0,
    customer_total_spent DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    customer_since      DATE,
    status              VARCHAR(20)      NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'pending')),
    assigned_to         VARCHAR(100)     DEFAULT '',
    last_message        TEXT             DEFAULT '',
    last_message_time   VARCHAR(50)      DEFAULT '',
    unread_count        INTEGER          NOT NULL DEFAULT 0,
    created_at          TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.19 Inbox Messages
-- ---------------------------------------------------------------------------
CREATE TABLE inbox_messages (
    id              VARCHAR(20)  PRIMARY KEY,
    conversation_id VARCHAR(20)  NOT NULL REFERENCES inbox_conversations(id) ON DELETE CASCADE,
    sender          VARCHAR(10)  NOT NULL CHECK (sender IN ('customer', 'agent')),
    content         TEXT         NOT NULL,
    timestamp       TIMESTAMP    NOT NULL DEFAULT NOW(),
    type            VARCHAR(20)  NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'order_inquiry', 'location')),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);


-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_status   ON users(status);

-- Customers
CREATE INDEX idx_customers_name     ON customers(name);
CREATE INDEX idx_customers_status   ON customers(status);
CREATE INDEX idx_customers_company  ON customers(company);

-- Warehouses
CREATE INDEX idx_warehouses_type    ON warehouses(type);
CREATE INDEX idx_warehouses_status  ON warehouses(status);
CREATE INDEX idx_warehouses_city    ON warehouses(city);

-- Inventory
CREATE INDEX idx_inventory_warehouse  ON inventory(warehouse_id);
CREATE INDEX idx_inventory_name       ON inventory(name);

-- Product Types
CREATE INDEX idx_product_types_product   ON product_types(product_id);
CREATE INDEX idx_product_types_stock     ON product_types(stock, min_stock);
CREATE INDEX idx_product_types_name      ON product_types(name);

-- Orders
CREATE INDEX idx_orders_customer     ON orders(customer_id);
CREATE INDEX idx_orders_status       ON orders(status);
CREATE INDEX idx_orders_priority     ON orders(priority);
CREATE INDEX idx_orders_date         ON orders(created_at DESC);
CREATE INDEX idx_orders_driver       ON orders(assigned_driver_id);
CREATE INDEX idx_orders_payment      ON orders(payment_status);

-- Order Items
CREATE INDEX idx_order_items_order    ON order_items(order_id);
CREATE INDEX idx_order_items_product  ON order_items(product_id);
CREATE INDEX idx_order_items_type     ON order_items(type_id);

-- Drivers
CREATE INDEX idx_drivers_status    ON drivers(status);
CREATE INDEX idx_drivers_name      ON drivers(name);

-- Deliveries
CREATE INDEX idx_deliveries_order    ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver   ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status   ON deliveries(status);
CREATE INDEX idx_deliveries_date     ON deliveries(created_at DESC);

-- Delivery Stops
CREATE INDEX idx_delivery_stops_delivery  ON delivery_stops(delivery_id);
CREATE INDEX idx_delivery_stops_status    ON delivery_stops(status);
CREATE INDEX idx_delivery_stops_order     ON delivery_stops(order_id);

-- Delivery Timeline
CREATE INDEX idx_delivery_timeline_delivery ON delivery_timeline(delivery_id);

-- Sales
CREATE INDEX idx_sales_order       ON sales(order_id);
CREATE INDEX idx_sales_customer    ON sales(customer);
CREATE INDEX idx_sales_sold_at     ON sales(sold_at DESC);
CREATE INDEX idx_sales_status      ON sales(status);

-- Notifications
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_read    ON notifications(is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_type    ON notifications(type);

-- Audit Logs
CREATE INDEX idx_audit_logs_resource   ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX idx_audit_logs_timestamp  ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user       ON audit_logs(user_name);

-- Activity Timeline
CREATE INDEX idx_activity_target_type  ON activity_timeline(target_type);
CREATE INDEX idx_activity_timestamp    ON activity_timeline(created_at DESC);

-- Archives
CREATE INDEX idx_archives_type     ON archives(entity_type);
CREATE INDEX idx_archives_entity   ON archives(entity_type, entity_id);
CREATE INDEX idx_archives_deleted  ON archives(is_deleted) WHERE is_deleted = FALSE;

-- Inbox
CREATE INDEX idx_inbox_conversations_status    ON inbox_conversations(status);
CREATE INDEX idx_inbox_conversations_channel   ON inbox_conversations(channel);
CREATE INDEX idx_inbox_conversations_assigned  ON inbox_conversations(assigned_to);
CREATE INDEX idx_inbox_messages_conversation   ON inbox_messages(conversation_id);


-- ============================================================================
-- 4. VIEWS (Common queries)
-- ============================================================================

-- 4.1 Inventory with warehouse and type summary
CREATE VIEW v_inventory_detail AS
SELECT
    i.id,
    i.name,
    w.name                              AS warehouse,
    i.last_updated,
    -- Aggregated from product_types
    (SELECT COUNT(*) FROM product_types pt WHERE pt.product_id = i.id) AS type_count,
    (SELECT COALESCE(SUM(pt.stock), 0) FROM product_types pt WHERE pt.product_id = i.id) AS total_stock,
    (SELECT MIN(pt.price) FROM product_types pt WHERE pt.product_id = i.id) AS min_price,
    (SELECT MAX(pt.price) FROM product_types pt WHERE pt.product_id = i.id) AS max_price,
    -- Computed status (matches frontend logic)
    CASE
        WHEN EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock = 0) THEN 'out_of_stock'
        WHEN EXISTS (SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND pt.stock < pt.min_stock) THEN 'low_stock'
        ELSE 'in_stock'
    END                                  AS computed_status,
    i.created_at,
    i.updated_at
FROM inventory i
LEFT JOIN warehouses w ON i.warehouse_id = w.id;

-- 4.2 Orders with customer details
CREATE VIEW v_orders_detail AS
SELECT
    o.id,
    o.customer_id,
    COALESCE(c.name, o.customer_name) AS customer_name,
    c.contact_number,
    c.company,
    o.item_count,
    o.total,
    o.status,
    o.priority,
    o.payment_status,
    o.delivery_type,
    o.notes,
    d.name           AS assigned_driver,
    o.created_at,
    o.updated_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN drivers d ON o.assigned_driver_id = d.id;

-- 4.3 Deliveries with order and driver details
CREATE VIEW v_deliveries_detail AS
SELECT
    del.id,
    del.order_id,
    ord.customer_name,
    ord.total              AS order_total,
    drv.name              AS driver_name,
    drv.phone             AS driver_phone,
    drv.vehicle,
    del.status,
    del.eta,
    del.progress,
    del.origin_lat,
    del.origin_lng,
    del.current_stop_index,
    del.total_distance,
    del.total_orders,
    del.total_value,
    del.scheduled_date,
    del.scheduled_time,
    del.rescheduled_date,
    del.rescheduled_time,
    del.started_at,
    del.completed_at,
    (SELECT COUNT(*) FROM delivery_stops WHERE delivery_id = del.id) AS stop_count,
    (SELECT COUNT(*) FROM delivery_stops WHERE delivery_id = del.id AND status = 'delivered') AS stops_delivered,
    del.created_at
FROM deliveries del
LEFT JOIN orders ord ON del.order_id = ord.id
LEFT JOIN drivers drv ON del.driver_id = drv.id;

-- 4.4 Dashboard KPI summary
CREATE VIEW v_dashboard_kpi AS
SELECT
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled')       AS total_revenue,
    (SELECT COUNT(*) FROM orders)                                                   AS total_orders,
    (SELECT COUNT(*) FROM inventory)                                                AS total_products,
    ROUND(
        (SELECT COUNT(*) FROM deliveries WHERE status = 'delivered')::NUMERIC
        / NULLIF((SELECT COUNT(*) FROM deliveries), 0) * 100, 1
    )                                                                               AS delivery_rate_pct,
    (SELECT COUNT(*) FROM customers WHERE status = 'active')                        AS active_customers,
    (SELECT COUNT(*) FROM drivers WHERE status = 'available')                       AS available_drivers,
    (SELECT COUNT(*) FROM inventory i WHERE EXISTS (
        SELECT 1 FROM product_types pt WHERE pt.product_id = i.id AND (pt.stock = 0 OR pt.stock < pt.min_stock)
    )) AS low_stock_items;

-- 4.5 Top customers by total orders
CREATE VIEW v_top_customers AS
SELECT
    id,
    name,
    company,
    total_orders,
    total_spent,
    last_order_date
FROM customers
WHERE status = 'active'
ORDER BY total_orders DESC, total_spent DESC;

-- 4.6 Driver performance summary
CREATE VIEW v_driver_performance AS
SELECT
    d.id,
    d.name,
    d.phone,
    d.status,
    d.vehicle,
    d.completed_today,
    d.rating,
    d.total_deliveries,
    (SELECT COUNT(*) FROM deliveries WHERE driver_id = d.id AND status = 'in_transit') AS active_deliveries,
    (SELECT COUNT(*) FROM deliveries WHERE driver_id = d.id AND DATE(completed_at) = CURRENT_DATE) AS completed_today_actual
FROM drivers d;

-- 4.7 Recent activity feed
CREATE VIEW v_recent_activity AS
SELECT
    'audit'    AS source,
    user_name,
    action::TEXT AS action_type,
    resource || ' ' || resource_id AS target,
    details,
    created_at
FROM audit_logs
UNION ALL
SELECT
    'activity' AS source,
    user_name,
    action     AS action_type,
    target,
    NULL::JSONB AS details,
    created_at
FROM activity_timeline
ORDER BY created_at DESC
LIMIT 50;

-- 4.8 Monthly revenue report
CREATE VIEW v_monthly_revenue AS
SELECT
    TO_CHAR(created_at, 'Mon') AS month,
    EXTRACT(MONTH FROM created_at) AS month_num,
    SUM(total) AS revenue,
    COUNT(*)   AS orders_count
FROM orders
WHERE status != 'cancelled'
GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
ORDER BY month_num;

-- 4.9 Warehouse summary
CREATE VIEW v_warehouse_summary AS
SELECT
    w.id,
    w.name,
    w.city,
    w.type,
    w.status,
    w.utilized,
    w.manager,
    w.contact_phone,
    (SELECT COUNT(*) FROM inventory i WHERE i.warehouse_id = w.id) AS product_count,
    (SELECT COALESCE(SUM(pt.stock), 0) FROM inventory i JOIN product_types pt ON pt.product_id = i.id WHERE i.warehouse_id = w.id) AS total_stock,
    (SELECT COALESCE(SUM(pt.price * pt.stock), 0) FROM inventory i JOIN product_types pt ON pt.product_id = i.id WHERE i.warehouse_id = w.id) AS inventory_value
FROM warehouses w;


-- ============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================================================

-- 5.1 Recalculate inventory status when product types change
CREATE OR REPLACE FUNCTION fn_recalc_product_types()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the parent inventory's last_updated timestamp
    UPDATE inventory SET last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_types_update
    AFTER INSERT OR UPDATE OR DELETE ON product_types
    FOR EACH ROW EXECUTE FUNCTION fn_recalc_product_types();

-- 5.2 Log audit trail for product type changes
CREATE OR REPLACE FUNCTION fn_audit_product_type_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (id, user_name, action, resource, resource_id, details, ip_address)
        VALUES (
            'LOG-' || LPAD(NEXTVAL('audit_seq')::TEXT, 4, '0'),
            current_setting('app.current_user', TRUE),
            'CREATE',
            'ProductType',
            NEW.id,
            jsonb_build_object('product_id', NEW.product_id, 'name', NEW.name, 'price', NEW.price, 'stock', NEW.stock),
            current_setting('app.client_ip', TRUE)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (id, user_name, action, resource, resource_id, details, ip_address)
        VALUES (
            'LOG-' || LPAD(NEXTVAL('audit_seq')::TEXT, 4, '0'),
            current_setting('app.current_user', TRUE),
            'UPDATE',
            'ProductType',
            NEW.id,
            jsonb_build_object(
                'changes', jsonb_agg(
                    jsonb_build_object(
                        'field', key,
                        'old', OLD[key],
                        'new', NEW[key]
                    )
                )
            ),
            current_setting('app.client_ip', TRUE)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS audit_seq START 1000;

CREATE TRIGGER trg_product_type_audit
    AFTER INSERT OR UPDATE ON product_types
    FOR EACH ROW EXECUTE FUNCTION fn_audit_product_type_changes();

-- 5.3 Auto-update order total from line items
CREATE OR REPLACE FUNCTION fn_update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total = (
        SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = NEW.order_id
    ),
    item_count = (
        SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = NEW.order_id
    ),
    updated_at = NOW()
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_items_total
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW EXECUTE FUNCTION fn_update_order_total();

-- 5.4 Auto-set delivery progress to 100 on completion
CREATE OR REPLACE FUNCTION fn_delivery_completed()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        NEW.progress := 100;
        NEW.completed_at := NOW();
        NEW.eta := 'Delivered';

        -- Log the delivery completion
        INSERT INTO activity_timeline (user_name, action, target, target_type)
        VALUES (
            COALESCE(
                (SELECT name FROM drivers WHERE id = NEW.driver_id),
                'Driver'
            ),
            'completed delivery',
            NEW.id,
            'delivery'
        );
    END IF;

    IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
        NEW.eta := 'Cancelled';
    END IF;

    IF NEW.status = 'in_transit' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
        NEW.started_at := COALESCE(NEW.started_at, NOW());
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_delivery_status
    BEFORE UPDATE OF status ON deliveries
    FOR EACH ROW EXECUTE FUNCTION fn_delivery_completed();

-- 5.5 Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated        BEFORE UPDATE ON users                FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_customers_updated    BEFORE UPDATE ON customers            FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_orders_updated       BEFORE UPDATE ON orders               FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_drivers_updated      BEFORE UPDATE ON drivers              FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_settings_updated     BEFORE UPDATE ON settings             FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_warehouses_updated   BEFORE UPDATE ON warehouses           FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_inbox_updated        BEFORE UPDATE ON inbox_conversations  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_product_types_updated BEFORE UPDATE ON product_types       FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- 5.6 Notify on low stock (fires on product_types table)
CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_product_name VARCHAR(200);
BEGIN
    SELECT name INTO v_product_name FROM inventory WHERE id = NEW.product_id;

    IF NEW.stock <= NEW.min_stock THEN
        INSERT INTO notifications (user_id, title, message, type)
        SELECT
            u.id,
            'Low Stock Alert',
            v_product_name || ' — ' || NEW.name || ' is running low on stock (' || NEW.stock || ' units remaining, minimum: ' || NEW.min_stock || ')',
            CASE
                WHEN NEW.stock = 0 THEN 'error'
                ELSE 'warning'
            END
        FROM users u
        WHERE u.role = 'Admin'
          AND u.status = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock_alert
    AFTER UPDATE OF stock ON product_types
    FOR EACH ROW
    WHEN (NEW.stock <= NEW.min_stock)
    EXECUTE FUNCTION fn_check_low_stock();

-- 5.7 Log order creation activity
CREATE OR REPLACE FUNCTION fn_log_order_created()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_timeline (user_name, action, target, target_type)
    VALUES (
        current_setting('app.current_user', TRUE),
        'created order',
        NEW.id,
        'order'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_created
    AFTER INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION fn_log_order_created();


-- ============================================================================
-- 6. STORED PROCEDURES
-- ============================================================================

-- 6.1 Archive an entity (soft delete)
CREATE OR REPLACE PROCEDURE archive_entity(
    p_entity_type entity_type,
    p_entity_id   VARCHAR(50)
)
LANGUAGE plpgsql AS $$
DECLARE
    v_label VARCHAR(200);
    v_data  JSONB;
BEGIN
    CASE p_entity_type
        WHEN 'inventory' THEN
            SELECT row_to_json(i)::JSONB INTO v_data FROM inventory i WHERE i.id = p_entity_id;
            SELECT name INTO v_label FROM inventory WHERE id = p_entity_id;
        WHEN 'order' THEN
            SELECT row_to_json(o)::JSONB INTO v_data FROM orders o WHERE o.id = p_entity_id;
            SELECT 'Order ' || id INTO v_label FROM orders WHERE id = p_entity_id;
        WHEN 'delivery' THEN
            SELECT row_to_json(d)::JSONB INTO v_data FROM deliveries d WHERE d.id = p_entity_id;
            SELECT 'Delivery ' || id INTO v_label FROM deliveries WHERE id = p_entity_id;
        WHEN 'user' THEN
            SELECT row_to_json(u)::JSONB INTO v_data FROM users u WHERE u.id = p_entity_id;
            SELECT name INTO v_label FROM users WHERE id = p_entity_id;
        WHEN 'driver' THEN
            SELECT row_to_json(d)::JSONB INTO v_data FROM drivers d WHERE d.id = p_entity_id;
            SELECT name INTO v_label FROM drivers WHERE id = p_entity_id;
        WHEN 'customer' THEN
            SELECT row_to_json(c)::JSONB INTO v_data FROM customers c WHERE c.id = p_entity_id;
            SELECT name INTO v_label FROM customers WHERE id = p_entity_id;
        WHEN 'warehouse' THEN
            SELECT row_to_json(w)::JSONB INTO v_data FROM warehouses w WHERE w.id = p_entity_id;
            SELECT name INTO v_label FROM warehouses WHERE id = p_entity_id;
        WHEN 'sale' THEN
            SELECT row_to_json(s)::JSONB INTO v_data FROM sales s WHERE s.id = p_entity_id;
            SELECT 'Sale ' || id INTO v_label FROM sales WHERE id = p_entity_id;
    END CASE;

    IF v_data IS NOT NULL THEN
        INSERT INTO archives (entity_type, entity_id, entity_data, label)
        VALUES (p_entity_type, p_entity_id, v_data, COALESCE(v_label, p_entity_id));
    END IF;
END;
$$;

-- 6.2 Restore an archived entity
CREATE OR REPLACE PROCEDURE restore_entity(
    p_entity_type entity_type,
    p_entity_id   VARCHAR(50)
)
LANGUAGE plpgsql AS $$
DECLARE
    v_data JSONB;
BEGIN
    SELECT entity_data INTO v_data
    FROM archives
    WHERE entity_type = p_entity_type AND entity_id = p_entity_id
      AND is_deleted = FALSE
    ORDER BY archived_at DESC LIMIT 1;

    IF v_data IS NOT NULL THEN
        -- Mark as restored
        UPDATE archives
        SET restored_at = NOW()
        WHERE entity_type = p_entity_type AND entity_id = p_entity_id
          AND is_deleted = FALSE AND restored_at IS NULL;
    END IF;
END;
$$;


-- ============================================================================
-- 7. ROW LEVEL SECURITY (Optional - uncomment to enable)
-- ============================================================================

-- ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE orders    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- -- Example: Admin can access everything; Staff can only view their own data
-- CREATE POLICY admin_full_access ON orders
--     FOR ALL USING (
--         (SELECT role FROM users WHERE id = current_setting('app.current_user_id', TRUE)) = 'Admin'
--     );

-- CREATE POLICY staff_read_only ON orders
--     FOR SELECT USING (
--         (SELECT role FROM users WHERE id = current_setting('app.current_user_id', TRUE)) = 'Staff'
--     );
