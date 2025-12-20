import React, { useCallback, useState } from 'react';
import { Upload, Loader2, FileText, Image as ImageIcon } from 'lucide-react';

export function Dropzone({ onUpload, isUploading }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragleave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && !isUploading) {
      onUpload(files);
    }
  }, [onUpload, isUploading]);

  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0 && !isUploading) {
      onUpload(files);
    }
  }, [onUpload, isUploading]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragleave}
      onDrop={handleDrop}
      className={`
        relative group rounded-xl p-10 text-center transition-all duration-200 cursor-pointer border-2 border-dashed
        ${isDragging 
          ? 'bg-indigo-50 border-indigo-500 shadow-xl shadow-indigo-500/10' 
          : 'bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-lg'
        }
      `}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.docx"
        className="hidden"
        id="file-upload"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      
      <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center relative z-10">
        <div className={`
             mb-5 p-4 rounded-xl bg-zinc-50 transition-all duration-300
             ${isDragging ? 'scale-110 text-indigo-600' : 'text-zinc-500 group-hover:text-zinc-800'}
        `}>
             {isUploading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
             ) : (
                <Upload className="w-10 h-10" strokeWidth={1.5} />
             )}
        </div>
        
        <h3 className="text-xl font-bold text-zinc-900 mb-1">
          {isUploading ? "Uploading..." : "Upload Documents"}
        </h3>
        
        <p className="text-zinc-500 text-sm mb-6">
          Drag & drop or click to browse
        </p>

        <div className="flex justify-center gap-4 text-xs font-mono text-zinc-400">
            <span>PDF</span>
            <span>IMG</span>
            <span>DOCX</span>
        </div>
      </label>
    </div>
  );
}
