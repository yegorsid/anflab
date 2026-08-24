import { useEffect, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { CloudUpload, Loader2, LogOut, Plus } from "lucide-react";
import type { Column, Task } from "@/types";
import { ColumnContainer } from "@/components/ColumnContainer";
import { TaskCard } from "@/components/TaskCard";
import { LoginScreen } from "@/components/LoginScreen";
import { fetchFromGitHub, saveToGitHub, type GitHubConfig } from "@/services/github";

const STORAGE_KEYS = {
  COLUMNS: "anflab_columns",
  TASKS: "anflab_tasks",
  LAST_SAVED_STATE: "anflab_last_saved",
  IS_AUTH: "anflab_is_authenticated",
};

// Конфиг автоматически берется из .env файлов
const gitHubConfig: GitHubConfig = {
  owner: import.meta.env.VITE_GITHUB_OWNER || "",
  repo: import.meta.env.VITE_GITHUB_REPO || "",
  token: import.meta.env.VITE_GITHUB_TOKEN || "",
  filePath: "data.json",
};

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || "";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.IS_AUTH) === "true";
  });

  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COLUMNS);
    return saved ? JSON.parse(saved) : [];
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    return saved ? JSON.parse(saved) : [];
  });

  const [fileSha, setFileSha] = useState<string>("");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEYS.LAST_SAVED_STATE) || ""
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const currentStateStr = JSON.stringify({ columns, tasks });
  const hasUnsavedChanges = currentStateStr !== lastSavedState;

  // При авторизации — автозагрузка данных из GitHub
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // Кэширование в localStorage
  useEffect(() => {
    if (columns.length > 0 || tasks.length > 0) {
      localStorage.setItem(STORAGE_KEYS.COLUMNS, JSON.stringify(columns));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }
  }, [columns, tasks]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const result = await fetchFromGitHub<{ columns: Column[]; tasks: Task[] }>(gitHubConfig);
      if (result) {
        setColumns(result.data.columns || []);
        setTasks(result.data.tasks || []);
        setFileSha(result.sha);

        const remoteStr = JSON.stringify(result.data);
        setLastSavedState(remoteStr);
        localStorage.setItem(STORAGE_KEYS.LAST_SAVED_STATE, remoteStr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (pass: string): boolean => {
    if (pass === APP_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.IS_AUTH, "true");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEYS.IS_AUTH);
  };

  const handleSaveToGitHub = async () => {
    try {
      setIsSaving(true);
      const dataToSave = { columns, tasks };

      let currentSha = fileSha;
      if (!currentSha) {
        const existing = await fetchFromGitHub(gitHubConfig);
        if (existing) currentSha = existing.sha;
      }

      const newSha = await saveToGitHub(gitHubConfig, dataToSave, currentSha);
      setFileSha(newSha);

      const savedStr = JSON.stringify(dataToSave);
      setLastSavedState(savedStr);
      localStorage.setItem(STORAGE_KEYS.LAST_SAVED_STATE, savedStr);
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения в GitHub");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers колонок и задач
  const handleAddColumn = () => {
    const newCol: Column = {
      id: `col-${Date.now()}`,
      title: `Новая колонка ${columns.length + 1}`,
    };
    setColumns((prev) => [...prev, newCol]);
  };

  const handleDeleteColumn = (id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
    setTasks((prev) => prev.filter((task) => task.columnId !== id));
  };

  const handleAddTask = (columnId: string) => {
    const newTask: Task = {
      id: `t-${Date.now()}`,
      columnId,
      content: `Новая задача ${tasks.length + 1}`,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleUpdateColumnTitle = (id: string, title: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === id ? { ...col, title } : col))
    );
  };

  const handleUpdateTask = (id: string, content: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, content } : task))
    );
  };

  // DnD Handlers
  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";
    if (!isActiveATask) return;

    if (isActiveATask && isOverATask) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        const overIndex = tasks.findIndex((t) => t.id === overId);

        if (tasks[activeIndex].columnId !== tasks[overIndex].columnId) {
          tasks[activeIndex].columnId = tasks[overIndex].columnId;
          return arrayMove(tasks, activeIndex, overIndex - 1);
        }
        return arrayMove(tasks, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";
    if (isActiveATask && isOverAColumn) {
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        tasks[activeIndex].columnId = overId as string;
        return arrayMove(tasks, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (isActiveAColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
    }
  };

  // Если не залогинены — показываем экран ввода пароля
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
            A
          </div>
          <h1 className="font-semibold text-lg">AnfLab</h1>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground ml-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Синхронизация...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveToGitHub}
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudUpload className="w-3.5 h-3.5" />
              )}
              {isSaving ? "Сохранение..." : "Save to GitHub"}
            </button>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

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
                  onUpdateTask={handleUpdateTask}
                  onDeleteColumn={handleDeleteColumn}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </SortableContext>

            <button
              onClick={handleAddColumn}
              className="w-[300px] h-[56px] shrink-0 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground hover:border-solid transition-all"
            >
              <Plus className="w-4 h-4" /> Добавить колонку
            </button>
          </div>

          {createPortal(
            <DragOverlay>
              {activeTask && (
                <TaskCard
                  task={activeTask}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              )}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </main>
    </div>
  );
}