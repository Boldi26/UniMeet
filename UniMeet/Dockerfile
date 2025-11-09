# syntax=docker/dockerfile:1

# Set the .NET version
ARG DOTNET_VERSION=9.0

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS builder
WORKDIR /src

# Copy solution and project files
COPY ../UniMeet.DataContext/UniMeet.DataContext.csproj ./UniMeet.DataContext/
COPY UniMeet.csproj ./UniMeet/
COPY UniMeet.sln ./

# Restore dependencies
WORKDIR /src/UniMeet
RUN dotnet restore

# Copy all source code
WORKDIR /src
COPY ../UniMeet.DataContext/ ./UniMeet.DataContext/
COPY . ./UniMeet/

# Build and publish
WORKDIR /src/UniMeet
RUN dotnet publish UniMeet.csproj -c Release -o /app/publish --no-restore

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

# Copy published output from build stage
COPY --from=builder /app/publish .

# Copy SQL initialization script
COPY UniMeet.sql /app/UniMeet.sql

# Expose port
EXPOSE 5186

# Set environment variables for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:5186

# Start the application
ENTRYPOINT ["dotnet", "UniMeet.dll"]
