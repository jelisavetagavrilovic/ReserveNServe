using Notifications.API.Services;
using Notifications.API.Services.Interfaces;

namespace Notifications.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddNotificationsApi(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddOpenApi();

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

        return services;
    }
}
