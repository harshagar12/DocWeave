from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
import uuid
from typing import List, Dict
from pydantic import BaseModel
import utils

import asyncio
import time
from contextlib import asynccontextmanager

# ... imports ...

CLEANUP_INTERVAL = 600  # Check every 10 minutes
FILE_MAX_AGE = 1800     # 30 minutes

def cleanup_directory(directory: str, max_age: int):
    now = time.time()
    if not os.path.exists(directory):
        return
    for filename in os.listdir(directory):
        filepath = os.path.join(directory, filename)
        if os.path.isfile(filepath):
            try:
                if os.stat(filepath).st_mtime < now - max_age:
                    os.remove(filepath)
                    print(f"Cleaned up: {filepath}")
            except Exception as e:
                print(f"Error cleaning {filepath}: {e}")

async def periodic_cleanup():
    while True:
        try:
            cleanup_directory(UPLOAD_DIR, FILE_MAX_AGE)
            cleanup_directory(PROCESSED_DIR, FILE_MAX_AGE)
        except Exception as e:
            print(f"Cleanup task error: {e}")
        await asyncio.sleep(CLEANUP_INTERVAL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch background task
    task = asyncio.create_task(periodic_cleanup())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(lifespan=lifespan)

# CORS configuration
# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# Add production frontend URL from env
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PROCESSED_DIR = "processed"

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

class PageOperation(BaseModel):
    file_id: str
    page_index: int # 0-based index in the original file
    rotation: int = 0 # 0, 90, 180, 270

class ProcessRequest(BaseModel):
    pages: List[PageOperation]
    output_name: str = "document.pdf"

@app.get("/")
def read_root():
    return {"message": "DocWeave API is running"}

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    uploaded_files = []
    for file in files:
        file_id = str(uuid.uuid4())
        file_ext = file.filename.split(".")[-1].lower()
        if file_ext not in ["pdf", "png", "jpg", "jpeg", "docx"]:
            continue
            
        file_path = os.path.join(UPLOAD_DIR, f"{file_id}.{file_ext}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        final_path = file_path
        try:
            if file_ext in ["docx"]:
                final_path = utils.convert_docx_to_pdf(file_path)
            elif file_ext in ["png", "jpg", "jpeg"]:
                final_path = utils.convert_image_to_pdf(file_path)
        except Exception as e:
            print(f"Conversion failed: {e}")
            # Identify failure to client? For now, skip or return error
            continue

        uploaded_files.append({
            "id": file_id,
            "original_name": file.filename,
            "path": final_path, # Backend use only
            "type": file_ext # Or 'pdf' if converted? let's keep original type or say pdf
        })
        
    return {"files": uploaded_files}

@app.post("/process")
async def process_pdf(request: ProcessRequest):
    # Security: validate file_ids exist in UPLOAD_DIR (or utilize a db mapping)
    # Ideally, client sends IDs we returned in /upload.
    
    # We need to map file_id to actual path.
    # Since we didn't store mapping in DB, we can assume we look for file in UPLOAD_DIR
    # We might need to handle the fact that we don't know the extension or derived PDF path just from ID?
    # FIX: /upload returns ID. The file on disk is f"{id}.{ext}" or f"{id}.pdf" (if converted).
    # Since we convert everything to PDF, we can check for f"{id}.pdf" first, then others?
    # Actually, if we convert, we should probably save as .pdf or keep track.
    # Let's simplify: In /upload, if we convert, we should verify the file exists as .pdf.
    
    output_filename = request.output_name if request.output_name.endswith(".pdf") else f"{request.output_name}.pdf"
    output_id = str(uuid.uuid4())
    output_path = os.path.join(PROCESSED_DIR, f"{output_id}_{output_filename}")
    
    # Resolving pages
    source_pages = []
    for page_op in request.pages:
        # Find the file path.
        # We can look for files starting with file_id in UPLOAD_DIR
        # Better: we enforce everything is .pdf after upload?
        # Yes, let's look for {file_id}.* and see if there's a .pdf version?
        # Or simple: in /upload we save converted files as {id}.pdf always implies strict naming?
        # Let's check utils to see how they save.
        
        # Search for the file
        found_path = None
        # Try exact PDF match first (most likely if converted or uploaded as PDF)
        pdf_candidate = os.path.join(UPLOAD_DIR, f"{page_op.file_id}.pdf")
        if os.path.exists(pdf_candidate):
            found_path = pdf_candidate
        else:
            # Maybe it wasn't converted yet? But we convert on upload.
            # Maybe the ID is wrong?
            # Scan directory?
            pass
            
        if found_path:
            source_pages.append({
                "path": found_path,
                "page_index": page_op.page_index,
                "rotation": page_op.rotation
            })
            
    if not source_pages:
        raise HTTPException(status_code=400, detail="No valid pages to process")

    try:
        utils.create_pdf_from_pages(source_pages, output_path)
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

    return {"download_url": f"/download/{output_id}/{output_filename}"}

@app.get("/download/{file_id}/{filename}")
async def download_file(file_id: str, filename: str):
    # Sanitize inputs
    safe_filename = os.path.basename(filename)
    path = os.path.join(PROCESSED_DIR, f"{file_id}_{safe_filename}")
    if os.path.exists(path):
        return FileResponse(path, filename=safe_filename)
    raise HTTPException(status_code=404, detail="File not found")

@app.get("/preview/{file_id}")
async def preview_file(file_id: str):
    # Find file with any extension in UPLOAD_DIR
    # We returned file_id in upload. We need to find the file.
    # Simple search in UPLOAD_DIR or checking extensions.
    # Only support the extensions we allow.
    for ext in ["pdf", "docx", "png", "jpg", "jpeg"]:
       path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")
       if os.path.exists(path):
           return FileResponse(path)
    
    # If not found, maybe it was converted to .pdf (e.g. docx)?
    # Utils might have saved it as distinct file?
    # In upload, we updated path but didn't change ID mapping on disk except replacing extension maybe?
    # Let's check upload logic:
    # "final_path = utils.convert_docx_to_pdf(file_path)" -> This creates .pdf but file_id.docx is still there or overwritten?
    # util.convert_docx_to_pdf(path) -> returns new path ending in .pdf. The original might exist.
    # so checking .pdf last covers converted ones?
    
    # Let's make sure we check .pdf
    path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
    if os.path.exists(path):
         return FileResponse(path)

    raise HTTPException(status_code=404, detail="File not found")
