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
                  // Add the entire search term (which can contain multiple space-separated words)
                  // This creates an OR search (spaces act as OR operators)
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
                id="searchInput"
                placeholder="Press Enter to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                inputRef={searchInputRef}
                autoFocus
                variant="outlined"
                InputProps={{
                  endAdornment: searchTerm ? (
                    <IconButton
                      size="small"
                      aria-label="clear search"
                      onClick={() => setSearchTerm('')}
                      sx={{ p: 0.5 }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null,
                  inputProps: {
                    autoCapitalize: "none",
                    autoComplete: "off",
                    autoCorrect: "off",
                    spellCheck: "false"
                  }
                }}
                sx={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchTerm.trim()) {
                      // Add the entire search term (which can contain multiple space-separated words)
                      // This creates an OR search (spaces act as OR operators)
                      addSearchTerm(searchTerm.trim());
                      setSearchTerm('');
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                <strong>Search Tips:</strong>
                <br />• <strong>Just start typing</strong> anywhere to search
                <br />• Use <strong>status:running</strong> or <strong>status:stopped</strong> to filter by status
                <br />• Use <strong>type:vm</strong> or <strong>type:ct</strong> for filtering by system type
                <br />• Type multiple words for OR search (e.g., <strong>vm server</strong>)
                <br />• Add multiple search terms for AND filtering
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                <Chip 
                  label="status:running" 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    // Don't just set the search term, directly add it as a filter
                    addSearchTerm('status:running');
                  }}
                  sx={{ borderStyle: 'dashed' }}
                />
                <Chip 
                  label="status:stopped" 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    // Don't just set the search term, directly add it as a filter
                    addSearchTerm('status:stopped');
                  }}
                  sx={{ borderStyle: 'dashed' }}
                />
                <Chip 
                  label="type:vm" 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    // Don't just set the search term, directly add it as a filter
                    addSearchTerm('type:vm');
                  }}
                  sx={{ borderStyle: 'dashed' }}
                />
                <Chip 
                  label="type:ct" 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    // Don't just set the search term, directly add it as a filter
                    addSearchTerm('type:ct');
                  }}
                  sx={{ borderStyle: 'dashed' }}
                />
              </Box>
            </Box>
            
            {activeSearchTerms.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Active Filters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {activeSearchTerms.map((term) => (
                    <Chip
                      key={term}
                      label={term}
                      size="small"
                      onDelete={() => removeSearchTerm(term)}
                      sx={{ 
                        bgcolor: 'primary.main', 
                        color: 'primary.contrastText',
                        '& .MuiChip-deleteIcon': {
                          color: 'primary.contrastText',
                          opacity: 0.7,
                          '&:hover': {
                            opacity: 1
                          }
                        }
                      }}
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