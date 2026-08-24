export interface GitHubConfig {
  owner: string;    // Твой логин на GitHub (например, "yegorsid")
  repo: string;     // Название репозитория
  token: string;    // Personal Access Token
  filePath: string; // Имя файла (например, "data.json")
}

export interface GitHubFetchResult<T> {
  data: T;
  sha: string;
}

export async function fetchFromGitHub<T>(
  config: GitHubConfig
): Promise<GitHubFetchResult<T> | null> {
  const { owner, repo, token, filePath } = config;
  if (!owner || !repo || !token) return null;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub Error: ${response.statusText}`);

  const json = await response.json();

  // Декодируем base64 с поддержкой UTF-8
  const rawContent = json.content.replace(/\n/g, "");
  const decodedContent = decodeURIComponent(
    atob(rawContent)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return {
    data: JSON.parse(decodedContent),
    sha: json.sha,
  };
}

export async function saveToGitHub<T>(
  config: GitHubConfig,
  data: T,
  sha?: string
): Promise<string> {
  const { owner, repo, token, filePath } = config;
  if (!owner || !repo || !token) throw new Error("Конфигурация GitHub не настроена");

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  // Кодируем JSON в base64 с поддержкой UTF-8
  const jsonString = JSON.stringify(data, null, 2);
  const base64Content = btoa(
    encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );

  const body: Record<string, unknown> = {
    message: "update: board state via AnfLab",
    content: base64Content,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Не удалось сохранить в GitHub: ${response.statusText}`);
  }

  const resJson = await response.json();
  return resJson.content.sha; // Возвращаем обновленный SHA файла
}