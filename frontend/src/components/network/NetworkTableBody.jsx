import React, { useEffect } from 'react';
import {
  TableBody,
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  Button
} from '@mui/material';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import NetworkTableRow from './NetworkTableRow';

const NetworkTableBody = ({
  sortedAndFilteredData,
  guestData,
  metricsData,
  columnVisibility,
  getNodeName,
  extractNumericId,
  resetFilters,
  showStopped,
  setShowStopped,
  guestTypeFilter,
  resetColumnVisibility,
  forceUpdateCounter,
  columnOrder,
  activeFilteredColumns = {}
}) => {
  // Check if any columns are visible
  const hasVisibleColumns = Object.values(columnVisibility).some(col => col.visible);
  
  // Force re-render when forceUpdateCounter changes
  useEffect(() => {
    if (forceUpdateCounter > 0) {
      console.log('NetworkTableBody re-rendering due to forceUpdateCounter:', forceUpdateCounter);
    }
  }, [forceUpdateCounter]);
  
  // If no columns are visible, show a message
  if (!hasVisibleColumns) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <VisibilityOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.6 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Columns Visible
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 3 }}>
                All columns are currently hidden. Click the button below to reset column visibility.
              </Typography>
              <Button 
                variant="outlined" 
                onClick={resetColumnVisibility}
                startIcon={<VisibilityOffIcon />}
              >
                Reset Column Visibility
              </Button>
            </Box>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  
  // If no data is available, show a message
  if (!sortedAndFilteredData || sortedAndFilteredData.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
              <NetworkCheckIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2, opacity: 0.6 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Systems Found
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400, mb: 3 }}>
                {!showStopped ? (
                  <>
                    No running systems match your current filters. 
                    {guestData && guestData.length > 0 && (
                      <>
                        <br />
                        Try showing stopped systems or adjusting your filters.
                      </>
                    )}
                  </>
                ) : (
                  <>
                    No stopped systems match your current filters. 
                    {guestData && guestData.length > 0 && (
                      <>
                        <br />
                        Try showing running systems or adjusting your filters.
                      </>
                    )}
                  </>
                )}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {guestData && (
                  <Button 
                    variant="outlined" 
                    onClick={() => setShowStopped(!showStopped)}
                    size="small"
                  >
                    {showStopped ? "Show Running Systems" : "Show Stopped Systems"}
                  </Button>
                )}
                <Button 
                  variant="outlined" 
                  onClick={resetFilters}
                  startIcon={<FilterAltIcon />}
                  size="small"
                >
                  Reset Filters
                </Button>
              </Box>
            </Box>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {Array.isArray(sortedAndFilteredData) && sortedAndFilteredData.map((guest) => (
        guest && (
          <NetworkTableRow
            key={`${guest.node || 'unknown'}-${guest.id || 'unknown'}`}
            guest={guest}
            metrics={metricsData || {}}
            columnVisibility={columnVisibility || {}}
            getNodeName={getNodeName || (() => 'Unknown')}
            extractNumericId={extractNumericId || ((id) => id)}
            columnOrder={columnOrder || []}
            activeFilteredColumns={activeFilteredColumns}
          />
        )
      ))}
    </TableBody>
  );
};

export default NetworkTableBody; 