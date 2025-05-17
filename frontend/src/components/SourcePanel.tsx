import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Button, IconButton, List, ListItem, ListItemText, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { styled } from '@mui/material/styles';

// Delete icon SVG component
const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 6l12 12M6 18L18 6" />
  </svg>
);

interface Source {
  id: string;
  filename: string;
  upload_date: string;
  file_type: string;
  content: string;
  summary?: string;
}

interface FileViewerDialogProps {
  open: boolean;
  onClose: () => void;
  file: Source | null;
}

const FileViewerDialog: React.FC<FileViewerDialogProps> = ({ open, onClose, file }) => {
  const [showSummary, setShowSummary] = useState(false);
  
  if (!file) return null;

  const isPdf = file.file_type === 'application/pdf';
  const pdfUrl = isPdf ? `http://localhost:8000/uploads/${file.id}_${file.filename}` : null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          maxHeight: '90vh',
          height: isPdf ? '90vh' : 'auto',
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e8eaed',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography sx={{ fontSize: 'inherit', fontWeight: 500 }}>
          {file.filename}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: '#5f6368' }}>
          {new Date(file.upload_date).toLocaleString()}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: isPdf ? 0 : 3, display: 'flex', flexDirection: 'column' }}>
        {showSummary ? (
          <Box sx={{ p: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontSize: '0.875rem', fontWeight: 500, mb: 2, color: '#1a73e8' }}
            >
              📝 문서 요약
            </Typography>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem',
                color: file.summary?.includes('실패') ? '#d93025' : '#202124',
              }}
            >
              {file.summary || '요약을 불러오는 중...'}
            </Typography>
          </Box>
        ) : (
          isPdf ? (
            <Box sx={{ flex: 1, height: '100%' }}>
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                title={file.filename}
              />
            </Box>
          ) : (
            <Typography
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                color: '#202124',
                margin: 0,
              }}
            >
              {file.content}
            </Typography>
          )
        )}
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #e8eaed', p: 2 }}>
        <Button
          onClick={() => setShowSummary(!showSummary)}
          sx={{
            color: '#1a73e8',
            '&:hover': {
              bgcolor: 'rgba(26, 115, 232, 0.04)',
            },
          }}
        >
          {showSummary ? '원문 보기' : '요약 보기'}
        </Button>
        {isPdf && pdfUrl && (
          <Button
            href={pdfUrl}
            download={file.filename}
            sx={{
              color: '#1a73e8',
              '&:hover': {
                bgcolor: 'rgba(26, 115, 232, 0.04)',
              },
            }}
          >
            다운로드
          </Button>
        )}
        <Button 
          onClick={onClose}
          sx={{
            color: '#5f6368',
            '&:hover': {
              bgcolor: '#f8f9fa',
            },
          }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const HiddenInput = styled('input')({
  display: 'none',
});

const SourcePanel: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Source | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event bus for updating summaries
  const updateSummaries = new CustomEvent('updateSummaries', {
    detail: { summaries: [], combinedSummary: null }
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('http://localhost:8000/sources/');
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const handleFileClick = async (source: Source) => {
    try {
      const [sourceResponse, summaryResponse] = await Promise.all([
        fetch(`http://localhost:8000/sources/${source.id}`),
        fetch('http://localhost:8000/summaries/')
      ]);
      
      const sourceData = await sourceResponse.json();
      const summaryData = await summaryResponse.json();
      
      // Find the matching summary
      const fileSummary = summaryData.individual_summaries.find(
        (s: { id: string }) => s.id === source.id
      );
      
      setSelectedFile({
        ...sourceData,
        summary: fileSummary?.summary
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Error fetching file content:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '파일 업로드에 실패했습니다');
      }

      const data = await response.json();
      
      // 요약 실패 확인
      if (data.summary && data.summary.includes('요약 생성에 실패했습니다')) {
        alert('문서 업로드는 완료되었으나, 요약 생성에 실패했습니다.');
      } else if (!data.summary) {
        alert('문서 업로드는 완료되었으나, 요약을 생성할 수 없습니다.');
      }

      // Update sources list
      await fetchSources();

      // Dispatch event to update summaries
      const updateEvent = new CustomEvent('updateSummaries', {
        detail: {
          summaries: data.all_summaries || [],
          combinedSummary: data.combined_summary
        }
      });
      window.dispatchEvent(updateEvent);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('파일 업로드 중 오류:', error);
      alert(error instanceof Error ? error.message : '파일 업로드에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 클릭 이벤트가 부모로 전파되는 것을 방지
    try {
      setDeletingIds(prev => new Set(prev).add(id));
      const response = await fetch(`http://localhost:8000/sources/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '문서 삭제에 실패했습니다');
      }

      await fetchSources();
    } catch (error) {
      console.error('문서 삭제 중 오류:', error);
      alert(error instanceof Error ? error.message : '문서 삭제에 실패했습니다');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  return (
    <>
      <Box sx={{ p: 2, borderBottom: '1px solid #e8eaed' }}>
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 500 }}>
          문서
        </Typography>
      </Box>
      
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <HiddenInput
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          onChange={handleFileUpload}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          sx={{
            borderRadius: '20px',
            textTransform: 'none',
            borderColor: '#e8eaed',
            color: '#202124',
            '&:hover': {
              borderColor: '#dadce0',
              bgcolor: '#f8f9fa',
            },
          }}
        >
          {loading ? <CircularProgress size={16} /> : '+ 추가'}
        </Button>
      </Box>

      {sources.length > 0 ? (
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {sources.map((source) => (
            <ListItem
              key={source.id}
              sx={{
                px: 2,
                py: 1,
                '&:hover': {
                  bgcolor: '#f8f9fa',
                },
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onClick={() => handleFileClick(source)}
            >
              <ListItemText
                primary={source.filename}
                secondary={new Date(source.upload_date).toLocaleString()}
                primaryTypographyProps={{
                  sx: { fontSize: '0.875rem', color: '#202124' }
                }}
                secondaryTypographyProps={{
                  sx: { fontSize: '0.75rem', color: '#5f6368' }
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => handleDelete(source.id, e)}
                disabled={deletingIds.has(source.id)}
                sx={{
                  padding: '4px',
                  color: '#5f6368',
                  '&:hover': {
                    color: '#d93025',
                    bgcolor: 'rgba(217, 48, 37, 0.04)',
                  },
                }}
              >
                {deletingIds.has(source.id) ? (
                  <CircularProgress size={16} />
                ) : (
                  <DeleteIcon />
                )}
              </IconButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            color: '#5f6368',
            textAlign: 'center',
          }}
        >
          <Box
            component="img"
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24' width='24' fill='%235f6368'%3E%3Cpath d='M8 16h8v2H8zm0-4h8v2H8zm6-10H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z'/%3E%3C/svg%3E"
            sx={{ width: 48, height: 48, mb: 2, opacity: 0.8 }}
          />
          <Typography variant="body2" sx={{ mb: 1 }}>
            저장된 문서가 여기에 표시됩니다
          </Typography>
          <Typography variant="body2" sx={{ color: '#5f6368', fontSize: '0.875rem' }}>
            위의 '추가' 버튼을 클릭하여 PDF, 텍스트 파일을 추가하세요.
          </Typography>
        </Box>
      )}

      <FileViewerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        file={selectedFile}
      />
    </>
  );
};

export default SourcePanel; 