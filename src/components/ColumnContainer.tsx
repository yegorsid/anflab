import { useState } from "react";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { Column, Task } from "@/types";
import { TaskCard } from "./TaskCard";

interface Props {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onUpdateColumnTitle: (id: string, title: string) => void;
  onUpdateTask: (id: string, content: string) => void;
  onDeleteColumn: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function ColumnContainer({
                                  column,
                                  tasks,
                                  onAddTask,
                                  onUpdateColumnTitle,
                                  onUpdateTask,
                                  onDeleteColumn,
                                  onDeleteTask,
                                }: Props) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(column.title);

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
    disabled: editMode,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const handleBlur = () => {
    setEditMode(false);
    if (title.trim() !== column.title) {
      onUpdateColumnTitle(column.id, title.trim() || column.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setTitle(column.title);
      setEditMode(false);
    }
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-secondary/30 border-2 border-primary/50 w-[300px] h-[500px] rounded-xl flex flex-col opacity-40"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-muted/40 border rounded-xl w-[300px] h-[500px] flex flex-col shrink-0 group/col"
    >
      {/* Шапка колонки */}
      <div className="p-3 font-semibold border-b flex items-center justify-between bg-background/50 rounded-t-xl">
        <div className="flex items-center gap-2 flex-1 mr-2">
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {editMode ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-background text-sm font-semibold border rounded px-1.5 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <span
              onClick={() => setEditMode(true)}
              className="text-sm font-semibold cursor-pointer hover:bg-muted/80 rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
            >
              {column.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
          <button
            onClick={() => onDeleteColumn(column.id)}
            className="text-muted-foreground hover:text-destructive p-1 rounded opacity-0 group-hover/col:opacity-100 transition-opacity"
            title="Удалить колонку"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Список задач */}
      <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </SortableContext>
      </div>

      {/* Кнопка добавления */}
      <div className="p-2 border-t">
        <button
          onClick={() => onAddTask(column.id)}
          className="w-full py-1.5 px-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" /> Добавить карточку
        </button>
      </div>
    </div>
  );
}