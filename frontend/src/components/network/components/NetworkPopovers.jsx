import React from 'react';
import {
  Popover,
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  MenuItem,
  Switch,
  Slider,
  Divider,
  Radio
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ComputerIcon from '@mui/icons-material/Computer';
import DnsIcon from '@mui/icons-material/Dns';
import ViewListIcon from '@mui/icons-material/ViewList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

const NetworkPopovers = ({
  // Search popover props
  searchAnchorEl,
  openSearch,
  handleCloseSearchPopover,
  searchTerm,
  setSearchTerm,
  activeSearchTerms,
  addSearchTerm,
  removeSearchTerm,
  searchInputRef,
  clearSearchTerms,
  
  // Type popover props
  typeAnchorEl,
  openType,
  handleCloseTypePopover,
  guestTypeFilter,
  setGuestTypeFilter,
  
  // Visibility popover props
  visibilityAnchorEl,
  openVisibility,
  handleCloseVisibilityPopover,
  showStopped,
  setShowStopped,
  
  // Filter popover props
  filterAnchorEl,
  openFilters,
  handleCloseFilterPopover,
  filters,
  updateFilter,
  handleSliderDragStart,
  handleSliderDragEnd,
  resetFilters,
  
  // Formatters
  formatPercentage,
  formatNetworkRateForFilter
}) => {
  return (
    <>
      {/* Search popover */}
      <Popover
        id="search-menu"
        anchorEl={searchAnchorEl}
        open={openSearch}
        onClose={handleCloseSearchPopover}
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
            overflow: 'hidden'
          }
        }}
      >
        <Paper sx={{ width: 350, p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Search Systems
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Search for specific systems by name, ID, or other properties.
            </Typography>
          </Box>
          
          <Box sx={{ p: 2 }}>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                if (searchTerm.trim()) {
                  addSearchTerm(searchTerm.trim());
                  setSearchTerm('');
                }
              }}
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <TextField
                fullWidth
                size="small"
                placeholder="Search systems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchTerm.trim()) {
                    e.preventDefault();
                    addSearchTerm(searchTerm.trim());
                    setSearchTerm('');
                  }
                }}
                inputRef={searchInputRef}
                autoFocus
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                  endAdornment: searchTerm ? (
                    <IconButton
                      size="small"
                      aria-label="clear search"
                      onClick={() => setSearchTerm('')}
                      sx={{ p: 0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null
                }}
                sx={{ flex: 1 }}
              />
            </Box>
          
            {activeSearchTerms.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Active Search Terms
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {activeSearchTerms.map((term) => (
                    <Chip
                      key={term}
                      label={term}
                      size="small"
                      onDelete={() => removeSearchTerm(term)}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                size="small" 
                onClick={() => {
                  clearSearchTerms();
                  handleCloseSearchPopover();
                }}
              >
                Clear All
              </Button>
            </Box>
          </Box>
        </Paper>
      </Popover>
      
      {/* Combined System Filters popover */}
      <Popover
        id="system-filters-menu"
        anchorEl={typeAnchorEl || visibilityAnchorEl}
        open={openType || openVisibility}
        onClose={() => {
          if (openType) handleCloseTypePopover();
          if (openVisibility) handleCloseVisibilityPopover();
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
            overflow: 'hidden'
          }
        }}
      >
        <Paper sx={{ width: 300, p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              System Filters
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Control which systems are displayed.
            </Typography>
          </Box>
          
          <Box sx={{ p: 2 }}>
            {/* System Visibility */}
            <MenuItem dense onClick={() => {
              setShowStopped(!showStopped);
            }}
            sx={{
              borderRadius: 1.5,
              mb: 2,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {showStopped ? (
                    <VisibilityIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                  ) : (
                    <VisibilityOffIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="body2">
                    {showStopped ? 'Show Stopped Systems' : 'Hide Stopped Systems'}
                  </Typography>
                </Box>
                <Switch
                  checked={showStopped}
                  onChange={(e) => {
                    setShowStopped(e.target.checked);
                  }}
                  size="small"
                />
              </Box>
            </MenuItem>
            
            <Divider sx={{ my: 2 }} />
            
            {/* System Type */}
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
              System Types
            </Typography>
            
            {/* VM Option */}
            <MenuItem dense onClick={() => {
              if (guestTypeFilter === 'vm') {
                setGuestTypeFilter('all');
              } else if (guestTypeFilter === 'ct') {
                setGuestTypeFilter('all');
              } else {
                setGuestTypeFilter('vm');
              }
            }}
            sx={{
              borderRadius: 1.5,
              mb: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ComputerIcon fontSize="small" color={guestTypeFilter === 'vm' ? "primary" : "action"} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Virtual Machines Only
                  </Typography>
                </Box>
                <Radio
                  checked={guestTypeFilter === 'vm'}
                  onChange={() => {}}
                  size="small"
                />
              </Box>
            </MenuItem>
            
            {/* CT Option */}
            <MenuItem dense onClick={() => {
              if (guestTypeFilter === 'ct') {
                setGuestTypeFilter('all');
              } else if (guestTypeFilter === 'vm') {
                setGuestTypeFilter('all');
              } else {
                setGuestTypeFilter('ct');
              }
            }}
            sx={{
              borderRadius: 1.5,
              mb: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DnsIcon fontSize="small" color={guestTypeFilter === 'ct' ? "primary" : "action"} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Containers Only
                  </Typography>
                </Box>
                <Radio
                  checked={guestTypeFilter === 'ct'}
                  onChange={() => {}}
                  size="small"
                />
              </Box>
            </MenuItem>
            
            {/* All Systems Option */}
            <MenuItem dense onClick={() => {
              setGuestTypeFilter('all');
            }}
            sx={{
              borderRadius: 1.5,
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                width: '100%',
                justifyContent: 'space-between'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ViewListIcon fontSize="small" color={guestTypeFilter === 'all' ? "primary" : "action"} sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    All System Types
                  </Typography>
                </Box>
                <Radio
                  checked={guestTypeFilter === 'all'}
                  onChange={() => {}}
                  size="small"
                />
              </Box>
            </MenuItem>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                size="small"
                onClick={() => {
                  if (openType) handleCloseTypePopover();
                  if (openVisibility) handleCloseVisibilityPopover();
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Paper>
      </Popover>
      
      {/* Resource thresholds popover */}
      <Popover
        id="filter-menu"
        anchorEl={filterAnchorEl}
        open={openFilters}
        onClose={handleCloseFilterPopover}
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
            overflow: 'hidden'
          }
        }}
      >
        <Paper sx={{ width: 350, p: 0, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Resource Thresholds
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Filter systems by resource usage thresholds.
            </Typography>
          </Box>
          
          <Box sx={{ p: 2 }}>
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
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => {
                resetFilters();
                handleCloseFilterPopover();
              }}
              startIcon={<FilterAltOffIcon />}
            >
              Reset All Thresholds
            </Button>
          </Box>
        </Paper>
      </Popover>
    </>
  );
};

export default NetworkPopovers; 