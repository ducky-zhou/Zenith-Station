import type { AiText, Comment, Post, Profile, ScoreRow, SecurityGameResult, SecurityQuestion, Stats, TokenResponse, User } from "../types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
export { API_BASE };
const TOKEN_KEY = "security_blog_token";
const USER_KEY = "security_blog_user";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function storeSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let message = `请求失败：${response.status}`;
    try {
      const data = await response.json();
      message = data.detail ?? message;
    } catch {
      // Keep the generic message.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false
    }),
  register: (username: string, email: string, password: string) =>
    request<TokenResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
      auth: false
    }),
  me: () => request<User>("/auth/me"),
  githubEnabled: () => request<{ enabled: boolean }>("/auth/github/enabled", { auth: false }),
  profile: () => request<Profile>("/profile", { auth: false }),
  updateProfile: (payload: Partial<Profile>) =>
    request<Profile>("/profile", { method: "PUT", body: JSON.stringify(payload) }),
  uploadProfileAvatar: (file: File) => {
    const body = new FormData();
    body.set("file", file);
    return request<Profile>("/profile/avatar", { method: "POST", body });
  },
  posts: (query = "", includeDrafts = false) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (includeDrafts) params.set("include_drafts", "true");
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return request<Post[]>(`/posts${suffix}`, { auth: includeDrafts });
  },
  post: (id: string | number, auth = false) => request<Post>(`/posts/${id}`, { auth }),
  createPost: (payload: Partial<Post>) => request<Post>("/posts", { method: "POST", body: JSON.stringify(payload) }),
  updatePost: (id: string | number, payload: Partial<Post>) =>
    request<Post>(`/posts/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePost: (id: string | number) => request<void>(`/posts/${id}`, { method: "DELETE" }),
  comments: (postId: string | number) => request<Comment[]>(`/posts/${postId}/comments`, { auth: false }),
  addComment: (postId: string | number, content: string) =>
    request<Comment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  likeStatus: (postId: string | number) => request<{ liked: boolean; favorited: boolean }>(`/posts/${postId}/like-status`),
  like: (postId: string | number) => request<{ liked: boolean }>(`/posts/${postId}/like`, { method: "POST" }),
  unlike: (postId: string | number) => request<{ liked: boolean }>(`/posts/${postId}/like`, { method: "DELETE" }),
  favorite: (postId: string | number) => request<{ favorited: boolean }>(`/posts/${postId}/favorite`, { method: "POST" }),
  unfavorite: (postId: string | number) => request<{ favorited: boolean }>(`/posts/${postId}/favorite`, { method: "DELETE" }),
  favorites: () => request<Post[]>("/me/favorites"),
  gameNames: () => request<string[]>("/security-games", { auth: false }),
  questions: (gameName: string) => request<SecurityQuestion[]>(`/security-games/${gameName}/questions`, { auth: false }),
  submitGame: (gameName: string, answers: Array<{ question_id: number; answer: string }>, duration_seconds: number) =>
    request<SecurityGameResult>(`/security-games/${gameName}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers, duration_seconds })
    }),
  leaderboard: (gameName: string) => request<ScoreRow[]>(`/security-games/${gameName}/leaderboard`, { auth: false }),
  submitArcadeScore: (gameName: string, payload: { score: number; correct_count: number; total_count: number; duration_seconds: number }) =>
    request<ScoreRow>(`/security-games/${gameName}/score`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  postAiSummary: (postId: string | number) => request<AiText>(`/ai/posts/${postId}/summary`, { auth: false }),
  generateSecurityQuestion: (topic: string, difficulty: "easy" | "medium" | "hard" = "medium") =>
    request<AiText>("/ai/security-question", {
      method: "POST",
      body: JSON.stringify({ topic, difficulty })
    }),
  stats: () => request<Stats>("/stats"),
  track: (event: string, path: string, extra: Record<string, unknown> = {}) =>
    request<{ ok: boolean }>("/track", {
      method: "POST",
      body: JSON.stringify({ event, path, extra }),
      auth: false
    }).catch(() => undefined)
};
