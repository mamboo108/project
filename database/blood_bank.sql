database creation

create database blood_bank;
use blood_bank;

///create tables///

/admin table/
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

/blood group table/
CREATE TABLE blood_groups (
    blood_group_id INT AUTO_INCREMENT PRIMARY KEY,
    blood_type VARCHAR(10) NOT NULL UNIQUE
);

/diseases table/
  
CREATE TABLE diseases (
    disease_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

/donors table/
  
CREATE TABLE donors (
    donor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    weight INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    disease_id INT NULL,
    blood_group_id INT NOT NULL,
    user_id INT NULL,
    FOREIGN KEY (disease_id) REFERENCES diseases(disease_id),
    FOREIGN KEY (blood_group_id) REFERENCES blood_groups(blood_group_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

/hospitals table/

CREATE TABLE hospitals (
    hospital_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL
);

/receivers table/

CREATE TABLE receivers (
    receiver_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    blood_group_id INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    FOREIGN KEY (blood_group_id) REFERENCES blood_groups(blood_group_id)
);

/users table/

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('donor', 'receiver') NOT NULL
);



