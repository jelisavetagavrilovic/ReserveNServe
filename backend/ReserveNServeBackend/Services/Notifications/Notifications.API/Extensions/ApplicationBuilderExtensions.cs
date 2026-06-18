namespace Notifications.API.Extensions;

public static class ApplicationBuilderExtensions
{
    public static WebApplication UseNotificationsApi(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseHttpsRedirection();
        app.UseCors("Frontend");
        app.UseAuthorization();
        app.MapControllers();

        return app;
    }
}
