FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build
WORKDIR /app

COPY . /app
WORKDIR /app/csharp/src/GreeterClient
RUN dotnet restore

RUN dotnet publish -c Release -o out

# FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS runtime
WORKDIR /app/csharp/src/GreeterClient/out
ENTRYPOINT ["dotnet", "GreeterClient.dll"]