// namespace Reservations.Domain.Entities;
//
// /// Represents a single food item ordered as part of a reservation.
// public class Order
// {
//     public int Id { get; set; }
//     public Guid ReservationId { get; set; }
//     public int MenuItemId { get; set; }
//     public string FoodName { get; set; }
//     public decimal Price { get; set; }
//     public int Quantity { get; set; }
//     
//     // navigation property: back to the reservation 
//     public Reservation Reservation { get; set; }
// }
//

namespace Reservations.Domain.Entities;

/// <summary>
/// Represents a single food order associated with a reservation.
/// Each order stores the selected menu item, its price at the time
/// of ordering, and the requested quantity.
/// </summary>
public class Order
{
    public int Id { get; set; }
    public Guid ReservationId { get; set; }
    public int MenuItemId { get; set; }
    public string FoodName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }

    // Navigation property: reservation that owns this order.
    public Reservation Reservation { get; set; }
}