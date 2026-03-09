using Identity.API.Data;
using Identity.API.Extensions;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddIdentityApi(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppIdentityDbContext>();
    await db.Database.MigrateAsync();
}

await IdentitySeeder.SeedAsync(app.Services, app.Environment);

app.UseIdentityApi();

app.Run();