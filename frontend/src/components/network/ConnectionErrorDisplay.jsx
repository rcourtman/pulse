import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { fadeIn } from '../../constants/networkConstants';
import { useThemeContext } from '../../context/ThemeContext';

const ConnectionErrorDisplay = ({ connectionStatus, error, onReconnect }) => {
  const { isDarkMode } = useThemeContext();
  const theme = useTheme();
  let title, message, icon, severity;
  
  switch (connectionStatus) {
    case 'error':
      title = 'Connection Error';
      message = error || 'Unable to connect to the server. The server may be offline or unreachable.';
      icon = <CancelIcon sx={{ mr: 1 }} />;
      severity = 'error';
      break;
    case 'disconnected':
      title = 'Server Disconnected';
      message = 'The connection to the server has been lost. This may happen if the server was stopped or restarted.';
      icon = <CancelIcon sx={{ mr: 1 }} />;
      severity = 'warning';
      break;
    default:
      title = 'Connection Issue';
      message = 'There is an issue with the connection to the server.';
      icon = <CancelIcon sx={{ mr: 1 }} />;
      severity = 'error';
  }
  
  // Use theme directly to ensure proper dark mode detection
  const mode = theme.palette.mode;
  const isDark = mode === 'dark';
  
  // Define colors based on theme mode and severity
  const bgColor = isDark 
    ? (severity === 'error' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 193, 7, 0.15)') 
    : (severity === 'error' ? '#FFF4F4' : '#FFF8E1');
  
  const borderColor = isDark
    ? (severity === 'error' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 193, 7, 0.3)')
    : (severity === 'error' ? '#ffcdd2' : '#ffe082');
  
  const textColor = isDark ? theme.palette.text.primary : 'rgba(0, 0, 0, 0.87)';
  const secondaryTextColor = isDark ? theme.palette.text.secondary : 'rgba(0, 0, 0, 0.6)';
  
  return (
    <Card 
      sx={{ 
        mb: 2, 
        bgcolor: bgColor,
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${borderColor}`,
        animation: `${fadeIn} 0.3s ease-out`,
        // Force dark mode styles
        ...(isDark && {
          backgroundColor: severity === 'error' ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 193, 7, 0.15)',
          borderColor: severity === 'error' ? 'rgba(244, 67, 54, 0.3)' : 'rgba(255, 193, 7, 0.3)',
          color: theme.palette.text.primary
        })
      }}
    >
      <CardContent sx={{ ...(isDark && { color: theme.palette.text.primary }) }}>
        <Typography 
          color={severity} 
          variant="h6" 
          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
        >
          {icon}
          {title}
        </Typography>
        <Typography sx={{ mb: 2, color: textColor }}>{message}</Typography>
        <Typography variant="body2" sx={{ mb: 2, color: secondaryTextColor }}>
          Please check that:
          <ul>
            <li>The server application is running</li>
            <li>Your network connection is working</li>
            <li>Any firewalls or security software are not blocking the connection</li>
            <li>The Socket.io server is properly configured and running on port 7654</li>
          </ul>
          
          {error && error.includes('Socket.io') && (
            <Box sx={{ mt: 1, p: 1, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                Socket.io Connection Issue Detected
              </Typography>
              <Typography variant="body2">
                The application is having trouble connecting to the Socket.io server. This is required for real-time updates.
                Try restarting the server with <code>npm run dev</code>.
              </Typography>
            </Box>
          )}
        </Typography>
        {onReconnect && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton 
              onClick={onReconnect} 
              color="primary" 
              sx={{ 
                border: '1px solid', 
                borderColor: 'primary.main',
                borderRadius: 1,
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                '& .MuiSvgIcon-root': { mr: 1 },
                ...(isDark && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main
                })
              }}
            >
              <RefreshIcon fontSize="small" />
              Try Reconnecting
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionErrorDisplay; 