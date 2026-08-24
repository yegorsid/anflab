# AnfLab — Personal Kanban Board

Интерактивная Канбан-доска на **React + TypeScript + Vite**. Работает как SPA без собственного бэкенда — состояние доски сохраняется напрямую в файл `data.json` внутри твоего GitHub-репозитория через GitHub REST API.

🚀 **Live App:** [https://yegorsid.github.io/anflab/](https://yegorsid.github.io/anflab/)

---

## ✨ Особенности

* **Drag-and-Drop:** Плавное перетаскивание колонок и задач на базе `@dnd-kit`.
* **Serverless Persistence (GitHub-as-a-Backend):** Чтение и запись состояния доски напрямую в `data.json` через GitHub Contents API.
* **Экран авторизации:** Доступ к интерфейсу закрыт простым экраном ввода пароля.
* **Локальное кэширование:** Автоматическое сохранение текущего состояния в `localStorage` для защиты от потери данных.
* **Автоматический CI/CD:** Автосборка и деплой на GitHub Pages при каждом push в ветку `main`.

---

## 🛠 Стек технологий

* **Frontend:** React, TypeScript, Vite
* **UI & DnD:** `@dnd-kit/core`, `@dnd-kit/sortable`, Lucide React, Tailwind CSS
* **API:** GitHub REST API (Contents API)
* **Hosting & CI/CD:** GitHub Pages + GitHub Actions

---

## 🚀 Локальный запуск

1. **Клонируй репозиторий:**
   ```bash
   git clone [https://github.com/yegorsid/anflab.git](https://github.com/yegorsid/anflab.git)
   cd anflab