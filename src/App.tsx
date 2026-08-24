import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { Plus, Save, Loader2, RefreshCw } from "lucide-react";

import type { Column, Task } from "@/types";
import { ColumnContainer } from "@/components/ColumnContainer";
import { TaskCard } from "@/components/TaskCard";
import { TaskModal } from "@/components/TaskModal";
import { fetchBoardFromGithub, saveBoardToGithub } from "@/services/github";

const defaultColumns: Column[] = [
  { id: "todo", title: "Надо сделать" },
  { id: "in-progress", title: "В работе" },
  { id: "done", title: "Готово" },
];

const defaultTasks: Task[] = [
  {
    id: "1",
    columnId: "todo",
    content: "Изучить React + TypeScript",
    description: "Посмотреть документацию и настроить Vite.",
  },
];

export function App() {
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem("anflab_columns");
    return saved ? JSON.parse(saved) : defaultColumns;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("anflab_tasks");
    return saved ? JSON.parse(saved) : defaultTasks;
  });

  // Храним SHA последнего файла на GitHub для выполнения PUT запросов
  const [fileSha, setFileSha] = useState<string | undefined>(undefined);

  // Слепок сохраненного состояния (для проверки изменений)
  const [lastSavedState, setLastSavedState] = useState<string>(() =>
    JSON.stringify({ columns, tasks })
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Проверка наличия несохраненных изменений
  const currentStateJson = JSON.stringify({ columns, tasks });
  const hasUnsavedChanges = currentStateJson !== lastSavedState;

  // --- Загрузка данных с GitHub при первом монтировании ---
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const result = await fetchBoardFromGithub();

      if (result) {
        setColumns(result.data.columns || []);
        setTasks(result.data.tasks || []);
        setFileSha(result.sha);

        const loadedJson = JSON.stringify(result.data);
        setLastSavedState(loadedJson);

        localStorage.setItem("anflab_columns", JSON.stringify(result.data.columns));
        localStorage.setItem("anflab_tasks", JSON.stringify(result.data.tasks));
      }
      setIsLoading(false);
    }

    loadInitialData();
  }, []);

  // Кэш в localStorage
  useEffect(() => {
    localStorage.setItem("anflab_columns", JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem("anflab_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // --- Функция сохранения в GitHub ---
  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const dataToSave = { columns, tasks };
      const newSha = await saveBoardToGithub(dataToSave, fileSha);

      // Обновляем SHA и состояние сохраненных данных
      setFileSha(newSha);
      setLastSavedState(currentStateJson);

      localStorage.setItem("anflab_columns", JSON.stringify(columns));
      localStorage.setItem("anflab_tasks", JSON.stringify(tasks));
    } catch (error) {
      console.error("Не удалось сохранить данные:", error);
      alert("Ошибка при сохранении в GitHub! Проверьте консоль или секреты.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Работа с колонками ---
  const handleCreateColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: "Новая колонка",
    };
    setColumns((prev) => [...prev, newColumn]);
  };

  const handleUpdateColumnTitle = (id: string, title: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, title } : col))
    );
  };

  const handleDeleteColumn = (id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
    setTasks((prev) => prev.filter((task) => task.columnId !== id));
  };

  // --- Работа с задачами ---
  const handleAddTask = (columnId: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      columnId,
      content: "Новая задача",
      description: "",
    };
    setTasks((prev) => [...prev, newTask]);
    setEditingTask(newTask);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveTaskDetails = (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  // --- Drag-and-Drop ---
  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (prev[activeIndex].columnId !== prev[overIndex].columnId) {
          prev[activeIndex].columnId = prev[overIndex].columnId;
          return arrayMove(prev, activeIndex, overIndex - 1);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    const isOverColumn = over.data.current?.type === "Column";

    if (isActiveTask && isOverColumn) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        prev[activeIndex].columnId = overId as string;
        return arrayMove(prev, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveColumn = active.data.current?.type === "Column";
    if (isActiveColumn) {
      setColumns((prev) => {
        const activeIndex = prev.findIndex((col) => col.id === activeId);
        const overIndex = prev.findIndex((col) => col.id === overId);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      {/* Шапка */}
      <header className="border-b px-6 py-4 flex items-center justify-between bg-card min-h-[65px]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">AnfLab Kanban</h1>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Загрузка с GitHub...
            </span>
          )}
        </div>

        {/* Кнопка сохранения в GitHub видна ТОЛЬКО при изменениях */}
        {hasUnsavedChanges && !isLoading && (
          <button
            onClick={handleSaveData}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 animate-in fade-in duration-200"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Сохранение в GitHub..." : "Сохранить изменения"}
          </button>
        )}
      </header>

      {/* Доска */}
      <main className="flex-1 p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 items-start">
            <SortableContext items={columns.map((col) => col.id)}>
              {columns.map((col) => (
                <ColumnContainer
                  key={col.id}
                  column={col}
                  tasks={tasks.filter((task) => task.columnId === col.id)}
                  onAddTask={handleAddTask}
                  onUpdateColumnTitle={handleUpdateColumnTitle}
                  onDeleteColumn={handleDeleteColumn}
                  onOpenTaskModal={(task) => setEditingTask(task)}
                />
              ))}
            </SortableContext>

            {/* Кнопка добавления колонки */}
            <button
              onClick={handleCreateColumn}
              className="w-[300px] h-[56px] border border-dashed border-border hover:border-primary/50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Добавить колонку
            </button>
          </div>

          {/* Drag Overlay */}
          {createPortal(
            <DragOverlay>
              {activeColumn && (
                <ColumnContainer
                  column={activeColumn}
                  tasks={tasks.filter(
                    (task) => task.columnId === activeColumn.id
                  )}
                  onAddTask={handleAddTask}
                  onUpdateColumnTitle={handleUpdateColumnTitle}
                  onDeleteColumn={handleDeleteColumn}
                />
              )}
              {activeTask && <TaskCard task={activeTask} />}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </main>

      {/* Модалка задачи */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTaskDetails}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}

export default App;