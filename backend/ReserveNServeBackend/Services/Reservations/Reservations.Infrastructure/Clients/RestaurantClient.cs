using Grpc.Core;
using Reservations.Application.DTOs.External.Restaurant;
using Reservations.Application.Interfaces;
using Contracts = global::ReserveNServe.Contracts.Restaurants;

namespace Reservations.Infrastructure.Clients;

public class RestaurantClient : IRestaurantClient
{
    private readonly Contracts.RestaurantsService.RestaurantsServiceClient
        _grpcClient;

    public RestaurantClient(
        Contracts.RestaurantsService.RestaurantsServiceClient grpcClient)
    {
        _grpcClient = grpcClient;
    }

    public async Task<RestaurantInfoResponse?>
        GetRestaurantInfoAsync(int restaurantId)
    {
        try
        {
            var response =
                await _grpcClient.GetRestaurantInfoAsync(
                    new Contracts.GetRestaurantInfoRequest
                    {
                        RestaurantId = restaurantId
                    });

            return new RestaurantInfoResponse
            {
                RestaurantName = response.RestaurantName,
                RestaurantAddress = response.RestaurantAddress,
                RestaurantCity = response.RestaurantCity,

                OpeningTime =
                    TimeOnly.Parse(response.OpeningTime),

                ClosingTime =
                    TimeOnly.Parse(response.ClosingTime),

                ReservationDurationMinutes =
                    response.ReservationDurationMinutes,

                TableGroups =
                    response.TableGroups
                        .Select(table =>
                            new TableGroupResponse
                            {
                                Id = table.Id,
                                Location = table.Location,
                                Capacity = table.Capacity,
                                TableCount = table.TableCount
                            })
                        .ToList()
            };
        }
        catch (RpcException ex)
            when (ex.StatusCode == StatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<MenuItemResponse>>
        GetMenuItemsAsync(
            int restaurantId,
            IEnumerable<int> menuItemIds)
    {
        var ids =
            menuItemIds
                .Distinct()
                .ToList();

        if (ids.Count == 0)
        {
            return [];
        }

        var request =
            new Contracts.GetMenuItemsRequest
            {
                RestaurantId = restaurantId
            };

        request.MenuItemIds.AddRange(ids);

        var response =
            await _grpcClient.GetMenuItemsAsync(
                request);

        return response.MenuItems
            .Select(item =>
                new MenuItemResponse
                {
                    MenuItemId = item.MenuItemId,
                    FoodName = item.FoodName,

                    Price = decimal.Parse(
                        item.Price,
                        System.Globalization.CultureInfo.InvariantCulture)
                })
            .ToList();
    }
}