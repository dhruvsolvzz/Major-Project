@echo off
echo ========================================
echo   Starting BloodCamp Application
echo ========================================
echo.

echo Checking if in correct directory...
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

echo Starting both servers...
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

npm run dev
