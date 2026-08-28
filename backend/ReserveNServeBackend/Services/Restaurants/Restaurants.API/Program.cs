using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Restaurants.API.Data;
using Restaurants.API.Handler;
using Restaurants.API.Repositories;
using Restaurants.API.GrpcServices;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSwaggerGen();

builder.Services.AddControllers();

builder.Services.AddGrpc();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IRestaurantsRepository, RestaurantRepository>();
builder.Services.AddScoped<RestaurantsHandler>();
builder.Services.AddDbContext<RestaurantsContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.UseAuthorization();

app.MapControllers();

app.MapGrpcService<RestaurantsGrpcService>();

app.Run();
