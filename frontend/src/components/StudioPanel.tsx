import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const StudioPanel: React.FC = () => {
  return (
    <>
      <Box sx={{ p: 2, borderBottom: '1px solid #e8eaed' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
          Studio
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500, mb: 2 }}>
            Notes
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            sx={{
              justifyContent: 'flex-start',
              textTransform: 'none',
              borderColor: '#e8eaed',
              color: '#202124',
              mb: 2,
            }}
          >
            + Add note
          </Button>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span>📚</span>}
              sx={{
                textTransform: 'none',
                borderColor: '#e8eaed',
                color: '#202124',
              }}
            >
              Study guide
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span>📄</span>}
              sx={{
                textTransform: 'none',
                borderColor: '#e8eaed',
                color: '#202124',
              }}
            >
              Briefing doc
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span>❓</span>}
              sx={{
                textTransform: 'none',
                borderColor: '#e8eaed',
                color: '#202124',
              }}
            >
              FAQ
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span>📅</span>}
              sx={{
                textTransform: 'none',
                borderColor: '#e8eaed',
                color: '#202124',
              }}
            >
              Timeline
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default StudioPanel; 