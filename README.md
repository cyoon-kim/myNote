# NotebookLM Clone

A web application that provides document management and AI-powered summarization capabilities.

## Setup Instructions

1. Clone the repository
2. Set up the environment:

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory with the following content:
```
OPENAI_API_KEY=your_openai_api_key_here
```

4. Start the backend server:
```bash
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Features

- 📄 Document Upload: Support for PDF and text files
- 🤖 AI-Powered Summarization: Automatic document summarization using OpenAI's GPT-3.5
- 📚 Document Management: Easy file organization and deletion
- 👀 PDF Viewer: Built-in PDF viewing capabilities
- 💬 Chat Interface: Interact with your documents through chat

## Troubleshooting

If you encounter issues with document summarization:

1. Check that your OpenAI API key is properly configured in the `.env` file
2. Ensure you're connected to the internet
3. Verify that the uploaded file is in a supported format (PDF or text)
4. Check the backend logs for specific error messages

## Technical Stack

- Backend: FastAPI + Python
- Frontend: React + TypeScript + Material-UI
- AI: OpenAI GPT-3.5
- File Processing: PyPDF2 