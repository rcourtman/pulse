import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
  IconButton,
  Collapse,
  Paper,
  InputBase,
  Tooltip,
  Badge,
  alpha,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Button
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ComputerIcon from '@mui/icons-material/Computer';
import DnsIcon from '@mui/icons-material/Dns';
import ViewListIcon from '@mui/icons-material/ViewList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { formatPercentage, formatNetworkRateForFilter, sliderValueToNetworkRate } from '../../utils/formatters';
import { KeyboardShortcut } from './UIComponents';
import { useTheme } from '@mui/material/styles';

const NetworkFilters = ({
  filters,
  updateFilter,
  clearFilter,
  resetFilters,
  showStopped,
  setShowStopped,
  searchTerm,
  setSearchTerm,
  activeSearchTerms,
  addSearchTerm,
  removeSearchTerm,
  activeFilterCount,
  showFilters,
  handleSliderDragStart,
  handleSliderDragEnd,
  searchInputRef,
  guestTypeFilter,
  setGuestTypeFilter,
  handleClose
}) => {
  const theme = useTheme();

  // Handle search input submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Add the entire search term (which can contain multiple space-separated words)
      // This creates an AND search as the filtering logic uses .every()
      addSearchTerm(searchTerm.trim());
      setSearchTerm('');
    }
  };

  // Handle guest type filter change
  const handleGuestTypeChange = (event, newValue) => {
    if (newValue !== null) {
      setGuestTypeFilter(newValue);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: 350,
        maxWidth: '100vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle2" gutterBottom>
          Filter Systems
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Filter by properties or search for specific systems.
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Search input */}
      <Box
        component="form"
        onSubmit={handleSearchSubmit}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
        }}
      >
        <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
        <InputBase
          placeholder="Press Enter to search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 1 }}
          inputRef={searchInputRef}
          inputProps={{ 'aria-label': 'search systems' }}
          endAdornment={
            searchTerm ? (
              <IconButton
                size="small"
                aria-label="clear search"
                onClick={() => setSearchTerm('')}
                sx={{ p: 0.5 }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            ) : null
          }
        />
      </Box>
      
      {/* Search Pro Tips */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="caption" color="text.secondary">
          <strong>Tips:</strong> Use <strong>status:running</strong> or <strong>status:stopped</strong> to filter by status. Use <strong>type:vm</strong> or <strong>type:ct</strong> for system types.
        </Typography>
      </Box>
      
      {/* Active search terms */}
      {activeSearchTerms.length > 0 && (
        <Box sx={{ px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {activeSearchTerms.map((term) => (
            <Chip
              key={term}
              label={term}
              size="small"
              onDelete={() => removeSearchTerm(term)}
            />
          ))}
        </Box>
      )}
      
      <Divider />
      
      {/* Guest type filter */}
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="body2" gutterBottom>
          System Type
        </Typography>
        <ToggleButtonGroup
          value={guestTypeFilter}
          exclusive
          onChange={handleGuestTypeChange}
          aria-label="system type filter"
          size="small"
          sx={{ 
            width: '100%',
            '& .MuiToggleButton-root': {
              borderRadius: 1.5,
              py: 1,
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiSvgIcon-root': {
                  color: 'primary.contrastText'
                }
              },
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            },
            '& .MuiToggleButtonGroup-grouped': {
              mx: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              '&:not(:first-of-type)': {
                borderLeft: '1px solid',
                borderLeftColor: 'divider',
              },
              '&:first-of-type': {
                ml: 0
              },
              '&:last-of-type': {
                mr: 0
              }
            }
          }}
        >
          <ToggleButton value="all" aria-label="all systems" sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
              All
            </Box>
          </ToggleButton>
          <ToggleButton value="vm" aria-label="virtual machines only" sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ComputerIcon fontSize="small" sx={{ mr: 0.5 }} />
              VMs
            </Box>
          </ToggleButton>
          <ToggleButton value="ct" aria-label="containers only" sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DnsIcon fontSize="small" sx={{ mr: 0.5 }} />
              CTs
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Divider />
      
      {/* Sliders for numeric filters */}
      <Box sx={{ px: 2, py: 1, maxHeight: 300, overflow: 'auto' }}>
        <Typography variant="body2" gutterBottom>
          Resource Filters
        </Typography>
        
        {/* CPU Filter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              CPU Usage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPercentage(filters.cpu)}+
            </Typography>
          </Box>
          <Slider
            value={filters.cpu}
            onChange={(e, newValue) => updateFilter('cpu', newValue)}
            onMouseDown={() => handleSliderDragStart('cpu')}
            onMouseUp={handleSliderDragEnd}
            aria-labelledby="cpu-filter-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={formatPercentage}
            min={0}
            max={100}
            size="small"
          />
        </Box>
        
        {/* Memory Filter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Memory Usage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPercentage(filters.memory)}+
            </Typography>
          </Box>
          <Slider
            value={filters.memory}
            onChange={(e, newValue) => updateFilter('memory', newValue)}
            onMouseDown={() => handleSliderDragStart('memory')}
            onMouseUp={handleSliderDragEnd}
            aria-labelledby="memory-filter-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={formatPercentage}
            min={0}
            max={100}
            size="small"
          />
        </Box>
        
        {/* Disk Filter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Disk Usage
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPercentage(filters.disk)}+
            </Typography>
          </Box>
          <Slider
            value={filters.disk}
            onChange={(e, newValue) => updateFilter('disk', newValue)}
            onMouseDown={() => handleSliderDragStart('disk')}
            onMouseUp={handleSliderDragEnd}
            aria-labelledby="disk-filter-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={formatPercentage}
            min={0}
            max={100}
            size="small"
          />
        </Box>
        
        {/* Network Download Filter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Download Rate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatNetworkRateForFilter(filters.download)}+
            </Typography>
          </Box>
          <Slider
            value={filters.download}
            onChange={(e, newValue) => updateFilter('download', newValue)}
            onMouseDown={() => handleSliderDragStart('download')}
            onMouseUp={handleSliderDragEnd}
            aria-labelledby="download-filter-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={formatNetworkRateForFilter}
            min={0}
            max={100}
            size="small"
          />
        </Box>
        
        {/* Network Upload Filter */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Upload Rate
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatNetworkRateForFilter(filters.upload)}+
            </Typography>
          </Box>
          <Slider
            value={filters.upload}
            onChange={(e, newValue) => updateFilter('upload', newValue)}
            onMouseDown={() => handleSliderDragStart('upload')}
            onMouseUp={handleSliderDragEnd}
            aria-labelledby="upload-filter-slider"
            valueLabelDisplay="auto"
            valueLabelFormat={formatNetworkRateForFilter}
            min={0}
            max={100}
            size="small"
          />
        </Box>
      </Box>
      
      <Divider />
      
      {/* Reset button */}
      <Box sx={{ px: 2, py: 1 }}>
        <Button 
          size="small" 
          fullWidth 
          variant="outlined" 
          onClick={() => {
            resetFilters();
            handleClose && handleClose();
          }}
          startIcon={<FilterAltOffIcon />}
        >
          Reset All Filters
        </Button>
      </Box>
    </Paper>
  );
};

export default NetworkFilters; 