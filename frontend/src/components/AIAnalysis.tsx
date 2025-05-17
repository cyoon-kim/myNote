import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

export interface AIAnalysisProps {}

const AIAnalysis: React.FC<AIAnalysisProps> = () => {
  return (
    <Box sx={{ p: 2, bgcolor: '#f8f9fa', height: '100%' }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 500,
          color: '#202124',
          mb: 2,
        }}
      >
        AI 분석
      </Typography>
      <Box
        sx={{
          p: 2,
          bgcolor: '#fff',
          borderRadius: 1,
          border: '1px solid #e8eaed',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#5f6368',
            fontSize: '0.875rem',
            lineHeight: 1.6,
          }}
        >
          노트를 작성하면 AI가 내용을 분석하여 여기에 표시됩니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default AIAnalysis; 