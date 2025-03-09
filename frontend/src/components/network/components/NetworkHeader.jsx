import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import SearchIcon from '@mui/icons-material/Search';
import ComputerIcon from '@mui/icons-material/Computer';
import DnsIcon from '@mui/icons-material/Dns';
import ViewListIcon from '@mui/icons-material/ViewList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { DEFAULT_COLUMN_CONFIG } from '../../../constants/networkConstants';

const NetworkHeader = ({
  openColumnMenu,
  openSearch,
  openType,
  openVisibility,
  openFilters,
  activeSearchTerms,
  guestTypeFilter,
  showStopped,
  filters,
  columnVisibility,
  handleColumnMenuOpen,
  handleSearchButtonClick,
  handleTypeButtonClick,
  handleVisibilityButtonClick,
  handleFilterButtonClick,
  searchButtonRef,
  filterButtonRef,
  systemFilterButtonRef
}) => {
  // Calculate if any system filters are active
  const hasActiveSystemFilters = guestTypeFilter !== 'all' || showStopped;
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Column visibility button */}
        <IconButton
          onClick={handleColumnMenuOpen}
          color={openColumnMenu ? 'primary' : 'default'}
          size="small"
          aria-controls={openColumnMenu ? 'column-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={openColumnMenu ? 'true' : undefined}
          sx={{ 
            border: '1px solid',
            borderColor: openColumnMenu ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 0.5
          }}
        >
          <Badge
            badgeContent={Object.keys(DEFAULT_COLUMN_CONFIG).length - Object.values(columnVisibility).filter(col => col.visible).length}
            color="primary"
            invisible={Object.values(columnVisibility).filter(col => col.visible).length === Object.keys(DEFAULT_COLUMN_CONFIG).length}
          >
            <ViewColumnIcon />
          </Badge>
        </IconButton>
        
        {/* Search button */}
        <IconButton
          ref={searchButtonRef}
          onClick={handleSearchButtonClick}
          color={openSearch ? 'primary' : 'default'}
          size="small"
          aria-controls={openSearch ? 'search-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={openSearch ? 'true' : undefined}
          sx={{ 
            border: '1px solid',
            borderColor: openSearch ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 0.5
          }}
        >
          <Badge
            badgeContent={activeSearchTerms.length}
            color="primary"
            invisible={activeSearchTerms.length === 0}
          >
            <SearchIcon />
          </Badge>
        </IconButton>
        
        {/* Combined System Filters button */}
        <IconButton
          ref={systemFilterButtonRef}
          onClick={handleTypeButtonClick}
          color={(openType || openVisibility) ? 'primary' : 'default'}
          size="small"
          aria-controls={(openType || openVisibility) ? 'system-filters-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={(openType || openVisibility) ? 'true' : undefined}
          sx={{ 
            border: '1px solid',
            borderColor: (openType || openVisibility) ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 0.5
          }}
        >
          <Badge
            badgeContent={hasActiveSystemFilters ? 1 : 0}
            color="primary"
            invisible={!hasActiveSystemFilters}
          >
            <FilterAltIcon />
          </Badge>
        </IconButton>
        
        {/* Resource thresholds button */}
        <IconButton
          onClick={handleFilterButtonClick}
          color={openFilters ? 'primary' : 'default'}
          ref={filterButtonRef}
          data-filter-button="true"
          size="small"
          aria-controls={openFilters ? 'filter-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={openFilters ? 'true' : undefined}
          sx={{ 
            border: '1px solid',
            borderColor: openFilters ? 'primary.main' : 'divider',
            borderRadius: 1,
            p: 0.5
          }}
        >
          <Badge
            badgeContent={
              (filters.cpu > 0 ? 1 : 0) + 
              (filters.memory > 0 ? 1 : 0) + 
              (filters.disk > 0 ? 1 : 0) + 
              (filters.download > 0 ? 1 : 0) + 
              (filters.upload > 0 ? 1 : 0)
            }
            color="primary"
            invisible={
              filters.cpu === 0 && 
              filters.memory === 0 && 
              filters.disk === 0 && 
              filters.download === 0 && 
              filters.upload === 0
            }
          >
            <TuneIcon />
          </Badge>
        </IconButton>
      </Box>
    </Box>
  );
};

export default NetworkHeader; 