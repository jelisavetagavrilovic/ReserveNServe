USE ReserveNServe;
GO

IF OBJECT_ID('Users', 'U') IS NULL
CREATE TABLE Users(
	id INT NOT NULL PRIMARY KEY,
	name varchar(50), 
	surname varchar(50),
	email varchar(50) NOT NULL,
	password varchar(50) NOT NULL,
	phone_number varchar(50)
);
GO

IF OBJECT_ID('Restaurants', 'U') IS NULL
CREATE TABLE Restaurants(
	id INT NOT NULL PRIMARY KEY,
	name VARCHAR(50) NOT NULL,
	description VARCHAR(255),
	city VARCHAR(50) NOT NULL,
	address VARCHAR(50) NOT NULL,
	phone_number VARCHAR(50) NOT NULL,
	opening_time_workday TIME NOT NULL,
	closing_time_workday TIME NOT NULL,
	opening_time_weekend TIME NOT NULL,
	closing_time_weekend TIME NOT NULL,
	rating FLOAT NOT NULL,
	price_range VARCHAR(50) NOT NULL,
	cusine_type VARCHAR(50) NOT NULL,
	reservation_duration TIME CONSTRAINT DF_reservation_duration DEFAULT('03:00:00'),
	
	CONSTRAINT C_price_range
        CHECK (price_range IN ('$', '$$', '$$$'))
);
GO

IF OBJECT_ID('Tables', 'U') IS NULL
CREATE TABLE Tables(
	id INT NOT NULL PRIMARY KEY,
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

IF OBJECT_ID('Reservations', 'U') IS NULL
CREATE TABLE Reservations(
	id INT NOT NULL PRIMARY KEY,
	user_id INT NOT NULL,
	restaurant_id INT NOT NULL,
	table_id INT NOT NULL,
	start_time DATETIME NOT NULL,
	end_time AS DATEADD(HOUR, 3, start_time),
	guest_number INT,
	special_requests VARCHAR(50),
	confirmed BIT NOT NULL CONSTRAINT DF_confirmed DEFAULT(0),
	
	CONSTRAINT FK_Reservations_Users
        FOREIGN KEY (user_id) REFERENCES Users(Id),
	CONSTRAINT FK_Reservations_Restaurants
        FOREIGN KEY (restaurant_id) REFERENCES Restaurants(Id),		
	CONSTRAINT FK_Reservations_Tables
        FOREIGN KEY (table_id) REFERENCES Tables(Id),
);
GO

IF OBJECT_ID('MenuItems', 'U') IS NULL
CREATE TABLE MenuItems(
	id INT NOT NULL PRIMARY KEY,
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

IF OBJECT_ID('Orders', 'U') IS NULL
CREATE TABLE Orders(
	id INT NOT NULL PRIMARY KEY,
	reservation_id INT NOT NULL,
	menu_item_id INT NOT NULL,
	quantity INT NOT NULL,
	serving_time TIME NOT NULL,
	
	CONSTRAINT FK_Orders_Reservations
        FOREIGN KEY (reservation_id) REFERENCES Reservations(Id),
	CONSTRAINT FK_Orders_MenuItems
        FOREIGN KEY (menu_item_id) REFERENCES MenuItems(Id)
);
GO

IF OBJECT_ID('Payments', 'U') IS NULL
CREATE TABLE Payments(
	id INT NOT NULL PRIMARY KEY,
	reservation_id INT NOT NULL,
	amount MONEY NOT NULL,
	status VARCHAR(50) NOT NULL,
	date DATETIME NOT NULL,
	
	CONSTRAINT FK_Payments_Reservations
        FOREIGN KEY (reservation_id) REFERENCES Reservations(Id),
	CONSTRAINT C_status
		CHECK(status in ('pending', 'success', 'failed'))
);
GO