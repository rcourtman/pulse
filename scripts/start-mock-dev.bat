@echo off
setlocal

:: Kill any existing servers
echo Killing any existing servers...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq dist/server.js" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq ts-node src/mock/run-server.ts" 2>nul
npx kill-port 7654 7655 7656 5173

:: Clear any existing data files that might persist between sessions
echo Clearing any persisted data from previous sessions...
node scripts/clear-data.js

:: Set environment to development and load the environment file
set NODE_ENV=development

:: Load environment variables from .env if it exists
if exist .env (
  echo Loading environment from .env
  for /f "tokens=*" %%a in (.env) do set "%%a"
)

:: Force mock data to be enabled for development
set USE_MOCK_DATA=true
set MOCK_DATA_ENABLED=true

:: Start the mock server in the background
echo Starting mock server...
start /B node scripts/start-mock-server.js
set MOCK_SERVER_PID=%ERRORLEVEL%

:: Build the backend
echo Building backend...
call npm run build

:: Build the frontend
echo Building frontend...
cd frontend && call npm run build && cd ..

:: Start the development server
echo Starting development server...
node dist/server.js

:: When the server exits, also kill the mock server
taskkill /F /PID %MOCK_SERVER_PID% 2>nul 