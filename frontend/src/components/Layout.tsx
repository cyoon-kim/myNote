import React from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import SourcePanel from './SourcePanel';
import ChatPanel from './ChatPanel';
import StudioPanel from './StudioPanel';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: '#f8f9fa', overflow: 'hidden' }}>
      {/* Sources Panel */}
      <Box
        sx={{
          width: '300px',
          borderRight: '1px solid #e8eaed',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          flexShrink: 0,
        }}
      >
        <SourcePanel />
      </Box>

      {/* Chat Panel */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          minWidth: 0,
        }}
      >
        <ChatPanel />
      </Box>

      {/* Studio Panel */}
      <Box
        sx={{
          width: '300px',
          borderLeft: '1px solid #e8eaed',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
          flexShrink: 0,
        }}
      >
        <StudioPanel />
      </Box>
    </Box>
  );
};

export default Layout; 