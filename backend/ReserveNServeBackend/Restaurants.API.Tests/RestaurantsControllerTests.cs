using Microsoft.AspNetCore.Mvc;
using Moq;
using Restaurants.API.Controllers;
using Restaurants.API.DTOs;
using Restaurants.API.DTOs.Requests;
using Restaurants.API.DTOs.Responses;
using Restaurants.API.Entities;
using Restaurants.API.Handler;
using Restaurants.API.Repositories;
using RestaurantEntity = Restaurants.API.Entities.Restaurant;
using TableEntity = Restaurants.API.Entities.Table;
using Xunit;

namespace Restaurants.API.Tests;

public class RestaurantsControllerTests
{
    private readonly Mock<IRestaurantsRepository> _repositoryMock;
    private readonly RestaurantsController _controller;

    public RestaurantsControllerTests()
    {
        _repositoryMock = new Mock<IRestaurantsRepository>(MockBehavior.Strict);
        var handler = new RestaurantsHandler(_repositoryMock.Object);
        _controller = new RestaurantsController(handler);
    }

    [Fact]
    public async Task GetRestaurantsAsync_WhenRestaurantsExist_ReturnsOkWithMappedPagedResponse()
    {
        // Arrange
        var request = new GetRestaurantsRequest
        {
            Search = "pizza",
            CuisineType = "Italian",
            Price = "$$",
            Page = 2,
            PageSize = 3
        };

        var restaurant = CreateRestaurant(
            id: 7,
            name: "Pizza House",
            cuisineType: 2,
            image: "07_Pizza_House.jpg");

        _repositoryMock
            .Setup(repository => repository.GetRestaurantsAsync(request))
            .ReturnsAsync(new PagedResult<RestaurantEntity>
            {
                Items = [restaurant],
                Page = 2,
                PageSize = 3,
                TotalCount = 10
            });

        _repositoryMock
            .Setup(repository => repository.GetCuisineTypeNameAsync(2))
            .ReturnsAsync("Italian");

        // Act
        var result = await _controller.GetRestaurantsAsync(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<GetRestaurantsResponse>(okResult.Value);

        Assert.Equal(200, okResult.StatusCode);
        Assert.Equal(2, response.Page);
        Assert.Equal(3, response.PageSize);
        Assert.Equal(10, response.TotalCount);
        Assert.Equal(4, response.TotalPages);

        var item = Assert.Single(response.Items);
        Assert.Equal(restaurant.id, item.Id);
        Assert.Equal(restaurant.name, item.Name);
        Assert.Equal(restaurant.description, item.Description);
        Assert.Equal(restaurant.city, item.City);
        Assert.Equal(restaurant.address, item.Address);
        Assert.Equal(restaurant.phone_number, item.PhoneNumber);
        Assert.Equal(restaurant.opening_time, item.OpeningTime);
        Assert.Equal(restaurant.closing_time, item.ClosingTime);
        Assert.Equal(restaurant.rating, item.Rating);
        Assert.Equal(restaurant.price, item.Price);
        Assert.Equal("Italian", item.CuisineType);
        Assert.Equal(restaurant.reservation_duration, item.ReservationDuration);
        Assert.Equal("07_Pizza_House.jpg", item.Image);

        _repositoryMock.Verify(repository => repository.GetRestaurantsAsync(request), Times.Once);
        _repositoryMock.Verify(repository => repository.GetCuisineTypeNameAsync(2), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantsAsync_WhenRepositoryThrows_ReturnsOkWithEmptyResponse()
    {
        // Arrange
        var request = new GetRestaurantsRequest
        {
            Page = 3,
            PageSize = 5
        };

        _repositoryMock
            .Setup(repository => repository.GetRestaurantsAsync(request))
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        // Act
        var result = await _controller.GetRestaurantsAsync(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<GetRestaurantsResponse>(okResult.Value);

        Assert.Equal(200, okResult.StatusCode);
        Assert.Empty(response.Items);
        Assert.Equal(3, response.Page);
        Assert.Equal(5, response.PageSize);
        Assert.Equal(0, response.TotalCount);
        Assert.Equal(0, response.TotalPages);

        _repositoryMock.Verify(repository => repository.GetRestaurantsAsync(request), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantByIdAsync_WhenRestaurantExists_ReturnsOkWithRestaurant()
    {
        // Arrange
        const int restaurantId = 11;
        var restaurant = CreateRestaurant(
            id: restaurantId,
            name: "Sakura",
            cuisineType: 4,
            image: "sakura.jpg");

        _repositoryMock
            .Setup(repository => repository.GetRestaurantByIdAsync(restaurantId))
            .ReturnsAsync(restaurant);

        _repositoryMock
            .Setup(repository => repository.GetCuisineTypeNameAsync(4))
            .ReturnsAsync("Japanese");

        // Act
        var result = await _controller.GetRestaurantByIdAsync(restaurantId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<RestaurantDTO>(okResult.Value);

        Assert.Equal(restaurantId, response.Id);
        Assert.Equal("Sakura", response.Name);
        Assert.Equal("Japanese", response.CuisineType);
        Assert.Equal("sakura.jpg", response.Image);
        Assert.Equal(restaurant.reservation_duration, response.ReservationDuration);

        _repositoryMock.Verify(repository => repository.GetRestaurantByIdAsync(restaurantId), Times.Once);
        _repositoryMock.Verify(repository => repository.GetCuisineTypeNameAsync(4), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantByIdAsync_WhenRestaurantDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        const int restaurantId = 404;

        _repositoryMock
            .Setup(repository => repository.GetRestaurantByIdAsync(restaurantId))
            .ReturnsAsync((RestaurantEntity?)null);

        // Act
        var result = await _controller.GetRestaurantByIdAsync(restaurantId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);

        _repositoryMock.Verify(repository => repository.GetRestaurantByIdAsync(restaurantId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantInfoAsync_WhenRestaurantExists_ReturnsOkWithTableGroups()
    {
        // Arrange
        const int restaurantId = 5;
        var restaurant = CreateRestaurant(
            id: restaurantId,
            name: "Tri Sesira",
            cuisineType: 1);

        var tables = new List<TableEntity>
        {
            new()
            {
                id = 101,
                restaurant_id = restaurantId,
                location = "Inside",
                seats = 4,
                total_table_number = 6
            },
            new()
            {
                id = 102,
                restaurant_id = restaurantId,
                location = "Garden",
                seats = 6,
                total_table_number = 3
            }
        };

        _repositoryMock
            .Setup(repository => repository.GetRestaurantByIdAsync(restaurantId))
            .ReturnsAsync(restaurant);

        _repositoryMock
            .Setup(repository => repository.GetTablesForRestaurantAsync(restaurantId))
            .ReturnsAsync(tables);

        // Act
        var result = await _controller.GetRestaurantInfoAsync(restaurantId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<GetRestaurantInfoResponse>(okResult.Value);

        Assert.Equal("Tri Sesira", response.RestaurantName);
        Assert.Equal(restaurant.address, response.RestaurantAddress);
        Assert.Equal(restaurant.city, response.RestaurantCity);
        Assert.Equal(restaurant.opening_time, response.OpeningTime);
        Assert.Equal(restaurant.closing_time, response.ClosingTime);
        Assert.Equal(restaurant.reservation_duration, response.ReservationDurationMinutes);

        var groups = response.TableGroups.ToList();
        Assert.Equal(2, groups.Count);
        Assert.Equal(101, groups[0].Id);
        Assert.Equal("Inside", groups[0].Location);
        Assert.Equal(4, groups[0].Capacity);
        Assert.Equal(6, groups[0].TableCount);
        Assert.Equal(102, groups[1].Id);
        Assert.Equal("Garden", groups[1].Location);
        Assert.Equal(6, groups[1].Capacity);
        Assert.Equal(3, groups[1].TableCount);

        _repositoryMock.Verify(repository => repository.GetRestaurantByIdAsync(restaurantId), Times.Once);
        _repositoryMock.Verify(repository => repository.GetTablesForRestaurantAsync(restaurantId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantInfoAsync_WhenRestaurantDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        const int restaurantId = 999;

        _repositoryMock
            .Setup(repository => repository.GetRestaurantByIdAsync(restaurantId))
            .ReturnsAsync((RestaurantEntity?)null);

        // Act
        var result = await _controller.GetRestaurantInfoAsync(restaurantId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);

        _repositoryMock.Verify(repository => repository.GetRestaurantByIdAsync(restaurantId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetTableAsync_WhenTableExists_ReturnsOkWithMappedTable()
    {
        // Arrange
        const int tableId = 15;
        var table = new TableEntity
        {
            id = tableId,
            restaurant_id = 3,
            location = "Terrace",
            seats = 4,
            total_table_number = 8
        };

        _repositoryMock
            .Setup(repository => repository.GetTableAsync(tableId))
            .ReturnsAsync(table);

        // Act
        var result = await _controller.GetTableAsync(tableId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TableDTO>(okResult.Value);

        Assert.Equal(table.id, response.Id);
        Assert.Equal(table.restaurant_id, response.RestaurantId);
        Assert.Equal(table.location, response.Location);
        Assert.Equal(table.seats, response.Seats);
        Assert.Equal(table.total_table_number, response.AvailableNumber);

        _repositoryMock.Verify(repository => repository.GetTableAsync(tableId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetTableAsync_WhenTableDoesNotExist_ReturnsNotFound()
    {
        // Arrange
        const int tableId = 999;

        _repositoryMock
            .Setup(repository => repository.GetTableAsync(tableId))
            .ReturnsAsync((TableEntity?)null);

        // Act
        var result = await _controller.GetTableAsync(tableId);

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);

        _repositoryMock.Verify(repository => repository.GetTableAsync(tableId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetMenuForRestaurant_WhenMenuItemsExist_ReturnsOkWithMappedItems()
    {
        // Arrange
        const int restaurantId = 8;
        var menuItems = CreateMenuItems(restaurantId);

        _repositoryMock
            .Setup(repository => repository.GetMenuItemsAsync(restaurantId))
            .ReturnsAsync(menuItems);

        // Act
        var result = await _controller.GetMenuForRestaurant(restaurantId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<MenuItemDTO>>(okResult.Value);
        var items = response.ToList();

        Assert.Equal(2, items.Count);
        Assert.Equal(menuItems[0].id, items[0].Id);
        Assert.Equal(menuItems[0].restaurant_id, items[0].RestaurantId);
        Assert.Equal(menuItems[0].food_name, items[0].FoodName);
        Assert.Equal(menuItems[0].description, items[0].Description);
        Assert.Equal(menuItems[0].price, items[0].Price);
        Assert.Equal(menuItems[0].image, items[0].Image);
        Assert.Equal(menuItems[0].category, items[0].Category);

        _repositoryMock.Verify(repository => repository.GetMenuItemsAsync(restaurantId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetMenuForRestaurant_WhenRepositoryThrows_ReturnsOkWithEmptyCollection()
    {
        // Arrange
        const int restaurantId = 8;

        _repositoryMock
            .Setup(repository => repository.GetMenuItemsAsync(restaurantId))
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        // Act
        var result = await _controller.GetMenuForRestaurant(restaurantId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<MenuItemDTO>>(okResult.Value);
        Assert.Empty(response);

        _repositoryMock.Verify(repository => repository.GetMenuItemsAsync(restaurantId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetMenuItemsForRestaurant_WhenMenuItemsExist_ReturnsOkWithCompactItems()
    {
        // Arrange
        const int restaurantId = 12;
        var menuItems = CreateMenuItems(restaurantId);

        _repositoryMock
            .Setup(repository => repository.GetMenuItemsAsync(restaurantId))
            .ReturnsAsync(menuItems);

        // Act
        var result = await _controller.GetMenuItemsForRestaurant(restaurantId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsAssignableFrom<IEnumerable<GetMenuItemsForRestaurantResponse>>(okResult.Value);
        var items = response.ToList();

        Assert.Equal(2, items.Count);
        Assert.Equal(menuItems[0].id, items[0].MenuItemId);
        Assert.Equal(menuItems[0].food_name, items[0].FoodName);
        Assert.Equal(menuItems[0].price, items[0].Price);
        Assert.Equal(menuItems[1].id, items[1].MenuItemId);
        Assert.Equal(menuItems[1].food_name, items[1].FoodName);
        Assert.Equal(menuItems[1].price, items[1].Price);

        _repositoryMock.Verify(repository => repository.GetMenuItemsAsync(restaurantId), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantsFilters_WhenFiltersExist_ReturnsOkWithFilters()
    {
        // Arrange
        var cuisines = new[] { "Serbian", "Italian", "Japanese" };
        var prices = new[] { "$", "$$", "$$$" };

        _repositoryMock
            .Setup(repository => repository.GetCuisinesAsync())
            .ReturnsAsync(cuisines);

        _repositoryMock
            .Setup(repository => repository.GetRangePricesAsync())
            .ReturnsAsync(prices);

        // Act
        var result = await _controller.GetRestaurantsFilters();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<GetRestaurantsFiltersResponse>(okResult.Value);

        Assert.Equal(cuisines, response.Cuisines);
        Assert.Equal(prices, response.RangePrices);

        _repositoryMock.Verify(repository => repository.GetCuisinesAsync(), Times.Once);
        _repositoryMock.Verify(repository => repository.GetRangePricesAsync(), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetRestaurantsFilters_WhenRepositoryThrows_ReturnsNotFound()
    {
        // Arrange
        _repositoryMock
            .Setup(repository => repository.GetCuisinesAsync())
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));

        // Act
        var result = await _controller.GetRestaurantsFilters();

        // Assert
        Assert.IsType<NotFoundResult>(result.Result);

        _repositoryMock.Verify(repository => repository.GetCuisinesAsync(), Times.Once);
        _repositoryMock.VerifyNoOtherCalls();
    }

    private static RestaurantEntity CreateRestaurant(
        int id,
        string name,
        int cuisineType,
        string? image = null)
    {
        return new RestaurantEntity
        {
            id = id,
            name = name,
            description = $"Description for {name}",
            city = "Belgrade",
            address = "Knez Mihailova 1",
            phone_number = "+381111234567",
            opening_time = new TimeOnly(9, 0),
            closing_time = new TimeOnly(23, 0),
            rating = 4.7,
            price = "$$",
            cuisine_type = cuisineType,
            reservation_duration = 90,
            image = image
        };
    }

    private static List<MenuItem> CreateMenuItems(int restaurantId)
    {
        return
        [
            new MenuItem
            {
                id = 1,
                restaurant_id = restaurantId,
                food_name = "Bruschetta",
                description = "Tomato, basil and olive oil",
                price = 690m,
                image = "bruschetta.jpg",
                category = "Appetizer"
            },
            new MenuItem
            {
                id = 2,
                restaurant_id = restaurantId,
                food_name = "Tiramisu",
                description = "Classic Italian dessert",
                price = 590m,
                image = "tiramisu.jpg",
                category = "Dessert"
            }
        ];
    }
}
