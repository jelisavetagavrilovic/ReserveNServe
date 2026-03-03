namespace Reservations.Application.DTOs;

// response
public class OrderResultDto
{
    public int MenuItemId { get; set; }
    public string FoodName { get; set; } = "";
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public decimal Total => Price * Quantity;
}