export type User = {
  id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  role: "user" | "admin";
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type Post = {
  id: number;
  title: string;
  summary: string;
  content: string;
  cover_url?: string | null;
  status: "draft" | "published";
  author_id: number;
  created_at: string;
  updated_at: string;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  author?: User;
};

export type Comment = {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user: User;
};

export type Profile = {
  id: number;
  name: string;
  bio: string;
  avatar_url?: string | null;
  interests: string;
  experiences: string;
  github_url?: string | null;
  email?: string | null;
};

export type SecurityQuestion = {
  id: number;
  game_name: string;
  question: string;
  options: string[];
  difficulty: string;
  category: string;
};

export type SecurityGameResult = {
  game_name: string;
  score: number;
  correct_count: number;
  total_count: number;
  details: Array<{
    question_id: number;
    correct: boolean;
    correct_answer: string;
    explanation: string;
  }>;
};

export type ScoreRow = {
  id: number;
  username: string;
  game_name: string;
  score: number;
  correct_count: number;
  total_count: number;
  duration_seconds: number;
  created_at: string;
};

export type PostStat = {
  id: number;
  title: string;
  views: number;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
};

export type Stats = {
  metrics: Array<{ label: string; value: number }>;
  top_viewed_posts: PostStat[];
  top_liked_posts: PostStat[];
  top_commented_posts: PostStat[];
  top_favorited_posts: PostStat[];
};
