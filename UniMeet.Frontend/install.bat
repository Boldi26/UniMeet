@echo off
echo ========================================
echo UniMeet Frontend - Telepito
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Fuggosegek telepitese...
call npm install

echo.
echo [2/3] React Router telepitese...
call npm install react-router-dom

echo.
echo [3/3] Ellenorzes...
call npm list react react-dom react-router-dom axios

echo.
echo ========================================
echo Telepites KESZ!
echo ========================================
echo.
echo Inditsad el a frontend-et:
echo   npm run dev
echo.
echo Backend URL ellenorzese:
echo   src/services/apiService.ts
echo.
pause
