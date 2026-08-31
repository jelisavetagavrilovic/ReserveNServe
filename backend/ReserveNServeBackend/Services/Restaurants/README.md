# Restaurants.API

Restaurants.API is the restaurant catalogue and restaurant-reference-data microservice of ReserveNServe. It provides restaurant details, cuisines, opening hours, menus, table-capacity groups, and static images.

## 1. Purpose

The service is the source of truth for restaurant data used by the frontend and by Reservations.API when validating reservations and calculating availability.

Default Docker URLs:

```text
HTTP:  http://localhost:5174
HTTPS: https://localhost:7274
```

## 2. Responsibilities

- Search, filter, sort, and paginate restaurants.
- Return restaurant details and operating hours.
- Return cuisine and price filters.
- Return restaurant menus and menu-item prices.
- Return table-capacity groups.
- Serve restaurant and menu-item images.
- Expose internal restaurant/menu data to Reservations.API through gRPC.
- Own restaurant catalogue data, but not reservation availability state.

## 3. Project Structure

```text
Services/Restaurants/
├── Restaurants.API/
│   ├── Controllers/        # REST API
│   ├── Data/               # EF Core context
│   ├── Database/           # init.sql and DB initializer image
│   ├── DTOs/               # Request/response models
│   ├── Entities/           # Cuisine, Restaurant, Table, MenuItem
│   ├── Grpc/               # RestaurantsGrpcService
│   ├── Handler/            # Application/business logic
│   ├── Images/             # Restaurant and menu images
│   ├── Protos/             # restaurants.proto
│   ├── Repositories/       # Database access
│   ├── Program.cs
│   └── Dockerfile
└── Restaurants.API.Tests/
```

## 4. Main Endpoints

Base route:

```text
/api/Restaurants
```

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/Restaurants/GetRestaurants` | Search/filter/sort/paginate restaurants |
| GET | `/api/Restaurants/GetRestaurants/{id}` | Get one restaurant |
| GET | `/api/Restaurants/GetRestaurantInfo/{id}` | Get operating data and table-capacity groups |
| GET | `/api/Restaurants/GetTable/{id}` | Get one table-capacity group |
| GET | `/api/Restaurants/GetMenuForRestaurant/{id}` | Get full restaurant menu |
| GET | `/api/Restaurants/GetMenuItemsForRestaurant/{id}` | Get compact menu ID/name/price data |
| GET | `/api/Restaurants/GetRestaurantsFilters` | Get cuisine and price filters |

The service currently exposes read-only restaurant catalogue endpoints.

Swagger in Development:

```text
https://localhost:7274/swagger
```

## 5. Database

Restaurants.API uses SQL Server through EF Core.

Default database:

```text
ReserveNServe.Restaurants
```

Main tables:

| Table | Purpose |
| --- | --- |
| `Cuisines` | Cuisine reference data |
| `Restaurants` | Restaurant details, hours, rating, price level |
| `Tables` | Groups of equivalent physical tables |
| `MenuItems` | Menu items and prices |

Important: a row in `Tables` is a **table-capacity group**, not one physical table. For example, `seats=4` and `total_table_number=8` means the restaurant has eight 4-seat tables in that group.

The schema and development seed data are created by:

```text
Restaurants.API/Database/init.sql
```

The root Compose stack runs this through `restaurants-db-init`.

## 6. Configuration

Important root `.env` values:

```dotenv
MSSQL_SA_PASSWORD=<sql-server-password>
RESTAURANTS_DB_NAME=ReserveNServe.Restaurants
RESTAURANTS_DB_USER=restaurants_user
RESTAURANTS_DB_PASSWORD=<restaurant-db-password>
RESTAURANTS_HTTP_PORT=5174
RESTAURANTS_HTTPS_PORT=7274
ASPNET_HTTPS_PATH=<absolute-path-to-.aspnet/https>
ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD=<certificate-password>
```

Docker passes the SQL connection through:

```text
ConnectionStrings__DefaultConnection
```

Inside Docker, the service uses:

```text
REST HTTP : 8080
REST HTTPS: 8081
gRPC      : 8082
```

The gRPC port is internal and is not published to the host by default.

## 7. How to Run

From the backend root:

```bash
cd backend/ReserveNServeBackend
cp .env.example .env
```

Create the development HTTPS certificate on macOS/Linux:

```bash
chmod +x scripts/setup-dev-cert.sh
./scripts/setup-dev-cert.sh
```

Then start the service and its database initialization:

```bash
docker compose up -d --build sqlserver restaurants-db-init restaurants-api
```

Open:

```text
https://localhost:7274/swagger
```

For direct host development:

```bash
dotnet run --project Services/Restaurants/Restaurants.API/Restaurants.API.csproj
```

The checked-in development connection string uses Windows LocalDB, so macOS/Linux developers should override `ConnectionStrings__DefaultConnection` to use SQL Server running in Docker or another SQL Server instance.

## 8. Communication with Other Services

```text
Frontend
   |
   | REST
   v
Restaurants.API
   ^
   | gRPC
   |
Reservations.API
```

### Frontend

The frontend calls the public REST API for restaurant search, details, menus, and filters.

### Reservations.API

Reservations uses internal gRPC at:

```text
http://restaurants-api:8082
```

The gRPC contract provides restaurant information and menu-item data needed to:

- validate restaurant opening hours and reservation duration;
- obtain table-capacity groups;
- validate menu items and prices before creating orders.

Restaurants.API does not communicate directly with Identity, Payment, Notifications, or RabbitMQ.
