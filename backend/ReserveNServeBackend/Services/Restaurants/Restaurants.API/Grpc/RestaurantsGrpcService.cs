using Grpc.Core;
using Restaurants.API.Handler;
using Contracts = global::ReserveNServe.Contracts.Restaurants;

namespace Restaurants.API.GrpcServices;

public class RestaurantsGrpcService
    : Contracts.RestaurantsService.RestaurantsServiceBase
{
    private readonly RestaurantsHandler _restaurantsHandler;

    public RestaurantsGrpcService(
        RestaurantsHandler restaurantsHandler)
    {
        _restaurantsHandler = restaurantsHandler;
    }

    public override async Task<Contracts.GetRestaurantInfoReply>
        GetRestaurantInfo(
            Contracts.GetRestaurantInfoRequest request,
            ServerCallContext context)
    {
        var restaurant =
            await _restaurantsHandler.GetRestaurantInfoAsync(
                request.RestaurantId);

        if (restaurant == null)
        {
            throw new RpcException(
                new Status(
                    StatusCode.NotFound,
                    $"Restaurant with ID {request.RestaurantId} was not found."));
        }

        var response =
            new Contracts.GetRestaurantInfoReply
            {
                RestaurantName =
                    restaurant.RestaurantName,

                RestaurantAddress =
                    restaurant.RestaurantAddress,

                RestaurantCity =
                    restaurant.RestaurantCity,

                OpeningTime =
                    restaurant.OpeningTime.ToString("HH:mm"),

                ClosingTime =
                    restaurant.ClosingTime.ToString("HH:mm"),

                ReservationDurationMinutes =
                    restaurant.ReservationDurationMinutes
            };

        foreach (var tableGroup in restaurant.TableGroups)
        {
            response.TableGroups.Add(
                new Contracts.TableGroupReply
                {
                    Id = tableGroup.Id,
                    Location = tableGroup.Location,
                    Capacity = tableGroup.Capacity,
                    TableCount = tableGroup.TableCount
                });
        }

        return response;
    }
    
    public override async Task<Contracts.GetMenuItemsReply>
        GetMenuItems(
            Contracts.GetMenuItemsRequest request,
            ServerCallContext context)
    {
        var menuItems =
            await _restaurantsHandler
                .GetMenuItemsForRestaurantAsync(
                    request.RestaurantId);

        var requestedIds =
            request.MenuItemIds.ToHashSet();

        var response =
            new Contracts.GetMenuItemsReply();

        foreach (var menuItem in menuItems)
        {
            if (!requestedIds.Contains(
                    menuItem.MenuItemId))
            {
                continue;
            }

            response.MenuItems.Add(
                new Contracts.MenuItemReply
                {
                    MenuItemId = menuItem.MenuItemId,
                    FoodName = menuItem.FoodName,
                    Price = menuItem.Price.ToString(
                        System.Globalization.CultureInfo.InvariantCulture)
                });
        }

        return response;
    }
}