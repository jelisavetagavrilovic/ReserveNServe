using Notifications.API.Consumers;
using Notifications.API.Data;
using Notifications.API.Services;
using Notifications.API.Services.Interfaces;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Notifications.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddNotificationsApi(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        services.AddDbContext<NotificationsDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("NotificationsDb"));
        });

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                policy
                    .WithOrigins("http://localhost:3000")
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });

        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<IEmailTemplateRenderer, ScribanTemplateRenderer>();
        services.AddScoped<IEmailDispatcher, EmailDispatcher>();

        services.AddMassTransit(x =>
        {
            x.AddConsumer<UserRegisteredConsumer>();
            x.AddConsumer<PasswordResetRequestedConsumer>();
            x.AddConsumer<OwnerRequestApprovedConsumer>();

            x.UsingRabbitMq((context, cfg) =>
            {
                var rabbit = configuration.GetSection("RabbitMq");
                cfg.Host(rabbit["Host"] ?? "localhost", h =>
                {
                    h.Username(rabbit["Username"] ?? "guest");
                    h.Password(rabbit["Password"] ?? "guest");
                });
                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
