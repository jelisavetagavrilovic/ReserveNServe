using Microsoft.EntityFrameworkCore;
using Reservations.Application.Handlers;
using Reservations.Application.Interfaces;
using Reservations.Infrastructure.DatabaseContext;
using Reservations.Infrastructure.Repositories;
using Reservations.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddAuthorization();
builder.Services.AddControllers();

builder.Services.AddDbContext<ReservationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IUserContextService, UserContextService>();
builder.Services.AddScoped<IRestaurantService, RestaurantService>(); 

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblyContaining<CreateReservationHandler>());


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ReservationDbContext>();
    db.Database.Migrate(); // ovo primenjuje sve migracije pri pokretanju
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();   

app.Run();