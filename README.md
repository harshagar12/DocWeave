# DocWeave

DocWeave is a powerful document processing application that allows users to upload, manage, and manipulate PDF files. It features a modern React frontend and a robust FastAPI backend.

## Features

- **PDF Manipulation**: Rotate, reorder, and organize PDF pages.
- **File Conversion**: Convert DOCX and images to PDF.
- **Drag & Drop**: Easy file upload interface.
- **Real-time Preview**: View your documents before processing.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Python, FastAPI, PyPDF, pdf2docx

## Getting Started

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd DocWeave
    ```

2.  **Backend Setup:**

    ```bash
    cd backend
    python -m venv venv
    ..\venv\Scripts\activate  # Windows
    # source ../venv/bin/activate # Linux/Mac
    pip install -r requirements.txt
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```

## Running the Application

### One-Click Start (Windows)

Simply run the `start_app.bat` file in the root directory.

### Manual Start

**Backend:**

```bash
cd backend
uvicorn main:app --reload
```

**Frontend:**

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:8000`.
