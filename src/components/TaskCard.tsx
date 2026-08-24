import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Task } from "@/types";

interface Props {
  task: Task;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onUpdate, onDelete }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(task.content);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: editMode,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleBlur = () => {
    setEditMode(false);
    if (content.trim() !== task.content) {
      onUpdate(task.id, content.trim() || task.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setContent(task.content);
      setEditMode(false);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-secondary/50 border-2 border-primary/50 rounded-lg h-[60px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card text-card-foreground p-3 rounded-lg border shadow-sm flex items-center justify-between group hover:border-primary/50 transition-all cursor-default"
    >
      {editMode ? (
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-background text-sm font-medium border rounded px-1.5 py-0.5 w-full mr-2 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      ) : (
        <span
          onClick={() => setEditMode(true)}
          className="text-sm font-medium flex-1 cursor-pointer hover:bg-muted/50 rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
        >
          {task.content}
        </span>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
        <button
          onClick={() => onDelete(task.id)}
          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
          title="Удалить карточку"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground p-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}