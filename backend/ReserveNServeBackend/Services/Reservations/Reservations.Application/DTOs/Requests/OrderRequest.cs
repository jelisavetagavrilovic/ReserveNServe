namespace Reservations.Application.DTOs.Requests;

public class OrderRequest
{
    public int MenuItemId { get; set; }
    public int Quantity { get; set; }
}