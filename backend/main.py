from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv
import aiofiles
import PyPDF2
import io
import mimetypes
import json
from datetime import datetime

# Load environment variables
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Global variables
notes_db = []
sources_db = []
combined_summary = None  # 통합 요약을 저장할 전역 변수

class Note(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    tags: List[str] = []

class Source(BaseModel):
    id: str
    filename: str
    content: str
    upload_date: str
    file_type: str
    summary: Optional[str] = None

async def generate_summary(content: str, filename: str, existing_summaries: List[dict] = None) -> str:
    try:
        # Prepare context from existing summaries
        context = ""
        if existing_summaries:
            context = "이전에 업로드된 문서들:\n"
            for summary in existing_summaries:
                context += f"- {summary['filename']}: {summary['summary']}\n"
            context += "\n새로 통합할 문서:\n"
        
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {
                    "role": "system",
                    "content": """당신은 문서를 요약하는 도우미입니다. 다음 가이드라인을 따라주세요:
1. 주요 포인트를 포착하고 이전 문서들과 연결하여 간결한 요약을 작성하세요
2. 적절한 이모지를 사용하여 요약을 더 흥미롭게 만드세요
3. 요약은 대략 한 단락으로 유지하세요
4. 핵심 통찰과 문서 간의 연결에 집중하세요
5. 문서 유형이나 주요 주제를 나타내는 적절한 이모지로 시작하세요"""
                },
                {
                    "role": "user",
                    "content": f"{context}다음 문서의 제목은 '{filename}'입니다. 요약해주세요:\n\n{content}"
                }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"요약 생성 중 오류 발생: {str(e)}")
        if "api_key" in str(e).lower():
            return "⚠️ OpenAI API 키가 올바르게 설정되지 않았습니다. 환경 변수를 확인해주세요."
        elif "model" in str(e).lower():
            return "⚠️ 잘못된 모델 설정입니다. OpenAI 모델 설정을 확인해주세요."
        return "📝 요약 생성에 실패했습니다. 나중에 다시 시도해주세요."

@app.get("/get_question")
async def get_question():
    return {"message": "Welcome to NotebookLM Clone API"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to NotebookLM Clone API"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Check file size (limit to 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:  # 10MB
            return JSONResponse(
                status_code=400,
                content={"error": "파일 크기는 10MB를 초과할 수 없습니다"}
            )
        
        # Detect file type using mimetypes
        file_type, _ = mimetypes.guess_type(file.filename)
        if not file_type:
            file_type = 'application/octet-stream'
        
        # Process different file types
        extracted_text = ""
        if file_type == "application/pdf":
            # Process PDF
            pdf_file = io.BytesIO(contents)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        elif file_type.startswith("text/"):
            # Process text files
            extracted_text = contents.decode('utf-8')
        else:
            return JSONResponse(
                status_code=400,
                content={"error": "지원하지 않는 파일 형식입니다. PDF 또는 텍스트 파일을 업로드해주세요."}
            )

        # Get existing summaries for context
        existing_summaries = [
            {"filename": s.filename, "summary": s.summary}
            for s in sources_db
            if s.summary
        ]

        # Generate individual summary
        summary = await generate_summary(extracted_text, file.filename, existing_summaries)

        # Save file metadata and content
        source_id = str(len(sources_db) + 1)
        source = Source(
            id=source_id,
            filename=file.filename,
            content=extracted_text,
            upload_date=datetime.now().isoformat(),
            file_type=file_type,
            summary=summary
        )
        sources_db.append(source)

        # Save physical file
        file_path = os.path.join(UPLOAD_DIR, f"{source_id}_{file.filename}")
        async with aiofiles.open(file_path, 'wb') as out_file:
            await out_file.write(contents)

        # Generate combined summary only during upload
        global combined_summary
        try:
            all_texts = []
            for s in sources_db:
                all_texts.append(f"Document '{s.filename}':\n{s.content}")
            
            combined_text = "\n\n---\n\n".join(all_texts)
            combined_summary = await generate_summary(
                combined_text,
                "All Documents",
                None
            )
        except Exception as e:
            print(f"통합 요약 생성 중 오류 발생: {str(e)}")
            if not combined_summary:  # 기존 통합 요약이 없는 경우에만 에러 메시지 설정
                combined_summary = "📝 통합 요약 생성에 실패했습니다"

        # Return complete response including all summaries
        return {
            "id": source_id,
            "filename": file.filename,
            "upload_date": source.upload_date,
            "file_type": file_type,
            "summary": summary,
            "combined_summary": combined_summary,
            "all_summaries": [
                {"id": s.id, "filename": s.filename, "summary": s.summary}
                for s in sources_db
            ]
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"An error occurred while processing the file: {str(e)}"}
        )

@app.get("/sources/")
async def get_sources():
    return sources_db

@app.get("/sources/{source_id}")
async def get_source(source_id: str):
    source = next((s for s in sources_db if s.id == source_id), None)
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source

@app.get("/summaries/")
async def get_summaries():
    """Get all document summaries and combined summary"""
    if not sources_db:
        return {
            "individual_summaries": [],
            "combined_summary": None
        }

    return {
        "individual_summaries": [
            {"id": s.id, "filename": s.filename, "summary": s.summary}
            for s in sources_db
        ],
        "combined_summary": combined_summary
    }

@app.post("/notes/")
async def create_note(note: Note):
    note.id = str(len(notes_db) + 1)
    notes_db.append(note)
    return note

@app.get("/notes/")
async def get_notes():
    return notes_db

@app.post("/notes/{note_id}/analyze")
async def analyze_note(note_id: str):
    # Find the note
    note = next((n for n in notes_db if n.id == note_id), None)
    if not note:
        raise HTTPException(status_code=404, detail="노트를 찾을 수 없습니다")
    
    try:
        # Call OpenAI API for analysis
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "당신은 노트를 분석하고 통찰을 제공하는 도우미입니다."},
                {"role": "user", "content": f"다음 노트를 분석해주세요:\n\n제목: {note.title}\n\n내용: {note.content}"}
            ],
            max_tokens=500,
            temperature=0.7
        )
        
        analysis = response.choices[0].message.content
        return {"analysis": analysis}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sources/{source_id}")
async def delete_source(source_id: str):
    try:
        # Find the source
        source = next((s for s in sources_db if s.id == source_id), None)
        if not source:
            raise HTTPException(status_code=404, detail="문서를 찾을 수 없습니다")

        # Remove from database
        sources_db.remove(source)

        # Delete physical file
        file_path = os.path.join(UPLOAD_DIR, f"{source_id}_{source.filename}")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"파일 삭제 중 오류 발생: {str(e)}")

        # 모든 문서가 삭제된 경우에만 통합 요약을 None으로 설정
        global combined_summary
        if not sources_db:
            combined_summary = None

        return {
            "message": "문서가 성공적으로 삭제되었습니다",
            "combined_summary": combined_summary,
            "all_summaries": [
                {"id": s.id, "filename": s.filename, "summary": s.summary}
                for s in sources_db
            ]
        }

    except Exception as e:
        print(f"문서 삭제 중 오류 발생: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"문서 삭제 중 오류가 발생했습니다: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 