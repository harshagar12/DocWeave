import React, { useState } from 'react';
import { Dropzone } from './components/UploadDir/Dropzone';
import { PageEditor } from './components/Editor/PageEditor';
import { uploadFiles, processPDF, getDownloadUrl } from './services/api';
import { getDocumentPages } from './utils/pdfHelpers';
import { Loader2, Download, FileText, RefreshCw, Trash2, CheckSquare, Plus, Layers, LayoutGrid, Settings, LogOut, Menu, X } from 'lucide-react';

export default function App() {
  const [pages, setPages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUpload = async (files) => {
    setIsUploading(true);
    try {
      const response = await uploadFiles(files);
      const newPages = [];
      
      for (const file of response.files) {
        const previewUrl = getDownloadUrl(`/preview/${file.id}`);
        const filePages = await getDocumentPages(previewUrl);
        
        filePages.forEach(p => {
            newPages.push({
                id: `${file.id}-${p.pageIndex}`,
                fileId: file.id,
                pageIndex: p.pageIndex,
                originalPageIndex: p.originalPageIndex,
                pdfUrl: previewUrl,
                rotation: 0 
            });
        });
      }
      
      setPages(prev => [...prev, ...newPages]);
    } catch (err) {
      console.error("Upload/Processing failed:", err);
      alert(`Error: ${err.message || "Failed to upload files"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSelection = (id) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) {
              newSet.delete(id);
          } else {
              newSet.add(id);
          }
          return newSet;
      });
  };

  const handleSelectAll = () => {
      if (selectedIds.size === pages.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(pages.map(p => p.id)));
      }
  };

  const handleRotate = (id) => {
      setPages(prev => prev.map(p => {
          if (p.id === id) {
              return { ...p, rotation: (p.rotation + 90) % 360 };
          }
          return p;
      }));
  };

  const handleBulkRotate = () => {
      setPages(prev => prev.map(p => {
          if (selectedIds.has(p.id)) {
              return { ...p, rotation: (p.rotation + 90) % 360 };
          }
          return p;
      }));
  };

  const handleDelete = (id) => {
      setPages(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
      });
  };

  const handleBulkDelete = () => {
      if (!confirm(`Delete ${selectedIds.size} pages?`)) return;
      setPages(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
  };

  const handleProcess = async () => {
      if (pages.length === 0) return;
      setIsProcessing(true);
      try {
          const result = await processPDF(pages.map(p => ({
              file_id: p.fileId,
              page_index: p.pageIndex,
              rotation: p.rotation
          })), "docweave_merged");
          
          const downloadUrl = getDownloadUrl(result.download_url);

          // Use fetch + blob to bypass redirect blockers and force download behavior
          const fileReq = await fetch(downloadUrl);
          if (!fileReq.ok) throw new Error("Failed to download file");
          const blob = await fileReq.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.setAttribute('download', 'docweave_merged.pdf');
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(blobUrl);
          
      } catch (err) {
          console.error("Processing failed", err);
          alert("Processing failed: " + err.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleReset = () => {
      if (pages.length > 0) {
          if (!confirm("Start over? This will clear your current workspace.")) return;
      }
      setPages([]);
      setSelectedIds(new Set());
      setIsMobileMenuOpen(false);
  };

  if (pages.length === 0) {
      return (
          <div className="flex h-screen bg-white text-zinc-900 font-sans selection:bg-indigo-100 items-center justify-center p-6">
              <div className="max-w-xl w-full flex flex-col items-center animate-in fade-in duration-700 slide-in-from-bottom-4">
                  
                  {/* Landing Header */}
                  <div className="mb-10 text-center px-4">
                    <div className="inline-flex items-center justify-center gap-3 mb-4">
                        <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-xl shadow-indigo-600/20">
                            <FileText size={32} className="fill-current" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">DocWeave</h1>
                    </div>
                    <p className="text-base md:text-lg text-zinc-500 font-medium">Professional PDF Workspace</p>
                  </div>

                  {/* Dropzone */}
                  <div className="w-full relative z-10">
                      <Dropzone onUpload={handleUpload} isUploading={isUploading} />
                  </div>

                  {/* Footer Stats / Info */}
                  <div className="mt-12 flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-zinc-400 font-medium">
                      <div className="flex items-center gap-2">
                          <CheckSquare size={16} className="text-indigo-500" />
                          <span>Local Processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Layers size={16} className="text-indigo-500" />
                          <span>Drag & Drop</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <Settings size={16} className="text-indigo-500" />
                          <span>Smart Actions</span>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 overflow-hidden">
      
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Responsive */}
      <aside 
        className={`
            fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-zinc-200 flex flex-col shadow-2xl md:shadow-sm transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:w-80 shrink-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                        <FileText size={20} className="fill-current" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900">DocWeave</h1>
                </div>
                <p className="text-xs text-zinc-500 font-medium ml-9">Professional PDF Editor</p>
            </div>
            {/* Close button for mobile */}
            <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-2 text-zinc-400 hover:text-zinc-600"
            >
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Stats / Status */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <div className="text-xs text-zinc-500 uppercase font-semibold mb-1">Count</div>
                    <div className="text-2xl font-bold font-mono text-zinc-700">{pages.length}</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                     <div className="text-xs text-indigo-500 uppercase font-semibold mb-1">Selected</div>
                     <div className="text-2xl font-bold font-mono text-indigo-600">{selectedIds.size}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider pl-1">Actions</div>
                
                <button 
                  onClick={handleSelectAll}
                  disabled={!pages.length}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 transition-all"
                >
                    <span className="flex items-center gap-2"><CheckSquare size={16} /> Select All</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handleBulkRotate}
                        disabled={!selectedIds.size}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 disabled:opacity-50 transition-all"
                    >
                        <RefreshCw size={16} /> Rotate
                    </button>
                    <button 
                        onClick={handleBulkDelete}
                        disabled={!selectedIds.size}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 transition-all"
                    >
                        <Trash2 size={16} /> Delete
                    </button>
                </div>
            </div>

            {/* Upload Area (Mini) */}
            <div className="pt-4 border-t border-zinc-100">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Plus className="w-8 h-8 text-zinc-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                        <p className="text-xs text-zinc-500 font-medium">Add more files</p>
                    </div>
                    <input type="file" multiple className="hidden" onChange={(e) => handleUpload(Array.from(e.target.files))} />
                </label>
            </div>
        </div>

        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
             <button 
                onClick={handleProcess}
                disabled={!pages.length || isProcessing}
                className="w-full group relative flex items-center justify-center gap-2 bg-zinc-900 text-white py-3.5 px-4 rounded-xl font-bold shadow-lg shadow-zinc-900/10 hover:shadow-xl hover:bg-black hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-lg transition-all"
             >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Download size={18} />}
                <span>Merge & Export</span>
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-zinc-50/50">
         {/* Top Bar */}
         <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 bg-white/80 backdrop-blur-sm z-10 sticky top-0">
             <div className="flex items-center gap-3">
                 {/* Mobile Menu Toggle */}
                 <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                 >
                     <Menu size={20} />
                 </button>

                 <div className="flex items-center gap-2 text-zinc-400">
                     <LayoutGrid size={18} />
                     <span className="text-sm font-medium uppercase tracking-widest hidden sm:inline">Workspace</span>
                     <span className="text-sm font-medium uppercase tracking-widest sm:hidden">Editor</span>
                 </div>
             </div>
             
             {pages.length > 0 && (
                 <button onClick={handleReset} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors">
                     <LogOut size={14} /> <span className="hidden sm:inline">CLEAR WORKSPACE</span><span className="sm:hidden">CLEAR</span>
                 </button>
             )}
         </header>

         {/* Canvas */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <PageEditor 
                pages={pages} 
                setPages={setPages} 
                onRotate={handleRotate} 
                onDelete={handleDelete}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
            />
         </div>
      </main>
    </div>
  );
}
