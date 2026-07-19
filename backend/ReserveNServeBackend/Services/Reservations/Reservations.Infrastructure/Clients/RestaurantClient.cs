using Reservations.Application.DTOs.External.Restaurant;
using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Clients;

public class RestaurantClient : IRestaurantClient
{
    public Task<RestaurantInfoResponse?> GetRestaurantInfoAsync(int restaurantId)
    {
        // TODO: kasnije ide gRPC poziv ka Restaurant servisu

        var response = new RestaurantInfoResponse
        {
            RestaurantName = "Test Restaurant",
            RestaurantAddress = "Main Street 1",
            RestaurantCity = "Belgrade",

            OpeningTime = new TimeOnly(9, 0, 0),
            ClosingTime = new TimeOnly(23, 0, 0),

            ReservationDurationMinutes = 180,

            TableGroups =
            [
                new TableGroupResponse
                {
                    Id = 1,
                    Capacity = 2,
                    Location = "Inside",
                    TableCount = 5
                },
                new TableGroupResponse
                {
                    Id = 2,
                    Capacity = 4,
                    Location = "Inside",
                    TableCount = 8
                },
                new TableGroupResponse
                {
                    Id = 3,
                    Capacity = 6,
                    Location = "Terrace",
                    TableCount = 3
                }
            ]
        };

        return Task.FromResult<RestaurantInfoResponse?>(response);
    }


    public Task<IReadOnlyList<MenuItemResponse>> GetMenuItemsAsync(
        IEnumerable<int> menuItemIds)
    {
        // TODO: kasnije ide gRPC poziv ka Restaurant servisu

        var items = new List<MenuItemResponse>();

        foreach (var id in menuItemIds)
        {
            items.Add(new MenuItemResponse
            {
                MenuItemId = id,
                FoodName = $"Food item {id}",
                Price = 10m
            });
        }

        return Task.FromResult<IReadOnlyList<MenuItemResponse>>(items);
    }
}