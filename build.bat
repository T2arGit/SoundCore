@echo off
echo ===================================
echo   Compiling Soundcore...
echo ===================================

call npm run dist

echo.
echo ===================================
echo   Build complete! 
echo   Check the "dist" folder for the new EXE files.
echo ===================================
pause
