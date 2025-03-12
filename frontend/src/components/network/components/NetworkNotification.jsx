import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const NetworkNotification = ({
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  handleSnackbarClose
}) => {
  return (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={2000}
      onClose={handleSnackbarClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={handleSnackbarClose} 
        severity={snackbarSeverity} 
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>
  );
};

export default NetworkNotification; 