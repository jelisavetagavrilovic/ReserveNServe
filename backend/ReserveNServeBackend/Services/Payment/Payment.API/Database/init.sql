IF DB_ID('$(DB_NAME)') IS NULL
BEGIN
    CREATE DATABASE [$(DB_NAME)];
END
GO


IF NOT EXISTS (
    SELECT 1
    FROM sys.server_principals
    WHERE name = '$(DB_USER)'
)
BEGIN
    CREATE LOGIN [$(DB_USER)]
    WITH PASSWORD = '$(DB_PASSWORD)';
END
GO


USE [$(DB_NAME)];
GO


IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = '$(DB_USER)'
)
BEGIN
    CREATE USER [$(DB_USER)]
    FOR LOGIN [$(DB_USER)];

    ALTER ROLE db_datareader ADD MEMBER [$(DB_USER)];
    ALTER ROLE db_datawriter ADD MEMBER [$(DB_USER)];
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
