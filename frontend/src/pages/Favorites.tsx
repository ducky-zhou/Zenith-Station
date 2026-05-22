import { useEffect, useState } from "react";

import { api } from "../api/client";
import { PostCard } from "../components/PostCard";
import { StatusMessage } from "../components/StatusMessage";
import type { Post } from "../types";

export function Favorites() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.favorites().then(setPosts).catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section className="page-stack">
      <h1>收藏</h1>
      {error && <StatusMessage tone="error" message={error} />}
      <div className="post-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
