import type { Column, Task } from "@/types";

const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const FILE_PATH = "data.json";

export interface BoardData {
  columns: Column[];
  tasks: Task[];
}

interface FetchResult {
  data: BoardData;
  sha: string;
}

function base64ToUtf8(str: string): string {
  const cleanStr = str.replace(/\n/g, "");
  return decodeURIComponent(
    atob(cleanStr)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

export async function fetchBoardFromGithub(): Promise<FetchResult | null> {
  if (!TOKEN || !OWNER || !REPO) {
    console.warn("Переменные VITE_GITHUB_* не заданы в .env");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const contentUtf8 = base64ToUtf8(json.content);
    const parsedData: BoardData = JSON.parse(contentUtf8);

    return {
      data: parsedData,
      sha: json.sha,
    };
  } catch (error) {
    console.error("Ошибка при получении данных с GitHub:", error);
    return null;
  }
}

export async function saveBoardToGithub(
  data: BoardData,
  sha?: string
): Promise<string> {
  if (!TOKEN || !OWNER || !REPO) {
    throw new Error("Не настроены переменные окружения VITE_GITHUB_*");
  }

  const jsonString = JSON.stringify(data, null, 2);
  const contentBase64 = utf8ToBase64(jsonString);

  const body: { message: string; content: string; sha?: string } = {
    message: "feat: update board data via app",
    content: contentBase64,
  };

  if (sha) {
    body.sha = sha;
  }

  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Не удалось сохранить в GitHub");
  }

  const resJson = await res.json();
  return resJson.content.sha;
}