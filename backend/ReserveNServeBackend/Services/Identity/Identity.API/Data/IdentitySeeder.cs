using Microsoft.AspNetCore.Identity;

namespace Identity.API.Data;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services, IWebHostEnvironment environment)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        string[] roles = ["User", "Admin", "RestaurantOwner"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        if (!environment.IsDevelopment())
        {
            return;
        }

        const string adminEmail = "admin@test.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser is not null)
        {
            if (!adminUser.EmailConfirmed)
            {
                adminUser.EmailConfirmed = true;
                await userManager.UpdateAsync(adminUser);
            }

            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }

            return;
        }

        adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true
        };

        var create = await userManager.CreateAsync(adminUser, "Admin12345");

        if (create.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}