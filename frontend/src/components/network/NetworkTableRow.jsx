import React, { useMemo } from 'react';
import {
  TableRow,
  TableCell,
  Typography,
  Box,
  Chip,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import { StatusIndicator, ProgressWithLabel } from './UIComponents';
import { formatBytes, formatNetworkRate, formatUptime, formatPercentage, formatBytesWithUnit } from '../../utils/formatters';
import { calculateDynamicColumnWidths } from '../../utils/networkUtils';

const NetworkTableRow = ({ 
  guest, 
  metrics, 
  columnVisibility, 
  getNodeName,
  extractNumericId,
  columnOrder,
  activeFilteredColumns = {}
}) => {
  const theme = useTheme();
  
  // Determine if the guest is running
  const isRunning = guest.status?.toLowerCase() === 'running';
  
  // Determine if this is a shared guest (ID 999 or 888)
  const isSharedGuest = guest.vmid === 999 || guest.vmid === 888;
  
  // If the guest is running and it's a shared guest, it's on its primary node
  const isPrimaryNode = isSharedGuest && isRunning;
  
  // Get metrics for this guest
  const cpuMetrics = metrics?.cpu?.[guest?.id] || null;
  const memoryMetrics = metrics?.memory?.[guest?.id] || null;
  const diskMetrics = metrics?.disk?.[guest?.id] || null;
  const networkMetrics = metrics?.network?.[guest?.id] || null;
  
  // Determine guest type
  const isVM = guest.type === 'qemu';
  const guestTypeLabel = isVM ? 'VM' : 'CT';
  const guestTypeColor = isVM ? 'primary' : 'secondary';
  
  // Get the CPU usage value
  const cpuUsage = cpuMetrics?.usage ?? 0;
  
  // Get memory usage with unit awareness
  const memoryUsage = memoryMetrics?.usagePercent ?? 0;
  const memoryUnit = memoryMetrics?.unit || 'bytes';
  const memoryTotal = memoryMetrics?.total ?? 0;
  const memoryUsed = memoryMetrics?.used ?? 0;
  
  // Get disk usage with unit awareness
  const diskUsage = diskMetrics?.usagePercent ?? 0;
  const diskUnit = diskMetrics?.unit || 'bytes';
  const diskTotal = diskMetrics?.total ?? 0;
  const diskUsed = diskMetrics?.used ?? 0;
  
  // Get network rates with unit awareness
  const downloadRate = networkMetrics?.inRate ?? 0;
  const uploadRate = networkMetrics?.outRate ?? 0;
  
  // Get uptime
  const uptime = guest.uptime ?? 0;
  
  // Calculate dynamic column widths based on visible columns
  const columnWidths = useMemo(() => {
    return calculateDynamicColumnWidths(columnVisibility);
  }, [columnVisibility]);
  
  // Get visible columns in the correct order
  const visibleColumns = useMemo(() => {
    if (!columnOrder || !Array.isArray(columnOrder) || columnOrder.length === 0) {
      return [];
    }
    
    // Filter visible columns and sort them according to columnOrder
    return columnOrder
      .filter(id => columnVisibility[id]?.visible)
      .map(id => ({ id, ...columnVisibility[id] }))
      .filter(Boolean);
  }, [columnVisibility, columnOrder]);

  // Render cell content based on column ID
  const renderCellContent = (columnId) => {
    if (!columnId) return null;
    
    switch (columnId) {
      case 'node':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" noWrap>
              {getNodeName(guest?.node)}
              {isSharedGuest && isPrimaryNode && (
                <Tooltip title="Primary Node - This node is currently running this shared guest">
                  <Box component="span" sx={{ 
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    opacity: 0.6,
                    ml: 1,
                    verticalAlign: 'middle'
                  }} />
                </Tooltip>
              )}
            </Typography>
          </Box>
        );
      case 'type':
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <Tooltip title={isVM ? 'Virtual Machine' : 'Container'}>
              <Typography 
                variant="caption" 
                sx={{
                  fontWeight: 'bold',
                  color: isVM ? theme.palette.primary.main : '#00C853',
                  fontSize: '0.7rem'
                }}
              >
                {isVM ? 'VM' : 'CT'}
              </Typography>
            </Tooltip>
          </Box>
        );
      case 'id':
        return (
          <Typography variant="body2" color="text.secondary">
            {extractNumericId(guest?.id)}
          </Typography>
        );
      case 'status':
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}>
            <Tooltip title={isRunning ? 'Running' : 'Stopped'}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <StatusIndicator status={isRunning ? 'running' : 'stopped'} />
              </Box>
            </Tooltip>
          </Box>
        );
      case 'name':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" noWrap>
              {guest?.name}
            </Typography>
          </Box>
        );
      case 'cpu':
        return (
          <ProgressWithLabel 
            value={cpuUsage} 
            label={`${formatPercentage(cpuUsage)}`} 
            color={cpuUsage > 90 ? 'error' : cpuUsage > 70 ? 'warning' : 'primary'}
          />
        );
      case 'memory':
        return (
          <ProgressWithLabel 
            value={memoryUsage} 
            label={`${formatBytesWithUnit(memoryUsed, memoryUnit)} / ${formatBytesWithUnit(memoryTotal, memoryUnit)}`} 
            color={memoryUsage > 90 ? 'error' : memoryUsage > 70 ? 'warning' : 'primary'}
          />
        );
      case 'disk':
        return (
          <ProgressWithLabel 
            value={diskUsage} 
            label={`${formatBytesWithUnit(diskUsed, diskUnit)} / ${formatBytesWithUnit(diskTotal, diskUnit)}`} 
            color={diskUsage > 90 ? 'error' : diskUsage > 70 ? 'warning' : 'primary'}
          />
        );
      case 'download':
        return (
          <Typography variant="body2" color="text.secondary">
            {formatNetworkRate(downloadRate)}
          </Typography>
        );
      case 'upload':
        return (
          <Typography variant="body2" color="text.secondary">
            {formatNetworkRate(uploadRate)}
          </Typography>
        );
      case 'uptime':
        return (
          <Typography variant="body2" color="text.secondary">
            {isRunning ? formatUptime(uptime) : '—'}
          </Typography>
        );
      default:
        return null;
    }
  };

  return (
    <TableRow 
      hover
      sx={{ 
        opacity: isRunning ? 1 : 0.6,
        '&:hover': {
          opacity: 1
        }
      }}
    >
      {/* Render cells based on column order */}
      {Array.isArray(visibleColumns) && visibleColumns.length > 0 ? (
        visibleColumns.map(column => (
          column && (
            <TableCell 
              key={column.id}
              sx={{ 
                width: columnWidths?.[column.id] || 'auto',
                minWidth: getMinWidthForColumn(column.id),
                backgroundColor: activeFilteredColumns[column.id] 
                  ? 'rgba(25, 118, 210, 0.08)' // Light blue highlight that's more visible but still neutral
                  : 'inherit',
                ...(column.id === 'status' && {
                  textAlign: 'center',
                  padding: '0px 8px'
                })
              }}
            >
              {renderCellContent(column.id)}
            </TableCell>
          )
        ))
      ) : (
        <TableCell colSpan={2}>No visible columns</TableCell>
      )}
    </TableRow>
  );
};

// Helper function to get minimum width for each column
const getMinWidthForColumn = (columnId) => {
  const minWidths = {
    node: 70,
    type: 35,    // Reduced from 45px to make it more compact
    id: 60,
    status: 40,   // Reduced from 90px since we're only showing the icon now
    name: 130,
    cpu: 100,
    memory: 100,
    disk: 100,
    download: 90,
    upload: 90,
    uptime: 85    // Increased from 70px to accommodate longer uptime strings
  };
  
  return minWidths[columnId] || 90;
};

export default NetworkTableRow; 