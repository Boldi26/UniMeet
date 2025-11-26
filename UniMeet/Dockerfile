# syntax=docker/dockerfile:1

# Set the .NET version
ARG DOTNET_VERSION=9.0

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS builder
WORKDIR /src

# Copy solution and project files first for better caching
COPY UniMeet.sln ./
COPY UniMeet/UniMeet.csproj ./UniMeet/
COPY UniMeet.DataContext/UniMeet.DataContext.csproj ./UniMeet.DataContext/

# Restore dependencies
RUN dotnet restore

# Copy all source code
COPY UniMeet/ ./UniMeet/
COPY UniMeet.DataContext/ ./UniMeet.DataContext/

# Build and publish
WORKDIR /src/UniMeet
RUN dotnet publish -c Release -o /app/publish --no-restore

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

# Copy published output from build stage
COPY --from=builder /app/publish .

# Expose port
EXPOSE 5186

# Set environment variables for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:5186
ENV ASPNETCORE_Kestrel__Limits__MaxRequestBodySize=52428800

# Start the application
ENTRYPOINT ["dotnet", "UniMeet.dll"]
