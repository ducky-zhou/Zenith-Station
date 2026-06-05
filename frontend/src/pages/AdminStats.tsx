import { BarChart3, Bookmark, MessageCircle, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import { StatusMessage } from "../components/StatusMessage";
import type { PostStat, Stats } from "../types";

function RankingList({ title, posts, metric }: { title: string; posts: PostStat[]; metric: keyof PostStat }) {
  return (
    <section className="leaderboard">
      <h2>{title}</h2>
      {posts.length === 0 ? (
        <StatusMessage message="暂无数据" />
      ) : (
        posts.map((post, index) => (
          <Link className="leaderboard-row" key={post.id} to={`/posts/${post.id}`}>
            <span>{index + 1}</span>
            <strong>{post.title}</strong>
            <span>{post[metric]}</span>
          </Link>
        ))
      )}
    </section>
  );
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then(setStats).catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <StatusMessage tone="error" message={error} />;
  if (!stats) return <StatusMessage message="加载中..." />;

  return (
    <section className="page-stack">
      <div className="section-heading">
        <h1>数据统计</h1>
      </div>
      <div className="stats-grid">
        {stats.metrics.map((metric) => (
          <div className="stat-card" key={metric.label}>
            <BarChart3 aria-hidden="true" />
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>
      <div className="stats-panels">
        <RankingList title="访问排行" posts={stats.top_viewed_posts} metric="views" />
        <RankingList title="点赞榜" posts={stats.top_liked_posts} metric="likes_count" />
        <RankingList title="评论榜" posts={stats.top_commented_posts} metric="comments_count" />
        <RankingList title="收藏榜" posts={stats.top_favorited_posts} metric="favorites_count" />
      </div>
      <div className="stats-legend">
        <span>
          <ThumbsUp aria-hidden="true" /> 点赞
        </span>
        <span>
          <MessageCircle aria-hidden="true" /> 评论
        </span>
        <span>
          <Bookmark aria-hidden="true" /> 收藏
        </span>
      </div>
    </section>
  );
}
