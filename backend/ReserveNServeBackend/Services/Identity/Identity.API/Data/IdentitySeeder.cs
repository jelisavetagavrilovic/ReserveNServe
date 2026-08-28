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
                var roleResult = await roleManager.CreateAsync(new IdentityRole(role));

                if (!roleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to create role '{role}': " +
                        string.Join("; ", roleResult.Errors.Select(error => error.Description))
                    );
                }
            }
        }

        if (!environment.IsDevelopment())
        {
            return;
        }

        const string adminEmail = "admin@test.com";
        const string adminPassword = "Admin12345";

        var adminUser = await userManager.FindByEmailAsync(adminEmail);

        if (adminUser is not null)
        {
            if (!adminUser.EmailConfirmed)
            {
                adminUser.EmailConfirmed = true;

                var updateResult = await userManager.UpdateAsync(adminUser);

                if (!updateResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        "Failed to update development admin: " +
                        string.Join("; ", updateResult.Errors.Select(error => error.Description))
                    );
                }
            }

            if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
            {
                var roleResult = await userManager.AddToRoleAsync(adminUser, "Admin");

                if (!roleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        "Failed to assign Admin role: " +
                        string.Join("; ", roleResult.Errors.Select(error => error.Description))
                    );
                }
            }

            return;
        }

        var admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = "System Administrator",
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(admin, adminPassword);

        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                "Failed to create development admin: " +
                string.Join("; ", createResult.Errors.Select(error => error.Description))
            );
        }

        var addRoleResult = await userManager.AddToRoleAsync(admin, "Admin");

        if (!addRoleResult.Succeeded)
        {
            throw new InvalidOperationException(
                "Failed to assign Admin role: " +
                string.Join("; ", addRoleResult.Errors.Select(error => error.Description))
            );
        }
    }
}