@echo off
echo ========================================
echo UniMeet Frontend - Inditasa
echo ========================================
echo.

cd /d "%~dp0"

echo Ellenorzes: Backend fut?
echo Backend URL: https://localhost:7048/api
echo.
echo Ha a backend NEM fut, inditsd el:
echo   cd ..\UniMeet
echo   dotnet run
echo.
echo Nyomd meg barmilyen billentyut a frontend inditasahoz...
pause >nul

echo.
echo Frontend inditasa http://localhost:5173 ...
echo.
call npm run dev
