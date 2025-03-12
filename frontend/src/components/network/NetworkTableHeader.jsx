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
  alpha,
  ListItemIcon,
  ListItemText,
  Select,
  FormControl,
  Popover
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckIcon from '@mui/icons-material/Check';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import AdjustIcon from '@mui/icons-material/Adjust';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import ViewListIcon from '@mui/icons-material/ViewList';
import DnsIcon from '@mui/icons-material/Dns';
import ComputerIcon from '@mui/icons-material/Computer';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import StorageIcon from '@mui/icons-material/Storage';
import SearchIcon from '@mui/icons-material/Search';
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
  setGuestTypeFilter,
  availableNodes = [],
  selectedNode = 'all',
  handleNodeChange = () => {},
  handleStatusChange = () => {},
  handleTypeChange = () => {},
  activeSearchTerms = [],
  addSearchTerm = () => {},
  removeSearchTerm = () => {}
}) => {
  const theme = useTheme();

  const [nodeMenuAnchorEl, setNodeMenuAnchorEl] = React.useState(null);
  const openNodeMenu = Boolean(nodeMenuAnchorEl);
  
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = React.useState(null);
  const openStatusMenu = Boolean(statusMenuAnchorEl);
  
  const [typeMenuAnchorEl, setTypeMenuAnchorEl] = React.useState(null);
  const openTypeMenu = Boolean(typeMenuAnchorEl);
  
  const handleNodeColumnClick = (event) => {
    event.stopPropagation();
    setNodeMenuAnchorEl(event.currentTarget);
  };
  
  const handleNodeMenuClose = () => {
    setNodeMenuAnchorEl(null);
  };
  
  const handleNodeSelect = (nodeId) => {
    // Update dropdown filter state
    handleNodeChange({ target: { value: nodeId } });
    
    // Also add the corresponding search term if not "all"
    if (nodeId !== 'all') {
      // Find the node name for better readability in the search term
      const selectedNode = availableNodes.find(node => node.id === nodeId);
      const nodeName = selectedNode ? selectedNode.name : nodeId;
      
      // Find and remove any existing node: filters
      const existingNodeTerms = activeSearchTerms.filter(term => 
        term.toLowerCase().startsWith('node:')
      );
      existingNodeTerms.forEach(term => {
        removeSearchTerm(term);
      });
      
      // Add the new node filter as a search term
      addSearchTerm(`node:${nodeName}`);
      } else {
      // Remove any node: filters when "all" is selected
      const existingNodeTerms = activeSearchTerms.filter(term => 
        term.toLowerCase().startsWith('node:')
      );
      existingNodeTerms.forEach(term => {
        removeSearchTerm(term);
      });
    }
    
    handleNodeMenuClose();
  };

  const handleStatusColumnClick = (event) => {
    event.stopPropagation();
    setStatusMenuAnchorEl(event.currentTarget);
  };
  
  const handleStatusMenuClose = () => {
    setStatusMenuAnchorEl(null);
  };
  
  const handleStatusSelect = (status) => {
    // Update dropdown filter state
    if (status === 'all') {
      handleStatusChange(null);
    } else if (status === 'running') {
      handleStatusChange(false);
    } else if (status === 'stopped') {
      handleStatusChange(true);
    }
    
    // Also add the corresponding search term
    // Find and remove any existing status: filters
    const existingStatusTerms = activeSearchTerms.filter(term => 
      term.toLowerCase().startsWith('status:')
    );
    existingStatusTerms.forEach(term => {
      removeSearchTerm(term);
    });
    
    // Add new status filter as a search term (except for "all" which means no filter)
    if (status !== 'all') {
      addSearchTerm(`status:${status}`);
    }
    
    handleStatusMenuClose();
  };

  const handleTypeColumnClick = (event) => {
    event.stopPropagation();
    setTypeMenuAnchorEl(event.currentTarget);
  };
  
  const handleTypeMenuClose = () => {
    setTypeMenuAnchorEl(null);
  };
  
  const handleTypeSelect = (type) => {
    // Update dropdown filter state
    handleTypeChange(type);
    
    // Also add the corresponding search term
    // Find and remove any existing type: filters
    const existingTypeTerms = activeSearchTerms.filter(term => 
      term.toLowerCase().startsWith('type:')
    );
    existingTypeTerms.forEach(term => {
      removeSearchTerm(term);
    });
    
    // Add new type filter as a search term (except for "all" which means no filter)
    if (type !== 'all') {
      addSearchTerm(`type:${type}`);
    }
    
    handleTypeMenuClose();
  };

  const getSortDirection = (key) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction;
    }
    return undefined;
  };

  const isSortingEnabledForType = guestTypeFilter === 'all';

  const handleColumnClick = (columnId) => {
    // For normal columns, just requestSort
    requestSort(columnId);
  };

  // New handler for node column text click that sorts by node
  const handleNodeColumnTextClick = (e) => {
    e.stopPropagation(); // Prevent opening the dropdown
    requestSort('node');
  };
  
  // New handler for status column text click that sorts by status
  const handleStatusColumnTextClick = (e) => {
    e.stopPropagation(); // Prevent opening the dropdown
    requestSort('status');
  };
  
  // New handler for type column text click that sorts by type
  const handleTypeColumnTextClick = (e) => {
    e.stopPropagation(); // Prevent opening the dropdown
    requestSort('type');
  };

  const visibleColumnCount = Object.values(columnVisibility).filter(col => col.visible).length;
  
  const hasVisibleColumns = visibleColumnCount > 0;

  const columnWidths = useMemo(() => {
    return calculateDynamicColumnWidths(columnVisibility);
  }, [columnVisibility, forceUpdateCounter]);

  const visibleColumns = useMemo(() => {
    if (!columnOrder || !Array.isArray(columnOrder) || columnOrder.length === 0) {
      return [];
    }
    
    const visible = Object.entries(columnVisibility || {})
      .filter(([_, config]) => config?.visible)
      .map(([id, config]) => ({ id, ...config }));
    
    return columnOrder
      .filter(id => columnVisibility?.[id]?.visible)
      .map(id => {
        const column = visible.find(col => col.id === id);
        return column || null;
      })
      .filter(Boolean);
  }, [columnVisibility, columnOrder]);

  const moveColumnUp = (columnId) => {
    const currentIndex = columnOrder.indexOf(columnId);
    if (currentIndex > 0) {
      const newOrder = [...columnOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      setColumnOrder(newOrder);
    }
  };

  const moveColumnDown = (columnId) => {
    const currentIndex = columnOrder.indexOf(columnId);
    if (currentIndex < columnOrder.length - 1) {
      const newOrder = [...columnOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setColumnOrder(newOrder);
    }
  };

  const [draggedColumn, setDraggedColumn] = React.useState(null);
  const [dragOverColumn, setDragOverColumn] = React.useState(null);
  const [previewOrder, setPreviewOrder] = React.useState(null);
  const dragHandleRef = React.useRef(null);

  const handleDragStart = (e, columnId) => {
    console.log('Drag start:', columnId);
    setDraggedColumn(columnId);
    setPreviewOrder([...columnOrder]);
    
    const dragImage = document.createElement('div');
    dragImage.style.position = 'absolute';
    dragImage.style.width = '1px';
    dragImage.style.height = '1px';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    e.dataTransfer.setData('text/plain', columnId);
    
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    if (draggedColumn !== columnId) {
      setDragOverColumn(columnId);
      
      if (previewOrder && draggedColumn && columnId) {
        const newPreviewOrder = [...previewOrder];
        const sourceIndex = newPreviewOrder.indexOf(draggedColumn);
        const targetIndex = newPreviewOrder.indexOf(columnId);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          newPreviewOrder.splice(sourceIndex, 1);
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
    
    if (previewOrder && draggedColumn) {
      console.log('Setting column order from preview:', previewOrder);
      setColumnOrder([...previewOrder]);
    } 
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
  
  const displayOrder = previewOrder || columnOrder;

  const selectedNodeObject = availableNodes.find(node => node.id === selectedNode);
  const selectedNodeName = selectedNodeObject ? selectedNodeObject.name : 'All Nodes';

  return (
    <TableHead>
      <TableRow>
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
            {visibleColumns.map(column => (
              <TableCell 
                key={column.id}
                onClick={(e) => {
                  // For special columns, don't do anything on the cell click
                  // since we're handling clicks on the components inside
                  if (column.id !== 'node' && column.id !== 'status' && column.id !== 'type') {
                    handleColumnClick(column.id);
                  }
                }}
                sx={{ 
                  width: columnWidths[column.id] || 'auto',
                  minWidth: getMinWidthForColumn(column.id),
                  backgroundColor: theme.palette.background.paper,
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider',
                  borderTop: 'none',
                  boxShadow: 'none',
                  ...((column.id === 'status' || column.id === 'type') && {
                    textAlign: 'center',
                    padding: '0px 8px'
                  }),
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.light, 0.15)
                      : alpha(theme.palette.primary.light, 0.1)
                  }
                }}
              >
                {column.id === 'node' ? (
                  <Box 
                    sx={{ 
                      width: '100%', 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      onClick={handleNodeColumnTextClick}
                      sx={{ 
                        fontWeight: sortConfig?.key === column.id ? 600 : 400,
                        color: sortConfig?.key === column.id 
                          ? theme.palette.mode === 'dark'
                            ? '#ffffff' 
                            : theme.palette.primary.main
                          : 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                      }}
                    >
                      {column.label || column.id}
                    </Typography>
                    <FilterListIcon 
                      fontSize="small"
                      onClick={(e) => handleNodeColumnClick(e)}
                              sx={{
                        fontSize: '1rem',
                        opacity: activeFilteredColumns['node'] ? 1 : 0.7,
                        ml: 0.5,
                        color: activeFilteredColumns['node'] 
                          ? theme.palette.primary.main 
                          : 'inherit',
                        cursor: 'pointer',
                        p: 0.3,
                                borderRadius: '50%',
                        backgroundColor: activeFilteredColumns['node'] ? 
                          alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    />
                  </Box>
                ) : column.id === 'status' ? (
                            <Box
                              sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      onClick={handleStatusColumnTextClick}
                              sx={{
                        fontWeight: sortConfig?.key === column.id ? 600 : 400,
                        color: sortConfig?.key === column.id 
                          ? theme.palette.mode === 'dark'
                            ? '#ffffff' 
                            : theme.palette.primary.main
                          : 'inherit',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                      }}
                    >
                      {column.label || column.id}
                    </Typography>
                    <FilterListIcon 
                      fontSize="small" 
                      onClick={(e) => handleStatusColumnClick(e)}
                              sx={{
                        fontSize: '1rem',
                        opacity: activeFilteredColumns['status'] ? 1 : 0.7,
                        ml: 0.5,
                        color: activeFilteredColumns['status'] 
                          ? theme.palette.primary.main 
                          : 'inherit',
                        cursor: 'pointer',
                        p: 0.3,
                                borderRadius: '50%',
                        backgroundColor: activeFilteredColumns['status'] ? 
                          alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    />
                  </Box>
                ) : column.id === 'type' ? (
                            <Box
                              sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      onClick={handleTypeColumnTextClick}
                              sx={{
                        fontWeight: sortConfig?.key === column.id ? 600 : 400,
                        color: sortConfig?.key === column.id 
                          ? theme.palette.mode === 'dark'
                            ? '#ffffff' 
                            : theme.palette.primary.main
                          : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      {column.label || column.id}
                    </Typography>
                    <FilterListIcon 
                      fontSize="small" 
                      onClick={(e) => handleTypeColumnClick(e)}
                      sx={{ 
                        fontSize: '1rem',
                        opacity: activeFilteredColumns['type'] ? 1 : 0.7,
                        ml: 0.5,
                        color: activeFilteredColumns['type'] 
                          ? theme.palette.primary.main 
                          : 'inherit',
                        cursor: 'pointer',
                        p: 0.3,
                                borderRadius: '50%',
                        backgroundColor: activeFilteredColumns['type'] ? 
                          alpha(theme.palette.primary.main, 0.1) : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                    />
                        </Box>
                ) : column.id === 'name' || column.id === 'id' ? (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{
                        fontWeight: sortConfig?.key === column.id ? 600 : 400,
                        color: sortConfig?.key === column.id 
                          ? theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : theme.palette.primary.main
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
                          color: theme.palette.mode === 'dark' 
                            ? '#ffffff' 
                            : theme.palette.primary.main
                        }}>
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </Box>
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    width: '100%'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: sortConfig?.key === column.id ? 600 : 400,
                        color: sortConfig?.key === column.id 
                          ? theme.palette.mode === 'dark'
                            ? '#ffffff'
                            : theme.palette.primary.main
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
        
        <Menu
          id="node-filter-menu"
          anchorEl={nodeMenuAnchorEl}
          open={openNodeMenu}
          onClose={handleNodeMenuClose}
          MenuListProps={{
            'aria-labelledby': 'node-filter-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            elevation: 3,
            sx: { 
              borderRadius: 2,
              overflow: 'hidden',
              width: 200,
              maxHeight: 300
            }
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter by Node
            </Typography>
          </Box>
          
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            {availableNodes.map((node) => (
              <MenuItem 
                key={node.id} 
                value={node.id}
                onClick={() => handleNodeSelect(node.id)}
                sx={{ 
                  py: 1,
                  borderLeft: selectedNode === node.id ? '3px solid' : 'none',
                  borderLeftColor: 'primary.main',
                  pl: selectedNode === node.id ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {node.id === 'all' ? (
                    <ViewListIcon fontSize="small" color={selectedNode === node.id ? "primary" : "inherit"} />
                  ) : (
                    <ComputerIcon fontSize="small" color={selectedNode === node.id ? "primary" : "inherit"} />
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
          </Box>
        </Menu>
        
        <Menu
          id="status-filter-menu"
          anchorEl={statusMenuAnchorEl}
          open={openStatusMenu}
          onClose={handleStatusMenuClose}
          MenuListProps={{
            'aria-labelledby': 'status-filter-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            elevation: 3,
            sx: { 
              borderRadius: 2,
              overflow: 'hidden',
              width: 200
            }
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter by Status
            </Typography>
          </Box>
          
          <MenuItem 
            value="all"
            onClick={() => handleStatusSelect('all')}
            sx={{ 
              py: 1,
              borderLeft: showStopped === null ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              pl: showStopped === null ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <AllInclusiveIcon fontSize="small" color={showStopped === null ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="All Statuses" 
              primaryTypographyProps={{ 
                variant: 'body2',
                fontWeight: showStopped === null ? 600 : 400
              }} 
            />
            {showStopped === null && (
              <CheckIcon 
                fontSize="small" 
                color="primary" 
                sx={{ ml: 1, fontSize: '1rem' }} 
              />
            )}
          </MenuItem>
          
          <MenuItem 
            value="running"
            onClick={() => handleStatusSelect('running')}
            sx={{ 
              py: 1,
              borderLeft: showStopped === false ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              pl: showStopped === false ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <PlayArrowIcon fontSize="small" color={showStopped === false ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Running" 
              primaryTypographyProps={{ 
                variant: 'body2',
                fontWeight: showStopped === false ? 600 : 400
              }} 
            />
            {showStopped === false && (
              <CheckIcon 
                fontSize="small" 
                color="primary" 
                sx={{ ml: 1, fontSize: '1rem' }} 
              />
            )}
          </MenuItem>
          
          <MenuItem 
            value="stopped"
            onClick={() => handleStatusSelect('stopped')}
            sx={{ 
              py: 1,
              borderLeft: showStopped === true ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              pl: showStopped === true ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <StopIcon fontSize="small" color={showStopped === true ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Stopped" 
              primaryTypographyProps={{ 
                variant: 'body2',
                fontWeight: showStopped === true ? 600 : 400
              }} 
            />
            {showStopped === true && (
              <CheckIcon 
                fontSize="small" 
                color="primary" 
                sx={{ ml: 1, fontSize: '1rem' }} 
              />
            )}
          </MenuItem>
        </Menu>
        
        <Menu
          id="type-filter-menu"
          anchorEl={typeMenuAnchorEl}
          open={openTypeMenu}
          onClose={handleTypeMenuClose}
          MenuListProps={{
            'aria-labelledby': 'type-filter-button',
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            elevation: 3,
            sx: { 
              borderRadius: 2,
              overflow: 'hidden',
              width: 200
            }
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Filter by Type
            </Typography>
          </Box>
          
          <MenuItem 
            value="all"
            onClick={() => handleTypeSelect('all')}
            sx={{ 
              py: 1,
              borderLeft: guestTypeFilter === 'all' ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              pl: guestTypeFilter === 'all' ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ViewListIcon fontSize="small" color={guestTypeFilter === 'all' ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="All Types" 
              primaryTypographyProps={{ 
                variant: 'body2',
                fontWeight: guestTypeFilter === 'all' ? 600 : 400
              }} 
            />
            {guestTypeFilter === 'all' && (
              <CheckIcon 
                fontSize="small" 
                color="primary" 
                sx={{ ml: 1, fontSize: '1rem' }} 
              />
            )}
          </MenuItem>
          
          <MenuItem 
            value="vm"
            onClick={() => handleTypeSelect('vm')}
            sx={{ 
              py: 1,
              borderLeft: guestTypeFilter === 'vm' ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              pl: guestTypeFilter === 'vm' ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ComputerIcon fontSize="small" color={guestTypeFilter === 'vm' ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="VMs" 
              primaryTypographyProps={{ 
                variant: 'body2',
                fontWeight: guestTypeFilter === 'vm' ? 600 : 400
              }} 
            />
            {guestTypeFilter === 'vm' && (
              <CheckIcon 
                fontSize="small" 
                color="primary" 
                sx={{ ml: 1, fontSize: '1rem' }} 
              />
            )}
          </MenuItem>
          
          <MenuItem 
            value="ct"
            onClick={() => handleTypeSelect('ct')}
            sx={{ 
              py: 1,
              borderLeft: guestTypeFilter === 'ct' ? '3px solid' : 'none',
              borderLeftColor: 'primary.main',
              pl: guestTypeFilter === 'ct' ? 1 : 2,
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <StorageIcon fontSize="small" color={guestTypeFilter === 'ct' ? "primary" : "inherit"} />
            </ListItemIcon>
            <ListItemText 
              primary="Containers" 
              primaryTypographyProps={{ 
                variant: 'body2',
                fontWeight: guestTypeFilter === 'ct' ? 600 : 400
              }} 
            />
            {guestTypeFilter === 'ct' && (
              <CheckIcon 
                fontSize="small" 
                color="primary" 
                sx={{ ml: 1, fontSize: '1rem' }} 
              />
            )}
          </MenuItem>
        </Menu>
        
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

const getMinWidthForColumn = (columnId) => {
  const minWidths = {
    node: 70,
    type: 40,
    id: 60,
    status: 40,
    name: 130,
    cpu: 100,
    memory: 100,
    disk: 100,
    download: 90,
    upload: 90,
    uptime: 85
  };
  
  return minWidths[columnId] || 90;
};

export default NetworkTableHeader; 