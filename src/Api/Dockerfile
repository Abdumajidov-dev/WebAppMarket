FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/Api/UzMarket.Api.csproj", "Api/"]
COPY ["src/Application/UzMarket.Application.csproj", "Application/"]
COPY ["src/Domain/UzMarket.Domain.csproj", "Domain/"]
COPY ["src/Infrastructure/UzMarket.Infrastructure.csproj", "Infrastructure/"]
RUN dotnet restore "Api/UzMarket.Api.csproj"

COPY src/ .
RUN dotnet publish "Api/UzMarket.Api.csproj" -c Release -o /app/publish --no-restore

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "UzMarket.Api.dll"]
