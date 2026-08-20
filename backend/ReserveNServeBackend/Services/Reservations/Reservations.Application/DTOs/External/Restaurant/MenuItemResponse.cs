namespace Reservations.Application.DTOs.External.Restaurant;

public class MenuItemResponse
{
    public int MenuItemId { get; set; }

    public string FoodName { get; set; } = string.Empty;

    public decimal Price { get; set; }
}