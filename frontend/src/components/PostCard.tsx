import { Bookmark, Eye, MessageCircle, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";

import type { Post } from "../types";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <div className="post-card-body">
        <div className="post-kicker">
          <span>{post.status === "published" ? "PUBLIC" : "DRAFT"}</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <Link to={`/posts/${post.id}`} className="post-title-link">
          <h2>{post.title}</h2>
        </Link>
        <p>{post.summary}</p>
      </div>
      <div className="post-meta">
        <span title="热度">
          <Eye aria-hidden="true" /> {post.likes_count + post.favorites_count + post.comments_count}
        </span>
        <span title="点赞">
          <ThumbsUp aria-hidden="true" /> {post.likes_count}
        </span>
        <span title="评论">
          <MessageCircle aria-hidden="true" /> {post.comments_count}
        </span>
        <span title="收藏">
          <Bookmark aria-hidden="true" /> {post.favorites_count}
        </span>
      </div>
    </article>
  );
}
