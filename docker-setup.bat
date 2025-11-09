@echo off
echo ========================================
echo UniMeet Docker Setup
echo ========================================
echo.

echo [1/4] Ellenorzes: Docker telepitve van?
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker nincs telepitve!
    echo Telepitsd innen: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
echo [OK] Docker telepitve van.
echo.

echo [2/4] Leallitas: Regi kontenerek torlese...
docker-compose down -v

echo.
echo [3/4] Build: Docker image-ek keszitese...
docker-compose build

echo.
echo [4/4] Inditas: Kontenerek elinditasa...
docker-compose up -d

echo.
echo ========================================
echo UniMeet SIKERESEN ELINDULT!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5186
echo SQL Server: localhost:1433
echo.
echo Logok megtekintese:
echo   docker-compose logs -f
echo.
echo Leallitas:
echo   docker-compose down
echo.
echo FONTOS: Vard meg ~30 masodpercet, amig az SQL Server elindul!
echo.
pause
