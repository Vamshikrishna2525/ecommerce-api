-- Create Database
CREATE DATABASE IF NOT EXISTS ecommerce_db;

-- Use the newly created database
USE ecommerce_db;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL,
  start_date DATE,
  expiry_date DATE,
  free_delivery BOOLEAN DEFAULT FALSE,
  image_url VARCHAR(255),
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  vendor_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Insert (optional, for testing)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@ecommerce.com', 'hashedpassword', 'admin');

INSERT INTO products (name, description, category, price, start_date, expiry_date, free_delivery, image_url, old_price, new_price, vendor_id) 
VALUES ('Sample Product', 'A sample product for testing', 'Electronics', 99.99, '2025-02-06', '2025-12-31', true, 'http://example.com/image.jpg', 120.00, 99.99, 1);
