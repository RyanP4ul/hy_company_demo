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
CREATE TYPE inventory_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE order_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE delivery_status AS ENUM ('pending', 'in_transit', 'delivered');
CREATE TYPE driver_status AS ENUM ('available', 'on_delivery', 'offline');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ALERT');
CREATE TYPE entity_type AS ENUM ('inventory', 'order', 'delivery', 'user', 'driver', 'customer');
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
    role_id     VARCHAR(50)  NOT NULL REFERENCES roles(id), -- FK to roles
    avatar      TEXT         DEFAULT '',
    status      user_status  NOT NULL DEFAULT 'active',
    last_active TIMESTAMP    DEFAULT NOW(),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.2 Roles & Permissions
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id          VARCHAR(50)  PRIMARY KEY,                    -- admin, manager, staff, driver, viewer
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT         NOT NULL DEFAULT ''
);

CREATE TABLE permissions (
    id          VARCHAR(50)  PRIMARY KEY,                    -- inv-view, ord-create, etc.
    label       VARCHAR(100) NOT NULL,
    category    VARCHAR(50)  NOT NULL                        -- Inventory, Orders, Deliveries, Users, Reports, Settings
);

CREATE TABLE role_permissions (
    role_id         VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    enabled         BOOLEAN     NOT NULL DEFAULT TRUE,
    PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- 2.3 Customers
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
-- 2.4 Warehouses (Lookup table)
-- ---------------------------------------------------------------------------
CREATE TABLE warehouses (
    id      VARCHAR(50)  PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE,
    address TEXT         DEFAULT ''
);

-- ---------------------------------------------------------------------------
-- 2.5 Inventory Categories (Lookup table)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory_categories (
    id      VARCHAR(50)  PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- 2.6 Inventory Items (Products)
-- ---------------------------------------------------------------------------
CREATE TABLE inventory (
    id          VARCHAR(20)        PRIMARY KEY,              -- SKU-001 format
    name        VARCHAR(200)       NOT NULL,
    category_id VARCHAR(50)        NOT NULL REFERENCES inventory_categories(id),
    price       DECIMAL(10,2)      NOT NULL DEFAULT 0.00,
    stock       INTEGER            NOT NULL DEFAULT 0,
    min_stock   INTEGER            NOT NULL DEFAULT 0,
    warehouse_id VARCHAR(50)       NOT NULL REFERENCES warehouses(id),
    status      inventory_status   NOT NULL DEFAULT 'in_stock',
    last_updated DATE              NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMP          NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP          NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.7 Orders
-- ---------------------------------------------------------------------------
CREATE TABLE orders (
    id              VARCHAR(20)      PRIMARY KEY,            -- ORD-2847 format
    customer_id     VARCHAR(20)      REFERENCES customers(id),
    customer_name   VARCHAR(200)     NOT NULL,               -- denormalized for quick lookup
    item_count      INTEGER          NOT NULL DEFAULT 0,
    total           DECIMAL(12,2)    NOT NULL DEFAULT 0.00,
    status          order_status     NOT NULL DEFAULT 'pending',
    priority        order_priority   NOT NULL DEFAULT 'medium',
    notes           TEXT             DEFAULT '',
    assigned_driver_id VARCHAR(20)   DEFAULT NULL,           -- FK to drivers (set later)
    created_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.8 Order Items (Line items within an order)
-- ---------------------------------------------------------------------------
CREATE TABLE order_items (
    id          VARCHAR(50)    PRIMARY KEY,
    order_id    VARCHAR(20)    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  VARCHAR(20)    NOT NULL REFERENCES inventory(id),
    product_name VARCHAR(200)  NOT NULL,                     -- denormalized
    quantity    INTEGER        NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    subtotal    DECIMAL(12,2)  GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at  TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2.9 Drivers
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
-- 2.10 Deliveries
-- ---------------------------------------------------------------------------
CREATE TABLE deliveries (
    id              VARCHAR(20)      PRIMARY KEY,            -- DEL-1092 format
    order_id        VARCHAR(20)      NOT NULL REFERENCES orders(id),
    driver_id       VARCHAR(20)      NOT NULL REFERENCES drivers(id),
    destination     TEXT             NOT NULL,
    status          delivery_status  NOT NULL DEFAULT 'pending',
    eta             VARCHAR(100)     DEFAULT '',
    progress        INTEGER          NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    started_at      TIMESTAMP        DEFAULT NULL,
    completed_at    TIMESTAMP        DEFAULT NULL,
    created_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
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
-- 2.12 Notifications
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
-- 2.13 Audit Logs
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
-- 2.14 Activity Timeline
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
-- 2.15 Archives (Soft-delete records)
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
-- 2.16 Settings (Key-value store for app settings)
-- ---------------------------------------------------------------------------
CREATE TABLE settings (
    key         VARCHAR(100) PRIMARY KEY,
    value       TEXT         NOT NULL,
    description TEXT         DEFAULT '',
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_by  VARCHAR(20)  DEFAULT 'system'
);


-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role_id);
CREATE INDEX idx_users_status   ON users(status);

-- Customers
CREATE INDEX idx_customers_name     ON customers(name);
CREATE INDEX idx_customers_status   ON customers(status);
CREATE INDEX idx_customers_company  ON customers(company);

-- Inventory
CREATE INDEX idx_inventory_category   ON inventory(category_id);
CREATE INDEX idx_inventory_warehouse  ON inventory(warehouse_id);
CREATE INDEX idx_inventory_status     ON inventory(status);
CREATE INDEX idx_inventory_name       ON inventory(name);
CREATE INDEX idx_inventory_low_stock  ON inventory(status, stock, min_stock)
    WHERE status IN ('out_of_stock', 'low_stock');

-- Orders
CREATE INDEX idx_orders_customer    ON orders(customer_id);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_priority    ON orders(priority);
CREATE INDEX idx_orders_date        ON orders(created_at DESC);
CREATE INDEX idx_orders_driver      ON orders(assigned_driver_id);

-- Order Items
CREATE INDEX idx_order_items_order    ON order_items(order_id);
CREATE INDEX idx_order_items_product  ON order_items(product_id);

-- Drivers
CREATE INDEX idx_drivers_status    ON drivers(status);
CREATE INDEX idx_drivers_name      ON drivers(name);

-- Deliveries
CREATE INDEX idx_deliveries_order    ON deliveries(order_id);
CREATE INDEX idx_deliveries_driver   ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status   ON deliveries(status);
CREATE INDEX idx_deliveries_date     ON deliveries(created_at DESC);

-- Delivery Timeline
CREATE INDEX idx_delivery_timeline_delivery ON delivery_timeline(delivery_id);

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


-- ============================================================================
-- 4. VIEWS (Common queries)
-- ============================================================================

-- 4.1 Inventory with category and warehouse names
CREATE VIEW v_inventory_detail AS
SELECT
    i.id,
    i.name,
    c.name           AS category,
    i.price,
    i.stock,
    i.min_stock,
    i.status,
    w.name           AS warehouse,
    i.last_updated,
    CASE
        WHEN i.stock = 0 THEN 'out_of_stock'
        WHEN i.stock <= i.min_stock THEN 'low_stock'
        ELSE 'in_stock'
    END              AS computed_status,
    i.created_at,
    i.updated_at
FROM inventory i
LEFT JOIN inventory_categories c ON i.category_id = c.id
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
    ord.total          AS order_total,
    drv.name          AS driver_name,
    drv.phone         AS driver_phone,
    drv.vehicle,
    del.destination,
    del.status,
    del.eta,
    del.progress,
    del.started_at,
    del.completed_at,
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
    (SELECT COUNT(*) FROM inventory WHERE status = 'low_stock' OR status = 'out_of_stock') AS low_stock_items;

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


-- ============================================================================
-- 5. TRIGGERS & FUNCTIONS
-- ============================================================================

-- 5.1 Auto-calculate inventory status based on stock vs min_stock
CREATE OR REPLACE FUNCTION fn_update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock = 0 THEN
        NEW.status := 'out_of_stock';
    ELSIF NEW.stock <= NEW.min_stock THEN
        NEW.status := 'low_stock';
    ELSE
        NEW.status := 'in_stock';
    END IF;
    NEW.last_updated := CURRENT_DATE;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_status
    BEFORE INSERT OR UPDATE OF stock, min_stock ON inventory
    FOR EACH ROW EXECUTE FUNCTION fn_update_inventory_status();

-- 5.2 Log audit trail for inventory changes
CREATE OR REPLACE FUNCTION fn_audit_inventory_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (id, user_name, action, resource, resource_id, details, ip_address)
        VALUES (
            'LOG-' || LPAD(NEXTVAL('audit_seq')::TEXT, 4, '0'),
            current_setting('app.current_user', TRUE),
            'CREATE',
            'Product',
            NEW.id,
            jsonb_build_object('name', NEW.name, 'price', NEW.price, 'stock', NEW.stock),
            current_setting('app.client_ip', TRUE)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (id, user_name, action, resource, resource_id, details, ip_address)
        VALUES (
            'LOG-' || LPAD(NEXTVAL('audit_seq')::TEXT, 4, '0'),
            current_setting('app.current_user', TRUE),
            'UPDATE',
            'Product',
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
-- (Adjust trigger as needed — the above is a template for column-level diff)

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

CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users      FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON customers  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_orders_updated    BEFORE UPDATE ON orders     FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_drivers_updated   BEFORE UPDATE ON drivers    FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_settings_updated  BEFORE UPDATE ON settings   FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- 5.6 Notify on low stock
CREATE OR REPLACE FUNCTION fn_check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    low_stock_count INTEGER;
BEGIN
    IF NEW.stock <= NEW.min_stock THEN
        INSERT INTO notifications (user_id, title, message, type)
        SELECT
            u.id,
            'Low Stock Alert',
            NEW.name || ' is running low on stock (' || NEW.stock || ' units remaining, minimum: ' || NEW.min_stock || ')',
            CASE
                WHEN NEW.stock = 0 THEN 'error'
                ELSE 'warning'
            END
        FROM users u
        WHERE u.role_id IN (SELECT id FROM roles WHERE id IN ('admin', 'manager'))
          AND u.status = 'active';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_low_stock_alert
    AFTER UPDATE OF stock ON inventory
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

-- -- Example: Staff can only view/edit their assigned orders
-- CREATE POLICY staff_order_access ON orders
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM users u
--             JOIN role_permissions rp ON u.role_id = rp.role_id
--             JOIN permissions p ON rp.permission_id = p.id
--             WHERE u.id = current_setting('app.current_user_id') TRUE
--               AND p.id = 'ord-view'
--         )
--     );
