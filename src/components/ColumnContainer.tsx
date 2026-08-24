import type { Column, Task } from "@/types";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import { TaskCard } from "./TaskCard";

interface Props {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onUpdateColumnTitle: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  onOpenTaskModal?: (task: Task) => void;
}

export function ColumnContainer({
                                  column,
                                  tasks,
                                  onAddTask,
                                  onUpdateColumnTitle,
                                  onDeleteColumn,
                                  onOpenTaskModal,
                                }: Props) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
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
        className="w-[300px] h-[500px] bg-background/50 border-2 border-primary rounded-xl shrink-0 opacity-40"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-[300px] max-h-[calc(100vh-120px)] bg-muted/30 border rounded-xl shrink-0 flex flex-col"
    >
      <div
        {...attributes}
        {...listeners}
        className="p-3.5 border-b font-semibold flex items-center justify-between cursor-grab"
      >
        <input
          type="text"
          value={column.title}
          onChange={(e) => onUpdateColumnTitle(column.id, e.target.value)}
          className="bg-transparent text-sm font-semibold outline-none focus:border-b border-primary px-1"
        />
        <button
          onClick={() => onDeleteColumn(column.id)}
          className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2.5 overflow-y-auto flex-1">
        <SortableContext items={tasks.map((t) => t.id)}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onOpenModal={onOpenTaskModal}
            />
          ))}
        </SortableContext>
      </div>

      <div className="p-3 border-t">
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full py-2 border border-dashed rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-background flex items-center justify-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Добавить карточку
        </button>
      </div>
    </div>
  );
}