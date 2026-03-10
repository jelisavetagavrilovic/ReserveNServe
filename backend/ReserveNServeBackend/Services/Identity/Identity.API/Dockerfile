FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/ReserveNServeBackend/Services/Identity/Identity.API/Identity.API.csproj", "backend/ReserveNServeBackend/Services/Identity/Identity.API/"]
RUN dotnet restore "backend/ReserveNServeBackend/Services/Identity/Identity.API/Identity.API.csproj"

COPY . .
WORKDIR "/src/backend/ReserveNServeBackend/Services/Identity/Identity.API"
RUN dotnet publish "Identity.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Identity.API.dll"]