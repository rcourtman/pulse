@echo off
setlocal enabledelayedexpansion

:: Display header
echo =======================================
echo        Pulse Application Launcher      
echo =======================================

:menu
echo.
echo Welcome to Pulse! For beginners, try option 2 (Mock Data).
echo.
echo DEVELOPMENT:
echo 1) Dev - Real Proxmox (Uses your Proxmox servers, port 3000)
echo 2) Dev - Mock Data *** RECOMMENDED FOR BEGINNERS *** (No real servers needed, port 3000)
echo.
echo PRODUCTION:
echo 3) Production (Real Proxmox, optimized build, port 7654)
echo.
echo DOCKER:
echo 4) Docker Dev (Mock data, hot-reloading, ports 7654/3000)
echo 5) Docker Prod (Real Proxmox, optimized build, port 7654)
echo.
echo q) Quit
echo.
echo Choice (1-5 or q):

set /p choice=

if "%choice%"=="1" (
    echo.
    echo Starting development environment with real Proxmox data...
    
    :: Ensure .env file exists
    if not exist .env (
        copy .env.example .env
    )
    
    :: Configure environment for dev
    node scripts\configure-env.js dev
    
    :: Override the mock data settings to use real data
    powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=true', 'USE_MOCK_DATA=false' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=true', 'MOCK_DATA_ENABLED=false' | Set-Content .env"
    
    echo Configured environment to use real Proxmox data
    
    :: Now run with real data
    set NODE_ENV=development
    set USE_MOCK_DATA=false
    set MOCK_DATA_ENABLED=false
    
    :: Run the start-dev.bat script directly 
    if exist scripts\start-dev.bat (
        call scripts\start-dev.bat
    ) else (
        node scripts\start.js dev
    )
    goto end
) else if "%choice%"=="2" (
    echo.
    echo Starting development environment with mock data...
    
    :: Ensure .env file exists
    if not exist .env (
        copy .env.example .env
    )
    
    :: Configure environment for dev
    node scripts\configure-env.js dev
    
    :: Ensure mock data settings are set to true (should already be, but just to be safe)
    powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=false', 'USE_MOCK_DATA=true' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=false', 'MOCK_DATA_ENABLED=true' | Set-Content .env"
    
    echo Configured environment to use mock data
    
    :: Now run with mock data
    set NODE_ENV=development
    set USE_MOCK_DATA=true
    set MOCK_DATA_ENABLED=true
    
    :: Run the start-dev.bat script directly
    if exist scripts\start-dev.bat (
        call scripts\start-dev.bat
    ) else (
        node scripts\start.js dev
    )
    goto end
) else if "%choice%"=="3" (
    echo.
    echo Starting production environment...
    
    :: Ensure .env file exists
    if not exist .env (
        copy .env.example .env
    )
    
    :: Configure environment for production
    node scripts\configure-env.js prod
    
    :: Ensure mock data settings are set to false for production
    powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=true', 'USE_MOCK_DATA=false' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=true', 'MOCK_DATA_ENABLED=false' | Set-Content .env"
    
    echo Configured environment for production mode
    
    :: Set environment variables directly for production
    set NODE_ENV=production
    set USE_MOCK_DATA=false
    set MOCK_DATA_ENABLED=false
    
    :: Run the start-prod.bat script directly
    if exist scripts\start-prod.bat (
        call scripts\start-prod.bat
    ) else (
        node scripts\start.js prod
    )
    goto end
) else if "%choice%"=="4" (
    echo.
    echo Starting Docker development environment...
    
    :: Ensure .env file exists but don't overwrite an existing one
    if not exist .env (
        echo Creating .env file from .env.example
        copy .env.example .env
    ) else (
        echo Using existing .env file
    )
    
    :: Configure for Docker development
    :: Set development environment
    powershell -Command "(Get-Content .env) -replace 'NODE_ENV=production', 'NODE_ENV=development' | Set-Content .env"
    :: Use the development Dockerfile (with correct path format)
    powershell -Command "(Get-Content .env) -replace 'DOCKERFILE=docker/Dockerfile', 'DOCKERFILE=docker/Dockerfile.dev' | Set-Content .env"
    
    :: Enable mock data for Docker development
    powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=false', 'USE_MOCK_DATA=true' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=false', 'MOCK_DATA_ENABLED=true' | Set-Content .env"
    
    :: Configure Docker development mounts
    powershell -Command "(Get-Content .env) -replace '# DEV_SRC_MOUNT', 'DEV_SRC_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_SRC_MOUNT', 'DEV_FRONTEND_SRC_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_PUBLIC_MOUNT', 'DEV_FRONTEND_PUBLIC_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_INDEX_MOUNT', 'DEV_FRONTEND_INDEX_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_FRONTEND_CONFIG_MOUNT', 'DEV_FRONTEND_CONFIG_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_SCRIPTS_MOUNT', 'DEV_SCRIPTS_MOUNT' | Set-Content .env"
    powershell -Command "(Get-Content .env) -replace '# DEV_ENV_MOUNT', 'DEV_ENV_MOUNT' | Set-Content .env"
    
    echo Configured Docker environment for development with mock data
    docker compose up --build
    goto end
) else if "%choice%"=="5" (
    echo.
    echo Starting Docker production environment...
    
    :: Ensure .env file exists but don't overwrite an existing one
    if not exist .env (
        echo Creating .env file from .env.example
        copy .env.example .env
    ) else (
        echo Using existing .env file
    )
    
    :: Check if Proxmox credentials are valid
    powershell -Command "$content = Get-Content .env; if ($content -match 'PROXMOX_NODE_1_TOKEN_SECRET=your-token-secret') { exit 1 } else { exit 0 }"
    if %errorlevel% equ 1 (
        :: No valid Proxmox credentials found
        echo No valid Proxmox credentials found in configuration.
        echo Do you want to:
        echo 1) Enter valid Proxmox credentials
        echo 2) Use mock data instead
        echo.
        set /p cred_choice=Enter your choice (1 or 2): 
        
        if "!cred_choice!"=="1" (
            echo.
            echo Please enter your Proxmox credentials:
            set /p proxmox_name=Node name (e.g., pve-1): 
            set /p proxmox_host=Host URL (e.g., https://your-proxmox-server:8006): 
            set /p proxmox_token_id=Token ID (e.g., root@pam!token-name): 
            set /p proxmox_token_secret=Token Secret: 
            
            :: Update the .env file with the provided credentials
            powershell -Command "(Get-Content .env) -replace 'PROXMOX_NODE_1_NAME=.*', 'PROXMOX_NODE_1_NAME=!proxmox_name!' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'PROXMOX_NODE_1_HOST=.*', 'PROXMOX_NODE_1_HOST=!proxmox_host!' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'PROXMOX_NODE_1_TOKEN_ID=.*', 'PROXMOX_NODE_1_TOKEN_ID=!proxmox_token_id!' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'PROXMOX_NODE_1_TOKEN_SECRET=.*', 'PROXMOX_NODE_1_TOKEN_SECRET=!proxmox_token_secret!' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=true', 'USE_MOCK_DATA=false' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=true', 'MOCK_DATA_ENABLED=false' | Set-Content .env"
            
            echo Configured Docker environment for production with real Proxmox data
        ) else if "!cred_choice!"=="2" (
            :: Configure for Docker production with mock data
            powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=false', 'USE_MOCK_DATA=true' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=false', 'MOCK_DATA_ENABLED=true' | Set-Content .env"
            
            echo Configured Docker environment for production with mock data
        ) else (
            echo Invalid choice. Using mock data as a fallback.
            :: Configure for Docker production with mock data
            powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=false', 'USE_MOCK_DATA=true' | Set-Content .env"
            powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=false', 'MOCK_DATA_ENABLED=true' | Set-Content .env"
            
            echo Configured Docker environment for production with mock data
        )
    ) else (
        :: Valid credentials already exist
        :: Set production environment
        :: Ensure NODE_ENV is set to production
        powershell -Command "(Get-Content .env) -replace 'NODE_ENV=development', 'NODE_ENV=production' | Set-Content .env"
        :: Ensure DOCKERFILE is set to production
        powershell -Command "(Get-Content .env) -replace 'DOCKERFILE=docker/Dockerfile.dev', 'DOCKERFILE=docker/Dockerfile' | Set-Content .env"
        :: Disable mock data for Docker production to match regular production
        powershell -Command "(Get-Content .env) -replace 'USE_MOCK_DATA=true', 'USE_MOCK_DATA=false' | Set-Content .env"
        powershell -Command "(Get-Content .env) -replace 'MOCK_DATA_ENABLED=true', 'MOCK_DATA_ENABLED=false' | Set-Content .env"
        
        echo Configured Docker environment for production with real Proxmox data
    )
    
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