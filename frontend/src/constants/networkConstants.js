import { keyframes } from '@mui/material';

// Define pulse animation
export const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(58, 123, 213, 0.6);
    transform: scale(0.95);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(58, 123, 213, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(58, 123, 213, 0);
    transform: scale(0.95);
  }
`;

// Add fade-in animation
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Add localStorage keys as constants
export const STORAGE_KEY_FILTERS = 'network_display_filters';
export const STORAGE_KEY_SORT = 'network_display_sort';
export const STORAGE_KEY_SHOW_STOPPED = 'network_display_show_stopped';
export const STORAGE_KEY_SHOW_FILTERS = 'network_display_show_filters';
export const STORAGE_KEY_SEARCH_TERMS = 'network_display_search_terms';
export const STORAGE_KEY_COLUMN_VISIBILITY = 'network_display_column_visibility';
export const STORAGE_KEY_COLUMN_ORDER = 'network_display_column_order';
export const STORAGE_KEY_COLUMN_DRAG_ENABLED = 'network_display_column_drag_enabled';
export const STORAGE_KEY_GUEST_TYPE_FILTER = 'network_display_guest_type_filter';

// Define default column configuration
export const DEFAULT_COLUMN_CONFIG = {
  status: { id: 'status', label: '', visible: true },
  node: { id: 'node', label: 'Node', visible: true },
  type: { id: 'type', label: 'Type', visible: true },
  id: { id: 'id', label: 'ID', visible: true },
  name: { id: 'name', label: 'Name', visible: true },
  cpu: { id: 'cpu', label: 'CPU', visible: true },
  memory: { id: 'memory', label: 'Memory', visible: true },
  disk: { id: 'disk', label: 'Disk', visible: true },
  download: { id: 'download', label: 'Download', visible: true },
  upload: { id: 'upload', label: 'Upload', visible: true },
  uptime: { id: 'uptime', label: 'Uptime', visible: true }
};

// Ensure all columns are visible in the default config
Object.keys(DEFAULT_COLUMN_CONFIG).forEach(key => {
  DEFAULT_COLUMN_CONFIG[key].visible = true;
}); 