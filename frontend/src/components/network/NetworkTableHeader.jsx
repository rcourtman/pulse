import React, { useMemo } from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Divider,
  Typography,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import AdjustIcon from '@mui/icons-material/Adjust';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import { DEFAULT_COLUMN_CONFIG } from '../../constants/networkConstants';
import { calculateDynamicColumnWidths } from '../../utils/networkUtils';

const NetworkTableHeader = ({
  sortConfig,
  requestSort,
  columnVisibility,
  toggleColumnVisibility,
  resetColumnVisibility,
  columnMenuAnchorEl,
  handleColumnMenuOpen,
  handleColumnMenuClose,
  openColumnMenu,
  forceUpdateCounter,
  columnOrder,
  setColumnOrder,
  activeFilteredColumns = {},
  showStopped = null,
  guestTypeFilter = 'all',
  setShowStopped,
  showRunningOnly = true,
  setGuestTypeFilter
}) => {
  const theme = useTheme();

  // Helper function to get sort direction
  const getSortDirection = (key) => {
    if (!sortConfig) return 'asc';
    return sortConfig.key === key ? sortConfig.direction : 'asc';
  };

  // Determine if sorting should be enabled for type columns
  const isSortingEnabledForType = guestTypeFilter === 'all'; // Only enable sorting if all guest types are shown

  // Handle click on column header
  const handleColumnClick = (columnId) => {
    // For status column, cycle through status filters: all -> running -> stopped -> all
    if (columnId === 'status' && setShowStopped) {
      if (showStopped === null) {
        // Currently showing all, switch to showing running only
        setShowStopped(false);
      } else if (showStopped === false) {
        // Currently showing running only, switch to showing stopped only
        setShowStopped(true);
      } else {
        // Currently showing stopped only, switch to showing all
        setShowStopped(null);
      }
      return;
    }
    
    // For type column, cycle through guest type filters: all -> vm -> ct -> all
    if (columnId === 'type' && setGuestTypeFilter) {
      if (guestTypeFilter === 'all') {
        setGuestTypeFilter('vm');
      } else if (guestTypeFilter === 'vm') {
        setGuestTypeFilter('ct');
      } else {
        setGuestTypeFilter('all');
      }
      return;
    }
    
    // Disable sorting for type column when only VMs or only containers are shown
    if (columnId === 'type' && !isSortingEnabledForType) {
      return;
    }
    
    // Disable sorting for status column completely
    if (columnId === 'status') {
      return;
    }
    
    // Otherwise, proceed with normal sorting
    requestSort(columnId);
  };

  // Count visible columns
  const visibleColumnCount = Object.values(columnVisibility).filter(col => col.visible).length;
  
  // Check if any columns are visible
  const hasVisibleColumns = visibleColumnCount > 0;

  // Calculate dynamic column widths based on visible columns
  const columnWidths = useMemo(() => {
    return calculateDynamicColumnWidths(columnVisibility);
  }, [columnVisibility, forceUpdateCounter]);

  // Get visible columns in the correct order
  const visibleColumns = useMemo(() => {
    if (!columnOrder || !Array.isArray(columnOrder) || columnOrder.length === 0) {
      return [];
    }
    
    // Filter visible columns
    const visible = Object.entries(columnVisibility || {})
      .filter(([_, config]) => config?.visible)
      .map(([id, config]) => ({ id, ...config }));
    
    // Sort them according to columnOrder
    return columnOrder
      .filter(id => columnVisibility?.[id]?.visible)
      .map(id => {
        const column = visible.find(col => col.id === id);
        return column || null;
      })
      .filter(Boolean); // Remove any null values
  }, [columnVisibility, columnOrder]);

  // Move a column up in the order
  const moveColumnUp = (columnId) => {
    const currentIndex = columnOrder.indexOf(columnId);
    if (currentIndex > 0) {
      const newOrder = [...columnOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      setColumnOrder(newOrder);
    }
  };

  // Move a column down in the order
  const moveColumnDown = (columnId) => {
    const currentIndex = columnOrder.indexOf(columnId);
    if (currentIndex < columnOrder.length - 1) {
      const newOrder = [...columnOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setColumnOrder(newOrder);
    }
  };

  // Handle drag start for a column
  const [draggedColumn, setDraggedColumn] = React.useState(null);
  const [dragOverColumn, setDragOverColumn] = React.useState(null);
  const [previewOrder, setPreviewOrder] = React.useState(null);
  const dragHandleRef = React.useRef(null);

  // Let's go back to the HTML5 drag and drop, but fix the image issue properly
  const handleDragStart = (e, columnId) => {
    console.log('Drag start:', columnId);
    setDraggedColumn(columnId);
    setPreviewOrder([...columnOrder]);
    
    // Create a completely transparent drag image
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.width = '1px';
    dragImage.style.height = '1px';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    
    // Set the drag image to our transparent div
    // The key is to set the offset far away from the cursor
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // This is needed for Firefox
    e.dataTransfer.setData('text/plain', columnId);
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    if (draggedColumn !== columnId) {
      setDragOverColumn(columnId);
      
      // Update preview order for live feedback
      if (previewOrder && draggedColumn && columnId) {
        const newPreviewOrder = [...previewOrder];
        const sourceIndex = newPreviewOrder.indexOf(draggedColumn);
        const targetIndex = newPreviewOrder.indexOf(columnId);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          // Remove the dragged item
          newPreviewOrder.splice(sourceIndex, 1);
          // Insert it at the new position
          newPreviewOrder.splice(targetIndex, 0, draggedColumn);
          console.log('Preview order updated:', newPreviewOrder);
          setPreviewOrder(newPreviewOrder);
        }
      }
    } else {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    // If we have a preview order, use that directly since it already shows the correct order
    if (previewOrder && draggedColumn) {
      console.log('Setting column order from preview:', previewOrder);
      setColumnOrder([...previewOrder]);
    } 
    // Fallback to the old logic if preview order isn't available for some reason
    else if (draggedColumn && targetColumnId && draggedColumn !== targetColumnId) {
      console.log('Using fallback drop logic');
      const sourceIndex = columnOrder.indexOf(draggedColumn);
      const targetIndex = columnOrder.indexOf(targetColumnId);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...columnOrder];
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, draggedColumn);
        setColumnOrder(newOrder);
      }
    }
    
    // Reset states
    setDraggedColumn(null);
    setDragOverColumn(null);
    setPreviewOrder(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
    setPreviewOrder(null);
  };

  const getDropPosition = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return null;
    const draggedIndex = columnOrder.indexOf(draggedId);
    const targetIndex = columnOrder.indexOf(targetId);
    return draggedIndex < targetIndex ? 'after' : 'before';
  };
  
  // Get the display order (either the preview during drag or the actual order)
  const displayOrder = previewOrder || columnOrder;

  return (
    <TableHead>
      <TableRow>
        {/* If no columns are visible, show a message in the header */}
        {!hasVisibleColumns ? (
          <TableCell colSpan={12} align="center">
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 1
            }}>
              <VisibilityOffIcon sx={{ mr: 1, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                All columns are hidden
              </Typography>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => {
                  console.log('Reset button clicked in NetworkTableHeader');
                  resetColumnVisibility();
                }}
              >
                Reset Columns
              </Button>
            </Box>
          </TableCell>
        ) : (
          <>
            {/* Render column headers */}
            {visibleColumns.map(column => (
              <TableCell 
                key={column.id}
                onClick={() => handleColumnClick(column.id)}
                sx={{ 
                  width: columnWidths[column.id] || 'auto',
                  minWidth: getMinWidthForColumn(column.id),
                  // Reset all background highlighting, use default background for all cells
                  backgroundColor: theme.palette.background.paper,
                  // Remove special borders and box shadows
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                  borderTop: 'none',
                  boxShadow: 'none',
                  ...((column.id === 'status' || column.id === 'type') && {
                    textAlign: 'center',
                    padding: '0px 8px'
                  }),
                  // Always make status column clickable with pointer cursor
                  cursor: column.id === 'status' || column.id === 'type'
                    ? 'pointer' // Always use pointer for status and type columns
                    : 'pointer',
                  // Only highlight on hover
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.light, 0.15) // Hover effect in dark mode
                      : alpha(theme.palette.primary.light, 0.1) // Hover effect in light mode
                  }
                }}
              >
                {column.id === 'status' || column.id === 'type' ? (
                  // For status and type columns, use a simple centered display without sort arrow
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    {column.id === 'status' ? (
                      // Show different circle icons based on which status filter is active
                      <Tooltip title={showStopped === null ? "Show running only" : showStopped === false ? "Show stopped only" : "Show all systems"}>
                        <Box sx={{ 
                          position: 'relative', 
                          width: 16, 
                          height: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s ease'
                          }
                        }}>
                          {showStopped === null ? (
                            // When showing all systems, show a neutral grey circle
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#9e9e9e', // neutral grey
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? `0 0 0 1px ${alpha('#9e9e9e', 0.5)}` 
                                  : '0 0 0 1px rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          ) : showStopped === false ? (
                            // When showing running systems only, show solid green circle
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#4caf50', // success green (same as running status)
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? `0 0 0 1px ${alpha('#4caf50', 0.5)}` 
                                  : '0 0 0 1px rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          ) : (
                            // When showing stopped systems only, show solid red circle
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#f44336', // error red (same as stopped status)
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? `0 0 0 1px ${alpha('#f44336', 0.5)}` 
                                  : '0 0 0 1px rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    ) : (
                      // For type column, show a colored indicator based on the current filter state
                      <Tooltip title={guestTypeFilter === 'all' ? "Show VMs only" : guestTypeFilter === 'vm' ? "Show containers only" : "Show all types"}>
                        <Box sx={{ 
                          position: 'relative', 
                          width: 16, 
                          height: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            transition: 'transform 0.2s ease'
                          }
                        }}>
                          {guestTypeFilter === 'all' ? (
                            // When showing all types, show a neutral grey circle
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#9e9e9e', // neutral grey
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? `0 0 0 1px ${alpha('#9e9e9e', 0.5)}` 
                                  : '0 0 0 1px rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          ) : guestTypeFilter === 'vm' ? (
                            // When showing VMs only, show a primary blue circle (same as VM icon)
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#1976d2', // primary blue (same as VM icon)
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? `0 0 0 1px ${alpha('#1976d2', 0.5)}` 
                                  : '0 0 0 1px rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          ) : (
                            // When showing containers only, show a secondary color circle (same as CT icon)
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: theme.palette.secondary.main, // secondary color (same as CT icon)
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? `0 0 0 1px ${alpha(theme.palette.secondary.main, 0.5)}` 
                                  : '0 0 0 1px rgba(255, 255, 255, 0.8)',
                              }}
                            />
                          )}
                        </Box>
                      </Tooltip>
                    )}
                  </Box>
                ) : (
                  // For all other columns, show the sort label
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        // Make text semi-bold when column is sorted
                        fontWeight: sortConfig?.key === column.id ? 600 : 400,
                        // Use primary color in light mode, white in dark mode for sorted columns
                        color: sortConfig?.key === column.id 
                          ? theme.palette.mode === 'dark'
                            ? '#ffffff' // White for dark mode
                            : theme.palette.primary.main // Primary color for light mode
                          : 'inherit',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {column.label || column.id}
                      {sortConfig?.key === column.id && (
                        <Box component="span" sx={{ 
                          ml: 0.5, 
                          display: 'flex', 
                          alignItems: 'center',
                          fontSize: '0.7rem',
                          // Use primary color in light mode, white in dark mode for sort indicator
                          color: theme.palette.mode === 'dark' 
                            ? '#ffffff' 
                            : theme.palette.primary.main
                        }}>
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </Box>
                      )}
                    </Typography>
                  </Box>
                )}
              </TableCell>
            ))}
          </>
        )}
        
        {/* Column menu */}
        <Menu
          id="column-menu"
          anchorEl={columnMenuAnchorEl}
          open={openColumnMenu}
          onClose={handleColumnMenuClose}
          MenuListProps={{
            'aria-labelledby': 'column-visibility-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            elevation: 3,
            sx: { 
              borderRadius: 2,
              overflow: 'hidden',
              width: 300
            }
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Column Visibility
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to toggle visibility. Drag to reorder.
            </Typography>
          </Box>
          
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {/* Column visibility and order controls */}
            {displayOrder.map((columnId) => {
              const config = columnVisibility[columnId];
              if (!config) return null;
              
              return (
                <MenuItem 
                  key={columnId}
                  onClick={() => toggleColumnVisibility(columnId)}
                  dense
                  className="column-menu-item"
                  data-column-id={columnId}
                  draggable={false}
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(e, columnId);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDrop(e, columnId);
                  }}
                  onDragEnd={(e) => {
                    handleDragEnd();
                  }}
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: dragOverColumn === columnId 
                      ? 'rgba(25, 118, 210, 0.08)' 
                      : draggedColumn === columnId 
                        ? 'rgba(0, 0, 0, 0.04)' 
                        : 'transparent',
                    borderLeft: config.visible ? '3px solid' : 'none',
                    borderLeftColor: 'primary.main',
                    pl: config.visible ? 1 : 2,
                    cursor: draggedColumn === columnId ? 'grabbing' : 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    transform: draggedColumn === columnId ? 'scale(1.02)' : 'scale(1)',
                    zIndex: draggedColumn === columnId ? 1200 : 1,
                    boxShadow: draggedColumn === columnId ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    },
                    '&:hover .drag-handle': {
                      opacity: 1
                    },
                    '&::before': dragOverColumn === columnId && draggedColumn !== columnId ? {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: '2px',
                      backgroundColor: 'primary.main',
                      top: getDropPosition(draggedColumn, columnId) === 'before' ? 0 : 'auto',
                      bottom: getDropPosition(draggedColumn, columnId) === 'after' ? 0 : 'auto',
                    } : {}
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        className="drag-handle"
                        draggable="true"
                        onDragStart={(e) => {
                          e.stopPropagation();
                          handleDragStart(e, columnId);
                        }}
                        sx={{ 
                          opacity: draggedColumn === columnId ? 1 : 0.3,
                          mr: 1,
                          cursor: draggedColumn === columnId ? 'grabbing' : 'grab',
                          display: 'flex',
                          alignItems: 'center',
                          color: draggedColumn === columnId ? 'primary.main' : 'text.secondary',
                          '&:hover': {
                            opacity: 1,
                            color: 'primary.main'
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DragIndicatorIcon fontSize="small" />
                      </Box>
                      <Typography 
                        variant="body2"
                        sx={{
                          fontWeight: draggedColumn === columnId ? 500 : 400
                        }}
                      >
                        {config.label}
                      </Typography>
                    </Box>
                    <Box 
                      component="span" 
                      sx={{ 
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: config.visible ? 'primary.main' : 'transparent',
                        color: config.visible ? 'primary.contrastText' : 'transparent',
                      }}
                    >
                      {config.visible && <CheckIcon fontSize="small" sx={{ fontSize: 12 }} />}
                    </Box>
                  </Box>
                </MenuItem>
              );
            })}
            
            <Divider />
            <MenuItem onClick={resetColumnVisibility} sx={{ justifyContent: 'center' }}>
              <Typography variant="body2" color="primary">
                Reset to Default
              </Typography>
            </MenuItem>
          </Box>
        </Menu>
      </TableRow>
    </TableHead>
  );
};

// Helper function to get minimum width for each column
const getMinWidthForColumn = (columnId) => {
  const minWidths = {
    node: 70,     // Reduced from 80px
    type: 40,     // Reduced from 65px since we're only showing an icon now
    id: 60,       // Reduced from 70px
    status: 40,   // Reduced from 65px since we're only showing an icon now
    name: 130,    // Reduced from 150px
    cpu: 100,     // Reduced from 120px
    memory: 100,  // Reduced from 120px
    disk: 100,    // Reduced from 120px
    download: 90, // Reduced from 100px
    upload: 90,   // Reduced from 100px
    uptime: 85    // Increased from 70px to accommodate longer uptime strings
  };
  
  return minWidths[columnId] || 90; // Default reduced from 100px
};

export default NetworkTableHeader; 