import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { Plus, Save, Loader2, RefreshCw, LogOut } from "lucide-react";

import type { Column, Task } from "@/types";
import { ColumnContainer } from "@/components/ColumnContainer";
import { TaskCard } from "@/components/TaskCard";
import { TaskModal } from "@/components/TaskModal";
import { LoginScreen } from "@/components/LoginScreen";
import { fetchBoardFromGithub, saveBoardToGithub } from "@/services/github";

const defaultColumns: Column[] = [
  { id: "todo", title: "Надо сделать" },
  { id: "in-progress", title: "В работе" },
  { id: "done", title: "Готово" },
];

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("anflab_is_auth") === "true";
  });

  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem("anflab_columns");
    return saved ? JSON.parse(saved) : defaultColumns;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("anflab_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [fileSha, setFileSha] = useState<string | undefined>(undefined);

  const [lastSavedState, setLastSavedState] = useState<string>(() =>
    JSON.stringify({ columns, tasks })
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify({ columns, tasks }) !== lastSavedState;
  }, [columns, tasks, lastSavedState]);

  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("anflab_columns", JSON.stringify(columns));
    }
  }, [columns, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem("anflab_tasks", JSON.stringify(tasks));
    }
  }, [tasks, isAuthenticated]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleLogin = (password: string): boolean => {
    const CORRECT_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("anflab_is_auth", "true");
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("anflab_is_auth");
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    try {
      const currentStateJson = JSON.stringify({ columns, tasks });
      const dataToSave = { columns, tasks };
      const newSha = await saveBoardToGithub(dataToSave, fileSha);

      setFileSha(newSha);
      setLastSavedState(currentStateJson);

      localStorage.setItem("anflab_columns", JSON.stringify(columns));
      localStorage.setItem("anflab_tasks", JSON.stringify(tasks));
    } catch (error) {
      console.error("Не удалось сохранить данные:", error);
      alert("Ошибка при сохранении в GitHub! Проверьте консоль.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateColumn = () => {
    const newColumn: Column = { id: `col-${Date.now()}`, title: "Новая колонка" };
    setColumns((prev) => [...prev, newColumn]);
  };
  
  const handleUpdateColumnTitle = (id: string, title: string) => {
    setColumns((prev) => prev.map((col) => (col.id === id ? { ...col, title } : col)));
  };
  
  const handleDeleteColumn = (id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
    setTasks((prev) => prev.filter((task) => task.columnId !== id));
  };

  const handleAddTask = (columnId: string) => {
    const newTask: Task = { id: `task-${Date.now()}`, columnId, content: "Новая задача", description: "" };
    setTasks((prev) => [...prev, newTask]);
  };
  
  const handleDeleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  
  const handleSaveTaskDetails = (updatedTask: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  };

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

    if (isOverTask) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (activeIndex === -1 || overIndex === -1) return prev;

        if (prev[activeIndex].columnId !== prev[overIndex].columnId) {
          const updated = [...prev];
          updated[activeIndex] = {
            ...updated[activeIndex],
            columnId: prev[overIndex].columnId,
          };
          return arrayMove(updated, activeIndex, overIndex);
        }

        return prev;
      });
    }

    const isOverColumn = over.data.current?.type === "Column";
    if (isOverColumn) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return prev;

        if (prev[activeIndex].columnId === overId) return prev;

        const updated = [...prev];
        updated[activeIndex] = {
          ...updated[activeIndex],
          columnId: overId as string,
        };

        return arrayMove(updated, activeIndex, activeIndex);
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
        if (activeIndex === -1 || overIndex === -1) return prev;
        return arrayMove(prev, activeIndex, overIndex);
      });
      return;
    }

    const isActiveTask = active.data.current?.type === "Task";
    if (isActiveTask) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (activeIndex === -1 || overIndex === -1) return prev;

        if (prev[activeIndex].columnId === prev[overIndex].columnId) {
          return arrayMove(prev, activeIndex, overIndex);
        }

        return prev;
      });
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      <header className="border-b px-6 py-4 flex items-center justify-between bg-card min-h-[65px]">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">AnfLab</h1>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Загрузка с GitHub...
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
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
              {isSaving ? "Сохранение..." : "Сохранить изменения"}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            title="Выйти"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
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
                  onUpdateTask={handleSaveTaskDetails}
                />
              ))}
            </SortableContext>

            <button
              onClick={handleCreateColumn}
              className="w-[300px] h-[56px] border border-dashed border-border hover:border-primary/50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-card/50 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> Добавить колонку
            </button>
          </div>
          {createPortal(
            <DragOverlay>
              {activeColumn && (
                <ColumnContainer
                  column={activeColumn}
                  tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
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