using Microsoft.EntityFrameworkCore;
using Payment.API.Data;
using Payment.API.Handler;
using Payment.API.Repositories;
using Payment.API.Grpc;
using Payment.API.Messaging;
using Stripe;

var builder = WebApplication.CreateBuilder(args);

StripeConfiguration.ApiKey = Environment.GetEnvironmentVariable("PAYMENT_STRIPE_SECRET_KEY");

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddGrpc();

builder.Services.AddScoped<PaymentsHandler>();
builder.Services.AddScoped<IPaymentsRepository, PaymentsRepository>();
builder.Services.AddDbContext<PaymentsContext>(options =>
            options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IPaymentStatusPublisher, RabbitMqPaymentStatusPublisher>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthorization();

app.MapGrpcService<PaymentsGrpcService>();
app.MapControllers();

app.Run();
