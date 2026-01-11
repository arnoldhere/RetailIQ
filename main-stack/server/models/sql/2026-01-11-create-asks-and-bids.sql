-- Create asks table
CREATE TABLE IF NOT EXISTS asks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  min_price DECIMAL(12,2) DEFAULT NULL,
  note TEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  status ENUM('open','closed','cancelled') DEFAULT 'open',
  INDEX (product_id),
  INDEX (status)
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ask_id BIGINT NOT NULL,
  supplier_id INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  message TEXT DEFAULT NULL,
  status ENUM('submitted','accepted','rejected') DEFAULT 'submitted',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX (ask_id),
  INDEX (supplier_id),
  CONSTRAINT fk_bids_ask FOREIGN KEY (ask_id) REFERENCES asks(id) ON DELETE CASCADE
);
