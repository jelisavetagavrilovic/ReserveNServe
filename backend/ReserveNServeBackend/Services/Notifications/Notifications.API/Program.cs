using Notifications.API.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddNotificationsApi(builder.Configuration);

var app = builder.Build();

app.UseNotificationsApi();

app.Run();
