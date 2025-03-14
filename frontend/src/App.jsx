import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  Paper, 
  IconButton, 
  Tooltip, 
  alpha,
  Button,
  Link,
  Chip,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import GitHubIcon from '@mui/icons-material/GitHub';
import NetworkDisplay from './components/NetworkDisplay';
import { AppThemeProvider, useThemeContext } from './context/ThemeContext';
import useSocket from './hooks/useSocket';
import { VERSION } from './utils/version';
import { AnimatedLogoWithText } from './components/network/UIComponents';
import { initializeStorage } from './utils/storageUtils';

function AppContent() {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const [selectedNode, setSelectedNode] = useState('all');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Check if we're in development mode - moved up to fix initialization order
  const isDevelopment = import.meta.env.DEV;
  
  // Error boundary effect
  useEffect(() => {
    const handleError = (event) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
      setErrorMessage(event.error?.message || 'An unknown error occurred');
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  // Initialize storage based on environment
  useEffect(() => {
    // Only initialize mock data flags if in development mode and not explicitly disabled
    if (isDevelopment && import.meta.env.DISABLE_MOCK_DATA !== 'true') {
      console.log('Development mode detected, mock data can be enabled if needed');
    } else {
      // In production or when explicitly disabled, ensure mock data is disabled
      if (localStorage.getItem('use_mock_data') === 'true' || localStorage.getItem('MOCK_DATA_ENABLED') === 'true') {
        console.log('Resetting mock data flags to match production environment');
        localStorage.removeItem('use_mock_data');
        localStorage.removeItem('MOCK_DATA_ENABLED');
      }
    }
  }, [isDevelopment]);
  
  const { 
    nodeData, 
    guestData, 
    isConnected,
    isMockData,
    processedMetricsData,
    forceUpdateCounter
  } = useSocket();
  const theme = useTheme();
  
  // Force a re-render when the forceUpdateCounter changes
  useEffect(() => {
    if (forceUpdateCounter % 10 === 0 && forceUpdateCounter > 0) {
      console.log('Force update triggered by counter:', forceUpdateCounter);
    }
  }, [forceUpdateCounter]);
  
  // Check if mock data is enabled - using both localStorage values and socket status
  const isMockDataEnabled = isMockData || 
                          localStorage.getItem('use_mock_data') === 'true' || 
                          localStorage.getItem('MOCK_DATA_ENABLED') === 'true';
  
  // Initialize storage and check for environment changes
  useEffect(() => {
    const wasCleared = initializeStorage();
    if (wasCleared) {
      console.log('Application data was cleared due to environment change');
    }
  }, []);
  
  // Add a listener for node change events from the NetworkDisplay component
  useEffect(() => {
    const handleNodeChangeEvent = (event) => {
      if (event.detail && event.detail.node) {
        setSelectedNode(event.detail.node);
      }
    };
    
    window.addEventListener('nodeChange', handleNodeChangeEvent);
    
    // Check URL parameters on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const nodeParam = urlParams.get('node');
    if (nodeParam) {
      setSelectedNode(nodeParam);
    }
    
    return () => {
      window.removeEventListener('nodeChange', handleNodeChangeEvent);
    };
  }, []);
  
  // If there's an error, show an error message
  if (hasError) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h4" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body1" paragraph>
          {errorMessage}
        </Typography>
        <Typography variant="body2" paragraph>
          Try refreshing the page or check the console for more details.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}
    onClick={(e) => {
      // Only blur if clicking the container itself, not its children
      if (e.target === e.currentTarget) {
        document.activeElement?.blur();
      }
    }}>
      {/* DEMO MODE Banner - Only visible when mock data is enabled */}
      {(isMockDataEnabled) && (
        <Alert 
          severity="warning" 
          variant="standard"
          sx={{ 
            borderRadius: 0,
            justifyContent: 'center', 
            fontWeight: 'medium',
            py: 0.5,
            fontSize: '0.875rem'
          }}
        >
          DEMO MODE - Viewing simulated data. To view real Proxmox data, disable mock data in your .env file.
        </Alert>
      )}
      
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AnimatedLogoWithText darkMode={darkMode} />
            
            {/* Version display with link to repository */}
            <Tooltip title="View Releases">
              <Link 
                href={`https://github.com/rcourtman/pulse/releases/tag/v${VERSION}`}
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  ml: 2,
                  color: 'rgba(255, 255, 255, 0.7)',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'rgba(255, 255, 255, 1)',
                  }
                }}
              >
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mr: 0.5,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  v{VERSION}
                </Typography>
                <GitHubIcon 
                  fontSize="small" 
                  sx={{ 
                    fontSize: '1rem',
                    opacity: 0.8,
                    '&:hover': {
                      opacity: 1
                    }
                  }}
                />
              </Link>
            </Tooltip>
          </Box>
          
          {/* Dark Mode Toggle Button */}
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={toggleDarkMode}
              size="small"
              color="inherit"
              sx={{ 
                ml: 1,
                borderRadius: 2,
                p: { xs: 0.8, sm: 1 },
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 1, sm: 2 }, 
          mb: { xs: 2, sm: 4 }, 
          flexGrow: 1,
          px: { xs: 2, sm: 3 },
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            document.activeElement?.blur();
          }
        }}
      >
        <Box sx={{ my: { xs: 1, sm: 2 } }}>
          {/* Network Display Component - pass the selected node as a prop */}
          <NetworkDisplay selectedNode={selectedNode} />
        </Box>
      </Container>
      
      <Paper 
        sx={{ 
          padding: 2, 
          marginTop: 'auto',
          borderRadius: 0,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
        }} 
        component="footer"
        elevation={0}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Pulse © {new Date().getFullYear()}
        </Typography>
      </Paper>
    </Box>
  );
}

function App() {
  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
}

export default App; 