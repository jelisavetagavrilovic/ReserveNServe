// Application entry point.
// Configures dependency injection, database context,
// application services, middleware, and API endpoints.

using Microsoft.EntityFrameworkCore;
using Reservations.Application.Interfaces;
using Reservations.Application.Services;
using Reservations.Infrastructure.DatabaseContext;
using Reservations.Infrastructure.Repositories;
using Reservations.Infrastructure.Clients;

using DotNetEnv;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
    $"Port={Environment.GetEnvironmentVariable("DB_PORT")};" +
    $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
    $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
    $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD")};";

// Add services to the container.
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();
builder.Services.AddControllers();

builder.Services.AddDbContext<ReservationsDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IRestaurantClient, RestaurantClient>();
builder.Services.AddScoped<IPaymentClient, PaymentClient>();
builder.Services.AddScoped<INotificationClient, NotificationClient>();


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ReservationsDbContext>();

    try
    {
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database migration failed: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();   

app.Run();