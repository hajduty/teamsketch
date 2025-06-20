FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["teamsketch_backend/teamsketch_backend.csproj", "teamsketch_backend/"]
RUN dotnet restore "teamsketch_backend/teamsketch_backend.csproj"
COPY . .
RUN dotnet publish "teamsketch_backend/teamsketch_backend.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "teamsketch_backend.dll"]
