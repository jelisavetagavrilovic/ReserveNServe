namespace Restaurants.API.DTOs
{
    public class ReservationDurationDTO
    {
        public bool Exists { get; set; }
        public int DefaultReservationDuration { get; set; }  // in minutes
    }
}
