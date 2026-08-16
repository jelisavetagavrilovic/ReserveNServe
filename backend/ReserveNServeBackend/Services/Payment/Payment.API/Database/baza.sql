IF DB_ID('Payment') IS NULL
BEGIN
    CREATE DATABASE Payment;
END
GO

USE Payment
GO

IF OBJECT_ID('Payments', 'U') IS NULL
CREATE TABLE Payments(
	id INT IDENTITY(1,1) PRIMARY KEY,
	reservation_id VARCHAR(255) NOT NULL,
	payment_intent VARCHAR(255) NOT NULL,
	status int NOT NULL
);
GO
