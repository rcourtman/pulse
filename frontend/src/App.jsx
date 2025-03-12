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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ComputerIcon from '@mui/icons-material/Computer';
import DnsIcon from '@mui/icons-material/Dns';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckIcon from '@mui/icons-material/Check';
import NetworkDisplay from './components/NetworkDisplay';
import { AppThemeProvider, useThemeContext } from './context/ThemeContext';
import useSocket from './hooks/useSocket';
import { VERSION } from './utils/version';
import { AnimatedLogoWithText } from './components/network/UIComponents';
import { initializeStorage } from './utils/storageUtils';

function AppContent() {
  const { darkMode, toggleDarkMode } = useThemeContext();
  const [selectedNode, setSelectedNode] = useState('all');
  const { 
    nodeData, 
    guestData, 
    isConnected
  } = useSocket();
  const theme = useTheme();
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env.DEV;
  
  // Initialize storage and check for environment changes
  useEffect(() => {
    const wasCleared = initializeStorage();
    if (wasCleared) {
      console.log('Application data was cleared due to environment change');
    }
  }, []);
  
  // Transform the node data from the API into the format needed for the dropdown
  const availableNodes = React.useMemo(() => {
    // Start with the "All Nodes" option
    const nodes = [
      { id: 'all', name: 'All Nodes', count: 0 }
    ];
    
    // Add nodes from the API
    if (nodeData && nodeData.length > 0) {
      console.log('Processing node data for dropdown:', nodeData);
      
      // Count guests for each node
      const nodeCounts = {};
      
      // Initialize counts for each node
      nodeData.forEach(node => {
        // Extract node number from the id (e.g., "node-1" -> "node1")
        const nodeId = node.id.replace('-', '');
        nodeCounts[nodeId] = 0;
        
        // Also store the original ID for reference
        nodeCounts[node.id] = 0;
      });
      
      // Count guests for each node
      if (guestData && guestData.length > 0) {
        guestData.forEach(guest => {
          if (guest.node) {
            // Try both formats - with and without hyphen
            const normalizedNodeId = guest.node.replace('-', '');
            
            // Increment count for normalized ID if it exists
            if (nodeCounts[normalizedNodeId] !== undefined) {
              nodeCounts[normalizedNodeId]++;
            }
            
            // Also increment count for original ID if it exists
            if (nodeCounts[guest.node] !== undefined) {
              nodeCounts[guest.node]++;
            }
          }
        });
      }
      
      console.log('Node counts:', nodeCounts);
      
      // Add nodes to the list with their counts
      nodeData.forEach(node => {
        // Extract node number from the id (e.g., "node-1" -> "node1")
        const nodeId = node.id.replace('-', '');
        
        // Add the node to the list
        nodes.push({
          id: nodeId,
          originalId: node.id,
          name: node.name,
          count: Math.max(nodeCounts[nodeId] || 0, nodeCounts[node.id] || 0)
        });
      });
      
      // Update the count for "All Nodes" to show total number of guests
      nodes[0].count = guestData ? guestData.length : 0;
      
      console.log('Available nodes for dropdown:', nodes);
    }
    
    return nodes;
  }, [nodeData, guestData]);
  
  // Handle node selection change
  const handleNodeChange = (event) => {
    setSelectedNode(event.target.value);
    event.target.blur(); // Remove focus after selection
  };
  
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
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <AnimatedLogoWithText darkMode={darkMode} />
          </Box>
          
          {/* Node Selection Dropdown */}
          <FormControl 
            variant="outlined" 
            size="small"
            sx={{ 
              minWidth: { xs: 48, sm: 160 },
              mr: { xs: 1, sm: 2 },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                height: 32,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                boxShadow: 0,
                background: 'transparent',
                border: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  background: theme => alpha(theme.palette.primary.light, 0.1),
                  boxShadow: 2,
                  transform: 'translateY(-1px)'
                },
                '&.Mui-focused': {
                  background: 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  boxShadow: 1,
                },
                '&:active': {
                  transform: 'translateY(0px)',
                  boxShadow: 1
                },
                '& .MuiSelect-icon': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                padding: { xs: '4px 8px', sm: '4px 14px' },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 'none'
                }
              }
            }}
          >
            <Select
              value={selectedNode}
              onChange={handleNodeChange}
              onClose={(event) => event.target?.blur()}
              displayEmpty
              renderValue={(selected) => {
                const node = availableNodes.find(n => n.id === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    {selected === 'all' ? (
                      <ViewListIcon fontSize="small" />
                    ) : (
                      <DnsIcon fontSize="small" />
                    )}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      {node ? node.name : 'Select Node'}
                    </Typography>
                  </Box>
                );
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 300,
                    mt: 0.5,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    '& .MuiMenuItem-root': {
                      py: 1,
                      px: 2,
                    }
                  }
                }
              }}
            >
              {availableNodes.map((node) => (
                <MenuItem 
                  key={node.id} 
                  value={node.id}
                  sx={{ 
                    borderRadius: 1,
                    my: 0.5,
                    '&.Mui-selected': {
                      bgcolor: theme => alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        bgcolor: theme => alpha(theme.palette.primary.main, 0.15),
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {node.id === 'all' ? (
                      <ViewListIcon fontSize="small" color="primary" />
                    ) : (
                      <ComputerIcon fontSize="small" color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={node.name} 
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      fontWeight: selectedNode === node.id ? 600 : 400
                    }} 
                  />
                  {selectedNode === node.id && (
                    <CheckIcon 
                      fontSize="small" 
                      color="primary" 
                      sx={{ ml: 1, fontSize: '1rem' }} 
                    />
                  )}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
          mt: { xs: 2, sm: 4 }, 
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
        <Box sx={{ my: { xs: 2, sm: 4 } }}>
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