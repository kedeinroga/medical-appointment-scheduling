-- Seed data for Medical Appointment Scheduling
-- This script inserts sample data for testing

USE medical_appointments;

-- Insert medical centers
INSERT INTO medical_centers (name, address, phone, country_iso) VALUES
('Hospital Nacional Lima', 'Av. Brasil 2630, Lima 11, Peru', '+51-1-471-3000', 'PE'),
('Clínica San Borja', 'Av. Guardia Civil 337, San Borja, Lima', '+51-1-475-4000', 'PE'),
('Hospital Salvador', 'Av. Salvador 364, Providencia, Santiago', '+56-2-2575-3000', 'CL'),
('Clínica Las Condes', 'Lo Fontecilla 441, Las Condes, Santiago', '+56-2-2610-8000', 'CL');

-- Insert specialties
INSERT INTO specialties (name, description) VALUES
('Cardiología', 'Especialidad médica que se encarga del estudio, diagnóstico y tratamiento de las enfermedades del corazón'),
('Dermatología', 'Especialidad médica que se encarga del estudio de la estructura y función de la piel'),
('Pediatría', 'Especialidad médica que estudia al niño y sus enfermedades'),
('Ginecología', 'Especialidad médica que trata las enfermedades del sistema reproductor femenino'),
('Neurología', 'Especialidad médica que trata los trastornos del sistema nervioso'),
('Oftalmología', 'Especialidad médica que estudia las enfermedades de los ojos');

-- Insert doctors for Peru
INSERT INTO doctors (first_name, last_name, specialty_id, center_id, license_number, country_iso) VALUES
('Carlos', 'Mendoza', 1, 1, 'CMP-12345', 'PE'),
('Ana', 'Rodriguez', 2, 1, 'CMP-12346', 'PE'),
('Luis', 'García', 3, 2, 'CMP-12347', 'PE'),
('María', 'Fernández', 4, 2, 'CMP-12348', 'PE');

-- Insert doctors for Chile
INSERT INTO doctors (first_name, last_name, specialty_id, center_id, license_number, country_iso) VALUES
('Pedro', 'Silva', 1, 3, 'CL-54321', 'CL'),
('Carmen', 'López', 2, 3, 'CL-54322', 'CL'),
('Jorge', 'Morales', 5, 4, 'CL-54323', 'CL'),
('Isabel', 'Vargas', 6, 4, 'CL-54324', 'CL');

-- Insert schedules for Peru (next 30 days)
INSERT INTO schedules (center_id, specialty_id, medic_id, available_date, country_iso) VALUES
-- Dr. Carlos Mendoza (Cardiology) - Hospital Nacional Lima
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, 'PE'),
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 10 HOUR, 'PE'),
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR, 'PE'),
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, 'PE'),
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 14 HOUR, 'PE'),
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 15 HOUR, 'PE'),

-- Dr. Ana Rodriguez (Dermatology) - Hospital Nacional Lima
(1, 2, 2, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, 'PE'),
(1, 2, 2, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, 'PE'),
(1, 2, 2, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 9 HOUR, 'PE'),
(1, 2, 2, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 10 HOUR, 'PE'),

-- Dr. Luis García (Pediatrics) - Clínica San Borja
(2, 3, 3, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 'PE'),
(2, 3, 3, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, 'PE'),
(2, 3, 3, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 16 HOUR, 'PE'),
(2, 3, 3, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 17 HOUR, 'PE'),

-- Dr. María Fernández (Gynecology) - Clínica San Borja
(2, 4, 4, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 13 HOUR, 'PE'),
(2, 4, 4, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 14 HOUR, 'PE'),
(2, 4, 4, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 10 HOUR, 'PE'),
(2, 4, 4, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 11 HOUR, 'PE');

-- Insert schedules for Chile (next 30 days)
INSERT INTO schedules (center_id, specialty_id, medic_id, available_date, country_iso) VALUES
-- Dr. Pedro Silva (Cardiology) - Hospital Salvador
(3, 1, 5, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 8 HOUR, 'CL'),
(3, 1, 5, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, 'CL'),
(3, 1, 5, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 14 HOUR, 'CL'),
(3, 1, 5, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 15 HOUR, 'CL'),

-- Dr. Carmen López (Dermatology) - Hospital Salvador
(3, 2, 6, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, 'CL'),
(3, 2, 6, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 11 HOUR, 'CL'),
(3, 2, 6, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 16 HOUR, 'CL'),
(3, 2, 6, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 17 HOUR, 'CL'),

-- Dr. Jorge Morales (Neurology) - Clínica Las Condes
(4, 5, 7, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 13 HOUR, 'CL'),
(4, 5, 7, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 14 HOUR, 'CL'),
(4, 5, 7, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 9 HOUR, 'CL'),
(4, 5, 7, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 10 HOUR, 'CL'),

-- Dr. Isabel Vargas (Ophthalmology) - Clínica Las Condes
(4, 6, 8, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 8 HOUR, 'CL'),
(4, 6, 8, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 9 HOUR, 'CL'),
(4, 6, 8, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 15 HOUR, 'CL'),
(4, 6, 8, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 16 HOUR, 'CL');

-- Create indexes for better performance
CREATE INDEX idx_schedules_country_available ON schedules(country_iso, is_available, available_date);
CREATE INDEX idx_schedules_center_date ON schedules(center_id, available_date);
CREATE INDEX idx_appointments_pe_insured_status ON appointments_pe(insured_id, status);
CREATE INDEX idx_appointments_cl_insured_status ON appointments_cl(insured_id, status);
