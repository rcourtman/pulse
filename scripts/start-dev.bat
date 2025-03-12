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
call npx kill-port 7654 7656 3000

REM Clear any existing data files that might persist between sessions
echo Clearing any persisted data from previous sessions...
node scripts/clear-data.js

REM Set environment to development
set NODE_ENV=development

REM Load environment variables from .env if it exists
if exist .env (
    echo Loading environment from .env
    for /f "tokens=*" %%a in (.env) do (
        set "%%a"
    )
)

REM Override with development settings
set USE_MOCK_DATA=true
set MOCK_DATA_ENABLED=true
set MOCK_SERVER_PORT=7656

REM Start the mock data server on port 7656
echo Starting mock data server on port 7656...
start /b cmd /c "npx ts-node src/mock/run-server.ts"

REM Wait a moment for the mock server to start
timeout /t 3 /nobreak > nul

REM Verify mock server is running
call :check_server_running 7656 "Mock server"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Mock server failed to start on port 7656
    exit /b 1
)

REM Start the backend server on port 7654
echo Starting backend server on port 7654...
start /b cmd /c "set PORT=7654 && npm run dev:server"

REM Wait a moment for the server to start
timeout /t 3 /nobreak > nul

REM Verify backend server is running
call :check_server_running 7654 "Backend server"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend server failed to start on port 7654
    exit /b 1
)

REM Set host IP to bind to all interfaces
set HOST_IP=0.0.0.0

echo.
echo Pulse is now running in development mode with mock data!
echo - Mock Data Server: http://localhost:7656 (internal only)
echo - Backend API: http://localhost:7654 (internal only)
echo - Frontend UI: http://localhost:3000 (use this for development)
echo.
echo Access the application at: http://localhost:3000
echo.

REM Start the frontend Vite dev server
echo Starting frontend development server on port 3000...
cd frontend && npm run dev -- --host %HOST_IP% --port 3000 --strict-port

REM When the frontend exits, also kill the backend and mock servers
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq npm run dev:server" 2>nul
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq npx ts-node src/mock/run-server.ts" 2>nul
exit /b 0

:check_server_running
set PORT=%~1
set SERVER_NAME=%~2
netstat -ano | findstr ":%PORT% " | findstr "LISTENING" > nul
if %ERRORLEVEL% NEQ 0 (
    echo %SERVER_NAME% is not running on port %PORT%
    exit /b 1
)
echo %SERVER_NAME% is running on port %PORT%
exit /b 0 