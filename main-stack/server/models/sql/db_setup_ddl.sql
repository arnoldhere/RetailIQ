--- Create database & user (optional)
CREATE DATABASE IF NOT EXISTS retailiq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'retail'@'%' IDENTIFIED BY 'retailpass';
GRANT ALL PRIVILEGES ON retailiq.* TO 'retail'@'%';
FLUSH PRIVILEGES;
USE retailiq;


-- core tables (DDLS)
-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  role ENUM('admin','customer','store_manager', 'supplier') NOT NULL DEFAULT 'customer',
  phone VARCHAR(50) UNIQUE,
  store_id INT NULL,
  address TEXT Null
  otp VARCHAR(10) NULL,
  otpGeneratedAt TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_store (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  description VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cust_id INT FOREIGN KEY REFERENCES users(id),
  name VARCHAR(255) Null UNIQUE,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50) UNIQUE,
  address VARCHAR(500) ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rating TINYINT UNSIGNED CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- STORES
CREATE TABLE IF NOT EXISTS stores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(50) UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  rating TINYINT UNSIGNED CHECK (rating BETWEEN 1 AND 5),
  owner_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_stores_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category_id INT NULL,
  supplier_id INT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sell_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_available INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  images JSON NULL, -- store array of image filenames/URLs
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category_id),
  INDEX idx_products_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUPPLY ORDERS (purchase orders from suppliers)
CREATE TABLE IF NOT EXISTS supply_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  supplier_id INT NOT NULL,
  store_id INT NOT NULL,
  ordered_by INT NULL,
  status ENUM('pending','sent','received','cancelled') NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  deliver_at DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_supplyorders_supplier (supplier_id),
  INDEX idx_supplyorders_store (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUPPLY ORDER ITEMS
CREATE TABLE IF NOT EXISTS supply_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supply_order_id INT NOT NULL,
  product_id INT NOT NULL,
  qty INT NOT NULL DEFAULT 0,
  cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount FLOAT DEFAULT 0.0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_supplyitems_order (supply_order_id),
  INDEX idx_supplyitems_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUPPLY PAYMENTS
CREATE TABLE IF NOT EXISTS supply_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supply_order_id INT NOT NULL,
  supplier_id INT NOT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  payment_date DATE,
  method ENUM('IMPS','NEFT','RTGS','CASH','CARD','OTHER') NOT NULL DEFAULT 'IMPS',
  payment_ref VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_supplypayments_order (supply_order_id),
  INDEX idx_supplypayments_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CUSTOMER ORDERS (sales)
CREATE TABLE IF NOT EXISTS customer_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(100) NOT NULL UNIQUE,
  cust_id INT NULL,
  store_id INT NOT NULL,
  cashier_id INT NULL,
  status ENUM('pending','processing','completed','cancelled','returned') NOT NULL DEFAULT 'pending',
  discount FLOAT DEFAULT 0.0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  payment_method ENUM('cash','card','upi','online','other') DEFAULT 'cash',
  payment_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_custorders_cust (cust_id),
  INDEX idx_custorders_store (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CUSTOMER ORDER ITEMS
CREATE TABLE IF NOT EXISTS customer_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_order_id INT NOT NULL,
  product_id INT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount FLOAT DEFAULT 0.0,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_custitems_order (customer_order_id),
  INDEX idx_custitems_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CUSTOMER PAYMENTS
CREATE TABLE IF NOT EXISTS customer_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_order_id INT NOT NULL,
  cust_id INT NULL,
  amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  payment_date DATE,
  method ENUM('cash','card','upi','online','other') NOT NULL DEFAULT 'cash',
  payment_ref VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_custpayments_order (customer_order_id),
  INDEX idx_custpayments_cust (cust_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- WISHLISTS
CREATE TABLE IF NOT EXISTS customer_wishlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cust_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wishlist_cust (cust_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer_wishlist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wishlist_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_wishlistitems_wishlist (wishlist_id),
  INDEX idx_wishlistitems_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CARTS
CREATE TABLE IF NOT EXISTS customer_carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cust_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cart_cust (cust_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS customer_cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cartitems_cart (cart_id),
  INDEX idx_cartitems_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FEEDBACKS
CREATE TABLE IF NOT EXISTS feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cust_id INT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feedbacks_cust (cust_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



--- Adding constraints 
-- users.store_id -> stores.id
ALTER TABLE users
  ADD CONSTRAINT fk_users_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- stores.owner_id -> users.id
ALTER TABLE stores
  ADD CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- products.category_id -> categories.id
ALTER TABLE products
  ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- products.supplier_id -> suppliers.id
ALTER TABLE products
  ADD CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- supply_orders -> suppliers, stores, users
ALTER TABLE supply_orders
  ADD CONSTRAINT fk_supplyorders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_supplyorders_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_supplyorders_orderedby FOREIGN KEY (ordered_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- supply_order_items.supply_order_id -> supply_orders.id
ALTER TABLE supply_order_items
  ADD CONSTRAINT fk_supplyitems_order FOREIGN KEY (supply_order_id) REFERENCES supply_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_supplyitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- supply_payments
ALTER TABLE supply_payments
  ADD CONSTRAINT fk_supplypayments_order FOREIGN KEY (supply_order_id) REFERENCES supply_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_supplypayments_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- customer_orders -> users(storer), stores
ALTER TABLE customer_orders
  ADD CONSTRAINT fk_custorders_cust FOREIGN KEY (cust_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_custorders_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT fk_custorders_cashier FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- customer_order_items
ALTER TABLE customer_order_items
  ADD CONSTRAINT fk_custitems_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_custitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- customer_payments
ALTER TABLE customer_payments
  ADD CONSTRAINT fk_custpayments_order FOREIGN KEY (customer_order_id) REFERENCES customer_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_custpayments_cust FOREIGN KEY (cust_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- wishlists and wishlist_items
ALTER TABLE customer_wishlists
  ADD CONSTRAINT fk_wishlist_cust FOREIGN KEY (cust_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE customer_wishlist_items
  ADD CONSTRAINT fk_wishlistitems_wishlist FOREIGN KEY (wishlist_id) REFERENCES customer_wishlists(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_wishlistitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- carts & cart_items
ALTER TABLE customer_carts
  ADD CONSTRAINT fk_carts_cust FOREIGN KEY (cust_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE customer_cart_items
  ADD CONSTRAINT fk_cartitems_cart FOREIGN KEY (cart_id) REFERENCES customer_carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_cartitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- feedbacks
ALTER TABLE feedbacks
  ADD CONSTRAINT fk_feedbacks_cust FOREIGN KEY (cust_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;


---- Useful indexes & performance notes

-- Add indexes on sales / customer_order_items.product_id, supply_order_items.product_id and timestamp columns you will query often (created_at or deliver_at).

-- For reporting, create aggregated tables (daily_store_sales, product_daily_stock) periodically instead of running heavy queries against raw tables.
--- 

ALTER TABLE products ADD FULLTEXT idx_products_fulltext (name, description);
