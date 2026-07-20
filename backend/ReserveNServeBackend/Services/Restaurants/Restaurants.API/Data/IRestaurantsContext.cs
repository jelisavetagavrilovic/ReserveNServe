namespace Restaurants.API.Data
{
    public interface IRestaurantsContext
    {
        IEnumerable<Entities.Restaurant> Restaurants { get; }
        IEnumerable<Entities.Table> Tables { get; }
        IEnumerable<Entities.MenuItem> MenuItems { get; }
        IEnumerable<Entities.Cuisines> Cuisines { get; }
    }
}
