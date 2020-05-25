FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build
WORKDIR /app

COPY . /app
WORKDIR /app/csharp/src/GreeterServer

RUN dotnet restore

RUN dotnet publish -c Release -o out

# FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS runtime
WORKDIR /app/csharp/src/GreeterServer/out
ENTRYPOINT ["dotnet", "GreeterServer.dll"]