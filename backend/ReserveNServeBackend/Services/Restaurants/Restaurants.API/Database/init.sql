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


IF OBJECT_ID('Cuisines', 'U') IS NULL
BEGIN
    CREATE TABLE Cuisines
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        cuisine_type VARCHAR(50) NOT NULL
    );
END
GO


IF OBJECT_ID('Restaurants', 'U') IS NULL
BEGIN
    CREATE TABLE Restaurants
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        city VARCHAR(50) NOT NULL,
        address VARCHAR(50) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        opening_time TIME NOT NULL,
        closing_time TIME NOT NULL,
        rating FLOAT NOT NULL,
        price VARCHAR(50) NOT NULL,
        cuisine_type INT NOT NULL,
        reservation_duration INT DEFAULT 180,
        image VARBINARY(MAX),

        CONSTRAINT C_price
            CHECK (price IN ('$', '$$', '$$$')),

        CONSTRAINT FK_Restaurants_Cuisines
            FOREIGN KEY (cuisine_type)
            REFERENCES Cuisines(id)
    );
END
GO


IF OBJECT_ID('Tables', 'U') IS NULL
BEGIN
    CREATE TABLE Tables
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        restaurant_id INT NOT NULL,
        location VARCHAR(50) NOT NULL,
        seats INT NOT NULL,
        total_table_number INT NOT NULL,

        CONSTRAINT FK_Tables_Restaurants
            FOREIGN KEY (restaurant_id)
            REFERENCES Restaurants(id),

        CONSTRAINT C_location
            CHECK (location IN ('window', 'center', 'private', 'garden'))
    );
END
GO


IF OBJECT_ID('MenuItems', 'U') IS NULL
BEGIN
    CREATE TABLE MenuItems
    (
        id INT IDENTITY(1,1) PRIMARY KEY,
        restaurant_id INT NOT NULL,
        food_name VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        price MONEY NOT NULL,
        image VARBINARY(MAX),
        category VARCHAR(50),

        CONSTRAINT FK_MenuItems_Restaurants
            FOREIGN KEY (restaurant_id)
            REFERENCES Restaurants(id),

        CONSTRAINT C_category
            CHECK (category IN ('appetizer', 'main', 'dessert', 'drink'))
    );
END
GO