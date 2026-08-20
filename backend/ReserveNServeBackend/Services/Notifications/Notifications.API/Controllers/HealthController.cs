using Microsoft.AspNetCore.Mvc;

namespace Notifications.API.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "Notifications.API" });
}
