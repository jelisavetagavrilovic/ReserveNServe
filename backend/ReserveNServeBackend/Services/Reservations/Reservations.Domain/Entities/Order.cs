namespace Reservations.Domain.Entities;

public class Order
{
    public int Id { get; set; }
    public Guid ReservationId { get; set; }
    public int MenuItemId { get; set; }
    public string FoodName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    
    // // navigation property: back to the reservation 
    public Reservation Reservation { get; set; }
}