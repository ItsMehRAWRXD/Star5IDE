FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["PolymorphicBackend.csproj", "./"]
RUN dotnet restore "PolymorphicBackend.csproj"
COPY . .
RUN dotnet build "PolymorphicBackend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PolymorphicBackend.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Install C# compiler for runtime compilation
RUN apt-get update && \
    apt-get install -y mono-mcs && \
    rm -rf /var/lib/apt/lists/*

ENTRYPOINT ["dotnet", "PolymorphicBackend.dll"]