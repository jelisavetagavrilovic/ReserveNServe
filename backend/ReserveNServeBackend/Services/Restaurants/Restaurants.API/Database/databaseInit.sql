IF DB_ID('Restaurant') IS NULL
BEGIN
    CREATE DATABASE Restaurant;
END
GO

USE Restaurant
GO

IF OBJECT_ID('Restaurants', 'U') IS NULL
CREATE TABLE Restaurants(
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
        CHECK (price IN ('$', '$$', '$$$'))
);
GO

IF OBJECT_ID('Tables', 'U') IS NULL
CREATE TABLE Tables(
	id INT IDENTITY(1,1) PRIMARY KEY,
	restaurant_id INT NOT NULL,
	location VARCHAR(50) NOT NULL,
	seats INT NOT NULL,
	total_table_number INT NOT NULL,
	
	CONSTRAINT FK_Tables_Restaurants
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(Id),
	CONSTRAINT C_location
		CHECK (location IN ('window', 'center', 'private', 'garden'))
);
GO

IF OBJECT_ID('MenuItems', 'U') IS NULL
CREATE TABLE MenuItems(
	id INT IDENTITY(1,1) PRIMARY KEY,
	restaurant_id INT NOT NULL,
	food_name VARCHAR(50) NOT NULL,
	description VARCHAR(255),
	price MONEY NOT NULL,
	image VARBINARY(MAX),
	category VARCHAR(50),
	
	
	CONSTRAINT FK_MenuItems_Restaurants
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(Id),	
	CONSTRAINT C_category
		CHECK(category in ('appetizer', 'main', 'dessert', 'drink'))
);
GO

IF OBJECT_ID('Cuisines', 'U') IS NULL
CREATE TABLE Cuisines(
	id INT IDENTITY(1,1) PRIMARY KEY,
	cuisine_type VARCHAR(50) NOT NULL
);
GO

ALTER TABLE Restaurants
ADD CONSTRAINT FK_Restaurants_Cuisines
		FOREIGN KEY (cuisine_type) REFERENCES Cuisines(id)

ALTER TABLE Cuisines
ADD CONSTRAINT FK_Cuisines_Restaurants
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(Id)