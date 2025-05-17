import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Paper, Divider, CircularProgress, IconButton } from '@mui/material';

// Delete icon SVG component
const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
);

interface Summary {
  id: string;
  filename: string;
  summary: string;
}

interface SummaryResponse {
  individual_summaries: Summary[];
  combined_summary: string | null;
}

export interface ChatPanelProps {}

const ChatPanel: React.FC<ChatPanelProps> = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [combinedSummary, setCombinedSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSummaries();

    // Listen for summary updates
    const handleSummaryUpdate = (event: CustomEvent<{summaries: Summary[], combinedSummary: string | null}>) => {
      setSummaries(event.detail.summaries);
      setCombinedSummary(event.detail.combinedSummary);
    };

    window.addEventListener('updateSummaries', handleSummaryUpdate as EventListener);

    return () => {
      window.removeEventListener('updateSummaries', handleSummaryUpdate as EventListener);
    };
  }, []);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/summaries/');
      if (!response.ok) {
        throw new Error('요약을 가져오는데 실패했습니다');
      }
      const data: SummaryResponse = await response.json();
      setSummaries(data.individual_summaries || []);
      setCombinedSummary(data.combined_summary);
    } catch (error) {
      console.error('요약 가져오기 실패:', error);
      alert('요약을 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      const response = await fetch(`http://localhost:8000/sources/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('문서 삭제에 실패했습니다');
      }

      const data = await response.json();
      
      // Update summaries from the response
      setSummaries(data.all_summaries || []);
      setCombinedSummary(data.combined_summary);
    } catch (error) {
      console.error('문서 삭제 중 오류:', error);
      alert('문서 삭제에 실패했습니다');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ p: 2, borderBottom: '1px solid #e8eaed' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
          채팅
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3,
          overflowY: 'auto',
        }}
      >
        {summaries.length > 0 ? (
          <>
            {combinedSummary && (
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 3,
                  border: '1px solid #1a73e8',
                  borderRadius: '8px',
                  bgcolor: '#f8f9fa',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 1, color: '#1a73e8' }}
                >
                  📚 통합 요약
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: combinedSummary.includes('실패') ? '#d93025' : '#202124',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem',
                  }}
                >
                  {combinedSummary}
                </Typography>
              </Paper>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#202124', fontSize: '1.1rem' }}>
              👋 안녕하세요!
            </Typography>
            <Typography variant="body1" sx={{ color: '#5f6368', fontSize: '0.95rem', lineHeight: 1.6 }}>
            ✨ 문서를 업로드하고 저와 대화해보세요 ✨
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e8eaed',
        }}
      >
        <TextField
          fullWidth
          placeholder="문서를 업로드하여 시작하세요"
          disabled={summaries.length === 0}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: '#f8f9fa',
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1,
            color: '#5f6368',
          }}
        >
          NotebookLM의 응답이 부정확할 수 있으니 반드시 확인해주세요.
        </Typography>
      </Box>
    </>
  );
};

export default ChatPanel; 