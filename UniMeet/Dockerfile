# syntax=docker/dockerfile:1

# Set the .NET version from the csproj (update if needed)
ARG DOTNET_VERSION=7.0

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS builder
WORKDIR /src

# Copy csproj and restore as distinct layers for better caching
COPY --link UniMeet.csproj ./
COPY --link UniMeet.DataContext/UniMeet.DataContext.csproj ./UniMeet.DataContext/
RUN --mount=type=cache,target=/root/.nuget/packages \
    --mount=type=cache,target=/root/.cache/msbuild \
    dotnet restore UniMeet.csproj

# Copy the rest of the source code
COPY --link . .

# Publish the application
RUN dotnet publish UniMeet.csproj -c Release -o /app/publish --no-restore

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS final
WORKDIR /app

# Create a non-root user
RUN addgroup --system unimeet && adduser --system --ingroup unimeet unimeet
USER unimeet

# Copy published output from build stage
COPY --from=builder /app/publish .

# Expose port 80 (update if your app uses a different port)
EXPOSE 80

# Set environment variables for ASP.NET Core
ENV ASPNETCORE_URLS=http://+:80

# Start the application
ENTRYPOINT ["dotnet", "UniMeet.dll"]
