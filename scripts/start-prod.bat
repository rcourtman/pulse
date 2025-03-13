@echo off
setlocal enabledelayedexpansion

REM Check for dry run flag
set DRY_RUN=false
for %%a in (%*) do (
    if "%%a"=="--dry-run" (
        set DRY_RUN=true
        echo Dry run mode enabled - will not actually start the server
    )
)

REM Kill any existing server processes
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq node dist/server.js" 2>nul
taskkill /f /im "node.exe" /fi "WINDOWTITLE eq ts-node src/mock/run-server.ts" 2>nul
call npx kill-port 7654 7655 7656 5173

REM Clear any existing data files that might persist between sessions
echo Clearing any persisted data from previous sessions...
node scripts/clear-data.js

REM Set environment to production
set NODE_ENV=production

REM Load environment variables from .env if it exists
if exist .env (
    echo Loading environment from .env
    for /f "tokens=*" %%a in (.env) do (
        set "line=%%a"
        if not "!line:~0,1!"=="#" (
            if not "!line!"=="" (
                set "%%a"
            )
        )
    )
)

REM Force mock data to be disabled for production
set USE_MOCK_DATA=false
set MOCK_DATA_ENABLED=false

REM Build the backend
echo Building the backend...
if "%DRY_RUN%"=="false" (
    call npm run build
) else (
    echo [DRY RUN] Would run: npm run build
)

REM Build the frontend
echo Building the frontend...
if "%DRY_RUN%"=="false" (
    cd frontend
    call npm run build
    cd ..
) else (
    echo [DRY RUN] Would run: cd frontend ^&^& npm run build ^&^& cd ..
)

REM Start the production server
echo Starting production server...
if "%DRY_RUN%"=="false" (
    node dist/server.js
) else (
    echo [DRY RUN] Would run: node dist/server.js
)

REM If we're using mock data, start the mock server
if "%USE_MOCK_DATA%"=="true" (
    echo Starting mock data server on port 7656...
    
    :: Start the mock server
    start /b node dist/mock/run-server.js > %TEMP%\pulse-mock-server.log 2>&1
    
    :: Wait a moment for the mock server to start
    timeout /t 5 > nul
    
    :: Verify mock server is running
    if "%DOCKER_CONTAINER%"=="" (
      :: Not in Docker, check localhost
      for /f "tokens=*" %%a in ('powershell -Command "(Invoke-WebRequest -Uri http://localhost:7656 -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode"') do set HTTP_CODE=%%a
    ) else (
      :: In Docker, check 0.0.0.0
      for /f "tokens=*" %%a in ('powershell -Command "(Invoke-WebRequest -Uri http://0.0.0.0:7656 -UseBasicParsing -ErrorAction SilentlyContinue).StatusCode"') do set HTTP_CODE=%%a
    )
    
    :: Check if we got a valid HTTP response (200 or 404 both mean the server is running)
    if "%HTTP_CODE%"=="200" (
      echo ✅ Mock server is running on port 7656 (HTTP code: %HTTP_CODE%)
    ) else if "%HTTP_CODE%"=="404" (
      echo ✅ Mock server is running on port 7656 (HTTP code: %HTTP_CODE%)
    ) else (
      echo ❌ Mock server failed to start
      type %TEMP%\pulse-mock-server.log
    )
)

REM When the server exits, also kill the mock server if it's running
if "%USE_MOCK_DATA%"=="true" (
    taskkill /f /im "node.exe" /fi "WINDOWTITLE eq node dist/mock/run-server.js" 2>nul
) 