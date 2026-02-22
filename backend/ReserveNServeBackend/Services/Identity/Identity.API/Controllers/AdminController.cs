using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    [Authorize(Roles = "Admin")]
    [HttpGet("ping")]
    public IActionResult Ping()
    {
        return Ok(new { ok = true, message = "You are Admin ✅" });
    }
}