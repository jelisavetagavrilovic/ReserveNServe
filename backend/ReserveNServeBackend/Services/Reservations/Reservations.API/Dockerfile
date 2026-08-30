FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Services/Reservations/Reservations.API/Reservations.API.csproj", "Services/Reservations/Reservations.API/"]
COPY ["Services/Reservations/Reservations.Application/Reservations.Application.csproj", "Services/Reservations/Reservations.Application/"]
COPY ["Services/Reservations/Reservations.Domain/Reservations.Domain.csproj", "Services/Reservations/Reservations.Domain/"]
COPY ["Services/Reservations/Reservations.Infrastructure/Reservations.Infrastructure.csproj", "Services/Reservations/Reservations.Infrastructure/"]
COPY ["BuildingBlocks/Contracts/Contracts.csproj", "BuildingBlocks/Contracts/"]

RUN dotnet restore "Services/Reservations/Reservations.API/Reservations.API.csproj"

COPY . .

WORKDIR "/src/Services/Reservations/Reservations.API"
RUN dotnet build "./Reservations.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Reservations.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Reservations.API.dll"]
