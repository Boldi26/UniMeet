## Running UniMeet with Docker

This project provides Docker support for both the backend (ASP.NET Core) and frontend (TypeScript/Vite) applications. The setup uses Docker Compose to orchestrate both services.

### Project-Specific Requirements

- **Backend (.NET):**
  - Uses .NET 7.0 (see `ARG DOTNET_VERSION=7.0` in Dockerfile)
  - Exposes port **80**
- **Frontend (Vite/Node.js):**
  - Uses Node.js version **22.13.1** (see `ARG NODE_VERSION=22.13.1` in Dockerfile)
  - Exposes port **5173**

### Environment Variables
- No required environment variables are set by default in the Dockerfiles or compose file.
- If you need to provide environment variables, you can uncomment and use the `env_file` lines in the `docker-compose.yml` for each service.

### Build and Run Instructions

1. **Ensure Docker and Docker Compose are installed.**
2. **From the project root, run:**
   ```sh
   docker compose up --build
   ```
   This will build and start both the backend and frontend services.

### Service Ports
- **Backend (csharp-UniMeet):** Accessible at [http://localhost:80](http://localhost:80)
- **Frontend (typescript-UniMeet.Frontend):** Accessible at [http://localhost:5173](http://localhost:5173)

### Special Configuration
- Both services run as non-root users inside their containers for improved security.
- Both services are connected to the `unimeet-net` Docker network for internal communication.
- If you need to add a database service, update the `docker-compose.yml` accordingly and ensure the backend is configured to connect to it.

### Notes
- The frontend service depends on the backend and will wait for it to be available.
- If you need to customize ports or environment variables, edit the `docker-compose.yml` file as needed.

---

*This section was updated to reflect the current Docker-based setup for UniMeet. If you have custom environment or database requirements, please refer to the backend and frontend documentation or source code for further configuration details.*
