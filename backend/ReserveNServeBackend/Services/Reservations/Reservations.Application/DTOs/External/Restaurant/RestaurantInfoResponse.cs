namespace Reservations.Application.DTOs.External.Restaurant;

public class RestaurantInfoResponse
{
    public string RestaurantName { get; set; } = string.Empty;
    
    public string RestaurantAddress { get; set; } = string.Empty;

    public string RestaurantCity { get; set; } = string.Empty;

    public TimeOnly OpeningTime { get; set; }

    public TimeOnly ClosingTime { get; set; }

    public int ReservationDurationMinutes { get; set; }
    
    public List<TableGroupResponse> TableGroups { get; set; } = [];
}