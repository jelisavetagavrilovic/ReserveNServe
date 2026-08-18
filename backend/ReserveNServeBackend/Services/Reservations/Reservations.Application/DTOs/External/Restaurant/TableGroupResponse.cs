namespace Reservations.Application.DTOs.External.Restaurant;

public class TableGroupResponse
{
    public int Id { get; set; }

    public string Location { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public int TableCount { get; set; }
}