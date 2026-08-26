import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Pencil } from "lucide-react";
import type { Task } from "@/types";

interface Props {
  task: Task;
  onOpenModal?: (task: Task) => void;
  onUpdateTask?: (updatedTask: Task) => void;
}

export function TaskCard({ task, onOpenModal, onUpdateTask }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(task.content);
  const inputRef = useRef<HTMLInputElement>(null);

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
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  useEffect(() => {
    setContent(task.content);
  }, [task.content]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = content.trim();
    if (trimmed && trimmed !== task.content) {
      onUpdateTask?.({ ...task, content: trimmed });
    } else {
      setContent(task.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
    if (e.key === "Escape") {
      setContent(task.content);
      setIsEditing(false);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-background p-3.5 h-[80px] min-h-[80px] flex rounded-xl border-2 border-primary cursor-grab"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background p-3.5 rounded-xl border hover:border-primary/50 flex flex-col justify-between gap-2 group transition-all shadow-sm hover:shadow"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 mt-0.5 p-0.5 rounded hover:bg-accent/50 transition-colors"
          title="Перетащить карточку"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-sm font-medium leading-snug text-foreground outline-none border-b border-primary px-0.5"
            />
          ) : (
            <p
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="text-sm font-medium leading-snug text-foreground break-words hover:bg-accent/50 rounded px-1 -mx-1 transition-colors cursor-text"
              title="Кликните для редактирования"
            >
              {task.content}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal?.(task);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-all shrink-0 mt-0.5"
          title="Открыть детали задачи"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
      {task.description && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-6">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[200px]">{task.description}</span>
        </div>
      )}
    </div>
  );
}