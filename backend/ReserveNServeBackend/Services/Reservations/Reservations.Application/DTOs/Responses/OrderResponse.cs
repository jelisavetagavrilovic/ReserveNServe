namespace Reservations.Application.DTOs.Responses;

public class OrderResponse
{
    public int MenuItemId { get; set; }
    public string FoodName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Total { get; set; }
}