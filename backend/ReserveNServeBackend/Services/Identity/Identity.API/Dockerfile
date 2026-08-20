FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["Services/Identity/Identity.API/Identity.API.csproj", "Services/Identity/Identity.API/"]

COPY ["BuildingBlocks/Contracts/Contracts.csproj", "BuildingBlocks/Contracts/"]

RUN dotnet restore "Services/Identity/Identity.API/Identity.API.csproj"

COPY . .

WORKDIR "/src/Services/Identity/Identity.API"

RUN dotnet publish "Identity.API.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "Identity.API.dll"]