@echo off
setlocal enabledelayedexpansion

:: Display header
echo =======================================
echo        Pulse Application Launcher      
echo =======================================

:menu
echo.
echo Please select an environment to start:
echo 1) Development (with real Proxmox data)
echo 2) Development (with mock data)
echo 3) Production
echo 4) Docker Development
echo 5) Docker Production
echo q) Quit
echo.
echo Enter your choice:

set /p choice=

if "%choice%"=="1" (
    echo.
    echo Starting development environment with real Proxmox data...
    node scripts\start.js dev
    goto end
) else if "%choice%"=="2" (
    echo.
    echo Starting development environment with mock data...
    node scripts\start.js mock
    goto end
) else if "%choice%"=="3" (
    echo.
    echo Starting production environment...
    node scripts\start.js prod
    goto end
) else if "%choice%"=="4" (
    echo.
    echo Starting Docker development environment...
    copy .env.example .env
    powershell -Command "(Get-Content .env) -replace 'NODE_ENV=production', 'NODE_ENV=development' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'DOCKERFILE=docker/Dockerfile', 'DOCKERFILE=docker/Dockerfile.dev' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_SRC_MOUNT', 'DEV_SRC_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_SRC_MOUNT', 'DEV_FRONTEND_SRC_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_PUBLIC_MOUNT', 'DEV_FRONTEND_PUBLIC_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_INDEX_MOUNT', 'DEV_FRONTEND_INDEX_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_CONFIG_MOUNT', 'DEV_FRONTEND_CONFIG_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_SCRIPTS_MOUNT', 'DEV_SCRIPTS_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_ENV_MOUNT', 'DEV_ENV_MOUNT' | Set-Content .env"
    docker compose up --build
    goto end
) else if "%choice%"=="5" (
    echo.
    echo Starting Docker production environment...
    copy .env.example .env
    docker compose up --build
    goto end
) else if "%choice%"=="q" (
    echo.
    echo Exiting...
    goto end
) else (
    echo.
    echo Invalid option. Please try again.
    goto menu
)

:end
endlocal 