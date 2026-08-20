using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using Notifications.API.Services.Interfaces;
using Scriban;

namespace Notifications.API.Services;

public partial class ScribanTemplateRenderer : IEmailTemplateRenderer
{
    private readonly string _templatesRoot;
    private readonly IWebHostEnvironment _env;
    private readonly ConcurrentDictionary<string, Template> _cache = new();

    public ScribanTemplateRenderer(IWebHostEnvironment env)
    {
        _env = env;
        _templatesRoot = Path.Combine(env.ContentRootPath, "Templates");
    }

    public async Task<string> RenderAsync(string templateName, object model, CancellationToken cancellationToken = default)
    {
        // Guard against path traversal: template names come from internal code, but stay strict.
        if (string.IsNullOrWhiteSpace(templateName) || !SafeNameRegex().IsMatch(templateName))
        {
            throw new ArgumentException($"Invalid template name '{templateName}'.", nameof(templateName));
        }

        // Cache parsed templates in non-development environments; always reload in dev for fast iteration.
        var template = _env.IsDevelopment()
            ? LoadTemplate(templateName)
            : _cache.GetOrAdd(templateName, LoadTemplate);

        return await template.RenderAsync(model);
    }

    private Template LoadTemplate(string templateName)
    {
        var path = Path.Combine(_templatesRoot, templateName + ".html");
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Email template '{templateName}' was not found.", path);
        }

        var text = File.ReadAllText(path);
        var template = Template.Parse(text, path);
        if (template.HasErrors)
        {
            var errors = string.Join("; ", template.Messages.Select(m => m.ToString()));
            throw new InvalidOperationException($"Email template '{templateName}' has parse errors: {errors}");
        }

        return template;
    }

    [GeneratedRegex("^[a-z0-9-]+$")]
    private static partial Regex SafeNameRegex();
}
