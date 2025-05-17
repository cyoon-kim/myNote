import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, TextField, Paper, Divider, CircularProgress, IconButton } from '@mui/material';

// Custom Send icon SVG component
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
);

interface ChatMessage {
  role: string;
  content: string;
}

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
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSummaries();
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

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

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/chat/history/');
      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.history || []);
      }
    } catch (error) {
      console.error('채팅 기록 가져오기 실패:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) {
        throw new Error('메시지 전송에 실패했습니다');
      }

      const data = await response.json();
      setChatHistory(data.history);
      setMessage('');
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      alert('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && chatHistory.length === 0) {
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
          gap: 2,
        }}
      >
        {summaries.length > 0 && combinedSummary && (
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

        {chatHistory.map((msg, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 2,
              maxWidth: '80%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              bgcolor: msg.role === 'user' ? '#1a73e8' : '#f8f9fa',
              borderRadius: '12px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '12px',
              borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '12px',
            }}
          >
            <Typography
              sx={{
                color: msg.role === 'user' ? '#fff' : '#202124',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {msg.content}
            </Typography>
          </Paper>
        ))}
        <div ref={messagesEndRef} />

        {chatHistory.length === 0 && (
          <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#202124', fontSize: '1.1rem' }}>
              👋 안녕하세요!
            </Typography>
            <Typography variant="body1" sx={{ color: '#5f6368', fontSize: '0.95rem', lineHeight: 1.6 }}>
              ✨ 저와 대화를 시작해보세요 ✨
            </Typography>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e8eaed',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder="메시지를 입력하세요..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          multiline
          maxRows={4}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              bgcolor: '#f8f9fa',
            },
          }}
        />
        <IconButton
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
          sx={{
            bgcolor: '#1a73e8',
            color: '#fff',
            '&:hover': {
              bgcolor: '#1557b0',
            },
            '&.Mui-disabled': {
              bgcolor: '#e8eaed',
              color: '#9aa0a6',
            },
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: '#fff' }} />
          ) : (
            <SendIcon />
          )}
        </IconButton>
      </Box>
    </>
  );
};

export default ChatPanel; 