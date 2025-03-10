import React from 'react';
import {
  Card,
  CardContent,
  TableContainer,
  Table,
  Paper
} from '@mui/material';
import NetworkTableHeader from '../NetworkTableHeader';
import NetworkTableBody from '../NetworkTableBody';

const NetworkTable = ({
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
  activeFilteredColumns,
  sortedAndFilteredData,
  guestData,
  metricsData,
  getNodeName,
  extractNumericId,
  resetFilters,
  showStopped,
  setShowStopped,
  guestTypeFilter
}) => {
  return (
    <Card>
      <CardContent sx={{ p: 0 }}>
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
          <Table stickyHeader size="small" sx={{
            '& .MuiTableCell-stickyHeader': {
              borderBottom: '2px solid',
              borderBottomColor: 'divider',
              zIndex: 3 // Ensure the header stays above other elements
            }
          }}>
            <NetworkTableHeader
              sortConfig={sortConfig}
              requestSort={requestSort}
              columnVisibility={columnVisibility}
              toggleColumnVisibility={toggleColumnVisibility}
              resetColumnVisibility={resetColumnVisibility}
              columnMenuAnchorEl={columnMenuAnchorEl}
              handleColumnMenuOpen={handleColumnMenuOpen}
              handleColumnMenuClose={handleColumnMenuClose}
              openColumnMenu={openColumnMenu}
              forceUpdateCounter={forceUpdateCounter}
              columnOrder={columnOrder}
              setColumnOrder={setColumnOrder}
              activeFilteredColumns={activeFilteredColumns}
            />
            <NetworkTableBody
              sortedAndFilteredData={sortedAndFilteredData}
              guestData={guestData}
              metricsData={metricsData}
              columnVisibility={columnVisibility}
              getNodeName={getNodeName}
              extractNumericId={extractNumericId}
              resetFilters={resetFilters}
              showStopped={showStopped}
              setShowStopped={setShowStopped}
              guestTypeFilter={guestTypeFilter}
              resetColumnVisibility={resetColumnVisibility}
              forceUpdateCounter={forceUpdateCounter}
              columnOrder={columnOrder}
              activeFilteredColumns={activeFilteredColumns}
            />
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default NetworkTable; 