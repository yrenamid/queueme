
DROP DATABASE IF EXISTS queueme;
CREATE DATABASE queueme;
USE queueme;


CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    category ENUM('food', 'service') NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    qr_code_url VARCHAR(500) NULL,
    qr_code_img LONGTEXT NULL,
    max_queue_length INT DEFAULT 50,
    avg_prep_time INT DEFAULT 5,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('owner', 'manager', 'cashier', 'staff') DEFAULT 'owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business (business_id),
    INDEX idx_role (role)
);


CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_business (business_id),
    INDEX idx_available (is_available)
);


CREATE TABLE queues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    customer_phone VARCHAR(20),
    queue_number INT NOT NULL,
    order_items JSON,
    order_total DECIMAL(10, 2),
    status ENUM('pending', 'waiting', 'called', 'served', 'cancelled', 'delayed') NOT NULL DEFAULT 'pending',
    is_priority BOOLEAN DEFAULT FALSE,
    estimated_wait_time INT,
    actual_wait_time INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    called_at TIMESTAMP NULL,
    served_at TIMESTAMP NULL,
    called_by INT NULL,
    served_by INT NULL,
    payment_status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    payment_method ENUM('cash', 'online') DEFAULT 'cash',
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (called_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (served_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_business (business_id),
    INDEX idx_queue_number (business_id, queue_number),
    INDEX idx_status (status),
    INDEX idx_priority (is_priority),
    INDEX idx_joined_at (joined_at),
    UNIQUE KEY unique_queue_number (business_id, queue_number)
);



CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    notify_via_sms BOOLEAN DEFAULT TRUE,
    notify_via_email BOOLEAN DEFAULT TRUE,
    reserve_slots INT DEFAULT 0,
    available_kitchen_staff INT DEFAULT 1,
    notify_customer BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);


