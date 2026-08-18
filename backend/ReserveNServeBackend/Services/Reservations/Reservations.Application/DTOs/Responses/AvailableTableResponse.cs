namespace Reservations.Application.DTOs.Responses;

public class AvailableTableResponse
{
    public int TableGroupId { get; set; }

    public string Location { get; set; } = string.Empty;

    public int Capacity { get; set; }

    public int AvailableTables { get; set; }
}