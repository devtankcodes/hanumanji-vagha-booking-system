CREATE TABLE devotees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(15),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vagha_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    devotee_id INT,
    status ENUM('waiting', 'confirmed') DEFAULT 'waiting',
    vagha_date DATE NULL,
    day_type VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (devotee_id) REFERENCES devotees(id)
);