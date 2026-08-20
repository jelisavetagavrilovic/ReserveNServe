namespace Notifications.API.Services.Interfaces;

public interface IEmailTemplateRenderer
{
    /// <summary>
    /// Renders an HTML email template from the Templates folder using the given model.
    /// </summary>
    /// <param name="templateName">Template file name without extension (e.g. "confirm-email").</param>
    /// <param name="model">The data model bound into the template (snake_case in markup).</param>
    Task<string> RenderAsync(string templateName, object model, CancellationToken cancellationToken = default);
}
