namespace Reservations.Application.DTOs;

public class RestaurantDataDto
{
    public bool Exists { get; set; } // check restaurants exist                
    public int DefaultReservationDuration { get; set; }  // in minutes
    public List<MenuItemDto> MenuItems { get; set; } = new();

    public class MenuItemDto
    {
        public int Id { get; set; }
        public decimal Price { get; set; }
        public string Name { get; set; }
    }
}