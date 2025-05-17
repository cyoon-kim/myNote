import React from 'react';
import { List, ListItem, ListItemText, ListItemButton, Typography, Box, Divider } from '@mui/material';

export interface NoteListProps {}

const NoteList: React.FC<NoteListProps> = () => {
  const notes = [
    { id: 1, title: '첫 번째 노트', content: '노트 내용...', updatedAt: new Date() },
    { id: 2, title: '두 번째 노트', content: '노트 내용...', updatedAt: new Date() },
  ];

  return (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
          내 노트
        </Typography>
      </Box>
      <List sx={{ px: 1 }}>
        {notes.map((note, index) => (
          <React.Fragment key={note.id}>
            <ListItem disablePadding>
              <ListItemButton
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(32, 33, 36, 0.039)',
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: 'text.primary',
                        fontSize: '0.95rem',
                      }}
                    >
                      {note.title}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {note.content}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < notes.length - 1 && (
              <Divider variant="fullWidth" sx={{ my: 1 }} />
            )}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default NoteList; 