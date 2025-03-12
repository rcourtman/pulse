@echo off
setlocal

REM Stop any running Pulse Docker containers first
echo Stopping any running Pulse Docker containers...
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('docker ps -q --filter "name=pulse"') do (
        docker stop %%i
    )
) else (
    echo Docker not found, skipping container cleanup...
)

REM Kill any existing servers
echo Killing any existing servers...
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq node dist/server.js" 2>nul
call npx kill-port 7654 7655 3000

REM Set environment to development with mock data
set NODE_ENV=development
set USE_MOCK_DATA=true
set MOCK_DATA_ENABLED=true

REM Load environment variables from .env if it exists
if exist .env (
    echo Loading environment from .env
    for /f "tokens=*" %%a in (.env) do (
        set "%%a"
    )
)

REM Override with mock data settings
set USE_MOCK_DATA=true
set MOCK_DATA_ENABLED=true

REM Start the mock data server
echo Starting mock data server...
start /b cmd /c "ts-node src/mock/run-server.ts > %TEMP%\pulse-mock-server.log 2>&1"

REM Wait a moment for the mock server to start
timeout /t 2 /nobreak > nul

REM Start the backend server with mock data
echo Starting backend server with mock data on port 7655...
start /b cmd /c "set USE_MOCK_DATA=true && set MOCK_DATA_ENABLED=true && set PORT=7655 && npm run dev:server"

REM Wait a moment for the server to start
timeout /t 3 /nobreak > nul

REM Set host IP to bind to all interfaces
set HOST_IP=0.0.0.0

REM Verify mock data is enabled
echo Verifying mock data is enabled...
curl -s "http://localhost:7655/api/status" | findstr "mockDataEnabled" > nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Mock data is enabled
) else (
    echo ❌ Mock data is NOT enabled
)

echo.
echo Pulse is now running with mock data!
echo - Backend API: http://localhost:7655 (internal only)
echo - Frontend UI: http://localhost:7654 (use this for development)
echo.
echo Access the application at: http://localhost:7654
echo.

REM Start the frontend Vite dev server
echo Starting Pulse interface with mock data on port 7654...
cd frontend && set USE_MOCK_DATA=true && set MOCK_DATA_ENABLED=true && npm run dev -- --host %HOST_IP% --port 7654

REM When the frontend exits, also kill the backend and mock server
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq npm run dev:server" 2>nul
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq ts-node src/mock/run-server.ts" 2>nul 