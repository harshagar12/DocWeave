import os
from pypdf import PdfReader, PdfWriter
from PIL import Image
import sys

# Try importing docx2pdf, handle if missing
try:
    from docx2pdf import convert
except ImportError:
    convert = None

def convert_docx_to_pdf(docx_path):
    if not convert:
        raise Exception("docx2pdf is not installed.")
        
    pdf_path = docx_path.replace(".docx", ".pdf")
    # docx2pdf requires absolute paths usually
    abs_docx = os.path.abspath(docx_path)
    abs_pdf = os.path.abspath(pdf_path)
    
    try:
        convert(abs_docx, abs_pdf)
        return pdf_path
    except Exception as e:
        print(f"Error converting docx: {e}")
        # If conversion fails, maybe return original? No, backend expects PDF.
        raise e

def convert_image_to_pdf(image_path):
    image = Image.open(image_path)
    # Handle RGBA to RGB (strip alpha channel for JPEG/PDF compatibility sometimes needed)
    if image.mode == 'RGBA':
        image = image.convert('RGB')
        
    pdf_path = image_path.rpartition('.')[0] + ".pdf"
    image.save(pdf_path, "PDF", resolution=100.0)
    return pdf_path

def merge_pdfs(file_paths, output_path):
    merger = PdfWriter()
    for path in file_paths:
        merger.append(path)
    merger.write(output_path)
    merger.close()
    return output_path

def create_pdf_from_pages(pages_config, output_path):
    """
    pages_config: list of dicts {'path': str, 'page_index': int, 'rotation': int}
    """
    writer = PdfWriter()
    
    # Optimization: Cache PdfReaders to avoid re-opening same file multiple times?
    # For now, simple approach: Open, extract, close?
    # PdfReader keeps file open?
    
    # We should group by file path to minimize IO if file optimization needed,
    # but sequential processing ensures correct order.
    # pypdf handles append efficiently.
    
    # We need to keep file handles open or let pypdf handle it? 
    # Best to read into writer.
    
    file_handles = {} # path -> reader
    
    try:
        for page_data in pages_config:
            path = page_data['path']
            idx = page_data['page_index']
            rot = page_data.get('rotation', 0)
            
            if path not in file_handles:
                file_handles[path] = PdfReader(path)
            
            reader = file_handles[path]
            
            if 0 <= idx < len(reader.pages):
                page = reader.pages[idx]
                if rot != 0:
                    page.rotate(rot)
                writer.add_page(page)
        
        with open(output_path, "wb") as f_out:
            writer.write(f_out)
            
    finally:
        # pypdf PdfReader usually doesn't need explicit close if we just let it go out of scope,
        # but explicit close might be good if using strict file handles? 
        # PdfReader in newer versions just reads.
        pass
    
    return output_path
