import { useState } from "react";
import { Lock, LogIn } from "lucide-react";

interface Props {
  onLogin: (password: string) => boolean;
}

export function LoginScreen({ onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(password);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border rounded-2xl p-6 bg-card shadow-lg flex flex-col gap-4"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">AnfLab Board</h2>
          <p className="text-xs text-muted-foreground">
            Введите пароль для доступа к доске
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <input
            type="password"
            placeholder="Пароль доступа"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className={`w-full bg-background border text-sm rounded-xl px-4 py-2.5 outline-none transition-all ${
              error
                ? "border-destructive focus:ring-1 focus:ring-destructive"
                : "focus:border-primary focus:ring-1 focus:ring-primary"
            }`}
            autoFocus
          />
          {error && (
            <span className="text-[11px] text-destructive pl-1">
              Неверный пароль
            </span>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
        >
          <LogIn className="w-4 h-4" /> Войти
        </button>
      </form>
    </div>
  );
}