-- Medical Appointment Scheduling Database Schema
-- This script creates the database structure for both Peru (PE) and Chile (CL)

-- Create database
CREATE DATABASE IF NOT EXISTS medical_appointments;
USE medical_appointments;

-- Table for Peru appointments
CREATE TABLE IF NOT EXISTS appointments_pe (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL UNIQUE,
    insured_id VARCHAR(10) NOT NULL,
    schedule_id BIGINT NOT NULL,
    country_iso CHAR(2) NOT NULL DEFAULT 'PE',
    center_id INT,
    specialty_id INT,
    medic_id INT,
    appointment_date DATETIME,
    status ENUM('scheduled', 'confirmed', 'cancelled', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_insured_id (insured_id),
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Chile appointments
CREATE TABLE IF NOT EXISTS appointments_cl (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_id VARCHAR(50) NOT NULL UNIQUE,
    insured_id VARCHAR(10) NOT NULL,
    schedule_id BIGINT NOT NULL,
    country_iso CHAR(2) NOT NULL DEFAULT 'CL',
    center_id INT,
    specialty_id INT,
    medic_id INT,
    appointment_date DATETIME,
    status ENUM('scheduled', 'confirmed', 'cancelled', 'completed') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_insured_id (insured_id),
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_appointment_date (appointment_date),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for available schedules
CREATE TABLE IF NOT EXISTS schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    center_id INT NOT NULL,
    specialty_id INT NOT NULL,
    medic_id INT NOT NULL,
    available_date DATETIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    country_iso CHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_available_date (available_date),
    INDEX idx_center_specialty (center_id, specialty_id),
    INDEX idx_country (country_iso),
    INDEX idx_is_available (is_available),
    INDEX idx_medic_date (medic_id, available_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical centers reference table
CREATE TABLE IF NOT EXISTS medical_centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(20),
    country_iso CHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_country (country_iso),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical specialties reference table
CREATE TABLE IF NOT EXISTS specialties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Medical doctors reference table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialty_id INT NOT NULL,
    center_id INT NOT NULL,
    license_number VARCHAR(50),
    country_iso CHAR(2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (specialty_id) REFERENCES specialties(id),
    FOREIGN KEY (center_id) REFERENCES medical_centers(id),
    INDEX idx_specialty (specialty_id),
    INDEX idx_center (center_id),
    INDEX idx_country (country_iso),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
