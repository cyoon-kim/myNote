import React, { useState } from 'react';
import { Paper, TextField, Box } from '@mui/material';

export interface NoteEditorProps {}

const NoteEditor: React.FC<NoteEditorProps> = () => {
  const [note, setNote] = useState({
    title: '',
    content: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNote(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box sx={{ height: '100%', p: 3 }}>
      <TextField
        name="title"
        value={note.title}
        onChange={handleChange}
        variant="standard"
        placeholder="제목"
        fullWidth
        InputProps={{
          disableUnderline: true,
          sx: {
            fontSize: '1.5rem',
            fontWeight: 500,
            '&::placeholder': {
              color: '#5f6368',
              opacity: 1,
            },
          },
        }}
        sx={{ mb: 3 }}
      />
      <TextField
        name="content"
        value={note.content}
        onChange={handleChange}
        variant="standard"
        placeholder="내용을 입력하세요"
        multiline
        fullWidth
        InputProps={{
          disableUnderline: true,
          sx: {
            fontSize: '1rem',
            lineHeight: 1.8,
            '&::placeholder': {
              color: '#5f6368',
              opacity: 1,
            },
          },
        }}
      />
    </Box>
  );
};

export default NoteEditor; 