@echo off
echo Starting DocWeave...

:: Start Backend
start "DocWeave Backend" cmd /k "cd backend && ..\venv\Scripts\activate && uvicorn main:app --reload"

:: Start Frontend
start "DocWeave Frontend" cmd /k "cd frontend && npm run dev"

echo DocWeave is starting in separate windows.
