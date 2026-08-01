@echo off
echo Backend ve frontend baslatiliyor, 2 pencere acilacak...

start "KOPRU Backend" cmd /k "cd /d "%~dp0backend" && pip install -r requirements.txt && uvicorn main:app --reload"

timeout /t 3 /nobreak >nul

start "KOPRU Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo Iki pencere de acildi. Frontend penceresinde "Local: http://localhost:...."
echo yazan adresi tarayicida ac.
