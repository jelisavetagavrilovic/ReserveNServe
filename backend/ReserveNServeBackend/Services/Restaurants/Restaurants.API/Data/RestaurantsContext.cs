using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Restaurants.API.Entities;

namespace Restaurants.API.Data
{
    public class RestaurantsContext : DbContext
    {
        public DbSet<Restaurant> Restaurants { get; set; } = null!;
        public DbSet<Table> Tables { get; set; } = null!;
        public DbSet<MenuItem> MenuItems { get; set; } = null!;

        public RestaurantsContext(DbContextOptions<RestaurantsContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
