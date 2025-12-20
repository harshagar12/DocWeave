import React from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortablePage } from './SortablePage';

export function PageEditor({ pages, setPages, onRotate, onDelete, selectedIds, onToggleSelection }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setPages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4 lg:p-8">
        <SortableContext 
          items={pages} 
          strategy={rectSortingStrategy}
        >
          {pages.map((page) => (
            <SortablePage 
                key={page.id} 
                id={page.id} 
                page={page} 
                onRotate={onRotate}
                onDelete={onDelete}
                isSelected={selectedIds ? selectedIds.has(page.id) : false}
                onToggleSelection={onToggleSelection}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
