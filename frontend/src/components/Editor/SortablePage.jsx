import React, { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, RotateCw, Check } from 'lucide-react';
import { renderPage } from '../../utils/pdfHelpers';

export function SortablePage({ id, page, onRotate, onDelete, isSelected, onToggleSelection }) {
  const canvasRef = useRef(null);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  useEffect(() => {
    const controller = new AbortController();
    
    const render = async () => {
        if (canvasRef.current && page.pdfUrl) {
            try {
                await renderPage(page.pdfUrl, page.pageIndex, canvasRef.current, page.rotation, controller.signal);
            } catch (err) {
                console.error("Render error", err);
            }
        }
    };

    render();

    return () => {
        controller.abort();
    };
  }, [page.pdfUrl, page.pageIndex, page.rotation]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white border transition-all duration-200
        ${isDragging ? 'shadow-2xl border-indigo-500' : 'hover:shadow-md'}
        ${isSelected 
            ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
            : 'border-zinc-200'
        }
      `}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-move p-4 flex justify-center items-center h-[260px] bg-zinc-50"
      >
         <canvas ref={canvasRef} className="max-w-full max-h-full shadow-sm object-contain bg-white" />
      </div>
      
      {/* Top Bar (Selection & Actions) */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-start opacity-100 lg:opacity-0 lg:group-hover:opacity-100 data-[selected=true]:opacity-100 transition-opacity bg-linear-to-b from-black/10 to-transparent" data-selected={isSelected}>
          {/* Checkbox */}
          <div 
            className="cursor-pointer"
            onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(id);
            }}
          >
              <div className={`
                w-5 h-5 border rounded-md flex items-center justify-center transition-all shadow-sm
                ${isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white border-zinc-300 lg:border-zinc-200 text-transparent lg:hover:border-indigo-400'
                }
              `}>
                  <Check size={12} strokeWidth={4} />
              </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1.5">
            <button 
               onClick={(e) => { e.stopPropagation(); onRotate(id); }}
               className="p-1.5 bg-white text-zinc-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-zinc-200 shadow-sm transition-colors"
               title="Rotate"
            >
              <RotateCw size={14} />
            </button>
            <button 
               onClick={(e) => { e.stopPropagation(); onDelete(id); }}
               className="p-1.5 bg-white text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-md border border-zinc-200 shadow-sm transition-colors"
               title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
      </div>
      
      {/* Footer Info */}
      <div className="px-3 py-2 bg-white border-t border-zinc-100 flex justify-between items-center text-[11px] font-medium text-zinc-400">
         <span>Page {page.originalPageIndex}</span>
         {page.rotation > 0 && (
             <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                <RotateCw size={10} /> {page.rotation}°
             </span>
         )}
      </div>
    </div>
  );
}
