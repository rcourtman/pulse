@echo off
setlocal enabledelayedexpansion

REM Kill any existing server processes
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq node dist/server.js" 2>nul
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq ts-node src/mock/run-server.ts" 2>nul
call npx kill-port 7654 7655

REM Set environment to production
set NODE_ENV=production

REM Check if .env.production exists and load it
if exist .env.production (
    echo Loading production environment from .env.production
    for /f "tokens=*" %%a in (.env.production) do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            if not "!line!"=="" (
                set "%%a"
            )
        )
    )
) else (
    echo WARNING: .env.production file not found. Using default .env file.
)

REM Force mock data to be disabled for production
set USE_MOCK_DATA=false
set MOCK_DATA_ENABLED=false

REM Build the backend
call npm run build

REM Build the frontend
cd frontend
call npm run build
cd ..

REM Start the production server
node dist/server.js

REM When the server exits, also kill the mock server if it's running
if "%USE_MOCK_DATA%"=="true" (
    taskkill /f /im "node.exe" /fi "WINDOWTITLE eq ts-node src/mock/run-server.ts" 2>nul
) 