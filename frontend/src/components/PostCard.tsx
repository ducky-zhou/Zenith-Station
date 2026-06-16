import { Link } from "react-router-dom";

import type { Post } from "../types";

function formatDate(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function inferTags(post: Post) {
  const source = `${post.title} ${post.summary}`.toLowerCase();
  const tags: string[] = [];
  if (source.includes("llm") || source.includes("ai")) tags.push("llm-sec");
  if (source.includes("web") || source.includes("react") || source.includes("fastapi")) tags.push("web-dev");
  if (source.includes("ctf") || source.includes("security") || source.includes("安全")) tags.push("security");
  if (source.includes("docker") || source.includes("deploy")) tags.push("ops");
  return (tags.length > 0 ? tags : ["notes"]).slice(0, 2);
}

export function PostCard({ post }: { post: Post }) {
  const views = post.likes_count + post.favorites_count + post.comments_count;
  return (
    <article className="post-card">
      <div className="post-card-body">
        <div className="post-kicker">
          <span>{formatDate(post.created_at)}</span>
          {inferTags(post).map((tag) => (
            <span className="post-tag" key={tag}>{tag}</span>
          ))}
        </div>
        <Link to={`/posts/${post.id}`} className="post-title-link">
          <h2>{post.title}</h2>
        </Link>
        <p>{post.summary}</p>
      </div>
      <div className="post-meta">
        <span>{views} views</span>
      </div>
    </article>
  );
}
