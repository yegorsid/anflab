import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText } from "lucide-react";
import type { Task } from "@/types";

interface Props {
  task: Task;
  onOpenModal?: (task: Task) => void;
}

export function TaskCard({ task, onOpenModal }: Props) {
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
      {...attributes}
      {...listeners}
      onClick={() => onOpenModal?.(task)}
      className="bg-background p-3.5 min-h-[70px] rounded-xl border hover:border-primary/50 cursor-grab flex flex-col justify-between gap-2 group transition-all shadow-sm hover:shadow"
    >
      <p className="text-sm font-medium leading-snug text-foreground break-words">
        {task.content}
      </p>

      {task.description && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[200px]">{task.description}</span>
        </div>
      )}
    </div>
  );
}