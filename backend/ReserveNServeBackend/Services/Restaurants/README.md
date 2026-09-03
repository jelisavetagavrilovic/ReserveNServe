# Restaurants.API

Restaurants.API is the restaurant catalogue and reference-data microservice of ReserveNServe. It provides restaurant details, cuisines, opening hours, menus, table-capacity groups and static images.

## 1. Purpose

The service is the source of truth for restaurant information used by the frontend and by Reservations.API when validating reservations and calculating availability.

## 2. Responsibilities

* Search, filter, sort and paginate restaurants
* Return restaurant details and opening hours
* Return cuisine and price filters
* Return restaurant menus and menu-item prices
* Return table-capacity groups
* Serve restaurant and menu-item images
* Provide restaurant and menu data to Reservations.API through gRPC
* Own restaurant catalogue data, but not reservation availability state

## 3. Project Structure

```text
Services/Restaurants/
├── Restaurants.API/
│   ├── Controllers/        # Public REST API
│   ├── Data/               # Entity Framework Core context
│   ├── Database/           # SQL initialization and seed data
│   ├── DTOs/               # Request and response models
│   ├── Entities/           # Cuisine, Restaurant, Table and MenuItem
│   ├── Grpc/               # RestaurantsGrpcService
│   ├── Handler/            # Application and business logic
│   ├── Images/             # Restaurant and menu-item images
│   ├── Protos/             # gRPC contract
│   ├── Repositories/       # Database access
│   ├── Program.cs
│   └── Dockerfile
└── Restaurants.API.Tests/
```

## 4. Main Endpoints

The base REST route is `/api/Restaurants`.

| Method | Endpoint                                          | Purpose                                        |
| ------ | ------------------------------------------------- | ---------------------------------------------- |
| GET    | `/api/Restaurants/GetRestaurants`                 | Search, filter, sort and paginate restaurants |
| GET    | `/api/Restaurants/GetRestaurants/{id}`            | Get one restaurant                             |
| GET    | `/api/Restaurants/GetRestaurantInfo/{id}`         | Get opening hours and table-capacity groups    |
| GET    | `/api/Restaurants/GetTable/{id}`                  | Get one table-capacity group                   |
| GET    | `/api/Restaurants/GetMenuForRestaurant/{id}`      | Get the complete restaurant menu               |
| GET    | `/api/Restaurants/GetMenuItemsForRestaurant/{id}` | Get compact menu-item data                     |
| GET    | `/api/Restaurants/GetRestaurantsFilters`          | Get cuisine and price filters                  |

The service currently exposes read-only restaurant catalogue endpoints.

Swagger is available in the Development environment at `https://localhost:7274/swagger`.

## 5. Database

Restaurants.API uses **SQL Server** through **Entity Framework Core**.

The default database is:

```text
ReserveNServe.Restaurants
```

| Table         | Purpose                                                    |
| ------------- | ---------------------------------------------------------- |
| `Cuisines`    | Cuisine reference data                                     |
| `Restaurants` | Restaurant details, opening hours, rating and price level |
| `Tables`      | Groups of equivalent physical tables                       |
| `MenuItems`   | Menu items, categories, prices, and images                 |

A row in `Tables` represents a **table-capacity group**, not a single physical table.

For example, `seats = 4` and `total_table_number = 8` means that the restaurant has eight four-seat tables in that group.

The schema and development seed data are created from:

```text
Restaurants.API/Database/init.sql
```

Docker Compose runs the initialization through the `restaurants-db-init` service.

## 6. Configuration

| Variable                                | Purpose                                          |
| --------------------------------------- | ------------------------------------------------ |
| `MSSQL_SA_PASSWORD`                     | SQL Server administrator password                |
| `RESTAURANTS_DB_NAME`                   | Restaurants database name                        |
| `RESTAURANTS_DB_USER`                   | Service database user                            |
| `RESTAURANTS_DB_PASSWORD`               | Service database password                        |
| `RESTAURANTS_HTTP_PORT`                 | Host HTTP port                                   |
| `RESTAURANTS_HTTPS_PORT`                | Host HTTPS port                                  |
| `ASPNET_HTTPS_PATH`                     | Directory containing the development certificate |
| `ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD` | Development certificate password                 |

Docker passes the service database connection through:

```text
ConnectionStrings__DefaultConnection
```

Internal container ports are:

```text
REST HTTP : 8080
REST HTTPS: 8081
gRPC      : 8082
```

The gRPC port is available only inside the Docker network.

## 7. How to Run

Configure the root `.env` file and development certificate as described in the [Setup and Run Guide](../../../../docs/setup-and-run.md).

From `backend/ReserveNServeBackend`, run:

```bash
docker compose up -d --build \
  sqlserver restaurants-db-init restaurants-api
```

For direct host development:

```bash
dotnet run --project Services/Restaurants/Restaurants.API/Restaurants.API.csproj
```

The checked-in development configuration uses Windows LocalDB. On macOS or Linux, override `ConnectionStrings__DefaultConnection` with a reachable SQL Server connection.

## 8. Communication with Other Services

| Direction | Component        | Mechanism                             | Purpose                                                                   |
| --------- | ---------------- | ------------------------------------- | ------------------------------------------------------------------------- |
| Inbound   | Frontend         | REST/JSON                             | Restaurant search, details, menus, filters and table information         |
| Inbound   | Reservations.API | gRPC at `http://restaurants-api:8082` | Opening hours, reservation duration, table groups, menu items and prices |

Restaurants.API does not communicate directly with Identity.API, Payment.API, Notifications.API or RabbitMQ.

## Related Project Documentation

* [Restaurants class diagram](../../../../docs/class-diagrams.md#restaurants-subsystem)
* [Service communication](../../../../docs/architecture.md#communication-matrix)
* [Restaurants API reference](../../../../docs/api-reference.md#restaurantsapi)
* [Source-code documentation](../../../../docs/source-code.md)
