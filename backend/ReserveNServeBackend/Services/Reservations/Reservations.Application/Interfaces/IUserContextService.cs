namespace Reservations.Application.Interfaces;

public interface IUserContextService
{
    Guid GetCurrentUserId();
}