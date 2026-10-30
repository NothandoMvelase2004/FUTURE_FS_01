CREATE DATABASE IF NOT EXISTS thandoleads;

USE thandoleads;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin') DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    source VARCHAR(100),
    status ENUM(
        'new',
        'contacted',
        'converted'
    ) DEFAULT 'new',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE SET NULL

);

CREATE TABLE IF NOT EXISTS follow_ups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    follow_up_date DATETIME NOT NULL,
    description TEXT,
    status ENUM(
        'pending',
        'completed'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id)
    REFERENCES leads(id)
    ON DELETE CASCADE

);

CREATE INDEX idx_lead_status
ON leads(status);

CREATE INDEX idx_lead_created
ON leads(created_at);

CREATE INDEX idx_follow_up_date
ON follow_ups(follow_up_date);


SHOW TABLES;