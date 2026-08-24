import { useState } from "react";
import { Trash2, X } from "lucide-react";
import type { Task } from "@/types";

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskModal({ task, onClose, onSave, onDelete }: TaskModalProps) {
  const [content, setContent] = useState(task.content);
  const [description, setDescription] = useState(task.description || "");

  const handleSave = () => {
    if (!content.trim()) return;
    onSave({ ...task, content, description });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-xl flex flex-col gap-4 text-card-foreground">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-base font-semibold">Карточка задачи</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Заголовок
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-xl border bg-background p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
              placeholder="Название задачи..."
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Описание / Тело карточки
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border bg-background p-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Добавьте подробности или заметки к этой задаче..."
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-3 border-t">
          <button
            onClick={() => {
              onDelete(task.id);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}