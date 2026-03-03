CREATE TABLE Reservations (
    id UUID NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL,
    restaurant_id INTEGER NOT NULL,
    table_group_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 180,
    guest_number INTEGER NOT NULL,
    serving_time TIME DEFAULT NULL, -- NULL if customer doesn't order the food              
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- 0 if only reservation, else > 0
	status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Confirmed', 'PendingPayment', 'Cancelled','Completed', 'Failed'))
);

CREATE TABLE Orders (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reservation_id UUID NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
	price DECIMAL(10,2) NOT NULL, -- price for item * quantity

    CONSTRAINT fk_orders_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES Reservations(id)
        ON DELETE CASCADE
);
