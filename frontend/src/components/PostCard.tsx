import { Bookmark, MessageCircle, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";

import type { Post } from "../types";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <div className="post-card-body">
        <Link to={`/posts/${post.id}`} className="post-title-link">
          <h2>{post.title}</h2>
        </Link>
        <p>{post.summary}</p>
      </div>
      <div className="post-meta">
        <span>{new Date(post.created_at).toLocaleDateString()}</span>
        <span>
          <ThumbsUp aria-hidden="true" /> {post.likes_count}
        </span>
        <span>
          <Bookmark aria-hidden="true" /> {post.favorites_count}
        </span>
        <span>
          <MessageCircle aria-hidden="true" /> {post.comments_count}
        </span>
      </div>
    </article>
  );
}
